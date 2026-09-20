import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "../src/lib/seed";

async function main() {
  const prisma = new PrismaClient();
  try {
    await seedDatabase(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Erro no seed:", error);
  process.exit(1);
});
