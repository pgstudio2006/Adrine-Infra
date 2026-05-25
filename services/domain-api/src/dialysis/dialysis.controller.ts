import { Body, Controller, Get, Headers, Param, Post, Query, Req } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import { DialysisRuntimeService } from './dialysis-runtime.service';

@ApiTags('dialysis')
@ApiSecurity('tenant')
@Controller('dialysis')
export class DialysisController {
  constructor(private readonly dialysis: DialysisRuntimeService) {}

  @Get('machines')
  machines(@Req() req: Request, @Headers('x-branch-id') branchId: string | undefined) {
    return this.dialysis.listMachines((req as RequestWithTenant).tenantId!, branchId ?? 'branch_main');
  }

  @Post('machines')
  upsertMachine(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body() body: { code: string; model?: string; state?: string },
  ) {
    return this.dialysis.upsertMachine(
      (req as RequestWithTenant).tenantId!,
      branchId ?? 'branch_main',
      body,
    );
  }

  @Post('sessions')
  createSession(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body()
    body: {
      patientId: string;
      ipdAdmissionId?: string;
      machineId?: string;
      scheduledAt?: string;
      packageCode?: string;
      externalRef?: string;
      amountCents?: number;
      actorId?: string;
      actorRole?: string;
      syncBilling?: boolean;
    },
  ) {
    return this.dialysis.createSession(
      (req as RequestWithTenant).tenantId!,
      branchId ?? 'branch_main',
      body,
    );
  }

  @Get('branch/worklist')
  worklist(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Query('take') take?: string,
  ) {
    return this.dialysis.listBranchWorklist(
      (req as RequestWithTenant).tenantId!,
      branchId ?? 'branch_main',
      take ? parseInt(take, 10) : 100,
    );
  }

  @Get('admission/:admissionId/sessions')
  admissionSessions(@Req() req: Request, @Param('admissionId') admissionId: string) {
    return this.dialysis.listForAdmission((req as RequestWithTenant).tenantId!, admissionId);
  }

  @Get('sessions/:id')
  getSession(@Req() req: Request, @Param('id') id: string) {
    return this.dialysis.getSession((req as RequestWithTenant).tenantId!, id);
  }

  @Post('sessions/:id/transition')
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
      expectedVersion?: number;
    },
  ) {
    return this.dialysis.transition((req as RequestWithTenant).tenantId!, id, body);
  }
}
