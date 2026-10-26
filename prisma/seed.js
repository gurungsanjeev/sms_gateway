
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const providers = [
    {
      name: "ROUTE_A",
      priority: 1,
      balance: 10000,
      failureRate: 0.3,
    },
    {
      name: "ROUTE_B",
      priority: 2,
      balance: 10000,
      failureRate: 0.15,
    },
    {
      name: "ROUTE_C",
      priority: 3,
      balance: 10000,
      failureRate: 0.05,
    },
  ];

  for (const provider of providers) {
    await prisma.provider.upsert({
      where: { name: provider.name },
      update: provider,
      create: provider,
    });
  }

  console.log("SMS providers seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
