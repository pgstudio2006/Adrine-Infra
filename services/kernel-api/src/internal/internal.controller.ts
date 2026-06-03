import { Controller, ForbiddenException, Headers, Post } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { PlatformBillingService } from '../platform-billing/platform-billing.service';
import { ScaleReadinessService } from '../scale/scale-readiness.service';
import { runNavayuProvisionScript } from './navayu-provision.runner';

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

  /** One-shot Navayu seed (runs pnpm provision:navayu in-container). Requires x-provision-secret. */
  @Post('provision-navayu')
  @ApiHeader({ name: 'x-provision-secret', required: true })
  async provisionNavayu(@Headers('x-provision-secret') secret: string) {
    const expected =
      process.env.NAVAYU_PROVISION_SECRET?.trim() || process.env.JWT_SECRET?.trim();
    if (!expected || secret !== expected) {
      throw new ForbiddenException('Invalid provision secret');
    }
    const { stdout, stderr } = await runNavayuProvisionScript();
    return { ok: true, stdout, stderr };
  }
}
