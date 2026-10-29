
import prisma from "../src/config/prisma.js";



// 3 different mock provider for the sms services


// defining the providers
const providers = [
  {
    name: "MockProviderA",
    priority: 1, // determines the order in which provder are tried
    balance: 10000, /// mock provider's available balance
    failureRate: 0.3,   /// probability that a delivery attempt fails (0.3 means 30% chance of failure for Provider A)
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
    await prisma.provider.upsert({  // upsert (database operations) combines two operation for  (insert and update)
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
