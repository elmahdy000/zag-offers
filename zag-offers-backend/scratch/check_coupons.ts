import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const coupons = await prisma.coupon.findMany({ include: { customer: true } });
  console.log(`Total coupons: ${coupons.length}`);
  if (coupons.length > 0) {
    console.log(coupons[0]);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
