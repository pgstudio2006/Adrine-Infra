import { Controller, Headers, Post } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { ReconciliationService } from '../orchestration/reconciliation.service';
import { PlatformNotificationService } from '../platform-notification/notification.service';

/** Admin reconciliation + dead-letter processing. Env: DATABASE_URL required */
@ApiTags('jobs')
@Controller()
export class JobsController {
  constructor(
    private readonly reconciliation: ReconciliationService,
    private readonly notifications: PlatformNotificationService,
  ) {}

  @Post('jobs/reconcile')
  @Post('internal/jobs/reconcile')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async reconcile(@Headers('x-tenant-id') tenantId: string) {
    const tenant = tenantId ?? 'tenant_dev';
    const [health, deadLetter, notificationRetry] = await Promise.all([
      this.reconciliation.getOrchestrationHealth(tenant),
      this.notifications.listOutbox(tenant, 'dead_letter'),
      this.notifications.processPending(),
    ]);
    return {
      orchestration: health,
      notificationDeadLetterCount: deadLetter.length,
      notificationRetry,
      reconciledAt: new Date().toISOString(),
    };
  }
}
