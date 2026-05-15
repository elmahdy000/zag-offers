const admin = require('firebase-admin');
const serviceAccount = require('../zagoffers-firebase-adminsdk-fbsvc-46c5cc258d.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const message = {
  notification: {
    title: 'تجربة إشعار جديد 🚀',
    body: 'ده إشعار تجريبي عشان نشوف شكل الأيقونة الجديدة!'
  },
  data: {
    type: 'GENERAL'
  },
  topic: 'all_users'
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
