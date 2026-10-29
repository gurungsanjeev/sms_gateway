
import prisma from "../config/prisma.js";

const REFERENCE_PROVIDER_BALANCE = 10000;

export const getRoutesHealth = async (req, res) => {
    try {

        // for last 24 hrs
        const last24Hours = new Date(
            Date.now() - 24 * 60 * 60 * 1000
        );

        const providers = await prisma.provider.findMany({
            orderBy: { priority: "asc" },
            include: {
                attempts: {
                    where: {
                        attemptedAt: {
                            gte: last24Hours,
                        },
                    },
                    select: {
                        status: true,
                    },
                },
            },
        });

        const routes = providers.map((provider) => {
            const totalAttempts = provider.attempts.length;

            const successfulAttempts = provider.attempts.filter(
                (attempt) => attempt.status === "SUCCESS"
            ).length;

            const successRate =
                totalAttempts > 0
                    ? (successfulAttempts / totalAttempts) * 100
                    : null;

            const balanceScore = Math.min(
                (provider.balance / REFERENCE_PROVIDER_BALANCE) * 100,
                100
            );

            // Health is unavailable until we have attempt data.

            /// using 70 % success rate and 30 % for the balance score 
            // ( as it prioritize succsesful sms delivery while still considering available balance)
            const health =
                successRate === null
                    ? null
                    : 0.7 * successRate + 0.3 * balanceScore;

            return {
                name: provider.name,
                priority: provider.priority,
                isActive: provider.isActive,
                balance: provider.balance,
                attemptsLast24Hours: totalAttempts,
                successfulAttempts,
                failedAttempts: totalAttempts - successfulAttempts,
                successRate:
                    successRate === null
                        ? null
                        : Number(successRate.toFixed(2)),
                health:
                    health === null
                        ? null
                        : Number(health.toFixed(2)),
            };
        });

        return res.status(200).json({
            success: true,
            period: "Last 24 hours",
            healthFormula:
                "Health = (Success Rate × 0.7) + (Balance Score × 0.3)",
            routes,
        });
    } catch (error) {
        console.error("Get routes health error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};
