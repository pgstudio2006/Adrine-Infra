import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import type { WorkflowDefinitionDraft } from '@adrine/hospital-operations';
import { WorkflowDefinitionRuntimeService } from './workflow-definition-runtime.service';

@ApiTags('workflow-config')
@Controller('workflow-config')
@ApiHeader({ name: 'x-tenant-id', required: true })
export class WorkflowConfigController {
  constructor(private readonly runtime: WorkflowDefinitionRuntimeService) {}

  @Get('definitions')
  list(@Headers('x-tenant-id') tenantId: string) {
    return this.runtime.listDefinitions(tenantId ?? 'tenant_dev');
  }

  @Post('definitions')
  upsert(
    @Headers('x-tenant-id') tenantId: string,
    @Body()
    body: {
      lifecycleId: string;
      name: string;
      description?: string;
      draft: WorkflowDefinitionDraft;
    },
  ) {
    return this.runtime.upsertDraft(tenantId ?? 'tenant_dev', body);
  }

  @Post('definitions/:definitionId/publish')
  publish(
    @Headers('x-tenant-id') tenantId: string,
    @Param('definitionId') definitionId: string,
    @Body() body: { versionId: string; expectedVersion: number; actorId?: string },
  ) {
    return this.runtime.publish(tenantId ?? 'tenant_dev', definitionId, body);
  }

  @Post('definitions/:definitionId/rollback')
  rollback(
    @Headers('x-tenant-id') tenantId: string,
    @Param('definitionId') definitionId: string,
    @Body() body: { toVersion: number; actorId?: string },
  ) {
    return this.runtime.rollback(tenantId ?? 'tenant_dev', definitionId, body);
  }

  @Post('definitions/clone')
  clone(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: { sourceLifecycleId: string; targetLifecycleId: string; name: string },
  ) {
    return this.runtime.cloneTemplate(tenantId ?? 'tenant_dev', body.sourceLifecycleId, body.targetLifecycleId, body.name);
  }
}
