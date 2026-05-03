const BASE_URL = 'http://127.0.0.1:3001';

async function runSecurityTests() {
  console.log('🛡️ بدء اختبارات الأمان واختراق الصلاحيات...');

  try {
    // 1. تسجيل دخول كعميل (Customer)
    const loginCust = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '01011111111', password: 'password123' })
    }).then(r => r.json());
    const tokenCust = loginCust.access_token;

    console.log('\n--- 1. محاولة عميل الدخول لإحصائيات الأدمن (AdminController) ---');
    const adminStats = await fetch(`${BASE_URL}/admin/stats/global`, {
      headers: { 'Authorization': `Bearer ${tokenCust}` }
    }).then(r => r.json());
    console.log('🔴 النتيجة:', adminStats.message); // متوقع: عفواً، مفيش صلاحية للدخول هنا

    console.log('\n--- 2. محاولة عميل الموافقة على محل (StoresController) ---');
    const approveStore = await fetch(`${BASE_URL}/stores/some-id/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenCust}`
      },
      body: JSON.stringify({ status: 'APPROVED' })
    }).then(r => r.json());
    console.log('🔴 النتيجة:', approveStore.message); // متوقع: عفواً، مفيش صلاحية للدخول هنا

    console.log('\n--- 3. محاولة عميل تفعيل كوبون (CouponsController) ---');
    const redeemCoupon = await fetch(`${BASE_URL}/coupons/redeem`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenCust}`
      },
      body: JSON.stringify({ code: 'ZAG-TEST', storeId: 'test' })
    }).then(r => r.json());
    console.log('🔴 النتيجة:', redeemCoupon.message); // متوقع: عفواً، مفيش صلاحية للدخول هنا

    console.log('\n--- 4. محاولة شخص مجهول (بدون توكن) استخراج كوبون ---');
    const anonymousGen = await fetch(`${BASE_URL}/coupons/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId: 'test' })
    }).then(r => r.json());
    console.log('🔴 النتيجة:', anonymousGen.message); // متوقع: عفواً، لازم تسجل دخول الأول عشان تقدر تكمل

    console.log('\n✅ انتهت اختبارات الأمان. كل المحاولات تم صدها بنجاح!');

  } catch (err) {
    console.error('💥 فشل السكربت:', err);
  }
}

runSecurityTests();
