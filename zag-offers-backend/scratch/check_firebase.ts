import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { NotificationsService } from '../src/notifications/notifications.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const notificationsService = app.get(NotificationsService);
  
  console.log('--- Firebase Initialization Test ---');
  const isReady = notificationsService.isReady();
  console.log(`Firebase Ready: ${isReady}`);
  
  if (!isReady) {
    console.log('Checking environment variables...');
    console.log(`GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
    console.log(`FIREBASE_SERVICE_ACCOUNT_JSON exists: ${!!process.env.FIREBASE_SERVICE_ACCOUNT_JSON}`);
  }

  await app.close();
}

bootstrap();
