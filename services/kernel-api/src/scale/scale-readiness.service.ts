import { Injectable } from '@nestjs/common';
import type { PlatformScaleHealth, TenantScaleMetrics } from '@adrine/hospital-operations';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScaleReadinessService {
  constructor(private readonly prisma: PrismaService) {}

  async tenantMetrics(tenantId: string): Promise<TenantScaleMetrics> {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [eventsLastHour, outboxPending] = await Promise.all([
      this.prisma.platformEventOutbox.count({
        where: { tenantId, createdAt: { gte: hourAgo } },
      }),
      this.prisma.platformEventOutbox.count({
        where: { tenantId, status: 'pending' },
      }),
    ]);

    return {
      tenantId,
      visitCount: 0,
      admissionCount: 0,
      eventsLastHour,
      outboxPending,
      notificationPending: 0,
      checkedAt: new Date().toISOString(),
    };
  }

  async collectSnapshot(tenantId: string) {
    const metrics = await this.tenantMetrics(tenantId);
    return { snapshotId: `snap_${Date.now()}`, metrics };
  }

  async health(): Promise<PlatformScaleHealth> {
    const [outboxDepth, notificationOutboxDepth] = await Promise.all([
      this.prisma.platformEventOutbox.count({
        where: { status: 'pending' },
      }),
      this.prisma.platformEventOutbox.count({
        where: {
          status: 'pending',
          eventName: { contains: 'notifications' },
        },
      }),
    ]);
    const depth = outboxDepth + notificationOutboxDepth;
    return {
      status: depth > 1000 ? 'degraded' : 'healthy',
      outboxDepth,
      notificationOutboxDepth,
      rlsEnabled: process.env.DATABASE_RLS_ENABLED === 'true',
      checkedAt: new Date().toISOString(),
    };
  }

  /** Tenant isolation audit helper — all tenant-scoped queries must include tenantId. */
  auditTenantFilter(_model: string, where: Record<string, unknown>): boolean {
    return typeof where.tenantId === 'string' && where.tenantId.length > 0;
  }
}
