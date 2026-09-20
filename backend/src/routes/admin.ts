import { Router } from "express";
import { Prisma } from "@prisma/client";
import { endOfDay, startOfDay } from "date-fns";
import { z } from "zod";
import { prisma } from "../db";
import { asyncHandler } from "../lib/async";
import { BookingStatus, parsePhones, serializePhones } from "../lib/constants";
import { DEFAULT_OPENING_HOURS, withDefaults } from "../lib/opening-hours";
import { handleUpload, isValidImageRef } from "../lib/uploads";
import { requireAdmin, requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth, requireAdmin);

const imageUrlSchema = z
  .string()
  .min(1, "Imagem obrigatória.")
  .refine(isValidImageRef, "Informe uma URL válida ou envie um arquivo de imagem.");

router.post("/uploads", handleUpload, (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Selecione uma imagem." });
    return;
  }
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

router.get("/dashboard", asyncHandler(async (req, res) => {
  const barbershopId = req.user!.barbershopId!;
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [todayBookings, upcomingBookings, servicesCount, blocks] =
    await Promise.all([
      prisma.booking.count({
        where: {
          date: { gte: todayStart, lte: todayEnd },
          status: { not: BookingStatus.CANCELED },
          service: { barbershopId },
        },
      }),
      prisma.booking.count({
        where: {
          date: { gt: new Date() },
          status: BookingStatus.CONFIRMED,
          service: { barbershopId },
        },
      }),
      prisma.barbershopService.count({ where: { barbershopId } }),
      prisma.scheduleBlock.findMany({
        where: {
          barbershopId,
          endsAt: { gte: new Date() },
        },
        orderBy: { startsAt: "asc" },
        take: 10,
      }),
    ]);

  res.json({
    dashboard: {
      todayBookings,
      upcomingBookings,
      servicesCount,
      blocks,
    },
  });
}));

router.get("/bookings", asyncHandler(async (req, res) => {
  const barbershopId = req.user!.barbershopId!;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;

  const bookings = await prisma.booking.findMany({
    where: {
      service: { barbershopId },
      ...(status ? { status } : { status: { not: BookingStatus.CANCELED } }),
    },
    orderBy: { date: "asc" },
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
      service: {
        select: {
          id: true,
          name: true,
          price: true,
          durationMinutes: true,
        },
      },
    },
  });

  res.json({
    bookings: bookings.map((b) => ({
      ...b,
      service: { ...b.service, price: Number(b.service.price) },
    })),
  });
}));

const bookingStatusSchema = z.object({
  status: z.enum([
    BookingStatus.CONFIRMED,
    BookingStatus.COMPLETED,
    BookingStatus.CANCELED,
    BookingStatus.NO_SHOW,
  ]),
});

router.patch("/bookings/:id", asyncHandler(async (req, res) => {
  const parsed = bookingStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Status inválido." });
    return;
  }

  const barbershopId = req.user!.barbershopId!;
  const existing = await prisma.booking.findFirst({
    where: {
      id: req.params.id,
      service: { barbershopId },
    },
  });

  if (!existing) {
    res.status(404).json({ error: "Agendamento não encontrado." });
    return;
  }

  const booking = await prisma.booking.update({
    where: { id: existing.id },
    data: { status: parsed.data.status },
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
      service: {
        select: { id: true, name: true, price: true, durationMinutes: true },
      },
    },
  });

  res.json({
    booking: {
      ...booking,
      service: { ...booking.service, price: Number(booking.service.price) },
    },
  });
}));

router.get("/services", asyncHandler(async (req, res) => {
  const services = await prisma.barbershopService.findMany({
    where: { barbershopId: req.user!.barbershopId! },
    orderBy: { name: "asc" },
  });

  res.json({
    services: services.map((s) => ({ ...s, price: Number(s.price) })),
  });
}));

const serviceSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  imageUrl: imageUrlSchema,
  price: z.number().positive(),
  durationMinutes: z.number().int().min(15).max(240).optional(),
  isActive: z.boolean().optional(),
});

router.post("/services", asyncHandler(async (req, res) => {
  const parsed = serviceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message });
    return;
  }

  const { price, durationMinutes, ...rest } = parsed.data;
  const service = await prisma.barbershopService.create({
    data: {
      ...rest,
      price: new Prisma.Decimal(price.toFixed(2)),
      durationMinutes: durationMinutes ?? 45,
      barbershopId: req.user!.barbershopId!,
    },
  });

  res.status(201).json({ service: { ...service, price: Number(service.price) } });
}));

