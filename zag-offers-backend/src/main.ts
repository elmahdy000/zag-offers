import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import compression from 'compression';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // تفعيل CORS — السماح للـ Frontend بالتواصل مع الـ API
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:3002'];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // تفعيل ضغط البيانات لتسريع التحميل
  app.use(compression());

  // إعدادات الـ Validation والـ Global Filter
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  // تفعيل الوصول للصور المرفوعة محلياً
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // إعداد الـ Swagger (Documentation)
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
  console.log(`🚀 السيرفر شغال على: http://localhost:${port}`);
  console.log(`🌐 متاح على الشبكة عبر: http://${host}:${port}`);
  console.log(`📜 التوثيق (Swagger): http://localhost:${port}/api`);
}
void bootstrap();
