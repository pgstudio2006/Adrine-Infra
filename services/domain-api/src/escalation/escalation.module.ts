import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { PlatformNotificationModule } from '../platform-notification/notification.module';
import { EscalationController } from './escalation.controller';
import { OperationalEscalationService } from './operational-escalation.service';

@Module({
  imports: [EventsModule, PlatformNotificationModule],
  controllers: [EscalationController],
  providers: [OperationalEscalationService],
  exports: [OperationalEscalationService],
})
export class EscalationModule {}
