import { Module } from '@nestjs/common';
import { PlatformBillingModule } from '../platform-billing/platform-billing.module';
import { MeteringController } from './metering.controller';
import { MeteringService } from './metering.service';

@Module({
  imports: [PlatformBillingModule],
  controllers: [MeteringController],
  providers: [MeteringService],
  exports: [MeteringService],
})
export class MeteringModule {}
