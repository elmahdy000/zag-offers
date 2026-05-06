import { Module } from '@nestjs/common';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { EventsModule } from '../events/events.module';
import { UploadModule } from '../upload/upload.module';

import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      ttl: 60 * 1000, // كاش لمحلات لمدة دقيقة واحدة
      max: 200,
    }),
    EventsModule,
    UploadModule,
  ],
  providers: [StoresService],
  controllers: [StoresController],
})
export class StoresModule {}
