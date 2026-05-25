import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { BedController } from './bed.controller';
import { BedRuntimeService } from './bed-runtime.service';

@Module({
  imports: [EventsModule],
  controllers: [BedController],
  providers: [BedRuntimeService],
  exports: [BedRuntimeService],
})
export class BedModule {}
