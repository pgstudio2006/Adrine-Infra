import { Body, Controller, Get, Headers, Param, Post, Req } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import { DischargeRuntimeService } from './discharge-runtime.service';

@ApiTags('discharge')
@ApiSecurity('tenant')
@Controller('discharge')
export class DischargeController {
  constructor(private readonly discharge: DischargeRuntimeService) {}

  @Post('orchestrations')
  start(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body()
    body: {
      admissionId: string;
      patientId: string;
      actorRole: string;
      actorId?: string;
    },
  ) {
    return this.discharge.startForAdmission(
      (req as RequestWithTenant).tenantId!,
      branchId ?? 'branch_main',
      body,
    );
  }

  @Get('orchestrations/:id')
  get(@Req() req: Request, @Param('id') id: string) {
    return this.discharge.getDischarge((req as RequestWithTenant).tenantId!, id);
  }

  @Get('admissions/:admissionId')
  byAdmission(@Req() req: Request, @Param('admissionId') admissionId: string) {
    return this.discharge.getByAdmission((req as RequestWithTenant).tenantId!, admissionId);
  }

  @Get('orchestrations/:id/blockers')
  blockers(@Req() req: Request, @Param('id') id: string) {
    return this.discharge.getBlockers((req as RequestWithTenant).tenantId!, id);
  }

  @Post('orchestrations/:id/transition')
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
    return this.discharge.transition((req as RequestWithTenant).tenantId!, id, body);
  }
}
