const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const stores = await prisma.store.findMany();
  console.log('--- STORES ---');
  stores.forEach(s => console.log(`${s.id}: ${s.name}`));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
