import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const cats = await prisma.category.findMany();
  console.log('Categories in DB:', cats.map(c => c.name));
}
main().finally(() => prisma.$disconnect());
