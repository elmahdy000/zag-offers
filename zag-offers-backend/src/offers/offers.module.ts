import { Module } from '@nestjs/common';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { EventsModule } from '../events/events.module';
import { UploadModule } from '../upload/upload.module';

import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      ttl: 60 * 1000, // كاش للعروض لمدة دقيقة واحدة
      max: 500,
    }),
    EventsModule,
    UploadModule,
  ],
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}
