import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { EventsModule } from '../events/events.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [EventsModule, UsersModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
