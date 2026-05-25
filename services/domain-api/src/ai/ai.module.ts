import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { CommandModule } from '../command/command.module';
import { AIController } from './ai.controller';
import { AIOrchestrationService } from './ai-orchestration.service';

@Module({
  imports: [AnalyticsModule, CommandModule],
  controllers: [AIController],
  providers: [AIOrchestrationService],
  exports: [AIOrchestrationService],
})
export class AIModule {}
