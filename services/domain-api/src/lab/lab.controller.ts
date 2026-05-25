import { Body, Controller, Get, Headers, Param, Post, Query, Req } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import { LabRuntimeService } from './lab-runtime.service';

@ApiTags('lab')
@ApiSecurity('tenant')
@Controller('lab')
export class LabController {
  constructor(private readonly lab: LabRuntimeService) {}

  @Post('orders')
  create(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body()
    body: {
      patientId: string;
      encounterId?: string;
      opdVisitId?: string;
      externalRef?: string;
      tests: string;
      category?: string;
      priority?: string;
      orderingDoctor: string;
      amountCents?: number;
      actorId?: string;
      actorRole?: string;
      syncBilling?: boolean;
    },
  ) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.lab.createOrder(tenantId, branchId ?? 'branch_main', body);
  }

  @Get('patient/:patientId/orders')
  patientOrders(
    @Req() req: Request,
    @Param('patientId') patientId: string,
    @Query('take') take?: string,
  ) {
    return this.lab.listForPatient(
      (req as RequestWithTenant).tenantId!,
      patientId,
      take ? parseInt(take, 10) : 50,
    );
  }

  @Get('branch/worklist')
  branchWorklist(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Query('take') take?: string,
  ) {
    return this.lab.listBranchWorklist(
      (req as RequestWithTenant).tenantId!,
      branchId ?? 'branch_main',
      take ? parseInt(take, 10) : 100,
    );
  }

  @Get('orders/:id')
  get(@Req() req: Request, @Param('id') id: string) {
    return this.lab.getOrder((req as RequestWithTenant).tenantId!, id);
  }

  @Post('orders/:id/transition')
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
    return this.lab.transition((req as RequestWithTenant).tenantId!, id, body);
  }

  @Post('orders/:id/ui-stage')
  uiStage(
    @Req() req: Request,
    @Param('id') id: string,
    @Body()
    body: {
      stage: 'Pending Analysis' | 'In Analysis' | 'Awaiting Validation' | 'Validated' | 'Reported';
      actorRole: string;
      actorId?: string;
      critical?: boolean;
    },
  ) {
    return this.lab.applyUiStage((req as RequestWithTenant).tenantId!, id, body.stage, body);
  }

  @Get('orders')
  list(
    @Req() req: Request,
    @Query('opdVisitId') opdVisitId: string,
    @Query('take') take?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.lab.listForOpdVisit(
      (req as RequestWithTenant).tenantId!,
      opdVisitId,
      take ? parseInt(take, 10) : 50,
      cursor,
    );
  }

  @Get('opd/:visitId/live')
  live(@Req() req: Request, @Param('visitId') visitId: string) {
    return this.lab.getLiveLabState((req as RequestWithTenant).tenantId!, visitId);
  }

  @Get('opd/:visitId/blockers')
  blockers(@Req() req: Request, @Param('visitId') visitId: string) {
    return this.lab.getOpdLabBlockers(
      (req as RequestWithTenant).tenantId!,
      visitId,
      'orders_pending',
    );
  }
}
