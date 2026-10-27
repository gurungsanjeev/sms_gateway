
import prisma from "../config/prisma.js";

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








export const deliverSms = async (smsId) => {
    const sms = await prisma.smsMessage.findUnique({
        where: { id: smsId },
    });

    if (!sms) {
        throw new Error("SMS_NOT_FOUND");
    }


    if (sms.status !== "PENDING") {
        throw new Error("SMS_NOT_PENDING");
    }

    // Atomically claim the SMS for delivery.
    const claimedSms = await prisma.smsMessage.updateMany({
        where: {
            id: smsId,
            status: "PENDING",
        },
        data: {
            status: "PROCESSING",
        },
    });

    if (claimedSms.count === 0) {
        throw new Error("SMS_NOT_PENDING");
    }

    const providers = await prisma.provider.findMany({
        where: { isActive: true },
        orderBy: { priority: "asc" },
    });



    if (providers.length === 0) {
    const refunded = await prisma.$transaction(async (tx) => {
        const updatedSms = await tx.smsMessage.updateMany({
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

        if (updatedSms.count === 0) {
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

    return {
        success: false,
        smsId: sms.id,
        status: "FAILED",
        refunded,
        refundedCredits: refunded ? sms.cost : 0,
        message: "No active SMS providers available. Credits refunded.",
    };
}


    for (const provider of providers) {
        const result = simulateProviderDelivery(provider);

        await prisma.smsAttempt.create({
            data: {
                smsMessageId: sms.id,
                providerId: provider.id,
                status: result.success ? "SUCCESS" : "FAILED",
                response: result.response ?? null,
                error: result.error ?? null,
            },
        });

        if (result.success) {
            await prisma.smsMessage.update({
                where: { id: sms.id },
                data: {
                    status: "SENT",
                    selectedProviderId: provider.id,
                },
            });

            return {
                success: true,
                smsId: sms.id,
                provider: provider.name,
                status: "SENT",
            };
        }
    }

    // All providers failed, or there were no active providers.
    // Use a transaction to mark the SMS failed and refund once.
    const refunded = await prisma.$transaction(async (tx) => {
        const currentSms = await tx.smsMessage.findUnique({
            where: { id: sms.id },
        });

        if (!currentSms) {
            throw new Error("SMS_NOT_FOUND");
        }

        if (currentSms.status !== "PROCESSING") {
            throw new Error("SMS_NOT_PENDING");
        }

        const updatedSms = await tx.smsMessage.updateMany({
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

        if (updatedSms.count === 0) {
            return false;
        }

        await tx.wallet.update({
            where: { userId: currentSms.userId },
            data: {
                balance: { increment: currentSms.cost },
            },
        });

        return true;
    });

    return {
        success: false,
        smsId: sms.id,
        status: "FAILED",
        refunded,
        refundedCredits: sms.cost,
        message: "All providers failed. Credits refunded.",
    };
};
