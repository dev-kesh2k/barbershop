import { Router } from "express";
import { BookingStatus, parsePhones } from "../lib/constants";
import { addMinutes, endOfDay, parseISO, startOfDay } from "date-fns";
import { prisma } from "../db";
import { asyncHandler } from "../lib/async";
import {
  buildDaySlots,
  findDayHours,
  withDefaults,
} from "../lib/opening-hours";

const router = Router();

const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) =>
  aStart < bEnd && aEnd > bStart;

router.get("/", asyncHandler(async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

  const barbershops = await prisma.barbershop.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q } },
            { address: { contains: q } },
            { description: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      address: true,
      phones: true,
      description: true,
      imageUrl: true,
    },
  });

  res.json({
    barbershops: barbershops.map((shop) => ({
      ...shop,
      phones: parsePhones(shop.phones),
    })),
  });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const barbershop = await prisma.barbershop.findUnique({
    where: { id: req.params.id },
    include: {
      services: { where: { isActive: true }, orderBy: { name: "asc" } },
      openingHours: {
        select: { weekday: true, opensAt: true, closesAt: true, isClosed: true },
      },
    },
  });

  if (!barbershop) {
    res.status(404).json({ error: "Barbearia não encontrada." });
    return;
  }

  const { openingHours, services, ...rest } = barbershop;
  res.json({
    barbershop: {
      ...rest,
      phones: parsePhones(rest.phones),
      services: services.map((s) => ({
        ...s,
        price: Number(s.price),
      })),
      openingHours: withDefaults(openingHours),
    },
  });
}));

router.get("/:id/slots", asyncHandler(async (req, res) => {
  const serviceId =
    typeof req.query.serviceId === "string" ? req.query.serviceId : "";
  const dateStr = typeof req.query.date === "string" ? req.query.date : "";

  if (!serviceId || !dateStr) {
    res.status(400).json({ error: "serviceId e date são obrigatórios." });
    return;
  }

  const service = await prisma.barbershopService.findFirst({
    where: { id: serviceId, barbershopId: req.params.id, isActive: true },
  });

  if (!service) {
    res.status(404).json({ error: "Serviço não encontrado." });
    return;
  }

  let day: Date;
  try {
    day = parseISO(`${dateStr}T12:00:00`);
    if (Number.isNaN(day.getTime())) throw new Error("invalid");
  } catch {
    res.status(400).json({ error: "Data inválida. Use YYYY-MM-DD." });
    return;
  }

  const openingHours = withDefaults(
    await prisma.openingHour.findMany({
      where: { barbershopId: req.params.id },
      select: { weekday: true, opensAt: true, closesAt: true, isClosed: true },
    }),
  );

  const dayHours = findDayHours(openingHours, day);
  const allSlots = buildDaySlots(dayHours, service.durationMinutes);

  const from = startOfDay(day);
  const to = endOfDay(day);
  const now = new Date();

  const [bookings, blocks] = await Promise.all([
    prisma.booking.findMany({
      where: {
        date: { gte: from, lte: to },
        status: { not: BookingStatus.CANCELED },
        service: { barbershopId: req.params.id },
      },
      select: { date: true, service: { select: { durationMinutes: true } } },
    }),
    prisma.scheduleBlock.findMany({
      where: {
        barbershopId: req.params.id,
        startsAt: { lte: to },
        endsAt: { gte: from },
      },
      select: { startsAt: true, endsAt: true },
    }),
  ]);

  const available = allSlots.filter((slot) => {
    const [h, m] = slot.split(":").map(Number);
    const slotStart = new Date(day);
    slotStart.setHours(h, m, 0, 0);
    const slotEnd = addMinutes(slotStart, service.durationMinutes);

    if (slotStart.getTime() <= now.getTime()) return false;

    const blocked = blocks.some((block) =>
      overlaps(slotStart, slotEnd, block.startsAt, block.endsAt),
    );
    if (blocked) return false;

    const conflict = bookings.some((booking) =>
      overlaps(
        slotStart,
        slotEnd,
        booking.date,
        addMinutes(booking.date, booking.service.durationMinutes),
      ),
    );
    return !conflict;
  });

  res.json({ slots: available });
}));

export default router;
