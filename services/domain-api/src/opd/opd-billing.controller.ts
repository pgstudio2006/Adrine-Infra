import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { OpdBillingService } from './opd-billing.service';

@ApiTags('opd-billing')
@Controller('opd')
@ApiHeader({ name: 'x-tenant-id', required: true })
export class OpdBillingController {
  constructor(private readonly opdBilling: OpdBillingService) {}

  @Get('visits/:id/billing')
  context(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.opdBilling.getBillingContext(tenantId ?? 'tenant_dev', id);
  }

  @Post('visits/:id/billing/exit')
  completeExit(
    @Headers('x-tenant-id') tenantId: string,
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
      skipPayment?: boolean;
    },
  ) {
    return this.opdBilling.completeBillingExit(tenantId ?? 'tenant_dev', id, body);
  }
}
