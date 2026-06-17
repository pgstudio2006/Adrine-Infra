import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { BillingModule } from '../billing/billing.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { RisController } from './ris.controller';
import { RisService } from './ris.service';

@Module({
  imports: [EventsModule, BillingModule, RealtimeModule],
  controllers: [RisController],
  providers: [RisService],
  exports: [RisService],
})
export class RisModule {}
