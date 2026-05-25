import { Controller, Headers, Post } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { PlatformBillingService } from '../platform-billing/platform-billing.service';
import { ScaleReadinessService } from '../scale/scale-readiness.service';

/** Internal jobs — admin/service token via x-tenant-id. Env: DATABASE_URL */
@ApiTags('internal')
@Controller('internal')
export class InternalController {
  constructor(
    private readonly scale: ScaleReadinessService,
    private readonly billing: PlatformBillingService,
  ) {}

  @Post('scale/collect')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  collectMetrics(@Headers('x-tenant-id') tenantId: string) {
    return this.scale.collectSnapshot(tenantId ?? 'tenant_dev');
  }

  @Post('jobs/reconcile')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async reconcile(@Headers('x-tenant-id') tenantId: string) {
    const metrics = await this.scale.collectSnapshot(tenantId ?? 'tenant_dev');
    const usage = await this.billing.getUsage(tenantId ?? 'tenant_dev');
    return { metrics, usage, reconciledAt: new Date().toISOString() };
  }
}
