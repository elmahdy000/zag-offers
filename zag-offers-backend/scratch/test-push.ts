import { config } from 'dotenv';
config();
import { PrismaClient } from '@prisma/client';
import * as admin from 'firebase-admin';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching users with active FCM tokens...');
  
  // Get all users that have an fcmToken
  const users = await prisma.user.findMany({
    where: {
      fcmToken: {
        not: null
      }
    },
    select: {
      id: true,
      name: true,
      fcmToken: true,
      role: true
    }
  });

  if (users.length === 0) {
    console.log('❌ No users found with an active FCM token. Please open the Vendor or Client app to register a token first.');
    return;
  }

  console.log(`Found ${users.length} users with FCM tokens. Initializing Firebase...`);

  // Initialize Firebase Admin (it uses GOOGLE_APPLICATION_CREDENTIALS from .env)
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log('✅ Firebase Admin initialized.');
  } catch (error: any) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    return;
  }

  // Send a test notification to all of them
  let successCount = 0;
  for (const user of users) {
    try {
      if (!user.fcmToken) continue;
      
      const message = {
        token: user.fcmToken,
        notification: {
          title: 'إشعار تجريبي 🚀',
          body: `مرحباً ${user.name}، هذا إشعار تجريبي من سيرفر Zag Offers للتأكد من عمل النظام بنجاح!`,
        },
        data: {
          type: 'TEST_NOTIFICATION',
          message: 'It works!'
        },
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            channelId: 'high_importance_channel',
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              contentAvailable: true,
            }
          }
        }
      };

      await admin.messaging().send(message);
      console.log(`✅ Successfully sent to user: ${user.name} (${user.role})`);
      successCount++;
    } catch (err: any) {
      console.log(`❌ Failed to send to user ${user.name}:`, err.message);
    }
  }

  console.log(`\n🎉 Test completed! Sent ${successCount} out of ${users.length} notifications.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
