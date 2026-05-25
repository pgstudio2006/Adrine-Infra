import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { PharmacyController } from './pharmacy.controller';
import { PharmacyRuntimeService } from './pharmacy-runtime.service';

@Module({
  imports: [BillingModule],
  controllers: [PharmacyController],
  providers: [PharmacyRuntimeService],
  exports: [PharmacyRuntimeService],
})
export class PharmacyModule {}
