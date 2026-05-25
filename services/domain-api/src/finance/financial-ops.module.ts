import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { OrchestrationModule } from '../orchestration/orchestration.module';
import { FinanceController } from './finance.controller';
import { FinancialOperationsService } from './financial-operations.service';

@Module({
  imports: [BillingModule, OrchestrationModule],
  controllers: [FinanceController],
  providers: [FinancialOperationsService],
  exports: [FinancialOperationsService],
})
export class FinancialOpsModule {}
