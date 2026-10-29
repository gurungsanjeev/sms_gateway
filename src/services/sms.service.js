
import prisma from "../config/prisma.js";
import { getBalance } from "./provider.service.js";

const simulateProviderDelivery = (provider) => {
    const failed = Math.random() < provider.failureRate;

    if (failed) {
        return {
            success: false,
            error: `${provider.name} simulated a delivery failure.`,
        };
    }

    return {
        success: true,
        response: `${provider.name} accepted the SMS successfully.`,
    };
};

const recordFailedAttempt = async (smsId, providerId, error) => {
    await prisma.smsAttempt.create({
        data: {
            smsMessageId: smsId,
            providerId,
            status: "FAILED",
            error,
        },
    });
};

const refundAndFailSms = async (sms) => {
    return prisma.$transaction(async (tx) => {
        const updated = await tx.smsMessage.updateMany({
            where: {
                id: sms.id,
                status: "PROCESSING",
                refundedAt: null,
            },
            data: {
                status: "FAILED",
                refundedAt: new Date(),
            },
        });

        if (updated.count === 0) {
            return false;
        }

        await tx.wallet.update({
            where: { userId: sms.userId },
            data: {
                balance: { increment: sms.cost },
            },
        });

        return true;
    });
};

export const deliverSms = async (smsId) => {
    const sms = await prisma.smsMessage.findUnique({
        where: { id: smsId },
    });

    if (!sms) {
        throw new Error("SMS_NOT_FOUND");
    }

    // Only one delivery process can claim this SMS.
    const claimed = await prisma.smsMessage.updateMany({
        where: {
            id: smsId,
            status: "PENDING",
        },
        data: {
            status: "PROCESSING",
        },
    });

    if (claimed.count === 0) {
        throw new Error("SMS_NOT_PENDING");
    }

    const providers = await prisma.provider.findMany({
        where: { isActive: true },
        orderBy: { priority: "asc" },
    });

    for (const provider of providers) {
        // Check the latest provider balance before attempting delivery.
        const providerBalance = await getBalance(provider.id);

        if (providerBalance < sms.cost) {
            await recordFailedAttempt(
                sms.id,
                provider.id,
                "Insufficient provider balance."
            );
            continue;
        }

        const result = simulateProviderDelivery(provider);

        if (!result.success) {
            await recordFailedAttempt(
                sms.id,
                provider.id,
                result.error
            );
            continue;
        }

        // Charge the provider and record successful delivery atomically.
        const delivered = await prisma.$transaction(async (tx) => {
            const debit = await tx.provider.updateMany({
                where: {
                    id: provider.id,
                    isActive: true,
                    balance: { gte: sms.cost },
                },
                data: {
                    balance: { decrement: sms.cost },
                },
            });

            // Another request may have used the balance since we checked it.
            if (debit.count === 0) {
                return false;
            }

            const updatedSms = await tx.smsMessage.updateMany({
                where: {
                    id: sms.id,
                    status: "PROCESSING",
                },
                data: {
                    status: "SENT",
                    selectedProviderId: provider.id,
                },
            });

            if (updatedSms.count === 0) {
                throw new Error("SMS_NOT_PROCESSING");
            }

            await tx.smsAttempt.create({
                data: {
                    smsMessageId: sms.id,
                    providerId: provider.id,
                    status: "SUCCESS",
                    response: result.response,
                },
            });

            return true;
        });

        if (delivered) {
            return {
                success: true,
                smsId: sms.id,
                provider: provider.name,
                status: "SENT",
                refundedCredits: 0,
            };
        }

        // Provider balance was consumed by another request first.
        await recordFailedAttempt(
            sms.id,
            provider.id,
            "Provider balance became insufficient before delivery."
        );
    }

    // No provider succeeded: mark the message failed and refund once.
    const refunded = await refundAndFailSms(sms);

    return {
        success: false,
        smsId: sms.id,
        status: "FAILED",
        refunded,
        refundedCredits: refunded ? sms.cost : 0,
        message: providers.length === 0
            ? "No active providers available. Credits refunded."
            : "All providers failed or lacked balance. Credits refunded.",
    };
};
