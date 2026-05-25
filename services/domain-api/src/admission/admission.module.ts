import { forwardRef, Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { BedModule } from '../bed/bed.module';
import { DischargeModule } from '../discharge/discharge.module';
import { EventsModule } from '../events/events.module';
import { AdmissionController } from './admission.controller';
import { AdmissionBillingService } from './admission-billing.service';
import { AdmissionRuntimeService } from './admission-runtime.service';

@Module({
  imports: [EventsModule, BillingModule, BedModule, forwardRef(() => DischargeModule)],
  controllers: [AdmissionController],
  providers: [AdmissionRuntimeService, AdmissionBillingService],
  exports: [AdmissionRuntimeService, AdmissionBillingService],
})
export class AdmissionModule {}
