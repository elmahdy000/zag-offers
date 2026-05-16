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
  console.log('--- Selective Cleanup Starting ---');

  // 1. تحديد المعرفات التي نريد الاحتفاظ بها
  const adminPhone = '01000000000'; // حسابك
  const myStoreName = 'مركز الابتكار التعليمي'; // متجر Edu-Verse

  const admin = await prisma.user.findUnique({ where: { phone: adminPhone } });
  
  // البحث عن المتجر (Edu-Verse)
  const myStore = await prisma.store.findFirst({ 
    where: { 
      OR: [
        { name: myStoreName },
        { name: { contains: 'Edu' } }
      ]
    } 
  });

  if (!admin) {
    console.error('Error: Could not find Admin user. Aborting.');
    return;
  }

  if (!myStore) {
    console.warn('Warning: Could not find Edu-Verse store. Will keep the Admin user only.');
  }

  const myStoreId = myStore?.id;

  // 2. حذف الكوبونات والعروض للمتاجر الأخرى
  if (myStoreId) {
    console.log(`Keeping store: ${myStore.name} (${myStoreId})`);
    await prisma.coupon.deleteMany({ where: { offer: { storeId: { not: myStoreId } } } });
    await prisma.offer.deleteMany({ where: { storeId: { not: myStoreId } } });
    await prisma.store.deleteMany({ where: { id: { not: myStoreId } } });
  } else {
    await prisma.coupon.deleteMany({});
    await prisma.offer.deleteMany({});
    await prisma.store.deleteMany({});
  }
  
  // 3. حذف المستخدمين الآخرين (باستثناء حسابك)
  const deletedUsers = await prisma.user.deleteMany({ 
    where: { 
      id: { not: admin.id },
      role: { not: 'ADMIN' }
    } 
  });
  console.log(`Deleted ${deletedUsers.count} test users.`);

  // 4. تنظيف الجداول العامة
  await prisma.notification.deleteMany({});
  await prisma.analyticsEvent.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});

  console.log('\n--- Cleanup Completed! Only your Admin account and Edu-Verse store remain. ---');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
