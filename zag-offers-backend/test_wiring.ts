import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { NotificationsService } from './src/notifications/notifications.service';
import { PrismaService } from './src/prisma/prisma.service';

async function bootstrap() {
  console.log('Testing Realtime Notifications & Backend Wiring...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const notificationsService = app.get(NotificationsService);
  const prismaService = app.get(PrismaService);

  try {
    const testUser = await prismaService.user.findFirst();
    if (!testUser) {
        console.log('No users found in DB.');
        process.exit(0);
    }
    
    const countBefore = await prismaService.notification.count();
    
    await notificationsService.sendToAll(
        '🚀 تحديث جديد من Zag Offers!',
        'تم تفعيل نظام الإشعارات المتكامل بنجاح. يمكنك الآن متابعة كل جديد لحظة بلحظة!',
        { type: 'SYSTEM_UPDATE', route: '/notifications' }
    );

    // Wait a moment for async save
    await new Promise(r => setTimeout(r, 2000));
    
    const countAfter = await prismaService.notification.count();
    console.log(`Notifications in DB before: ${countBefore}`);
    console.log(`Notifications in DB after: ${countAfter}`);
    
    if (countAfter > countBefore) {
        console.log('✅ WIRING TEST PASSED! Notifications were successfully saved to the database upon sending.');
    } else {
        console.log('❌ WIRING TEST FAILED! Database count did not increase.');
    }
    
  } catch(e) {
    console.error('Test error:', e);
  }

  await app.close();
  process.exit(0);
}

bootstrap();
