
import prisma from "../config/prisma.js";
import {
    calculateSmsParts,
    normalizeNepaliPhone,
} from "../utils/sms.utils.js";
import { deliverSms } from "../services/sms.service.js";

export const sendSms = async (req, res) => {
    try {

        const { recipient, message } = req.body;

        if (
            typeof recipient !== "string" ||
            !recipient.trim() ||
            typeof message !== "string" ||
            !message.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Recipient and message are required.",
            });
        }

        const normalizedRecipient = normalizeNepaliPhone(recipient.trim());

        if (!normalizedRecipient) {
            return res.status(400).json({
                success: false,
                message: "Invalid Nepali mobile number.",
            });
        }

        const smsInfo = calculateSmsParts(message);
        const cost = smsInfo.parts;


        const providers = await prisma.provider.findMany({
            where: { isActive: true },
            orderBy: { priority: "asc" },
            select: { id: true, name: true, priority: true },
        });

        if (providers.length === 0) {
            return res.status(503).json({
                success: false,
                message: "No active SMS providers available.",
            });
        }

        const result = await prisma.$transaction(async (tx) => {
            // Deduct credits only if the wallet has enough balance.
            const debit = await tx.wallet.updateMany({
                where: {
                    userId: req.user.userId,
                    balance: { gte: cost },
                },
                data: {
                    balance: { decrement: cost },
                },
            });

            if (debit.count === 0) {
                const wallet = await tx.wallet.findUnique({
                    where: { userId: req.user.userId },
                    select: { balance: true },
                });

                if (!wallet) {
                    throw new Error("WALLET_NOT_FOUND");
                }

                throw new Error("INSUFFICIENT_CREDITS");
            }

            const wallet = await tx.wallet.findUnique({
                where: { userId: req.user.userId },
                select: { balance: true },
            });

            const sms = await tx.smsMessage.create({
                data: {
                    recipient: normalizedRecipient,
                    message,
                    parts: smsInfo.parts,
                    cost,
                    status: "PENDING",
                    userId: req.user.userId,
                },
            });

            return { sms, wallet };
        });


        const delivery = await deliverSms(result.sms.id);

        const walletAfterDelivery = await prisma.wallet.findUnique({
            where: {
                userId: req.user.userId,
            },
            select: {
                balance: true,
            },
        });

        return res.status(delivery.success ? 201 : 502).json({
            success: delivery.success,
            message: delivery.success
                ? "SMS sent successfully."
                : "All SMS providers failed. Credits have been refunded.",
            data: {
                smsId: result.sms.id,
                recipient: result.sms.recipient,
                parts: smsInfo.parts,
                encoding: smsInfo.encoding,
                cost,
                remainingCredits: walletAfterDelivery.balance,
                status: delivery.status,
                provider: delivery.provider ?? null,
                refundedCredits: delivery.refundedCredits ?? 0,
            },
        });





    } catch (error) {
        if (error.message === "WALLET_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Wallet not found.",
            });
        }

        if (error.message === "INSUFFICIENT_CREDITS") {
            return res.status(400).json({
                success: false,
                message: "Insufficient wallet credits.",
            });
        }

        console.error("Send SMS error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};
