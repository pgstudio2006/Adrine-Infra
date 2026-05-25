import { Body, Controller, Get, Headers, Param, Post, Query, Req } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import { RadiologyRuntimeService } from './radiology-runtime.service';

@ApiTags('radiology')
@ApiSecurity('tenant')
@Controller('radiology')
export class RadiologyController {
  constructor(private readonly radiology: RadiologyRuntimeService) {}

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
      study: string;
      modality?: string;
      priority?: string;
      orderingDoctor: string;
      amountCents?: number;
      actorId?: string;
      actorRole?: string;
      syncBilling?: boolean;
    },
  ) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.radiology.createOrder(tenantId, branchId ?? 'branch_main', body);
  }

  @Get('branch/worklist')
  branchWorklist(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Query('take') take?: string,
  ) {
    return this.radiology.listBranchWorklist(
      (req as RequestWithTenant).tenantId!,
      branchId ?? 'branch_main',
      take ? parseInt(take, 10) : 100,
    );
  }

  @Get('orders/:id')
  get(@Req() req: Request, @Param('id') id: string) {
    return this.radiology.getOrder((req as RequestWithTenant).tenantId!, id);
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
    return this.radiology.transition((req as RequestWithTenant).tenantId!, id, body);
  }

  @Post('orders/:id/ui-status')
  uiStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body()
    body: {
      status: 'Ordered' | 'Scheduled' | 'In Progress' | 'Completed' | 'Reported';
      actorRole: string;
      actorId?: string;
      critical?: boolean;
    },
  ) {
    return this.radiology.applyUiStatus(
      (req as RequestWithTenant).tenantId!,
      id,
      body.status,
      body,
    );
  }

  @Get('opd/:visitId/live')
  live(@Req() req: Request, @Param('visitId') visitId: string) {
    return this.radiology.getLiveRadiologyState((req as RequestWithTenant).tenantId!, visitId);
  }

  @Get('opd/:visitId/orders')
  list(
    @Req() req: Request,
    @Param('visitId') visitId: string,
    @Query('take') take?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.radiology.listForOpdVisit(
      (req as RequestWithTenant).tenantId!,
      visitId,
      take ? parseInt(take, 10) : 50,
      cursor,
    );
  }
}
