import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import compression from 'compression';
import { join } from 'path';
import * as express from 'express';
import { RedisIoAdapter } from './common/adapters/redis-io.adapter';

function getAllowedOrigins(): string[] {
  const rawOrigins = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGINS;
  if (rawOrigins) {
    return rawOrigins
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  return [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://zagoffers.online',
    'https://www.zagoffers.online',
    'https://vendor.zagoffers.online',
    'https://admin.zagoffers.online',
  ];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  
  // تفعيل Redis Adapter للشات
  const redisIoAdapter = new RedisIoAdapter(app);
  try {
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);
    console.log('Socket.io is now using Redis Adapter!');
  } catch (e) {
    console.error('Failed to initialize Socket.io Redis Adapter:', e);
  }

  const allowedOrigins = getAllowedOrigins();

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('CORS blocked'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
    ],
    credentials: true,
  });

  app.use(compression());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  const config = new DocumentBuilder()
    .setTitle('Zag Offers API')
    .setDescription('نظام إدارة العروض والخصومات في مدينة الزقازيق')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3001;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  console.log(`Server running on: http://localhost:${port}`);
}
void bootstrap();
