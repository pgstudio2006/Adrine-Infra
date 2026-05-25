import { Body, Controller, Get, Headers, Param, Post, Req } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import { BillingSyncService } from './billing-sync.service';

@ApiTags('billing-sync')
@ApiSecurity('tenant')
@Controller('billing/sync')
export class BillingSyncController {
  constructor(private readonly sync: BillingSyncService) {}

  @Post('ensure-draft')
  @ApiOperation({ summary: 'Ensure live OPD invoice draft exists' })
  ensureDraft(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body()
    body: {
      opdVisitId: string;
      patientId: string;
      encounterId?: string;
      corporatePayer?: boolean;
      insuranceMode?: string;
      actorId?: string;
      actorRole?: string;
    },
  ) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.sync.ensureOpdDraft(tenantId, {
      ...body,
      branchId: branchId ?? 'branch_main',
    });
  }

  @Post('charge')
  @ApiOperation({ summary: 'Sync operational charge to live invoice (idempotent)' })
  syncCharge(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body()
    body: {
      opdVisitId: string;
      patientId: string;
      encounterId?: string;
      idempotencyKey: string;
      description: string;
      amountCents: number;
      chargeCode?: string;
      sourceModule: string;
      sourceAction: string;
      sourceRefId?: string;
      actorId?: string;
      actorRole?: string;
      expectedVersion?: number;
      corporatePayer?: boolean;
      insuranceMode?: string;
    },
  ) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.sync.syncCharge(tenantId, {
      ...body,
      branchId: branchId ?? 'branch_main',
    });
  }

  @Post('charge/reverse')
  reverse(
    @Req() req: Request,
    @Body()
    body: {
      idempotencyKey: string;
      reason?: string;
      actorId?: string;
      actorRole?: string;
      expectedVersion?: number;
    },
  ) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.sync.reverseCharge(tenantId, body);
  }

  @Get('opd/:visitId/live')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  live(@Req() req: Request, @Param('visitId') visitId: string) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.sync.getLiveFinancialState(tenantId, visitId);
  }

  @Post('ipd/ensure-draft')
  @ApiOperation({ summary: 'Ensure live IPD invoice draft exists' })
  ensureIpdDraft(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body()
    body: {
      admissionId: string;
      patientId: string;
      encounterId?: string;
      corporatePayer?: boolean;
      insuranceMode?: string;
      actorId?: string;
      actorRole?: string;
    },
  ) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.sync.ensureIpdDraft(tenantId, {
      ...body,
      branchId: branchId ?? 'branch_main',
    });
  }

  @Post('ipd/charge')
  @ApiOperation({ summary: 'Sync IPD operational charge to live invoice (idempotent)' })
  syncIpdCharge(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body()
    body: {
      admissionId: string;
      patientId: string;
      encounterId?: string;
      idempotencyKey: string;
      description: string;
      amountCents: number;
      chargeCode?: string;
      sourceModule: string;
      sourceAction: string;
      sourceRefId?: string;
      actorId?: string;
      actorRole?: string;
      expectedVersion?: number;
      corporatePayer?: boolean;
      insuranceMode?: string;
    },
  ) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.sync.syncIpdCharge(tenantId, {
      ...body,
      branchId: branchId ?? 'branch_main',
    });
  }

  @Get('ipd/:admissionId/live')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  ipdLive(@Req() req: Request, @Param('admissionId') admissionId: string) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.sync.getLiveIpdFinancialState(tenantId, admissionId);
  }
}
