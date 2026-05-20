import { Module } from '@nestjs/common';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { EventsModule } from '../events/events.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    EventsModule,
    UploadModule,
  ],
  providers: [StoresService],
  controllers: [StoresController],
})
export class StoresModule {}

