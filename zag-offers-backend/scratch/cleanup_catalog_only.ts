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
  console.log('Cleaning catalog data: categories, stores, offers (users preserved)...');

  await prisma.$transaction(async (tx) => {
    await tx.analyticsEvent.deleteMany({
      where: {
        OR: [{ offerId: { not: null } }, { storeId: { not: null } }],
      },
    });

    await tx.coupon.deleteMany({});
    await tx.favorite.deleteMany({});
    await tx.review.deleteMany({});
    await tx.offer.deleteMany({});
    await tx.store.deleteMany({});

    const deletedCategories = await tx.category.deleteMany({});
    console.log(`Deleted categories: ${deletedCategories.count}`);
  });

  console.log('Done. Users were not deleted.');
}

main()
  .catch((e) => {
    console.error('Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

