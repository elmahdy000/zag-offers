import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ──────────────────────────────────────────────────────────────────────────────
// PRODUCTION CATEGORIES  — these are always safe to upsert
// ──────────────────────────────────────────────────────────────────────────────
const PRODUCTION_CATEGORIES = [
  'دلع كرشك',
  'روقان',
  'شياكة',
  'فورمة',
  'دلع بنات',
  'طور نفسك',
  'دلع عربيتك',
  'اون فاير',
  'عيالنا',
  'ست البيت',
  'عروستي',
  'حلى بوقك',
  'نعيماً',
];

// ──────────────────────────────────────────────────────────────────────────────
// DEPRECATED CATEGORIES — cleaned up if they still exist
// ──────────────────────────────────────────────────────────────────────────────
const DEPRECATED_CATEGORIES = ['سوبرماركت', 'خدمات محلية', 'عيادات'];

async function seedProduction() {
  console.log('🌱 [PROD] Seeding production data…');

  // Remove old / renamed categories
  await prisma.category.deleteMany({
    where: { name: { in: DEPRECATED_CATEGORIES } },
  });

  // Upsert each category
  for (const name of PRODUCTION_CATEGORIES) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`✅ [PROD] ${PRODUCTION_CATEGORIES.length} categories ensured.`);

  console.log('✅ [PROD] Production seed complete.');
}

// ──────────────────────────────────────────────────────────────────────────────
// DEV-ONLY — fake merchants, stores & offers
// Run ONLY when NODE_ENV=development
// ──────────────────────────────────────────────────────────────────────────────
async function seedDev() {
  console.log('🔧 [DEV]  Seeding development test data…');

  const password = await bcrypt.hash('password123', 10);

  // Test admin
  await prisma.user.upsert({
    where: { phone: '01000000000' },
    update: {},
    create: {
      phone: '01000000000',
      password,
      name: 'مدير النظام (تجريبي)',
      role: Role.ADMIN,
    },
  });

  // Test merchants
  const merchant1 = await prisma.user.upsert({
    where: { phone: '01111111111' },
    update: {},
    create: {
      phone: '01111111111',
      password,
      name: 'محمود البرنس (تجريبي)',
      role: Role.MERCHANT,
    },
  });

  const merchant2 = await prisma.user.upsert({
    where: { phone: '01222222222' },
    update: {},
    create: {
      phone: '01222222222',
      password,
      name: 'سارة أحمد (تجريبي)',
      role: Role.MERCHANT,
    },
  });

  // Test customer
  await prisma.user.upsert({
    where: { phone: '01033333333' },
    update: {},
    create: {
      phone: '01033333333',
      password,
      name: 'أحمد محمد (تجريبي)',
      role: Role.CUSTOMER,
    },
  });

  // Fetch category IDs
  const getCat = async (name: string) => {
    const c = await prisma.category.findUnique({ where: { name } });
    return c?.id;
  };

  const testStores = [
    {
      name: 'مطعم البرنس - القومية',
      address: 'شارع القومية، الزقازيق',
      area: 'القومية',
      phone: '01011122233',
      categoryName: 'دلع كرشك',
      ownerId: merchant1.id,
    },
    {
      name: 'أروما كافيه',
      address: 'بجوار بوابة الجامعة الرئيسية',
      area: 'الجامعة',
      phone: '01099887766',
      categoryName: 'روقان',
      ownerId: merchant1.id,
    },
    {
      name: 'أتيليه روعة للأزياء',
      address: 'فلل الجامعة، الزقازيق',
      area: 'الفلل',
      phone: '01234567890',
      categoryName: 'شياكة',
      ownerId: merchant2.id,
    },
  ];

  for (const s of testStores) {
    const existing = await prisma.store.findFirst({
      where: { name: s.name, address: s.address },
    });
    if (existing) continue;

    const categoryId = await getCat(s.categoryName);
    if (!categoryId) continue;

    await prisma.store.create({
      data: {
        name: s.name,
        address: s.address,
        area: s.area,
        phone: s.phone,
        categoryId,
        ownerId: s.ownerId,
        status: 'APPROVED',
      },
    });
  }

  console.log('✅ [DEV]  Dev seed complete.');
}

async function main() {
  const env = process.env.NODE_ENV ?? 'production';
  const devSeedEnabled = process.env.ENABLE_DEV_SEED === 'true';
  console.log(`\n🚀 Running seed in [${env}] mode…\n`);

  await seedProduction();

  if (env === 'development' && devSeedEnabled) {
    await seedDev();
  } else {
    console.log(
      '⏭️  [SAFE] Skipping dev test data. Requires NODE_ENV=development and ENABLE_DEV_SEED=true.',
    );
  }
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
