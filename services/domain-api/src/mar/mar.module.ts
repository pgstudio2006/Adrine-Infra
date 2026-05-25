import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { NursingModule } from '../nursing/nursing.module';
import { MarController } from './mar.controller';
import { MarRuntimeService } from './mar-runtime.service';

@Module({
  imports: [EventsModule, NursingModule],
  controllers: [MarController],
  providers: [MarRuntimeService],
  exports: [MarRuntimeService],
})
export class MarModule {}
