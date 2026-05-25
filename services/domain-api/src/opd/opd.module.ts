import { Module } from '@nestjs/common';
import { EncounterModule } from '../encounter/encounter.module';
import { PatientModule } from '../patient/patient.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { BillingModule } from '../billing/billing.module';
import { LabModule } from '../lab/lab.module';
import { PharmacyModule } from '../pharmacy/pharmacy.module';
import { RadiologyModule } from '../radiology/radiology.module';
import { OpdBillingController } from './opd-billing.controller';
import { OpdBillingService } from './opd-billing.service';
import { OpdController } from './opd.controller';
import { OpdService } from './opd.service';

@Module({
  imports: [
    PatientModule,
    EncounterModule,
    SchedulingModule,
    BillingModule,
    LabModule,
    PharmacyModule,
    RadiologyModule,
  ],
  controllers: [OpdController, OpdBillingController],
  providers: [OpdService, OpdBillingService],
  exports: [OpdService, OpdBillingService],
})
export class OpdModule {}
