import { Module } from '@nestjs/common';
import { OrchestrationController } from './orchestration.controller';
import { ReconciliationService } from './reconciliation.service';
import { OperationalHealthService } from './operational-health.service';

@Module({
  controllers: [OrchestrationController],
  providers: [ReconciliationService, OperationalHealthService],
  exports: [ReconciliationService, OperationalHealthService],
})
export class OrchestrationModule {}
