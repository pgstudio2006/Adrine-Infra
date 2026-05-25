import { Body, Controller, Get, Headers, Param, Post, Req } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import { AdmissionBillingService } from './admission-billing.service';
import { AdmissionRuntimeService } from './admission-runtime.service';

@ApiTags('ipd')
@ApiSecurity('tenant')
@Controller('ipd/admissions')
export class AdmissionController {
  constructor(
    private readonly admissions: AdmissionRuntimeService,
    private readonly admissionBilling: AdmissionBillingService,
  ) {}

  @Post()
  create(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body()
    body: {
      patientId: string;
      opdVisitId?: string;
      encounterId?: string;
      ward?: string;
      attendingDoctor?: string;
      admissionSource?: string;
      primaryDiagnosis?: string;
      insuranceMode?: string;
      externalRef?: string;
      actorId?: string;
      actorRole?: string;
    },
  ) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.admissions.createAdmission(tenantId, branchId ?? 'branch_main', body);
  }

  @Get('patient/:patientId/active')
  active(@Req() req: Request, @Param('patientId') patientId: string) {
    return this.admissions.getActiveForPatient((req as RequestWithTenant).tenantId!, patientId);
  }

  @Get('branch/active')
  listActive(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
  ) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.admissions.listActiveAdmissions(tenantId, branchId ?? 'branch_main');
  }

  @Get(':id/blockers')
  blockers(@Req() req: Request, @Param('id') id: string) {
    return this.admissions.getAdmissionBlockers((req as RequestWithTenant).tenantId!, id);
  }

  @Get(':id')
  get(@Req() req: Request, @Param('id') id: string) {
    return this.admissions.getAdmission((req as RequestWithTenant).tenantId!, id);
  }

  @Post(':id/assign-bed')
  assignBed(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { bedId: string; actorRole: string; actorId?: string },
  ) {
    return this.admissions.assignBed((req as RequestWithTenant).tenantId!, id, body);
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
    return this.admissions.transition((req as RequestWithTenant).tenantId!, id, body);
  }

  @Get(':id/allowed-actions')
  allowed(
    @Req() req: Request,
    @Param('id') id: string,
    @Headers('x-actor-role') actorRole: string | undefined,
  ) {
    return this.admissions.listAllowedActions(
      (req as RequestWithTenant).tenantId!,
      id,
      actorRole ?? 'receptionist',
    );
  }

  @Post(':id/billing/exit')
  billingExit(
    @Req() req: Request,
    @Param('id') id: string,
    @Body()
    body: {
      actorRole: string;
      actorId?: string;
      lineItems: { description: string; amountCents: number }[];
      paymentAmountCents: number;
      paymentMethod: string;
      reference?: string;
      corporatePayer?: boolean;
      insuranceMode?: string;
      branchOverrides?: Record<string, boolean>;
      skipPayment?: boolean;
    },
  ) {
    return this.admissionBilling.completeBillingExit(
      (req as RequestWithTenant).tenantId!,
      id,
      body,
    );
  }
}
