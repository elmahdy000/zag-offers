import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StoresModule } from './stores/stores.module';
import { OffersModule } from './offers/offers.module';
import { CouponsModule } from './coupons/coupons.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ReviewsModule } from './reviews/reviews.module';
import { FavoritesModule } from './favorites/favorites.module';
import { AdminModule } from './admin/admin.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';
import { TasksService } from './tasks/tasks.service';
import { HealthController } from './health/health.controller';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RecommendationsService } from './recommendations/recommendations.service';
import { RecommendationsController } from './recommendations/recommendations.controller';
import { UploadModule } from './upload/upload.module';
import { EventsModule } from './events/events.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { CacheModule } from '@nestjs/cache-manager';
import { AnalyticsModule } from './analytics/analytics.module';
import { ChatModule } from './chat/chat.module';
import { SecurityMiddleware } from './common/middleware/security.middleware';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        // إذا كان هناك رابط Redis في الـ ENV سنستخدمه، وإلا سنستخدم المحلى
        const redisUrl = configService.get('REDIS_URL') || 'redis://localhost:6379';
        
        try {
          const store = await redisStore({
            url: redisUrl,
            ttl: 60000, // دقيقة واحدة افتراضياً
          });
          
          console.log('Redis Cache Store initialized successfully!');
          return { store };
        } catch (e) {
          console.error('Failed to initialize Redis Cache Store, falling back to memory:', e);
          return {
            ttl: 60000,
            max: 100,
          };
        }
      },
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    TerminusModule,
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 30 },
      { name: 'medium', ttl: 10000, limit: 100 },
      { name: 'long', ttl: 60000, limit: 500 },
      { name: 'strict', ttl: 60000, limit: 10 },
      { name: 'hourly', ttl: 3600000, limit: 100 },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    StoresModule,
    OffersModule,
    CouponsModule,
    ReviewsModule,
    FavoritesModule,
    AdminModule,
    UploadModule,
    EventsModule,
    NotificationsModule,
    AuditLogModule,
    AnalyticsModule,
    ChatModule,
  ],
  controllers: [AppController, HealthController, RecommendationsController],
  providers: [
    AppService,
    TasksService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    RecommendationsService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityMiddleware).forRoutes('*');
  }
}
