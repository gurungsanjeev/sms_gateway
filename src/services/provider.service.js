
import prisma from "../config/prisma.js";

export const getBalance = async (providerId) => {
    const provider = await prisma.provider.findUnique({
        where: { id: providerId },
        select: { balance: true },
    });

    if (!provider) {
        throw new Error("PROVIDER_NOT_FOUND");
    }

    return provider.balance;
};
