
import prisma from "../config/prisma.js";
import {
    calculateSmsParts,
    normalizeNepaliPhone,
} from "../utils/sms.utils.js";
import { deliverSms } from "../services/sms.service.js";

export const sendSms = async (req, res) => {
    try {
        const { to, message } = req.body;

        // Validate the request.
        if (
            !Array.isArray(to) ||
            to.length === 0 ||
            to.some(
                (number) =>
                    typeof number !== "string" || !number.trim()
            ) ||
            typeof message !== "string" ||
            !message.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Provide a non-empty array of recipients and a message.",
            });
        }

        // Normalize and validate every phone number before charging.
        const normalizedRecipients = to.map((number) =>
            normalizeNepaliPhone(number.trim())
        );

        const invalidNumbers = to.filter(
            (_, index) => !normalizedRecipients[index]
        );

        if (invalidNumbers.length > 0) {
            return res.status(400).json({
                success: false,
                message: "One or more Nepali mobile numbers are invalid.",
                invalidNumbers,
            });
        }

        // Calculate the cost for the complete request.
        const smsInfo = calculateSmsParts(message);
        const costPerMessage = smsInfo.parts;
        const totalCost = costPerMessage * normalizedRecipients.length;

        // Do not charge if no providers are active.
        const activeProviders = await prisma.provider.count({
            where: { isActive: true },
        });

        if (activeProviders === 0) {
            return res.status(503).json({
                success: false,
                message: "No active SMS providers available.",
            });
        }

        // Deduct all credits and create every SMS record atomically.
        const createdMessages = await prisma.$transaction(async (tx) => {
            const debit = await tx.wallet.updateMany({
                where: {
                    userId: req.user.userId,
                    balance: { gte: totalCost },
                },
                data: {
                    balance: { decrement: totalCost },
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

            const messages = [];

            for (const recipient of normalizedRecipients) {
                const sms = await tx.smsMessage.create({
                    data: {
                        recipient,
                        message,
                        parts: smsInfo.parts,
                        cost: costPerMessage,
                        status: "PENDING",
                        userId: req.user.userId,
                    },
                });

                messages.push(sms);
            }

            return messages;
        });

        // Attempt delivery for each SMS.
        const results = [];

        for (const sms of createdMessages) {
            const delivery = await deliverSms(sms.id);

            results.push({
                smsId: sms.id,
                recipient: sms.recipient,
                parts: sms.parts,
                cost: sms.cost,
                status: delivery.status,
                provider: delivery.provider ?? null,
                success: delivery.success,
                refundedCredits: delivery.refundedCredits ?? 0,
            });
        }

        const walletAfterDelivery = await prisma.wallet.findUnique({
            where: { userId: req.user.userId },
            select: { balance: true },
        });

        const allSent = results.every((result) => result.success);
        const totalRefundedCredits = results.reduce(
            (total, result) => total + result.refundedCredits,
            0
        );

        return res.status(200).json({
            success: allSent,
            message: allSent
                ? "All SMS messages sent successfully."
                : "SMS processing completed. Check each message status.",
            data: {
                totalMessages: results.length,
                totalCost,
                totalRefundedCredits,
                remainingCredits: walletAfterDelivery?.balance ?? null,
                encoding: smsInfo.encoding,
                results,
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
                message: "Insufficient wallet credits for all recipients.",
            });
        }

        console.error("Send SMS error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};





export const getSmsLogs = async (req, res) => {
    try {
        const {
            page = "1",
            limit = "10",
            status,
            from,
            to,
            number,
        } = req.query;

        const pageNumber = Number(page);
        const pageSize = Number(limit);

        if (
            !Number.isInteger(pageNumber) ||
            pageNumber < 1 ||
            !Number.isInteger(pageSize) ||
            pageSize < 1 ||
            pageSize > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Page must be positive; limit must be between 1 and 100.",
            });
        }

        const allowedStatuses = ["PENDING", "SENT", "FAILED"];
        let normalizedStatus;

        if (status !== undefined) {
            normalizedStatus = String(status).toUpperCase();

            if (!allowedStatuses.includes(normalizedStatus)) {
                return res.status(400).json({
                    success: false,
                    message: "Status must be pending, sent, or failed.",
                });
            }
        }

        const dateFrom = from ? new Date(from) : undefined;
        const dateTo = to ? new Date(to) : undefined;

        if (
            (from && Number.isNaN(dateFrom.getTime())) ||
            (to && Number.isNaN(dateTo.getTime()))
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid date. Use a valid date format such as 2026-10-27.",
            });
        }

        if (dateFrom && dateTo && dateFrom > dateTo) {
            return res.status(400).json({
                success: false,
                message: "'from' date cannot be later than 'to' date.",
            });
        }

        const where = {
            userId: req.user.userId,
        };

        if (normalizedStatus) {
            where.status = normalizedStatus;
        }

        if (number) {
            where.recipient = {
                contains: String(number).trim(),
            };
        }

        if (dateFrom || dateTo) {
            where.createdAt = {};

            if (dateFrom) {
                where.createdAt.gte = dateFrom;
            }

            if (dateTo) {
                where.createdAt.lte = dateTo;
            }
        }

        const skip = (pageNumber - 1) * pageSize;

        const [logs, total] = await prisma.$transaction([
            prisma.smsMessage.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: pageSize,
                include: {
                    selectedProvider: {
                        select: { name: true },
                    },
                    attempts: {
                        orderBy: { attemptedAt: "asc" },
                        include: {
                            provider: {
                                select: { name: true },
                            },
                        },
                    },
                },
            }),
            prisma.smsMessage.count({ where }),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                logs,
                pagination: {
                    page: pageNumber,
                    limit: pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize),
                },
            },
        });
    } catch (error) {
        console.error("Get SMS logs error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};
