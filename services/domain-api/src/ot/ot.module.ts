import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { OtController } from './ot.controller';
import { OtRuntimeService } from './ot-runtime.service';

@Module({
  imports: [BillingModule],
  controllers: [OtController],
  providers: [OtRuntimeService],
  exports: [OtRuntimeService],
})
export class OtModule {}
