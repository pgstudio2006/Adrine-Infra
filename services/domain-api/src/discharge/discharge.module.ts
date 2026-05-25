import { forwardRef, Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { EventsModule } from '../events/events.module';
import { AdmissionModule } from '../admission/admission.module';
import { NursingModule } from '../nursing/nursing.module';
import { DischargeController } from './discharge.controller';
import { DischargeRuntimeService } from './discharge-runtime.service';

@Module({
  imports: [
    EventsModule,
    BillingModule,
    NursingModule,
    forwardRef(() => AdmissionModule),
  ],
  controllers: [DischargeController],
  providers: [DischargeRuntimeService],
  exports: [DischargeRuntimeService],
})
export class DischargeModule {}
