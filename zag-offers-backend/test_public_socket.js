const io = require('socket.io-client');
const axios = require('axios');

async function testPublicNotifications() {
  console.log('Testing Realtime Notifications & Backend Wiring...');

  // Connect Socket
  const socket = io('http://localhost:3001');
  
  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('notification', (data) => {
    console.log('🔔 Received Realtime Notification via Socket:', data);
  });

  socket.on('connect_error', (err) => {
    console.log('❌ Socket connection error:', err.message);
  });

  await new Promise(resolve => setTimeout(resolve, 1500));

  try {
    console.log('Triggering public test broadcast...');
    const res = await axios.post('http://localhost:3001/notifications/test/public', {
      title: 'Wiring Test',
      body: 'Testing full backend socket and db integration'
    });
    console.log('✅ Trigger response:', res.data);

    // Wait to see if socket event fires
    await new Promise(resolve => setTimeout(resolve, 3000));
  } catch(e) {
    console.error('Trigger error:', e.response?.data || e.message);
  }

  socket.disconnect();
  console.log('Test completed.');
  process.exit(0);
}

testPublicNotifications();
