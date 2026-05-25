import { Global, Module, forwardRef } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { EventBusService } from './event-bus.service';
import { InternalEventsController } from './internal-events.controller';
import { PlatformEventService } from './platform-event.service';

@Global()
@Module({
  imports: [forwardRef(() => RealtimeModule)],
  controllers: [InternalEventsController],
  providers: [EventBusService, PlatformEventService],
  exports: [EventBusService, PlatformEventService],
})
export class EventsModule {}
