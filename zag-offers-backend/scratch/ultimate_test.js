const axios = require('axios');
const io = require('socket.io-client');

const BASE_URL = 'http://localhost:3001';

async function runUltimateTest() {
  console.log('🚀 بدء الاختبار الشامل لـ Zag Offers (مع الحماية والأدوار)...\n');

  try {
    // 1. تسجيل دخول التاجر
    console.log('🔑 تسجيل دخول التاجر...');
    const merchantLogin = await axios.post(`${BASE_URL}/auth/login`, { phone: '01111111111', password: 'password123' });
    const merchantAuth = { headers: { Authorization: `Bearer ${merchantLogin.data.access_token}` } };
    console.log('✅ تم تسجيل دخول التاجر.');

    // 2. تسجيل دخول الأدمن
    console.log('🔑 تسجيل دخول الأدمن...');
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, { phone: '01000000000', password: 'password123' });
    const adminAuth = { headers: { Authorization: `Bearer ${adminLogin.data.access_token}` } };
    console.log('✅ تم تسجيل دخول الأدمن.');

    // 3. تسجيل عميل جديد
    console.log('📝 تسجيل عميل جديد للاختبار...');
    const customerPhone = `015${Math.floor(Math.random() * 90000000 + 10000000)}`;
    await axios.post(`${BASE_URL}/auth/register`, { phone: customerPhone, password: 'password123', name: 'عميل تجريبي', role: 'CUSTOMER' });
    const customerLogin = await axios.post(`${BASE_URL}/auth/login`, { phone: customerPhone, password: 'password123' });
    const customerAuth = { headers: { Authorization: `Bearer ${customerLogin.data.access_token}` } };
    const customerId = customerLogin.data.user.id;
    console.log('✅ تم تسجيل وتجهيز العميل.');

    // 4. الحصول على محل التاجر
    const storesRes = await axios.get(`${BASE_URL}/stores`, merchantAuth);
    const store = storesRes.data[0];
    const storeId = store.id;
    console.log(`🏪 المحل المستخدم: ${store.name}`);

    // 5. الاتصال بـ WebSocket كعميل
    const socket = io(BASE_URL);
    socket.on('connect', () => {
      console.log('✅ العميل متصل بالسيرفر اللحظي.');
      socket.emit('join_room', { userId: customerId });
      console.log(`📡 تم الانضمام لغرفة العميل: ${customerId}`);
    });

    socket.on('coupon_update', (data) => {
      console.log(`\n🔔 إشعار لحظي للعميل: تم تحديث حالة الكوبون إلى [${data.status}]!`);
    });

    // 6. التاجر يضيف عرض
    console.log('\n📝 الخطوة 1: التاجر يضيف عرضاً جديداً...');
    const offerRes = await axios.post(`${BASE_URL}/offers`, {
      title: 'عرض التجربة اللحظية المذهل',
      description: 'وصف تجريبي للعرض اللحظي',
      discount: '70% خصم',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
      storeId: storeId,
      status: 'PENDING'
    }, merchantAuth);
    const offerId = offerRes.data.id;
    console.log(`✅ تم إنشاء العرض بنجاح.`);

    // 7. الأدمن يوافق على العرض
    console.log('\n⚖️ الخطوة 2: الأدمن يوافق على العرض...');
    await axios.patch(`${BASE_URL}/offers/${offerId}/status`, { status: 'ACTIVE' }, adminAuth);
    console.log('✅ تم تفعيل العرض.');

    // 8. العميل يولد كوبون
    console.log('\n🎟️ الخطوة 3: العميل يولد كوبون...');
    const couponRes = await axios.post(`${BASE_URL}/coupons/generate`, { offerId: offerId }, customerAuth);
    const couponCode = couponRes.data.code;
    console.log(`✅ تم توليد الكوبون: ${couponCode}`);

    // 9. التاجر يفعل الكوبون
    console.log(`\n📲 الخطوة 4: التاجر يفعل الكوبون [${couponCode}]...`);
    await axios.post(`${BASE_URL}/coupons/redeem`, { code: couponCode, storeId: storeId }, merchantAuth);
    console.log('✅ تم تفعيل الكوبون بنجاح من طرف التاجر.');

    setTimeout(() => {
      console.log('\n🏁 انتهى الاختبار بنجاح تام! مبروك يا زقازيقي!');
      process.exit(0);
    }, 3000);

  } catch (error) {
    console.error('❌ فشل الاختبار:', error.response?.data || error.message);
    process.exit(1);
  }
}

runUltimateTest();
