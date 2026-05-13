import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { NotificationsService } from '../src/notifications/notifications.service';
import * as admin from 'firebase-admin';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  console.log('Sending test broadcast notification to multiple topics...');
  
  const title = 'تجربة إشعارات زقازيق أوفيرز';
  const body = 'ده إشعار تجريبي مرسل من السيرفر للتأكد من عمل النظام بنجاح 🚀';
  const data = { type: 'TEST', timestamp: new Date().toISOString() };

  try {
    // Send to all_customers (default in service)
    const message1: admin.messaging.Message = {
      notification: { title, body },
      topic: 'all_customers',
      data,
      android: { priority: 'high' }
    };
    await admin.messaging().send(message1);
    console.log('Sent to all_customers');

    // Send to all_users (what Flutter currently subscribes to)
    const message2: admin.messaging.Message = {
      notification: { title, body },
      topic: 'all_users',
      data,
      android: { priority: 'high' }
    };
    await admin.messaging().send(message2);
    console.log('Sent to all_users');

    console.log('All broadcast notifications sent successfully!');
  } catch (error) {
    console.error('Failed to send broadcast:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
