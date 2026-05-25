import { Module } from '@nestjs/common';
import { OrchestrationModule } from '../orchestration/orchestration.module';
import { PlatformNotificationModule } from '../platform-notification/notification.module';
import { JobsController } from './jobs.controller';

@Module({
  imports: [OrchestrationModule, PlatformNotificationModule],
  controllers: [JobsController],
})
export class JobsModule {}
