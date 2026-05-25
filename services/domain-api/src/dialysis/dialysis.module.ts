import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { DialysisController } from './dialysis.controller';
import { DialysisRuntimeService } from './dialysis-runtime.service';

@Module({
  imports: [BillingModule],
  controllers: [DialysisController],
  providers: [DialysisRuntimeService],
  exports: [DialysisRuntimeService],
})
export class DialysisModule {}
