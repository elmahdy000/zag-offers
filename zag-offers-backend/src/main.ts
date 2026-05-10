import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import compression from 'compression';
import { join } from 'path';
import * as express from 'express';

function getAllowedOrigins(): string[] {
  const rawOrigins = process.env.CORS_ORIGINS;
  if (rawOrigins) {
    return rawOrigins
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  // Safe local defaults for development environments.
  return ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  const allowedOrigins = getAllowedOrigins();

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('CORS blocked'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
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
  console.log(`Network URL: http://${host}:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api`);
}
void bootstrap();
