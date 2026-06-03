import { Module, forwardRef } from '@nestjs/common';
import { OrchestrationModule } from '../orchestration/orchestration.module';
import { EscalationModule } from '../escalation/escalation.module';
import { CommandController } from './command.controller';
import { OperationalCommandService } from './operational-command.service';

@Module({
  imports: [OrchestrationModule, forwardRef(() => EscalationModule)],
  controllers: [CommandController],
  providers: [OperationalCommandService],
  exports: [OperationalCommandService],
})
export class CommandModule {}
