import { Body, Controller, Get, Headers, Param, Post, Query, Req } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import { OtRuntimeService } from './ot-runtime.service';

@ApiTags('ot')
@ApiSecurity('tenant')
@Controller('ot')
export class OtController {
  constructor(private readonly ot: OtRuntimeService) {}

  @Get('rooms')
  listRooms(@Req() req: Request, @Headers('x-branch-id') branchId: string | undefined) {
    return this.ot.listRooms((req as RequestWithTenant).tenantId!, branchId ?? 'branch_main');
  }

  @Post('rooms')
  upsertRoom(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body() body: { code: string; label: string; state?: string },
  ) {
    return this.ot.upsertRoom((req as RequestWithTenant).tenantId!, branchId ?? 'branch_main', body);
  }

  @Post('cases')
  createCase(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body()
    body: {
      patientId: string;
      ipdAdmissionId?: string;
      otRoomId?: string;
      procedureName: string;
      surgeonName?: string;
      priority?: string;
      scheduledAt?: string;
      externalRef?: string;
      amountCents?: number;
      actorId?: string;
      actorRole?: string;
      syncBilling?: boolean;
    },
  ) {
    return this.ot.createCase((req as RequestWithTenant).tenantId!, branchId ?? 'branch_main', body);
  }

  @Get('branch/worklist')
  worklist(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Query('take') take?: string,
  ) {
    return this.ot.listBranchWorklist(
      (req as RequestWithTenant).tenantId!,
      branchId ?? 'branch_main',
      take ? parseInt(take, 10) : 100,
    );
  }

  @Get('admission/:admissionId/cases')
  admissionCases(@Req() req: Request, @Param('admissionId') admissionId: string) {
    return this.ot.listForAdmission((req as RequestWithTenant).tenantId!, admissionId);
  }

  @Get('cases/:id')
  getCase(@Req() req: Request, @Param('id') id: string) {
    return this.ot.getCase((req as RequestWithTenant).tenantId!, id);
  }

  @Post('cases/:id/transition')
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
    return this.ot.transition((req as RequestWithTenant).tenantId!, id, body);
  }
}
