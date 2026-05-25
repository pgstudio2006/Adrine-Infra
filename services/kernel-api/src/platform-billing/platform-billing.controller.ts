import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { PlatformBillingService } from './platform-billing.service';

/** Platform SaaS billing — env: DATABASE_URL */
@ApiTags('billing')
@Controller('billing')
export class PlatformBillingController {
  constructor(private readonly billing: PlatformBillingService) {}

  @Post('plans')
  @ApiHeader({ name: 'x-tenant-id', required: false })
  createPlan(
    @Body()
    body: {
      code: string;
      label: string;
      isMetered?: boolean;
      taxRateBps?: number;
      quotaLimits?: Record<string, number>;
    },
  ) {
    return this.billing.upsertPlan(body);
  }

  @Get('plans')
  listPlans() {
    return this.billing.listPlans();
  }

  @Get('subscription')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  subscription(@Headers('x-tenant-id') tenantId: string) {
    return this.billing.getSubscription(tenantId ?? 'tenant_dev');
  }

  @Post('subscription')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  subscribe(@Headers('x-tenant-id') tenantId: string, @Body() body: { planCode: string }) {
    return this.billing.subscribe(tenantId ?? 'tenant_dev', body.planCode);
  }

  @Post('usage/record')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  recordUsage(
    @Headers('x-tenant-id') tenantId: string,
    @Body()
    body: {
      dimension: string;
      quantity?: number;
      branchId?: string;
      resourceId?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.billing.recordUsage({
      tenantId: tenantId ?? 'tenant_dev',
      dimension: body.dimension,
      quantity: body.quantity,
      branchId: body.branchId,
      resourceId: body.resourceId,
      metadata: body.metadata,
    });
  }

  @Get('usage/summary')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  usageSummary(@Headers('x-tenant-id') tenantId: string) {
    return this.billing.getUsage(tenantId ?? 'tenant_dev');
  }

  @Get('invoices')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  invoices(@Headers('x-tenant-id') tenantId: string) {
    return this.billing.listInvoices(tenantId ?? 'tenant_dev');
  }

  @Post('invoices/generate')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  generateInvoice(@Headers('x-tenant-id') tenantId: string) {
    return this.billing.generateInvoice(tenantId ?? 'tenant_dev');
  }
}
