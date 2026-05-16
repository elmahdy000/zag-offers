import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const offersCount = await prisma.offer.count();
  const storesCount = await prisma.store.count();
  console.log(`Offers in DB: ${offersCount}`);
  console.log(`Stores in DB: ${storesCount}`);
}

check();
