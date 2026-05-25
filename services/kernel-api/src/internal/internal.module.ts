import { Module } from '@nestjs/common';
import { PlatformBillingModule } from '../platform-billing/platform-billing.module';
import { ScaleModule } from '../scale/scale.module';
import { InternalController } from './internal.controller';

@Module({
  imports: [ScaleModule, PlatformBillingModule],
  controllers: [InternalController],
})
export class InternalModule {}
