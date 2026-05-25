import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { InsuranceModule } from '../insurance/insurance.module';
import { BillingController } from './billing.controller';
import { BillingDeptController } from './billing-dept.controller';
import { BillingDeptService } from './billing-dept.service';
import { BillingGatesService } from './billing-gates.service';
import { BillingRuntimeService } from './billing-runtime.service';
import { BillingSyncController } from './billing-sync.controller';
import { BillingSyncService } from './billing-sync.service';
import { BillingService } from './billing.service';

@Module({
  imports: [EventsModule, InsuranceModule],
  controllers: [BillingController, BillingSyncController, BillingDeptController],
  providers: [
    BillingService,
    BillingRuntimeService,
    BillingSyncService,
    BillingGatesService,
    BillingDeptService,
  ],
  exports: [BillingService, BillingRuntimeService, BillingSyncService, BillingGatesService],
})
export class BillingModule {}
