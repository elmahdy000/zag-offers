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
  console.log('Cleaning stores and offers only (preserving all users)...');

  await prisma.$transaction(async (tx) => {
    // Remove dependent rows first to satisfy FK constraints.
    await tx.analyticsEvent.deleteMany({
      where: {
        OR: [{ offerId: { not: null } }, { storeId: { not: null } }],
      },
    });
    await tx.coupon.deleteMany({});
    await tx.favorite.deleteMany({});
    await tx.review.deleteMany({});

    const deletedOffers = await tx.offer.deleteMany({});
    const deletedStores = await tx.store.deleteMany({});

    console.log(`Deleted offers: ${deletedOffers.count}`);
    console.log(`Deleted stores: ${deletedStores.count}`);
  });

  console.log('Done. Users are preserved.');
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

