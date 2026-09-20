import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { User } from "@prisma/client";
import type { Role } from "../lib/constants";
import { Role as RoleValues } from "../lib/constants";
import type { PublicUser } from "../types/express";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

export const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role as Role,
  barbershopId: user.barbershopId,
});

export const applyDemoMode = (user: PublicUser): PublicUser => {
  if (process.env.DEMO_MODE === "true" || process.env.DEMO_MODE === "1") {
    return { ...user, role: RoleValues.BARBER_ADMIN };
  }
  return user;
};

export const signToken = (user: User): string =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      barbershopId: user.barbershopId,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  );

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Não autenticado." });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    req.user = applyDemoMode({
      id: payload.sub as string,
      email: payload.email as string,
      name: null,
      phone: null,
      role: payload.role as Role,
      barbershopId: (payload.barbershopId as string | null) ?? null,
    });
    next();
  } catch {
    res.status(401).json({ error: "Token inválido." });
  }
};

/** Like requireAuth, but continues without req.user if token is missing/invalid. */
export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    req.user = applyDemoMode({
      id: payload.sub as string,
      email: payload.email as string,
      name: null,
      phone: null,
      role: payload.role as Role,
      barbershopId: (payload.barbershopId as string | null) ?? null,
    });
  } catch {
    // ignore invalid token — treat as guest
  }
  next();
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    res.status(401).json({ error: "Não autenticado." });
    return;
  }

  const user = applyDemoMode(req.user);
  if (user.role !== RoleValues.BARBER_ADMIN || !user.barbershopId) {
    res.status(403).json({ error: "Acesso negado." });
    return;
  }

  req.user = user;
  next();
};
