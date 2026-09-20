import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

export async function waitForDatabase(attempts = 30, delayMs = 1000): Promise<void> {
  let last: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      if (i > 1) console.log(`Database: pronto após ${i} tentativa(s)`);
      return;
    } catch (err) {
      last = err;
      console.warn(`Database: tentativa ${i}/${attempts} falhou, aguardando...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw last instanceof Error ? last : new Error(String(last));
}
