import { Module } from '@nestjs/common';
import { IdempotencyService } from '../common/idempotency.service';
import { OperationalTemplateModule } from '../templates/operational-template.module';
import { ProvisioningController } from './provisioning.controller';
import { TenantProvisioningService } from './tenant-provisioning.service';

@Module({
  imports: [OperationalTemplateModule],
  controllers: [ProvisioningController],
  providers: [TenantProvisioningService, IdempotencyService],
  exports: [TenantProvisioningService],
})
export class ProvisioningModule {}
