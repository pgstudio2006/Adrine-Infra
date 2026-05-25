import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { KernelNotificationService } from './notification.service';

@Module({
  controllers: [NotificationController],
  providers: [KernelNotificationService],
  exports: [KernelNotificationService],
})
export class NotificationModule {}