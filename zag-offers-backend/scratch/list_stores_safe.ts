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
  const stores = await prisma.store.findMany({
    select: {
      id: true,
      name: true,
      owner: {
        select: {
          name: true,
          phone: true,
        }
      }
    }
  });

  console.log('--- STORES IN DATABASE ---');
  stores.forEach(s => {
    console.log(`ID: ${s.id} | Name: ${s.name} | Owner: ${s.owner?.name} (${s.owner?.phone})`);
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
