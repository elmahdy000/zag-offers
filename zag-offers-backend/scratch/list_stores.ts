import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const stores = await prisma.store.findMany({
    include: {
      offers: true,
    }
  });

  console.log('STORES FOUND:', stores.length);
  for (const store of stores) {
    console.log(`- [${store.id}] ${store.name} (${store.status})`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
