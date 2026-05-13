import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Database Stats Check ---');
  
  const userCount = await prisma.user.count();
  const storeCount = await prisma.store.count();
  const offerCount = await prisma.offer.count();
  const couponCount = await prisma.coupon.count();
  const usedCouponCount = await prisma.coupon.count({ where: { status: 'USED' } });

  console.log('Total Users:', userCount);
  console.log('Total Stores:', storeCount);
  console.log('Total Offers:', offerCount);
  console.log('Total Coupons:', couponCount);
  console.log('Total Used Coupons:', usedCouponCount);

  if (storeCount > 0) {
    const firstStore = await prisma.store.findFirst({
        include: { _count: { select: { offers: true } } }
    });
    console.log('\nFirst Store:', firstStore?.name, '(Offers:', firstStore?._count.offers, ')');
  }

  if (couponCount > 0) {
    const recentCoupons = await prisma.coupon.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { offer: { select: { title: true, storeId: true } } }
    });
    console.log('\nRecent Coupons:');
    recentCoupons.forEach(c => {
      console.log(`- Code: ${c.code}, Offer: ${c.offer.title}, StoreID: ${c.offer.storeId}, Created: ${c.createdAt}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
