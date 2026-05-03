
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

  const coupons = await prisma.coupon.findMany({
    include: {
      customer: { select: { name: true, email: true } },
      offer: { select: { title: true } }
    }
  });

  console.log('Total Coupons:', coupons.length);
  console.log(JSON.stringify(coupons, null, 2));

  await prisma.$disconnect();
  await pool.end();
}

main();
