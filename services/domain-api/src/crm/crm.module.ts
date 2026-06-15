import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { TwentyCrmSyncService } from './twenty-crm-sync.service';

@Module({
  imports: [EventsModule],
  controllers: [CrmController],
  providers: [CrmService, TwentyCrmSyncService],
  exports: [CrmService],
})
export class CrmModule {}
