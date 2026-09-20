import "dotenv/config";
import { prisma } from "../src/db";

const services = [
  { name: "Alinhar a Barba (Máquina)", description: "Alinhamento de barba na máquina.", price: 25, durationMinutes: 30, imageUrl: "https://utfs.io/f/e6bdffb6-24a9-455b-aba3-903c2c2b5bde-1jo6tu.png" },
  { name: "Alinhar a Barba (Navalha)", description: "Alinhamento de barba na navalha.", price: 38, durationMinutes: 30, imageUrl: "https://utfs.io/f/e6bdffb6-24a9-455b-aba3-903c2c2b5bde-1jo6tu.png" },
  { name: "Barba modelo toalha quente navalha", description: "Modelagem de barba com toalha quente e navalha.", price: 38, durationMinutes: 30, imageUrl: "https://utfs.io/f/e6bdffb6-24a9-455b-aba3-903c2c2b5bde-1jo6tu.png" },
  { name: "Barba remoção total toalha quente", description: "Remoção total da barba com toalha quente.", price: 40, durationMinutes: 30, imageUrl: "https://utfs.io/f/e6bdffb6-24a9-455b-aba3-903c2c2b5bde-1jo6tu.png" },
  { name: "Barber terapia", description: "Sessão de barber terapia.", price: 50, durationMinutes: 30, imageUrl: "https://utfs.io/f/c4919193-a675-4c47-9f21-ebd86d1c8e6a-4oen2a.png" },
  { name: "COMBO Corte Raspar + Barba + Sobrancelha", description: "Combo com corte raspar, barba e sobrancelha.", price: 50, durationMinutes: 60, imageUrl: "https://utfs.io/f/0ddfbd26-a424-43a0-aaf3-c3f1dc6be6d1-1kgxo7.png" },
  { name: "Combo cabelo e barba", description: "Combo de corte de cabelo e barba.", price: 65, durationMinutes: 60, imageUrl: "https://utfs.io/f/0ddfbd26-a424-43a0-aaf3-c3f1dc6be6d1-1kgxo7.png" },
  { name: "COMBO: Corte Social Degradê + Barba toalha quente + Sobrancelha", description: "Combo completo com corte social degradê, barba com toalha quente e sobrancelha.", price: 75, durationMinutes: 60, imageUrl: "https://utfs.io/f/0ddfbd26-a424-43a0-aaf3-c3f1dc6be6d1-1kgxo7.png" },
  { name: "Corte Degradê (Qualquer Pente)", description: "Corte degradê com qualquer pente.", price: 35, durationMinutes: 30, imageUrl: "https://utfs.io/f/0ddfbd26-a424-43a0-aaf3-c3f1dc6be6d1-1kgxo7.png" },
  { name: "Corte degradê zero + Sobrancelha", description: "Corte degradê zero com sobrancelha.", price: 50, durationMinutes: 30, imageUrl: "https://utfs.io/f/0ddfbd26-a424-43a0-aaf3-c3f1dc6be6d1-1kgxo7.png" },
  { name: "Corte Social + Sobrancelha", description: "Corte social com sobrancelha.", price: 45, durationMinutes: 30, imageUrl: "https://utfs.io/f/0ddfbd26-a424-43a0-aaf3-c3f1dc6be6d1-1kgxo7.png" },
  { name: "Corte Social / Clássico", description: "Corte social ou clássico.", price: 35, durationMinutes: 30, imageUrl: "https://utfs.io/f/0ddfbd26-a424-43a0-aaf3-c3f1dc6be6d1-1kgxo7.png" },
];

async function main() {
  const shops = await prisma.barbershop.findMany({ select: { id: true, name: true } });
  if (!shops.length) throw new Error("Nenhuma barbearia encontrada.");

  // Atualiza a primeira (do admin) para Brutus Barber
  const primary = shops[0];
  await prisma.barbershop.update({
    where: { id: primary.id },
    data: {
      name: "Brutus Barber",
      description:
        "Barbearia com corte clássico e contemporâneo, barba na navalha e atendimento com hora marcada.",
    },
  });

  for (const shop of shops) {
    await prisma.booking.deleteMany({
      where: { service: { barbershopId: shop.id } },
    });
    await prisma.barbershopService.deleteMany({ where: { barbershopId: shop.id } });

    for (const service of services) {
      await prisma.barbershopService.create({
        data: {
          barbershopId: shop.id,
          name: service.name,
          description: service.description,
          price: service.price,
          durationMinutes: service.durationMinutes,
          imageUrl: service.imageUrl,
          isActive: true,
        },
      });
    }
    console.log(`Serviços atualizados: ${shop.name} (${shop.id})`);
  }

  console.log(`OK: ${services.length} serviços em ${shops.length} barbearia(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
