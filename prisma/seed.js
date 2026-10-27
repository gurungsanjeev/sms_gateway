
import prisma from "../src/config/prisma.js";

const providers = [
  {
    name: "MockProviderA",
    priority: 1,
    balance: 10000,
    failureRate: 0.3,
    isActive: true,
  },
  {
    name: "MockProviderB",
    priority: 2,
    balance: 10000,
    failureRate: 0.2,
    isActive: true,
  },
  {
    name: "MockProviderC",
    priority: 3,
    balance: 10000,
    failureRate: 0.1,
    isActive: true,
  },
];

async function main() {
  for (const provider of providers) {
    await prisma.provider.upsert({
      where: { name: provider.name },
      update: provider,
      create: provider,
    });
  }

  console.log("Mock SMS providers seeded successfully.");
}

main()
  .catch((error) => {
    console.error("Error seeding providers:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
