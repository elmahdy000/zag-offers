import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { NotificationsService } from './src/notifications/notifications.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const notificationsService = app.get(NotificationsService);

  console.log('Sending broadcast notification...');
  
  await notificationsService.sendToAll(
    'تجربة إشعار Zag Offers 🚀',
    'الـ SnackBar بقى بريميوم وأيقونة الإشعار اتصلحت 🔥 طمني إيه الأخبار؟',
    { type: 'TEST', timestamp: new Date().toISOString() }
  );

  console.log('Notification sent successfully!');
  await app.close();
}

bootstrap();
