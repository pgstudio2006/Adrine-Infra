import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Period = '24h' | '7d';

@Injectable()
export class OperationalAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private periodStart(period: Period): Date {
    const ms = period === '24h' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    return new Date(Date.now() - ms);
  }

  async getOperational(tenantId: string, branchId: string, period: Period = '24h') {
    const since = this.periodStart(period);
    const branchFilter = { tenantId, branchId };

    const [
      opdVisitsCreated,
      opdQueuedNow,
      admissionsCreated,
      dischargesCompleted,
      labPending,
      pharmacyPending,
      nursingMissed,
      insuranceTurnaround,
      eventCounts,
    ] = await Promise.all([
      this.prisma.opdVisit.count({ where: { ...branchFilter, createdAt: { gte: since } } }),
      this.prisma.opdVisit.count({ where: { ...branchFilter, state: 'queued' } }),
      this.prisma.ipdAdmission.count({ where: { ...branchFilter, createdAt: { gte: since } } }),
      this.prisma.ipdAdmission.count({
        where: { ...branchFilter, dischargedAt: { gte: since } },
      }),
      this.prisma.labDiagnosticOrder.count({
        where: { ...branchFilter, state: { notIn: ['completed', 'cancelled'] } },
      }),
      this.prisma.pharmacyFulfillment.count({
        where: { ...branchFilter, state: { notIn: ['dispense_completed', 'cancelled'] } },
      }),
      this.prisma.nursingTask.count({
        where: { ...branchFilter, state: 'missed', updatedAt: { gte: since } },
      }),
      this.prisma.insuranceAuthorization.findMany({
        where: { ...branchFilter, updatedAt: { gte: since }, state: { in: ['approved', 'settled'] } },
        select: { createdAt: true, updatedAt: true },
        take: 100,
      }),
      this.prisma.platformEvent.groupBy({
        by: ['eventName'],
        where: { tenantId, branchId, createdAt: { gte: since } },
        _count: true,
      }),
    ]);

    const insuranceAvgHours =
      insuranceTurnaround.length > 0
        ? insuranceTurnaround.reduce((sum, r) => sum + (r.updatedAt.getTime() - r.createdAt.getTime()), 0) /
          insuranceTurnaround.length /
          (1000 * 60 * 60)
        : null;

    return {
      branchId,
      period,
      since: since.toISOString(),
      generatedAt: new Date().toISOString(),
      metrics: {
        opdVisitsCreated,
        opdWaitProxy: opdQueuedNow,
        admissionsCreated,
        dischargeTurnaround: dischargesCompleted,
        labPending,
        pharmacyPending,
        nursingMissed,
        insuranceAvgTurnaroundHours: insuranceAvgHours,
      },
      platformEventCounts: Object.fromEntries(eventCounts.map((e) => [e.eventName, e._count])),
    };
  }

  async listPlatformEvents(
    tenantId: string,
    branchId: string,
    period: Period = '24h',
    limit = 200,
  ) {
    const since = this.periodStart(period);
    const rows = await this.prisma.platformEvent.findMany({
      where: { tenantId, branchId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 500),
      select: {
        id: true,
        eventName: true,
        createdAt: true,
        resourceType: true,
        resourceId: true,
        payload: true,
      },
    });

    return {
      branchId,
      period,
      since: since.toISOString(),
      events: rows.map((row) => ({
        id: row.id,
        eventName: row.eventName,
        timestamp: row.createdAt.toISOString(),
        resourceType: row.resourceType ?? undefined,
        resourceId: row.resourceId ?? undefined,
        payload: row.payload,
      })),
    };
  }
}
