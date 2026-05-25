import { Body, Controller, Get, Headers, Param, Post, Req } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import { NursingRuntimeService } from './nursing-runtime.service';

@ApiTags('nursing')
@ApiSecurity('tenant')
@Controller('nursing/tasks')
export class NursingController {
  constructor(private readonly nursing: NursingRuntimeService) {}

  @Post()
  create(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body()
    body: {
      admissionId: string;
      patientId: string;
      taskType: string;
      description: string;
      assignedTo?: string;
      priority?: string;
      dueAt?: string;
      actorId?: string;
      actorRole?: string;
    },
  ) {
    return this.nursing.createTask(
      (req as RequestWithTenant).tenantId!,
      branchId ?? 'branch_main',
      body,
    );
  }

  @Get('admission/:admissionId')
  listForAdmission(@Req() req: Request, @Param('admissionId') admissionId: string) {
    return this.nursing.listForAdmission((req as RequestWithTenant).tenantId!, admissionId);
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
      expectedVersion?: number;
    },
  ) {
    return this.nursing.transition((req as RequestWithTenant).tenantId!, id, body);
  }
}
