import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { NotificationsService } from '../src/notifications/notifications.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const notificationsService = app.get(NotificationsService);
  
  console.log('--- Sending Test Broadcast Notification ---');
  await notificationsService.sendToAll(
    '🚀 تجربة نظام الإشعارات',
    'لو شايف الرسالة دي، يبقى نظام الإشعارات شغال تمام! 🥳',
    { type: 'TEST_BROADCAST' }
  );
  
  console.log('Notification sent request completed.');
  await app.close();
}

bootstrap();
