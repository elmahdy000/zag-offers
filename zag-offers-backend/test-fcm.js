const admin = require('firebase-admin');

// الاعتماد على GOOGLE_APPLICATION_CREDENTIALS أو تسجيل الدخول الافتراضي
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'zagoffers'
});

const message = {
  topic: 'all_users',
  notification: {
    title: 'Zag Offers 🚀',
    body: 'مرحباً بك! هذا إشعار تجريبي من السيرفر.'
  },
  android: {
    priority: 'high',
    notification: { 
      sound: 'default', 
      channelId: 'offers_channel' 
    }
  }
};

admin.messaging().send(message)
  .then((response) => {
    console.log('✅ Successfully sent message:', response);
    process.exit(0);
  })
  .catch((error) => {
    console.log('❌ Error sending message:', error);
    process.exit(1);
  });
