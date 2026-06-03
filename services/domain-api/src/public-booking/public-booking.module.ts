import { Module } from '@nestjs/common';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { PublicBookingController } from './public-booking.controller';
import { PublicBookingService } from './public-booking.service';

@Module({
  imports: [SchedulingModule],
  controllers: [PublicBookingController],
  providers: [PublicBookingService],
})
export class PublicBookingModule {}
