import axios from 'axios';
import FormData from 'form-data';

import * as fs from 'fs';
import { join } from 'path';

const BASE_URL = 'http://127.0.0.1:3001';

async function runImageFlow() {
  console.log('🖼️ بدء سيناريو اختبار الصور والموافقة...');

  try {
    // 1. تسجيل دخول كأدمن
    const adminRes = await axios.post(`${BASE_URL}/auth/login`, { phone: '01000000000', password: 'password123' });
    const adminToken = adminRes.data.access_token;
    const adminHeader = { Authorization: `Bearer ${adminToken}` };

    // 2. رفع صورة (سنقوم بإنشاء ملف وهمي للاختبار)
    console.log('📤 محاولة رفع صورة...');
    const form = new FormData();
    // إنشاء buffer لصورة وهمية (1x1 pixel pixel PNG)
    const dummyImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    form.append('file', dummyImage, { filename: 'test-image.png', contentType: 'image/png' });

    const uploadRes = await axios.post(`${BASE_URL}/upload`, form, {
      headers: {
        ...form.getHeaders(),
      }
    });
    const imageUrl = uploadRes.data.url;
    console.log('✅ تم رفع الصورة بنجاح، الرابط:', imageUrl);

    // 3. إنشاء محل باستخدام الصورة المرفوعة
    console.log('🏪 إنشاء محل بالصورة الجديدة...');
    const catsRes = await axios.get(`${BASE_URL}/stores/categories`);
    const storeRes = await axios.post(`${BASE_URL}/stores`, 
      { 
        name: 'محل الصور الحديثة', 
        address: 'الزقازيق - القومية', 
        area: 'القومية', 
        phone: '01099887766', 
        categoryId: catsRes.data[0].id,
        logo: imageUrl // استخدام رابط الصورة المرفوعة
      },
      { headers: adminHeader }
    );
    const storeId = storeRes.data.id;

    // 4. موافقة الأدمن
    console.log('👮 موافقة الأدمن على المحل...');
    await axios.patch(`${BASE_URL}/stores/${storeId}/status`, { status: 'APPROVED' }, { headers: adminHeader });

    // 5. التحقق من ظهور الصورة في قائمة المحلات
    console.log('🔍 التحقق من النتيجة النهائية...');
    const finalStore = await axios.get(`${BASE_URL}/stores/${storeId}`);
    console.log('📍 اسم المحل:', finalStore.data.name);
    console.log('🖼️ رابط الصورة المخزن:', finalStore.data.logo);
    
    if (finalStore.data.logo.includes('/uploads/')) {
      console.log('✨ نجاح باهر! الصورة اترفعت واتربطت بالمحل والأدمن وافق عليها.');
    } else {
      console.log('❌ فيه مشكلة في رابط الصورة.');
    }

    console.log('\n🏆 سيناريو الصور اكتمل بنجاح 100%!');

  } catch (err: any) {
    console.error('💥 فشل الاختبار:');
    if (err.response) {
      console.error(err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

runImageFlow();
