import { Module } from '@nestjs/common';
import { IdempotencyService } from '../common/idempotency.service';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';

@Module({
  controllers: [IntegrationController],
  providers: [IntegrationService, IdempotencyService],
  exports: [IntegrationService],
})
export class IntegrationModule {}
