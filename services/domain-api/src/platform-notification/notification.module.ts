import { Module } from '@nestjs/common';
import { ProvidersModule } from '../providers/providers.module';
import { PlatformNotificationController } from './notification.controller';
import { PlatformNotificationService } from './notification.service';

@Module({
  imports: [ProvidersModule],
  controllers: [PlatformNotificationController],
  providers: [PlatformNotificationService],
  exports: [PlatformNotificationService],
})
export class PlatformNotificationModule {}
