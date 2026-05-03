import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedNewOffers() {
  // 1. العثور على أي متجر لربط العروض به
  const store = await prisma.store.findFirst();
  if (!store) {
    console.log('❌ لا يوجد أي متجر في قاعدة البيانات لإضافة عروض له.');
    return;
  }

  // 2. إنشاء عرض جديد مميز
  const offer = await prisma.offer.create({
    data: {
      storeId: store.id,
      title: 'خصم 50% على وجبات التوفير 🔥',
      description: 'استمتع بنصف السعر على جميع وجبات الغداء لفترة محدودة من ' + store.name,
      discount: '50%',
      terms: 'يسري العرض على الوجبات المحددة فقط',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // بعد 7 أيام
      images: ['https://images.unsplash.com/photo-1550547660-d9450f859349?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'],
      status: 'ACTIVE', // جعله نشطاً مباشرة ليظهر في التطبيق
    },
  });

  console.log('✅ تم إضافة العرض الجديد بنجاح في قاعدة البيانات:');
  console.log(offer);
  
  // حفظ الـ offerId في ملف لنرسل إشعار به
  const fs = require('fs');
  fs.writeFileSync('last-offer.json', JSON.stringify({ storeName: store.name, offerTitle: offer.title, offerId: offer.id }));
}

seedNewOffers()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
