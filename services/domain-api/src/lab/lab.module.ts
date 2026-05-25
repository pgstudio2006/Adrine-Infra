import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { PlatformNotificationModule } from '../platform-notification/notification.module';
import { LabController } from './lab.controller';
import { LabRuntimeService } from './lab-runtime.service';

@Module({
  imports: [BillingModule, PlatformNotificationModule],
  controllers: [LabController],
  providers: [LabRuntimeService],
  exports: [LabRuntimeService],
})
export class LabModule {}
