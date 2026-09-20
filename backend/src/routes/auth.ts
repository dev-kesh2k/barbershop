import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db";
import { asyncHandler } from "../lib/async";
import {
  applyDemoMode,
  requireAuth,
  signToken,
  toPublicUser,
} from "../middleware/auth";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, "Nome muito curto."),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres."),
});

const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(1, "Senha obrigatória."),
});

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message });
      return;
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "E-mail já cadastrado." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    });

    const token = signToken(user);
    res.status(201).json({ token, user: applyDemoMode(toPublicUser(user)) });
  }),
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message });
      return;
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: "E-mail ou senha incorretos." });
      return;
    }

    const token = signToken(user);
    res.json({ token, user: applyDemoMode(toPublicUser(user)) });
  }),
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      res.status(404).json({ error: "Usuário não encontrado." });
      return;
    }
    res.json({ user: applyDemoMode(toPublicUser(user)) });
  }),
);

export default router;
