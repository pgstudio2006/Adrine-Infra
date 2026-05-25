import { Body, Controller, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { IdempotencyService } from '../common/idempotency.service';
import { TenantRateLimitGuard } from '../common/tenant-rate-limit.guard';
import { TenantProvisioningService } from './tenant-provisioning.service';

@ApiTags('provisioning')
@Controller('provisioning')
@UseGuards(TenantRateLimitGuard)
export class ProvisioningController {
  constructor(
    private readonly provisioning: TenantProvisioningService,
    private readonly idempotency: IdempotencyService,
  ) {}

  @Post('signup')
  signup(
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() body: { orgName: string; adminEmail: string; adminName?: string },
  ) {
    return this.idempotency.run('system', idempotencyKey, 'provisioning/signup', () =>
      this.provisioning.signup(body),
    );
  }

  @Post('onboarding/:sessionId/step')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  step(
    @Headers('x-tenant-id') tenantId: string,
    @Param('sessionId') sessionId: string,
    @Body() body: { stepKey: string; payload: Record<string, unknown> },
  ) {
    return this.provisioning.completeStep(
      tenantId ?? 'tenant_dev',
      sessionId,
      body.stepKey,
      body.payload ?? {},
    );
  }

  @Post('onboarding/:sessionId/complete')
  @Post('onboarding/:sessionId/activate')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  complete(@Headers('x-tenant-id') tenantId: string, @Param('sessionId') sessionId: string) {
    return this.provisioning.completeOnboarding(tenantId ?? 'tenant_dev', sessionId);
  }
}
