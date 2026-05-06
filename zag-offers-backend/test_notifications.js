const io = require('socket.io-client');
const axios = require('axios');

async function testNotifications() {
  console.log('Testing Realtime Notifications & Backend Wiring...');

  // 1. Connect Socket
  const socket = io('http://localhost:3000');
  
  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('notification', (data) => {
    console.log('🔔 Received Realtime Notification via Socket:', data);
  });

  socket.on('connect_error', (err) => {
    console.log('❌ Socket connection error:', err.message);
  });

  // Wait a bit to ensure socket connects
  await new Promise(resolve => setTimeout(resolve, 1500));

  // 2. We need an Admin token to trigger a test broadcast or similar.
  // Assuming there's a login endpoint or an existing user to get a token.
  // Alternatively, the admin app might have a token we can use, but we can just use the /admin/auth/login endpoint.
  try {
    const loginRes = await axios.post('http://localhost:3000/api/admin/auth/login', {
      email: 'admin@zagoffers.com', // Replace with valid admin email if known
      password: 'password123'      // Replace with valid admin password
    }).catch(e => {
        // Just print login error
        console.log('Admin login failed (needs valid credentials). Attempting to use a test endpoint or bypass if possible.');
        return null;
    });

    let token = loginRes?.data?.access_token || loginRes?.data?.token;

    // Test the Get Status endpoint
    console.log('--- Testing /api/notifications/status ---');
    try {
      const statusRes = await axios.get('http://localhost:3000/api/notifications/status', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      console.log('Status:', statusRes.data);
    } catch(e) {
      console.log('Status endpoint requires auth or failed:', e.response?.status, e.response?.data);
    }

    // Since we may not have auth, let's use Prisma to check if the table works directly
    console.log('--- Checking DB Table ---');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Create a dummy notification directly to test DB insertion
    const testUser = await prisma.user.findFirst();
    if (testUser) {
      const notif = await prisma.notification.create({
        data: {
          userId: testUser.id,
          title: 'Test Wiring',
          body: 'This is a test notification',
          type: 'TEST'
        }
      });
      console.log('✅ Successfully inserted test notification into DB:', notif);

      const allNotifs = await prisma.notification.findMany({ where: { userId: testUser.id }});
      console.log(`✅ Found ${allNotifs.length} notifications in DB for user ${testUser.id}`);
    } else {
      console.log('No users found in DB to test notification association.');
    }
    await prisma.$disconnect();

  } catch (error) {
    console.error('Test script error:', error.message);
  }

  setTimeout(() => {
    socket.disconnect();
    console.log('Test completed.');
    process.exit(0);
  }, 2000);
}

testNotifications();
