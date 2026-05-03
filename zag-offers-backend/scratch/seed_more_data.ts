import { PrismaClient, Role, StoreStatus, OfferStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash('password123', 10);

  console.log('Seeding MORE data for Zagazig offers...');

  // 1. Get or Create Admin/Merchant
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

  const merchant3 = await prisma.user.upsert({
    where: { phone: '01333333333' },
    update: {},
    create: {
      phone: '01333333333',
      password,
      name: 'أحمد علي',
      role: Role.MERCHANT,
    },
  });

  // 2. Categories mapping
  const categoryNames = [
    'مطاعم',
    'كافيهات',
    'بلايستيشن',
    'ميكب',
    'جيم',
    'ملابس',
    'صيدليات',
    'كورسات'
  ];

  const catMap: Record<string, string> = {};
  for (const name of categoryNames) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    catMap[name] = cat.id;
  }

  // 3. New Stores Data
  const moreStores = [
    {
      name: 'قصر المشويات',
      area: 'القومية',
      address: 'شارع المشاية، القومية',
      phone: '01012345671',
      categoryId: catMap['مطاعم'],
      ownerId: merchant3.id,
      status: StoreStatus.APPROVED,
      offers: [
        {
          title: 'عرض الويك إند',
          description: 'كيلو كفتة + كيلو طرب بـ 450 جنيه بس',
          discount: 'خصم 100 جنيه',
        }
      ]
    },
    {
      name: 'برجر هاوس',
      area: 'الجامعة',
      address: 'بجوار كلية التجارة',
      phone: '01012345672',
      categoryId: catMap['مطاعم'],
      ownerId: merchant3.id,
      status: StoreStatus.APPROVED,
      offers: [
        {
          title: 'القطعة التانية بـ 50%',
          description: 'اشتري أي ساندوتش برجر كبير والقطعة التانية بنص التمن',
          discount: '50% على التاني',
        }
      ]
    },
    {
      name: 'ريترو كوفي',
      area: 'طلبة عويضة',
      address: 'برج الأطباء، طلبة عويضة',
      phone: '01012345673',
      categoryId: catMap['كافيهات'],
      ownerId: merchant3.id,
      status: StoreStatus.APPROVED,
      offers: [
        {
          title: 'قهوة الصباح',
          description: 'أي مشروب قهوة بـ 25 جنيه من 8 لـ 11 صباحاً',
          discount: 'سعر موحد 25ج',
        }
      ]
    },
    {
      name: 'جامر زون Gamer Zone',
      area: 'الفلل',
      address: 'منطقة الفلل، الزقازيق',
      phone: '01012345674',
      categoryId: catMap['بلايستيشن'],
      ownerId: merchant3.id,
      status: StoreStatus.APPROVED,
      offers: [
        {
          title: 'العبيط يكسب',
          description: 'احجز ساعة PS5 واخد نص ساعة زيادة مجاناً',
          discount: 'نص ساعة هدية',
        }
      ]
    },
    {
      name: 'بيوتي سنتر هدى',
      area: 'القومية',
      address: 'خلف مستشفى المبرة',
      phone: '01012345675',
      categoryId: catMap['ميكب'],
      ownerId: merchant3.id,
      status: StoreStatus.APPROVED,
      offers: [
        {
          title: 'باكيدج العروسة',
          description: 'ميكب كامل + تنظيف بشرة بخصم 25%',
          discount: '25% خصم',
        }
      ]
    },
    {
      name: 'باور لفت Gym',
      area: 'الجامعة',
      address: 'بجوار صيدلية الجامعة',
      phone: '01012345676',
      categoryId: catMap['جيم'],
      ownerId: merchant3.id,
      status: StoreStatus.APPROVED,
      offers: [
        {
          title: 'اشتراك الـ 6 شهور',
          description: 'ادفع 4 شهور بس واخد شهرين زيادة مجاناً',
          discount: 'شهرين مجاناً',
        }
      ]
    },
    {
      name: 'مودرن ستايل',
      area: 'طلبة عويضة',
      address: 'بجوار المحافظة',
      phone: '01012345677',
      categoryId: catMap['ملابس'],
      ownerId: merchant3.id,
      status: StoreStatus.APPROVED,
      offers: [
        {
          title: 'تصفيات الموسم',
          description: 'اشتري قطعة واخد التانية مجاناً على تشكيلة الصيف',
          discount: '1+1 مجاناً',
        }
      ]
    },
    {
      name: 'صيدلية النصر',
      area: 'وسط البلد',
      address: 'شارع البحر، الزقازيق',
      phone: '01012345678',
      categoryId: catMap['صيدليات'],
      ownerId: admin.id,
      status: StoreStatus.APPROVED,
      offers: [
        {
          title: 'مستلزمات العناية',
          description: 'خصم 15% على جميع منتجات العناية بالبشرة المستوردة',
          discount: '15% خصم',
        }
      ]
    },
    {
      name: 'أكاديمية المستقبل',
      area: 'الجامعة',
      address: 'حي الزهور، الزقازيق',
      phone: '01012345679',
      categoryId: catMap['كورسات'],
      ownerId: admin.id,
      status: StoreStatus.APPROVED,
      offers: [
        {
          title: 'كورس الإنجليزي المكثف',
          description: 'المستوى بـ 300 جنيه بدل 500 للطلبة',
          discount: 'وفر 200 جنيه',
        }
      ]
    }
  ];

  for (const sData of moreStores) {
    const { offers, ...storeData } = sData;
    
    // Check if store already exists to avoid duplicates
    const existingStore = await prisma.store.findFirst({
      where: { name: storeData.name }
    });

    let storeId: string;
    if (existingStore) {
      storeId = existingStore.id;
      console.log(`Store ${storeData.name} already exists, adding offers...`);
    } else {
      const store = await prisma.store.create({
        data: storeData,
      });
      storeId = store.id;
      console.log(`Created store: ${storeData.name}`);
    }

    // Add offers
    for (const o of offers) {
      await prisma.offer.create({
        data: {
          ...o,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: OfferStatus.ACTIVE,
          storeId: storeId,
        },
      });
    }
  }

  console.log('Seed MORE data completed successfully!');
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
