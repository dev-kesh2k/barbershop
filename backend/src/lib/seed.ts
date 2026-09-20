import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";
import { serializePhones } from "./constants";
import { DEFAULT_OPENING_HOURS } from "./opening-hours";

const BRUTUS_SERVICES = [
  {
    name: "Alinhar a Barba (Máquina)",
    description: "Alinhamento de barba na máquina.",
    price: 25.0,
    durationMinutes: 30,
    imageUrl:
      "https://utfs.io/f/e6bdffb6-24a9-455b-aba3-903c2c2b5bde-1jo6tu.png",
  },
  {
    name: "Alinhar a Barba (Navalha)",
    description: "Alinhamento de barba na navalha.",
    price: 38.0,
    durationMinutes: 30,
    imageUrl:
      "https://utfs.io/f/e6bdffb6-24a9-455b-aba3-903c2c2b5bde-1jo6tu.png",
  },
  {
    name: "Barba modelo toalha quente navalha",
    description: "Modelagem de barba com toalha quente e navalha.",
    price: 38.0,
    durationMinutes: 30,
    imageUrl:
      "https://utfs.io/f/e6bdffb6-24a9-455b-aba3-903c2c2b5bde-1jo6tu.png",
  },
  {
    name: "Barba remoção total toalha quente",
    description: "Remoção total da barba com toalha quente.",
    price: 40.0,
    durationMinutes: 30,
    imageUrl:
      "https://utfs.io/f/e6bdffb6-24a9-455b-aba3-903c2c2b5bde-1jo6tu.png",
  },
  {
    name: "Barber terapia",
    description: "Sessão de barber terapia.",
    price: 50.0,
    durationMinutes: 30,
    imageUrl:
      "https://utfs.io/f/c4919193-a675-4c47-9f21-ebd86d1c8e6a-4oen2a.png",
  },
  {
    name: "COMBO Corte Raspar + Barba + Sobrancelha",
    description: "Combo com corte raspar, barba e sobrancelha.",
    price: 50.0,
    durationMinutes: 60,
    imageUrl:
      "https://utfs.io/f/0ddfbd26-a424-43a0-aaf3-c3f1dc6be6d1-1kgxo7.png",
  },
  {
    name: "Combo cabelo e barba",
    description: "Combo de corte de cabelo e barba.",
    price: 65.0,
    durationMinutes: 60,
    imageUrl:
      "https://utfs.io/f/0ddfbd26-a424-43a0-aaf3-c3f1dc6be6d1-1kgxo7.png",
  },
  {
    name: "COMBO: Corte Social Degradê + Barba toalha quente + Sobrancelha",
    description:
      "Combo completo com corte social degradê, barba com toalha quente e sobrancelha.",
    price: 75.0,
    durationMinutes: 60,
    imageUrl:
      "https://utfs.io/f/0ddfbd26-a424-43a0-aaf3-c3f1dc6be6d1-1kgxo7.png",
  },
  {
    name: "Corte Degradê (Qualquer Pente)",
    description: "Corte degradê com qualquer pente.",
    price: 35.0,
    durationMinutes: 30,
    imageUrl:
      "https://utfs.io/f/0ddfbd26-a424-43a0-aaf3-c3f1dc6be6d1-1kgxo7.png",
  },
  {
    name: "Corte degradê zero + Sobrancelha",
    description: "Corte degradê zero com sobrancelha.",
    price: 50.0,
    durationMinutes: 30,
    imageUrl:
      "https://utfs.io/f/0ddfbd26-a424-43a0-aaf3-c3f1dc6be6d1-1kgxo7.png",
  },
  {
    name: "Corte Social + Sobrancelha",
    description: "Corte social com sobrancelha.",
    price: 45.0,
    durationMinutes: 30,
    imageUrl:
      "https://utfs.io/f/0ddfbd26-a424-43a0-aaf3-c3f1dc6be6d1-1kgxo7.png",
  },
  {
    name: "Corte Social / Clássico",
    description: "Corte social ou clássico.",
    price: 35.0,
    durationMinutes: 30,
    imageUrl:
      "https://utfs.io/f/0ddfbd26-a424-43a0-aaf3-c3f1dc6be6d1-1kgxo7.png",
  },
];

