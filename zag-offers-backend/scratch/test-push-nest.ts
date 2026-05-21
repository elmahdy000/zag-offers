import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { NotificationsService } from '../src/notifications/notifications.service';
import { PrismaService } from '../src/prisma/prisma.service';

async function bootstrap() {
  console.log('Bootstrapping NestJS application...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const prisma = app.get(PrismaService);
  const notificationsService = app.get(NotificationsService);

  console.log('Fetching users with active FCM tokens...');
  
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
    await app.close();
    return;
  }

  console.log(`Found ${users.length} users with FCM tokens. Sending test push notifications...`);

  let successCount = 0;
  for (const user of users) {
    try {
      if (!user.fcmToken) continue;
      
      await notificationsService.sendToUserId(user.id, {
        title: 'إشعار تجريبي 🚀',
        body: `مرحباً ${user.name}، هذا إشعار تجريبي من سيرفر Zag Offers للتأكد من عمل النظام بنجاح!`,
        data: {
          type: 'TEST_NOTIFICATION',
          message: 'It works!'
        }
      });
      console.log(`✅ Successfully queued notification for user: ${user.name} (${user.role})`);
      successCount++;
    } catch (err: any) {
      console.log(`❌ Failed to send to user ${user.name}:`, err.message);
    }
  }

  console.log(`\n🎉 Test completed! Processed ${successCount} out of ${users.length} users.`);
  await app.close();
}

bootstrap().catch(err => {
  console.error(err);
  process.exit(1);
});
