const API_URL = 'https://api.zagoffers.online/api';

async function simulate() {
  try {
    console.log('--- STARTING SIMULATION ---');

    // 1. Login as Merchant
    console.log('1. Logging in as Merchant (01111111111)...');
    const merchantLogin = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '01111111111', password: 'password123' })
    });
    const merchantLoginData = await merchantLogin.json();
    if (!merchantLogin.ok) throw new Error(`Merchant Login Failed: ${JSON.stringify(merchantLoginData)}`);
    const merchantToken = merchantLoginData.access_token; // FIXED: was .token
    console.log('   Merchant Token obtained.');

    // 2. Create Offer
    console.log('2. Creating a new Offer...');
    const offerRes = await fetch(`${API_URL}/offers`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${merchantToken}`
      },
      body: JSON.stringify({
        title: 'Simulation Offer ' + new Date().getTime(),
        description: 'This is a test offer from simulation script',
        discount: '50%',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        usageLimit: 10
      })
    });
    const offerData = await offerRes.json();
    if (!offerRes.ok) throw new Error(`Offer Creation Failed: ${JSON.stringify(offerData)}`);
    const offerId = offerData.id;
    const storeId = offerData.storeId;
    console.log(`   Offer Created: ID=${offerId}, StoreID=${storeId}`);

    // 3. Login as Admin to Approve
    console.log('3. Logging in as Admin (01000000000)...');
    const adminLogin = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '01000000000', password: 'password123' })
    });
    const adminLoginData = await adminLogin.json();
    if (!adminLogin.ok) throw new Error(`Admin Login Failed`);
    const adminToken = adminLoginData.access_token; // FIXED: was .token
    console.log('   Admin Token obtained.');

    // 4. Approve Offer
    console.log('4. Approving Offer...');
    const approveRes = await fetch(`${API_URL}/offers/${offerId}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'ACTIVE' })
    });
    if (!approveRes.ok) throw new Error('Offer Approval Failed');
    console.log('   Offer set to ACTIVE.');

    // 5. Login as Customer
    console.log('5. Logging in as Customer (01033333333)...');
    const customerLogin = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '01033333333', password: 'password123' })
    });
    const customerLoginData = await customerLogin.json();
    if (!customerLogin.ok) throw new Error(`Customer Login Failed`);
    const customerToken = customerLoginData.access_token; // FIXED: was .token
    console.log('   Customer Token obtained.');

    // 6. Generate Coupon
    console.log('6. Generating Coupon for the offer...');
    const couponRes = await fetch(`${API_URL}/coupons/generate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({ offerId: offerId })
    });
    const couponData = await couponRes.json();
    if (!couponRes.ok) throw new Error(`Coupon Generation Failed: ${JSON.stringify(couponData)}`);
    const couponCode = couponData.code;
    console.log(`   Coupon Generated: Code=${couponCode}`);

    // 7. Redeem Coupon (as Merchant)
    console.log('7. Redeeming Coupon (Merchant role)...');
    const redeemRes = await fetch(`${API_URL}/coupons/redeem`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${merchantToken}`
      },
      body: JSON.stringify({ code: couponCode, storeId: storeId })
    });
    const redeemData = await redeemRes.json();
    console.log('   Redeem Result:', JSON.stringify(redeemData, null, 2));

    console.log('--- SIMULATION COMPLETED SUCCESSFULLY ---');

  } catch (error) {
    console.error('--- SIMULATION FAILED ---');
    console.error(error.message);
  }
}

simulate();
