import { Module } from '@nestjs/common';
import { SchedulingController } from './scheduling.controller';
import { SchedulingHubController } from './scheduling-hub.controller';
import { SchedulingService } from './scheduling.service';

@Module({
  controllers: [SchedulingController, SchedulingHubController],
  providers: [SchedulingService],
  exports: [SchedulingService],
})
export class SchedulingModule {}
