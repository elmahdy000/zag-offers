const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const [merchants, users, offers, pendingMerchants] = await Promise.all([
    prisma.store.count(),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.offer.count({ where: { status: 'ACTIVE' } }),
    prisma.store.count({ where: { status: 'PENDING' } }),
  ]);
  console.log({ merchants, users, offers, pendingMerchants });
  await prisma.$disconnect();
}

check();
