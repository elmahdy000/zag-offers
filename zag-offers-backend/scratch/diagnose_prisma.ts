import { PrismaClient, Role, StoreStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnose() {
  console.log('🔍 بدء التشخيص العميق...');
  
  try {
    // 1. Get a user and a category
    const user = await prisma.user.findFirst();
    const category = await prisma.category.findFirst();
    
    if (!user || !category) {
      console.error('❌ مفيش يوزر أو تصنيف في الداتا بيز!');
      return;
    }

    console.log(`Using User: ${user.id}, Category: ${category.id}`);

    // 2. Try to create a store
    const store = await prisma.store.create({
      data: {
        name: 'Diag Store',
        address: 'Diag Addr',
        area: 'Diag Area',
        phone: '0123456',
        category: { connect: { id: category.id } },
        owner: { connect: { id: user.id } },
      }
    });

    console.log('✅ Store created successfully in DB:', store.id);

  } catch (err: any) {
    console.error('❌ خطأ في Prisma:');
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose();
