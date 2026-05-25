import { Body, Controller, Get, Headers, Param, Post, Query, Req } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import type { MedicationLine } from './pharmacy-runtime.service';
import { PharmacyRuntimeService } from './pharmacy-runtime.service';

@ApiTags('pharmacy')
@ApiSecurity('tenant')
@Controller('pharmacy')
export class PharmacyController {
  constructor(private readonly pharmacy: PharmacyRuntimeService) {}

  @Post('fulfillments')
  create(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body()
    body: {
      patientId: string;
      encounterId?: string;
      opdVisitId?: string;
      externalRef?: string;
      prescribingDoctor: string;
      department?: string;
      priority?: string;
      medications: MedicationLine[];
      actorId?: string;
      actorRole?: string;
    },
  ) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.pharmacy.createPrescription(tenantId, branchId ?? 'branch_main', body);
  }

  @Get('patient/:patientId/fulfillments')
  patientFulfillments(
    @Req() req: Request,
    @Param('patientId') patientId: string,
    @Query('take') take?: string,
  ) {
    return this.pharmacy.listForPatient(
      (req as RequestWithTenant).tenantId!,
      patientId,
      take ? parseInt(take, 10) : 50,
    );
  }

  @Get('branch/stock')
  branchStock(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Query('take') take?: string,
  ) {
    return this.pharmacy.listBranchStock(
      (req as RequestWithTenant).tenantId!,
      branchId ?? 'branch_main',
      take ? parseInt(take, 10) : 200,
    );
  }

  @Get('branch/worklist')
  branchWorklist(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Query('take') take?: string,
  ) {
    return this.pharmacy.listBranchWorklist(
      (req as RequestWithTenant).tenantId!,
      branchId ?? 'branch_main',
      take ? parseInt(take, 10) : 100,
    );
  }

  @Get('fulfillments/:id')
  get(@Req() req: Request, @Param('id') id: string) {
    return this.pharmacy.getFulfillment((req as RequestWithTenant).tenantId!, id);
  }

  @Post('fulfillments/:id/transition')
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
    return this.pharmacy.transition((req as RequestWithTenant).tenantId!, id, body);
  }

  @Post('fulfillments/:id/ui-status')
  uiStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body()
    body: {
      status: 'Pending' | 'Verified' | 'Dispensed' | 'Partially dispensed' | 'Cancelled';
      actorRole: string;
      actorId?: string;
      quantities?: Record<number, number>;
    },
  ) {
    return this.pharmacy.applyUiRxStatus(
      (req as RequestWithTenant).tenantId!,
      id,
      body.status,
      body,
    );
  }

  @Post('fulfillments/:id/dispense')
  dispense(
    @Req() req: Request,
    @Param('id') id: string,
    @Body()
    body: {
      quantities: Record<number, number>;
      actorRole: string;
      actorId?: string;
    },
  ) {
    return this.pharmacy.dispense((req as RequestWithTenant).tenantId!, id, body);
  }

  @Get('opd/:visitId/live')
  live(@Req() req: Request, @Param('visitId') visitId: string) {
    return this.pharmacy.getLivePharmacyState((req as RequestWithTenant).tenantId!, visitId);
  }

  @Get('opd/:visitId/blockers')
  blockers(@Req() req: Request, @Param('visitId') visitId: string) {
    return this.pharmacy.getOpdPharmacyBlockers(
      (req as RequestWithTenant).tenantId!,
      visitId,
      'orders_pending',
    );
  }
}
