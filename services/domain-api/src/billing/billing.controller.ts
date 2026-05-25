import { Body, Controller, Get, Headers, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import { BillingRuntimeService } from './billing-runtime.service';
import { BillingService } from './billing.service';

@ApiTags('billing')
@ApiSecurity('tenant')
@Controller('invoices')
export class BillingController {
  constructor(
    private readonly billing: BillingService,
    private readonly runtime: BillingRuntimeService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create invoice draft' })
  create(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body()
    body: {
      patientId: string;
      encounterId?: string;
      opdVisitId?: string;
      amountCents: number;
      lineItems?: { description: string; amountCents: number }[];
      currency?: string;
      gstRateBps?: number;
    },
  ) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.billing.createInvoice(tenantId, branchId ?? 'branch_main', body);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'List invoices for patient' })
  list(@Req() req: Request, @Param('patientId') patientId: string) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.billing.listForPatient(tenantId, patientId);
  }

  @Get(':id')
  get(@Req() req: Request, @Param('id') id: string) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.runtime.getInvoice(tenantId, id);
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
    const tenantId = (req as RequestWithTenant).tenantId!;
    return this.runtime.transition(tenantId, id, body);
  }
}
