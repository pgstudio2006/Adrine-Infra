import { Controller, Get, Headers } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { BillingService } from './billing.service';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('subscription')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  subscription(@Headers('x-tenant-id') tenantId: string) {
    return this.billing.getSubscription(tenantId ?? 'tenant_dev');
  }
}