const BRUTUS_DESCRIPTION =
  "Barbearia com corte clássico e contemporâneo, barba na navalha e atendimento com hora marcada.";

/** Keep a single shop (Brutus) and remove marketplace leftovers. */
export async function ensureSingleShop(prisma: PrismaClient) {
  const shops = await prisma.barbershop.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, description: true },
  });

  if (shops.length === 0) return null;

  const keep =
    shops.find((s) => /brutus/i.test(s.name)) ?? shops[0];

  const extraIds = shops.filter((s) => s.id !== keep.id).map((s) => s.id);

  if (extraIds.length > 0) {
    await prisma.booking.deleteMany({
      where: { service: { barbershopId: { in: extraIds } } },
    });
    await prisma.scheduleBlock.deleteMany({
      where: { barbershopId: { in: extraIds } },
    });
    await prisma.barbershopService.deleteMany({
      where: { barbershopId: { in: extraIds } },
    });
    await prisma.openingHour.deleteMany({
      where: { barbershopId: { in: extraIds } },
    });
    await prisma.user.updateMany({
      where: { barbershopId: { in: extraIds } },
      data: { barbershopId: keep.id },
    });
    await prisma.barbershop.deleteMany({ where: { id: { in: extraIds } } });
    console.log(`Kept shop ${keep.id}; removed ${extraIds.length} extra shop(s).`);
  }

  const needsName = keep.name !== "Brutus Barber";
  const needsDesc =
    /agende online/i.test(keep.description) ||
    /importados/i.test(keep.description) ||
    !keep.description.trim();

  if (needsName || needsDesc) {
    await prisma.barbershop.update({
      where: { id: keep.id },
      data: {
        ...(needsName ? { name: "Brutus Barber" } : {}),
        ...(needsDesc ? { description: BRUTUS_DESCRIPTION } : {}),
      },
    });
  }

  return keep.id;
}

export async function seedDatabase(prisma: PrismaClient) {
  const keptId = await ensureSingleShop(prisma);
  if (keptId) {
    console.log("Seed skipped: barbershop already exists (single shop ensured).");
    return;
  }

  const barbershop = await prisma.barbershop.create({
    data: {
      name: "Brutus Barber",
      address: "Rua da Barbearia, 123",
      phones: serializePhones(["(11) 99999-9999"]),
      description: BRUTUS_DESCRIPTION,
      imageUrl:
        "https://utfs.io/f/c97a2dc9-cf62-468b-a851-bfd2bdde775f-16p.png",
    },
  });

  for (const hour of DEFAULT_OPENING_HOURS) {
    await prisma.openingHour.create({
      data: { barbershopId: barbershop.id, ...hour },
    });
  }

  for (const service of BRUTUS_SERVICES) {
    await prisma.barbershopService.create({
      data: {
        name: service.name,
        description: service.description,
        price: service.price,
        durationMinutes: service.durationMinutes,
        barbershopId: barbershop.id,
        imageUrl: service.imageUrl,
      },
    });
  }

  const adminHash = await bcrypt.hash("admin123", 10);
  const customerHash = await bcrypt.hash("cliente123", 10);

  await prisma.user.create({
    data: {
      name: "Admin Brutus",
      email: "admin@barbershop.local",
      passwordHash: adminHash,
      role: "BARBER_ADMIN",
      barbershopId: barbershop.id,
    },
  });

  await prisma.user.create({
    data: {
      name: "Cliente Demo",
      email: "cliente@barbershop.local",
      passwordHash: customerHash,
      role: "CUSTOMER",
    },
  });

  console.log("Seed concluído: Brutus Barber (1 loja).");
}
