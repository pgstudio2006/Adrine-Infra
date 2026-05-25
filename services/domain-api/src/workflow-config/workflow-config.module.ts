import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { WorkflowConfigController } from './workflow-config.controller';
import { WorkflowDefinitionRuntimeService } from './workflow-definition-runtime.service';

@Module({
  imports: [EventsModule],
  controllers: [WorkflowConfigController],
  providers: [WorkflowDefinitionRuntimeService],
  exports: [WorkflowDefinitionRuntimeService],
})
export class WorkflowConfigModule {}
