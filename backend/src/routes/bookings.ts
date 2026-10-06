import { Router } from "express";
import bcrypt from "bcryptjs";
import { BookingStatus, Role } from "../lib/constants";
import { addMinutes, endOfDay, startOfDay } from "date-fns";
import { z } from "zod";
import { prisma } from "../db";
import { asyncHandler } from "../lib/async";
import {
  buildDaySlots,
  findDayHours,
  withDefaults,
} from "../lib/opening-hours";
import { optionalAuth, requireAuth } from "../middleware/auth";

const router = Router();

const MAX_OPEN_BOOKINGS = 3;

const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) =>
  aStart < bEnd && aEnd > bStart;

const createSchema = z.object({
  serviceId: z.string().min(1),
  barberId: z.string().min(1).optional(),
  date: z.string().datetime({ offset: true }).or(z.string().datetime()),
  guestName: z.string().min(2).optional(),
  guestPhone: z.string().min(8).optional(),
});

const phoneSchema = z.object({
  phone: z.string().min(8),
});

function normalizePhoneDigits(phone: string) {
  return phone.replace(/\D/g, "");
}

async function findGuestByPhone(phone: string) {
  const digits = normalizePhoneDigits(phone);
  if (digits.length < 8) return null;

  const guestEmail = `guest-${digits}@barbershop.local`;
  let guest = await prisma.user.findUnique({ where: { email: guestEmail } });

  if (!guest) {
    const candidates = await prisma.user.findMany({
      where: { role: Role.CUSTOMER, phone: { not: null } },
    });
    guest =
      candidates.find((u) => u.phone && normalizePhoneDigits(u.phone) === digits) ??
      null;
  }

  return guest;
}

function mapBookings<T extends { service: { price: unknown } }>(bookings: T[]) {
  return bookings.map((b) => ({
    ...b,
    service: { ...b.service, price: Number(b.service.price) },
  }));
}

const bookingInclude = {
  barber: { select: { id: true, name: true, title: true, imageUrl: true } },
  service: {
    include: {
      barbershop: {
        select: { id: true, name: true, address: true, imageUrl: true },
      },
    },
  },
} as const;

