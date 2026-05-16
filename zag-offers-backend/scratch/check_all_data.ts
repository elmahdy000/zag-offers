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
  console.log('--- ALL USERS ---');
  const users = await prisma.user.findMany({
    select: { id: true, name: true, phone: true, role: true }
  });
  users.forEach(u => console.log(`${u.id}: ${u.name} (${u.phone}) [${u.role}]`));

  console.log('\n--- ALL STORES ---');
  const stores = await prisma.store.findMany();
  stores.forEach(s => console.log(`${s.id}: ${s.name} [${s.status}]`));

  console.log('\n--- ALL OFFERS ---');
  const offers = await prisma.offer.findMany({
    include: { store: true }
  });
  offers.forEach(o => console.log(`${o.id}: ${o.title} (Store: ${o.store.name})`));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
