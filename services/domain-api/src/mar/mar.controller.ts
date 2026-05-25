import { Body, Controller, Get, Headers, Param, Post, Query, Req } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import { MarRuntimeService } from './mar-runtime.service';

@ApiTags('mar')
@ApiSecurity('tenant')
@Controller('mar')
export class MarController {
  constructor(private readonly mar: MarRuntimeService) {}

  @Post('schedules')
  create(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body()
    body: {
      admissionId: string;
      patientId: string;
      drug: string;
      dosage?: string;
      route?: string;
      frequency?: string;
      scheduledAt?: string;
      orderedBy?: string;
      nursingTaskId?: string;
      notes?: string;
      actorId?: string;
      actorRole?: string;
    },
  ) {
    return this.mar.createSchedule(
      (req as RequestWithTenant).tenantId!,
      branchId ?? 'branch_main',
      body,
    );
  }

  @Get('admission/:admissionId/schedules')
  listForAdmission(
    @Req() req: Request,
    @Param('admissionId') admissionId: string,
    @Query('syncNursing') syncNursing?: string,
  ) {
    return this.mar.listForAdmission(
      (req as RequestWithTenant).tenantId!,
      admissionId,
      syncNursing !== 'false',
    );
  }

  @Get('schedules/:id')
  get(@Req() req: Request, @Param('id') id: string) {
    return this.mar.getSchedule((req as RequestWithTenant).tenantId!, id);
  }

  @Get('admission/:admissionId/audit')
  auditForAdmission(@Req() req: Request, @Param('admissionId') admissionId: string) {
    return this.mar.listAuditForAdmission(
      (req as RequestWithTenant).tenantId!,
      admissionId,
    );
  }

  @Post('schedules/:id/transition')
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
    return this.mar.transition((req as RequestWithTenant).tenantId!, id, body);
  }
}
