import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { AIOrchestrationService } from './ai-orchestration.service';

@ApiTags('ai')
@Controller('ai')
export class AIController {
  constructor(private readonly ai: AIOrchestrationService) {}

  @Post('actions/execute')
  @Post('execute')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  execute(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-actor-id') actorId: string | undefined,
    @Body()
    body: {
      actionType: string;
      userId?: string;
      branchId?: string;
      permissions?: string[];
      payload?: Record<string, unknown>;
    },
  ) {
    return this.ai.execute(tenantId ?? 'tenant_dev', {
      actionType: body.actionType,
      userId: body.userId ?? actorId ?? 'unknown',
      branchId: body.branchId,
      permissions: body.permissions ?? ['clinical.notes.read'],
      payload: body.payload,
    });
  }

  @Post('scribe')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  scribe(
    @Body()
    body: {
      patientName: string;
      transcript: string;
    },
  ) {
    return this.ai.scribeConsultation(body);
  }
}
