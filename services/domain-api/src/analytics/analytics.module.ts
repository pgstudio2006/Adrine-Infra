import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { OperationalAnalyticsService } from './operational-analytics.service';

@Module({
  controllers: [AnalyticsController],
  providers: [OperationalAnalyticsService],
  exports: [OperationalAnalyticsService],
})
export class AnalyticsModule {}
