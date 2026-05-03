
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const stores = await prisma.store.findMany({
    include: { category: true }
  });

  console.log('Stores and their categories:');
  stores.forEach(s => {
    console.log(`Store: ${s.name} | Category: ${s.category?.name}`);
  });

  await prisma.$disconnect();
  await pool.end();
}

main();
