import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const categories = await prisma.category.findMany();
  console.log('--- CATEGORIES ---');
  categories.forEach(c => console.log(`${c.id}: ${c.name}`));

  const stores = await prisma.store.findMany({
    include: { category: true }
  });
  console.log('\n--- STORES ---');
  stores.forEach(s => console.log(`${s.id}: ${s.name} (Cat: ${s.category?.name})`));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
