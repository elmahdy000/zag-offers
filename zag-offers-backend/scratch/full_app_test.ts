import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:3001';

async function runFullScenario() {
  console.log('🚀 بدء الاختبار الشامل والنهائي...');

  try {
    // 1. Auth
    const userPhone = `010${Math.floor(Math.random() * 100000000)}`;
    await axios.post(`${BASE_URL}/auth/register`, { phone: userPhone, password: 'password123', name: 'User Test' });
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, { phone: userPhone, password: 'password123' });
    const token = loginRes.data.access_token;
    console.log('✅ [1] User Login');

    const adminRes = await axios.post(`${BASE_URL}/auth/login`, { phone: '01000000000', password: 'password123' });
    const adminToken = adminRes.data.access_token;
    const adminHeader = { Authorization: `Bearer ${adminToken}` };
    const authHeader = { Authorization: `Bearer ${token}` };
    console.log('✅ [2] Admin Login');

    const catsRes = await axios.get(`${BASE_URL}/stores/categories`);
    const catId = catsRes.data[0].id;
    const storePhone = `012${Math.floor(Math.random() * 10000000)}`;

    const storeRes = await axios.post(`${BASE_URL}/stores`, 
      { name: 'Zag Store', address: 'Main St', area: 'القومية', phone: storePhone, categoryId: catId },
      { headers: adminHeader }
    );
    const storeId = storeRes.data.id;
    await axios.patch(`${BASE_URL}/stores/${storeId}/status`, { status: 'APPROVED' }, { headers: adminHeader });
    console.log('✅ [3] Store Ready');

    const offerRes = await axios.post(`${BASE_URL}/offers`, 
      { title: 'Super Sale', description: 'Big discount', discount: '70%', startDate: '2026-05-01', endDate: '2026-06-01', storeId },
      { headers: adminHeader }
    );
    const offerId = offerRes.data.id;
    await axios.patch(`${BASE_URL}/offers/${offerId}/status`, { status: 'ACTIVE' }, { headers: adminHeader });
    console.log('✅ [4] Offer Active');

    await new Promise(r => setTimeout(r, 1000));

    const searchRes = await axios.get(`${BASE_URL}/offers/search?q=Super`);
    console.log('✅ [5] Search count:', searchRes.data.length);

    await axios.post(`${BASE_URL}/favorites/toggle/${offerId}`, {}, { headers: authHeader });
    console.log('✅ [6] Favorite toggled');

    const recsRes = await axios.get(`${BASE_URL}/recommendations`, { headers: authHeader });
    console.log('✅ [7] Recommendations count:', recsRes.data.length);

    const couponRes = await axios.post(`${BASE_URL}/coupons/generate`, { offerId }, { headers: authHeader });
    const code = couponRes.data.code;
    console.log('✅ [8] Coupon code:', code);

    const redeemRes = await axios.post(`${BASE_URL}/coupons/redeem`, { code, storeId }, { headers: adminHeader });
    console.log('✅ [9] Redeemed status:', redeemRes.data.status);

    console.log('\n🏆 ALL TESTS PASSED! THE SYSTEM IS ROCK SOLID!');

  } catch (err: any) {
    console.error('💥 Error At:', err.config?.url);
    console.error('Message:', err.response?.data?.message || err.response?.data || err.message);
  }
}

runFullScenario();