router.post("/", optionalAuth, asyncHandler(async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." });
    return;
  }

  const bookingDate = new Date(parsed.data.date);
  if (Number.isNaN(bookingDate.getTime())) {
    res.status(400).json({ error: "Data inválida." });
    return;
  }

  if (bookingDate.getTime() <= Date.now()) {
    res.status(400).json({ error: "Escolha um horário no futuro." });
    return;
  }

  let userId = req.user?.id;

  if (!userId) {
    const { guestName, guestPhone } = parsed.data;
    if (!guestName?.trim() || guestName.trim().length < 2) {
      res.status(400).json({ error: "Informe o nome para agendar." });
      return;
    }
    if (!guestPhone) {
      res.status(400).json({ error: "Informe o telefone para agendar." });
      return;
    }

    const digits = normalizePhoneDigits(guestPhone);
    if (digits.length < 8) {
      res.status(400).json({ error: "Telefone inválido." });
      return;
    }

    let guest = await findGuestByPhone(guestPhone);
    const name = guestName.trim();

    if (!guest) {
      const passwordHash = await bcrypt.hash(`guest-${digits}-${Date.now()}`, 10);
      guest = await prisma.user.create({
        data: {
          name,
          email: `guest-${digits}@barbershop.local`,
          phone: guestPhone.trim(),
          passwordHash,
          role: Role.CUSTOMER,
        },
      });
    } else {
      guest = await prisma.user.update({
        where: { id: guest.id },
        data: {
          name,
          phone: guest.phone ?? guestPhone.trim(),
        },
      });
    }

    userId = guest.id;
  }

  const dayStart = startOfDay(bookingDate);
  const dayEnd = endOfDay(bookingDate);

  const sameDayCount = await prisma.booking.count({
    where: {
      userId,
      status: BookingStatus.CONFIRMED,
      date: { gte: dayStart, lte: dayEnd },
    },
  });

  if (sameDayCount >= MAX_OPEN_BOOKINGS) {
    res.status(400).json({
      error: `Você já tem ${MAX_OPEN_BOOKINGS} horários marcados nesta data. Conclua ou cancele um para marcar outro.`,
    });
    return;
  }

  const service = await prisma.barbershopService.findUnique({
    where: { id: parsed.data.serviceId },
    select: {
      id: true,
      isActive: true,
      durationMinutes: true,
      barbershopId: true,
    },
  });

  if (!service || !service.isActive) {
    res.status(404).json({ error: "Serviço indisponível." });
    return;
  }

  const activeBarbers = await prisma.barber.count({
    where: { barbershopId: service.barbershopId, isActive: true },
  });
  if (activeBarbers > 0 && !parsed.data.barberId) {
    res.status(400).json({ error: "Escolha o barbeiro." });
    return;
  }

  if (parsed.data.barberId) {
    const barber = await prisma.barber.findFirst({
      where: {
        id: parsed.data.barberId,
        barbershopId: service.barbershopId,
        isActive: true,
      },
    });
    if (!barber) {
      res.status(404).json({ error: "Barbeiro indisponível." });
      return;
    }
  }

  const openingHours = withDefaults(
    await prisma.openingHour.findMany({
      where: { barbershopId: service.barbershopId },
      select: { weekday: true, opensAt: true, closesAt: true, isClosed: true },
    }),
  );

  const timeStr = `${String(bookingDate.getHours()).padStart(2, "0")}:${String(
    bookingDate.getMinutes(),
  ).padStart(2, "0")}`;

  const validSlot = buildDaySlots(
    findDayHours(openingHours, bookingDate),
    service.durationMinutes,
  ).includes(timeStr);

  if (!validSlot) {
    res.status(400).json({ error: "A barbearia não atende nesse horário." });
    return;
  }

  const endsAt = addMinutes(bookingDate, service.durationMinutes);
  const from = startOfDay(bookingDate);
  const to = endOfDay(bookingDate);

  const [sameDayBookings, block] = await Promise.all([
    prisma.booking.findMany({
      where: {
        date: { gte: from, lte: to },
        status: { not: BookingStatus.CANCELED },
        service: { barbershopId: service.barbershopId },
      },
      select: {
        date: true,
        barberId: true,
        service: { select: { durationMinutes: true } },
      },
    }),
    prisma.scheduleBlock.findFirst({
      where: {
        barbershopId: service.barbershopId,
        startsAt: { lt: endsAt },
        endsAt: { gt: bookingDate },
      },
    }),
  ]);

  if (block) {
    res.status(409).json({ error: "Esse horário está bloqueado pela barbearia." });
    return;
  }

  const conflict = sameDayBookings.some((booking) => {
    const sameChair =
      !parsed.data.barberId ||
      booking.barberId === parsed.data.barberId ||
      booking.barberId == null;
    if (!sameChair) return false;
    return overlaps(
      bookingDate,
      endsAt,
      booking.date,
      addMinutes(booking.date, booking.service.durationMinutes),
    );
  });

  if (conflict) {
    res.status(409).json({ error: "Esse horário acabou de ser ocupado. Escolha outro." });
    return;
  }

  const booking = await prisma.booking.create({
    data: {
      serviceId: parsed.data.serviceId,
      barberId: parsed.data.barberId,
      date: bookingDate,
      userId,
    },
    include: {
      barber: { select: { id: true, name: true, title: true, imageUrl: true } },
      service: {
        include: { barbershop: { select: { id: true, name: true, imageUrl: true } } },
      },
    },
  });

  res.status(201).json({
    booking: {
      ...booking,
      service: {
        ...booking.service,
        price: Number(booking.service.price),
      },
    },
  });
}));

router.post("/lookup", asyncHandler(async (req, res) => {
  const parsed = phoneSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Informe um telefone válido." });
    return;
  }

  const digits = normalizePhoneDigits(parsed.data.phone);
  if (digits.length < 8) {
    res.status(400).json({ error: "Telefone inválido." });
    return;
  }

  const guest = await findGuestByPhone(parsed.data.phone);
  if (!guest) {
    res.json({ bookings: [] });
    return;
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: guest.id },
    orderBy: { date: "desc" },
    include: bookingInclude,
  });

  res.json({ bookings: mapBookings(bookings) });
}));

router.get("/", requireAuth, asyncHandler(async (req, res) => {
  const bookings = await prisma.booking.findMany({
    where: { userId: req.user!.id },
    orderBy: { date: "desc" },
    include: bookingInclude,
  });

  res.json({ bookings: mapBookings(bookings) });
}));

router.delete("/:id", optionalAuth, asyncHandler(async (req, res) => {
  const phone = typeof req.body?.phone === "string" ? req.body.phone : undefined;

  let booking = null;

  if (req.user) {
    booking = await prisma.booking.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
  } else if (phone) {
    const guest = await findGuestByPhone(phone);
    if (guest) {
      booking = await prisma.booking.findFirst({
        where: { id: req.params.id, userId: guest.id },
      });
    }
  } else {
    res.status(401).json({ error: "Informe o telefone para cancelar." });
    return;
  }

  if (!booking) {
    res.status(404).json({ error: "Agendamento não encontrado." });
    return;
  }

  if (booking.status === BookingStatus.CANCELED) {
    res.status(400).json({ error: "Agendamento já cancelado." });
    return;
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: BookingStatus.CANCELED },
    include: {
      service: {
        include: {
          barbershop: { select: { id: true, name: true, imageUrl: true } },
        },
      },
      barber: { select: { id: true, name: true, title: true, imageUrl: true } },
    },
  });

  res.json({
    booking: {
      ...updated,
      service: { ...updated.service, price: Number(updated.service.price) },
    },
  });
}));

export default router;
