import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db";

export type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export const asyncHandler =
  (fn: AsyncHandler) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

function reconnectPrisma() {
  prisma.$disconnect()
    .catch(() => undefined)
    .finally(() => {
      prisma.$connect().catch((e) => {
        console.error("Prisma reconnect failed:", e instanceof Error ? e.message : e);
      });
    });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const code = (err as { code?: string })?.code;
  const status = (err as { status?: number; statusCode?: number })?.status
    ?? (err as { statusCode?: number })?.statusCode;
  const message = err instanceof Error ? err.message : String(err);

  if (status === 400 || (err as { type?: string })?.type === "entity.parse.failed") {
    res.status(400).json({ error: "JSON inválido." });
    return;
  }

  if (code === "P1017" || code === "P1001" || /Server has closed the connection/i.test(message)) {
    console.error("Database connection error:", message);
    reconnectPrisma();
    res.status(503).json({
      error: "Banco de dados indisponível. Tente novamente em alguns segundos.",
    });
    return;
  }

  console.error("Unhandled route error:", err);
  res.status(500).json({ error: "Erro interno do servidor." });
}
