import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StoresModule } from './stores/stores.module';
import { OffersModule } from './offers/offers.module';
import { CouponsModule } from './coupons/coupons.module';
import { ConfigModule } from '@nestjs/config';
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
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({
      ttl: 60 * 1000, // الكاش الافتراضي لمدة دقيقة
      max: 100, // أقصى عدد للعناصر في الكاش
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TerminusModule,
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 30,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 100,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 500,
      },
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
export class AppModule {}
