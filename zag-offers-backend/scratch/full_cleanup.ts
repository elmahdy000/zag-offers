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
  console.log('CLEANING UP ALL TEST DATA FROM ALL APPS...');

  try {
    // 1. Delete AnalyticsEvents
    await prisma.analyticsEvent.deleteMany({});
    console.log('Deleted all analytics events.');

    // 2. Delete Notifications
    await prisma.notification.deleteMany({});
    console.log('Deleted all notifications.');

    // 3. Delete AuditLogs
    await prisma.auditLog.deleteMany({});
    console.log('Deleted all audit logs.');

    // 4. Delete Messages & Conversations
    await prisma.message.deleteMany({});
    await prisma.conversation.deleteMany({});
    console.log('Deleted all conversations and messages.');

    // 5. Delete Coupons
    await prisma.coupon.deleteMany({});
    console.log('Deleted all coupons.');

    // 6. Delete Favorites
    await prisma.favorite.deleteMany({});
    console.log('Deleted all favorites.');

    // 7. Delete Reviews
    await prisma.review.deleteMany({});
    console.log('Deleted all reviews.');

    // 8. Delete Offers
    await prisma.offer.deleteMany({});
    console.log('Deleted all offers.');

    // 9. Delete Stores
    await prisma.store.deleteMany({});
    console.log('Deleted all stores.');

    // 10. Delete Users (except ADMIN)
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        role: { not: 'ADMIN' }
      }
    });
    console.log(`Deleted ${deletedUsers.count} users (Customers & Merchants).`);

    console.log('\nFULL DATABASE CLEANUP COMPLETED!');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
