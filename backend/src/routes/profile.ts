import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { asyncHandler } from "../lib/async";
import { applyDemoMode, requireAuth, toPublicUser } from "../middleware/auth";

const router = Router();

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().nullable().optional(),
});

router.patch(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message });
      return;
    }

    const data: { name?: string; phone?: string | null } = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.phone !== undefined) data.phone = parsed.data.phone;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data,
    });

    res.json({ user: applyDemoMode(toPublicUser(user)) });
  }),
);

export default router;
