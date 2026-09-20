import "dotenv/config";
import { execSync } from "child_process";
import app from "./app";
import { prisma, waitForDatabase } from "./db";
import { seedDatabase } from "./lib/seed";

const PORT = Number(process.env.PORT || process.env.API_PORT || 4000);

async function syncDatabase() {
  await waitForDatabase();
  execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
}

async function start() {
  await syncDatabase();
  await seedDatabase(prisma);

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Barbershop API listening on 0.0.0.0:${PORT}`);
  });

  const shutdown = async () => {
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch(async (error) => {
  console.error("Failed to start server:", error);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