router.patch("/services/:id", asyncHandler(async (req, res) => {
  const parsed = serviceSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message });
    return;
  }

  const { price, ...rest } = parsed.data;
  const data: Prisma.BarbershopServiceUpdateInput = { ...rest };
  if (price !== undefined) {
    data.price = new Prisma.Decimal(price.toFixed(2));
  }

  const result = await prisma.barbershopService.updateMany({
    where: { id: req.params.id, barbershopId: req.user!.barbershopId! },
    data,
  });

  if (result.count === 0) {
    res.status(404).json({ error: "Serviço não encontrado." });
    return;
  }

  const service = await prisma.barbershopService.findUnique({
    where: { id: req.params.id },
  });

  res.json({ service: { ...service!, price: Number(service!.price) } });
}));

router.get("/schedule-blocks", asyncHandler(async (req, res) => {
  const blocks = await prisma.scheduleBlock.findMany({
    where: { barbershopId: req.user!.barbershopId! },
    orderBy: { startsAt: "desc" },
  });
  res.json({ blocks });
}));

const blockSchema = z.object({
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  reason: z.string().optional(),
});

router.post("/schedule-blocks", asyncHandler(async (req, res) => {
  const parsed = blockSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message });
    return;
  }

  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(parsed.data.endsAt);

  if (endsAt <= startsAt) {
    res.status(400).json({ error: "O fim deve ser posterior ao início." });
    return;
  }

  const block = await prisma.scheduleBlock.create({
    data: {
      barbershopId: req.user!.barbershopId!,
      startsAt,
      endsAt,
      reason: parsed.data.reason,
    },
  });

  res.status(201).json({ block });
}));

router.delete("/schedule-blocks/:id", asyncHandler(async (req, res) => {
  const result = await prisma.scheduleBlock.deleteMany({
    where: { id: req.params.id, barbershopId: req.user!.barbershopId! },
  });

  if (result.count === 0) {
    res.status(404).json({ error: "Bloqueio não encontrado." });
    return;
  }

  res.json({ ok: true });
}));

router.get("/opening-hours", asyncHandler(async (req, res) => {
  const hours = await prisma.openingHour.findMany({
    where: { barbershopId: req.user!.barbershopId! },
    select: { weekday: true, opensAt: true, closesAt: true, isClosed: true },
  });

  res.json({ openingHours: withDefaults(hours) });
}));

const openingHourSchema = z.array(
  z.object({
    weekday: z.number().int().min(0).max(6),
    opensAt: z.string().regex(/^\d{2}:\d{2}$/),
    closesAt: z.string().regex(/^\d{2}:\d{2}$/),
    isClosed: z.boolean(),
  }),
);

router.put("/opening-hours", asyncHandler(async (req, res) => {
  const parsed = openingHourSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message });
    return;
  }

  const barbershopId = req.user!.barbershopId!;

  await prisma.$transaction(
    parsed.data.map((hour) =>
      prisma.openingHour.upsert({
        where: {
          barbershopId_weekday: { barbershopId, weekday: hour.weekday },
        },
        create: { barbershopId, ...hour },
        update: hour,
      }),
    ),
  );

  const hours = await prisma.openingHour.findMany({
    where: { barbershopId },
    select: { weekday: true, opensAt: true, closesAt: true, isClosed: true },
  });

  res.json({ openingHours: withDefaults(hours.length ? hours : DEFAULT_OPENING_HOURS) });
}));

const settingsSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  phones: z.array(z.string()).optional(),
  description: z.string().optional(),
  imageUrl: imageUrlSchema.optional(),
});

router.patch("/settings", asyncHandler(async (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message });
    return;
  }

  const { phones, ...rest } = parsed.data;
  const barbershop = await prisma.barbershop.update({
    where: { id: req.user!.barbershopId! },
    data: {
      ...rest,
      ...(phones !== undefined ? { phones: serializePhones(phones) } : {}),
    },
  });

  res.json({
    barbershop: {
      ...barbershop,
      phones: parsePhones(barbershop.phones),
    },
  });
}));

export default router;
