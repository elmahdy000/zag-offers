
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

  const customerId = "17a78214-4260-47a4-a5d8-98c29541ef67"; // mahmoud Elmahdy
  const coupons = await prisma.coupon.findMany({
    where: { customerId },
    include: { offer: { include: { store: true } } },
    orderBy: { createdAt: 'desc' },
  });

  console.log('Coupons for Mahmoud:', coupons.length);
  console.log(JSON.stringify(coupons, null, 2));

  await prisma.$disconnect();
  await pool.end();
}

main();
