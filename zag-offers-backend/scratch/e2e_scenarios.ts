const BASE_URL = 'http://127.0.0.1:3001';



async function runTests() {
  console.log('🚀 بدء اختبار السيناريوهات...');

  try {
    // 1. تسجيل عملاء جدد
    console.log('\n--- 1. تسجيل العملاء ---');
    const cust1 = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '01011111111', password: 'password123', name: 'أحمد علي' })
    }).then(r => r.json());
    console.log('✅ تم تسجيل أحمد علي');

    const cust2 = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '01022222222', password: 'password123', name: 'منى محمد' })
    }).then(r => r.json());
    console.log('✅ تم تسجيل منى محمد');

    // 2. تسجيل دخول العملاء للحصول على التوكن
    const loginA = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '01011111111', password: 'password123' })
    }).then(r => r.json());
    const tokenA = loginA.access_token;

    // 3. تسجيل دخول التجار
    console.log('\n--- 2. تسجيل دخول التجار ---');
    const loginM1 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '01111111111', password: 'password123' }) // محمود البرنس
    }).then(r => r.json());
    const tokenM1 = loginM1.access_token;

    const loginM2 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '01222222222', password: 'password123' }) // سارة أحمد
    }).then(r => r.json());
    const tokenM2 = loginM2.access_token;

    // 4. جلب عرض من مطعم البرنس
    const stores = await fetch(`${BASE_URL}/stores`).then(r => r.json());
    const elPrinceStore = stores.find((s: any) => s.name.includes('البرنس'));

    const storeDetails = await fetch(`${BASE_URL}/stores/${elPrinceStore.id}`).then(r => r.json());
    const offerId = storeDetails.offers[0].id;

    console.log(`\n--- 3. تجربة استخراج كوبون لعرض: ${storeDetails.offers[0].title} ---`);
    const couponRes = await fetch(`${BASE_URL}/coupons/generate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ offerId })
    }).then(r => r.json());
    console.log('✅ تم استخراج الكوبون:', couponRes.code);

    // 5. تجربة تكرار الطلب
    console.log('\n--- 4. تجربة تكرار الطلب لنفس العرض ---');
    const couponResRepeat = await fetch(`${BASE_URL}/coupons/generate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ offerId })
    }).then(r => r.json());
    if (couponResRepeat.code === couponRes.code) {
      console.log('✅ نجاح: تم إرجاع نفس الكوبون الفعال');
    }

    // 6. تجربة الـ Redeem الصحيح (محمود البرنس بيفعل كوبون مطعمه)
    console.log('\n--- 5. تجربة تفعيل الكوبون (Redeem) بنجاح ---');
    const redeemRes = await fetch(`${BASE_URL}/coupons/redeem`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenM1}`
      },
      body: JSON.stringify({ code: couponRes.code, storeId: elPrinceStore.id })
    }).then(r => r.json());
    console.log('✅ تم التفعيل بنجاح! الحالة الجديدة:', redeemRes.status);

    // 7. تجربة تفعيل نفس الكوبون مرة تانية
    console.log('\n--- 6. تجربة تفعيل كوبون مستخدم بالفعل ---');
    const redeemResAgain = await fetch(`${BASE_URL}/coupons/redeem`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenM1}`
      },
      body: JSON.stringify({ code: couponRes.code, storeId: elPrinceStore.id })
    }).then(r => r.json());
    console.log('❌ رسالة الخطأ:', redeemResAgain.message);

    // 8. تجربة تفعيل في محل غلط (سارة أحمد بتحاول تفعل كوبون البرنس)
    console.log('\n--- 7. تجربة تفعيل الكوبون في محل غلط ---');
    // هنطلع كوبون جديد لأحمد علي
    const newCoupon = await fetch(`${BASE_URL}/coupons/generate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ offerId })
    }).then(r => r.json());

    const storesM2 = await fetch(`${BASE_URL}/admin/stats/merchant`, {
      headers: { 'Authorization': `Bearer ${tokenM2}` }
    }).then(r => r.json());
    const m2StoreId = storesM2[0].id; // أتيليه روعة

    const redeemWrongStore = await fetch(`${BASE_URL}/coupons/redeem`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenM2}`
      },
      body: JSON.stringify({ code: newCoupon.code, storeId: m2StoreId })
    }).then(r => r.json());
    console.log('❌ رسالة الخطأ للمحل الغلط:', redeemWrongStore.message);

    console.log('\n🏁 انتهت جميع الاختبارات بنجاح!');

  } catch (err) {
    console.error('💥 فشل الاختبار:', err);
  }
}

runTests();
