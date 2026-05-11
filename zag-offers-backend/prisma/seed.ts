import { PrismaClient, Role, StoreStatus, OfferStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash('password123', 10);

  console.log('Seeding database with Zagazig offers...');

  // 1. Create Admin
  const admin = await prisma.user.upsert({
    where: { phone: '01000000000' },
    update: {},
    create: {
      phone: '01000000000',
      password,
      name: 'مدير النظام',
      role: Role.ADMIN,
    },
  });

  // 2. Create Merchants
  const merchant1 = await prisma.user.upsert({
    where: { phone: '01111111111' },
    update: {},
    create: {
      phone: '01111111111',
      password,
      name: 'محمود البرنس',
      role: Role.MERCHANT,
    },
  });

  const merchant2 = await prisma.user.upsert({
    where: { phone: '01222222222' },
    update: {},
    create: {
      phone: '01222222222',
      password,
      name: 'سارة أحمد',
      role: Role.MERCHANT,
    },
  });

  // 3. Create Test Customer
  await prisma.user.upsert({
    where: { phone: '01033333333' },
    update: {},
    create: {
      phone: '01033333333',
      password,
      name: 'أحمد محمد',
      role: Role.CUSTOMER,
    },
  });

  // 4. Create Categories
  const categories = [
    'مطاعم',
    'كافيهات',
    'ملابس',
    'جيم',
    'تجميل',
    'دورات',
    'خدمات سيارات',
    'ألعاب',
    'أطفال',
    'أدوات منزلية',
    'مناسبات',
    'حلويات',
    'حلاقين'
  ];

  const catMap: Record<string, string> = {};
  for (const name of categories) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    catMap[name] = cat.id;
  }

  // 5. Create Stores
  const storesData = [
    {
      name: 'مطعم البرنس - القومية',
      address: 'شارع القومية، الزقازيق',
      area: 'القومية',
      phone: '01011122233',
      categoryId: catMap['مطاعم'],
      ownerId: merchant1.id,
      status: StoreStatus.APPROVED,
    },
    {
      name: 'أروما كافيه',
      address: 'بجوار بوابة الجامعة الرئيسية',
      area: 'الجامعة',
      phone: '01099887766',
      categoryId: catMap['كافيهات'],
      ownerId: merchant1.id,
      status: StoreStatus.APPROVED,
    },
    {
      name: 'أتيليه روعة للأزياء',
      address: 'فلل الجامعة، الزقازيق',
      area: 'الفلل',
      phone: '01234567890',
      categoryId: catMap['ملابس'],
      ownerId: merchant2.id,
      status: StoreStatus.APPROVED,
    },
    {
      name: 'تيتان جيم',
      address: 'شارع طلبة عويضة، الزقازيق',
      area: 'طلبة عويضة',
      phone: '01555443322',
      categoryId: catMap['جيم'],
      ownerId: merchant1.id,
      status: StoreStatus.APPROVED,
    },
    {
      name: 'مركز الابتكار التعليمي',
      address: 'وسط البلد، خلف سينما عرابي',
      area: 'وسط البلد',
      phone: '01012345678',
      categoryId: catMap['دورات'],
      ownerId: admin.id,
      status: StoreStatus.APPROVED,
    }
  ];

  for (const s of storesData) {
    // Check if store exists by name + address to avoid duplicates
    const existing = await prisma.store.findFirst({
        where: { name: s.name, address: s.address }
    });
    if (existing) continue;

    const store = await prisma.store.create({
      data: s,
    });

    // 6. Create Offers for each store
    if (s.categoryId === catMap['مطاعم']) {
      await prisma.offer.create({
        data: {
          title: 'وجبة العيلة الاقتصادية',
          description: 'خصم 20% على كل صواني العيلة يومي الجمعة والسبت',
          discount: '20% خصم',
          terms: 'العرض متاح للطلبات داخل المطعم فقط',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: OfferStatus.ACTIVE,
          storeId: store.id,
        },
      });
    } else if (s.categoryId === catMap['دورات']) {
      await prisma.offer.create({
        data: {
          title: 'منحة البرمجة للشباب',
          description: 'احصل على كورس Full Stack بخصم 50% لأول 20 مشترك',
          discount: '50% خصم',
          terms: 'الأولوية لطلبة كليات الحاسبات والهندسة',
          startDate: new Date(),
          endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          status: OfferStatus.ACTIVE,
          storeId: store.id,
        },
      });
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
