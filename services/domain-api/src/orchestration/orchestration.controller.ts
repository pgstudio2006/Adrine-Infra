import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import { ReconciliationService } from './reconciliation.service';
import { OperationalHealthService } from './operational-health.service';

@ApiTags('orchestration')
@ApiSecurity('tenant')
@Controller('orchestration')
export class OrchestrationController {
  constructor(
    private readonly reconciliation: ReconciliationService,
    private readonly operationalHealth: OperationalHealthService,
  ) {}

  @Get('health')
  async health(@Req() req: Request, @Query('branchId') branchId?: string) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    const summary = await this.operationalHealth.getHealthSummary(tenantId, branchId);
    return { ...summary.base, ...summary, checkedAt: new Date().toISOString() };
  }

  @Get('diagnostics')
  diagnostics(@Req() req: Request, @Query('branchId') branchId?: string) {
    return this.operationalHealth.getDiagnostics((req as RequestWithTenant).tenantId!, branchId);
  }

  @Get('admissions/:admissionId/reconcile')
  reconcile(@Req() req: Request, @Param('admissionId') admissionId: string) {
    return this.reconciliation.getAdmissionReconciliation(
      (req as RequestWithTenant).tenantId!,
      admissionId,
    );
  }
}
