import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { EventsModule } from '../events/events.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { RadiologyController } from './radiology.controller';
import { RadiologyRuntimeService } from './radiology-runtime.service';

@Module({
  imports: [EventsModule, BillingModule, RealtimeModule],
  controllers: [RadiologyController],
  providers: [RadiologyRuntimeService],
  exports: [RadiologyRuntimeService],
})
export class RadiologyModule {}
