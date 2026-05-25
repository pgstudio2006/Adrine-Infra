import { Body, Controller, Get, Headers, Param, Post, Req } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import { InsuranceRuntimeService } from './insurance-runtime.service';

@ApiTags('insurance')
@ApiSecurity('tenant')
@Controller('insurance/authorizations')
export class InsuranceController {
  constructor(private readonly insurance: InsuranceRuntimeService) {}

  @Post()
  start(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body()
    body: {
      admissionId: string;
      patientId: string;
      payerName?: string;
      policyNumber?: string;
      actorRole?: string;
      actorId?: string;
    },
  ) {
    return this.insurance.startForAdmission(
      (req as RequestWithTenant).tenantId!,
      branchId ?? 'branch_main',
      body,
    );
  }

  @Get()
  list(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Headers('x-tenant-id') _tenantHeader: string | undefined,
  ) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.insurance.listForBranch(tenantId, branchId ?? 'branch_main');
  }

  @Get('admission/:admissionId')
  byAdmission(@Req() req: Request, @Param('admissionId') admissionId: string) {
    return this.insurance.getByAdmission((req as RequestWithTenant).tenantId!, admissionId);
  }

  @Post(':id/transition')
  transition(
    @Req() req: Request,
    @Param('id') id: string,
    @Body()
    body: {
      action: string;
      actorRole: string;
      actorId?: string;
      reason?: string;
      context?: Record<string, unknown>;
      payload?: Record<string, unknown>;
      expectedVersion?: number;
    },
  ) {
    return this.insurance.transition((req as RequestWithTenant).tenantId!, id, body);
  }
}
