import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { NursingController } from './nursing.controller';
import { NursingClinicalController } from './nursing-clinical.controller';
import { NursingClinicalRuntimeService } from './nursing-clinical-runtime.service';
import { NursingRuntimeService } from './nursing-runtime.service';

@Module({
  imports: [EventsModule],
  controllers: [NursingController, NursingClinicalController],
  providers: [NursingRuntimeService, NursingClinicalRuntimeService],
  exports: [NursingRuntimeService, NursingClinicalRuntimeService],
})
export class NursingModule {}
