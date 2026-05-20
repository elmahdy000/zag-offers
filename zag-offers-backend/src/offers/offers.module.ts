import { Module } from '@nestjs/common';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { EventsModule } from '../events/events.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    EventsModule,
    UploadModule,
  ],
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}

