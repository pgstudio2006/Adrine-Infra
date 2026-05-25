import { Injectable, NotFoundException } from '@nestjs/common';
import {
  evaluateEscalationRules,
  HospitalPlatformEvents,
  type OperationalSnapshotCounts,
} from '@adrine/hospital-operations';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformEventService } from '../events/platform-event.service';
import { PlatformNotificationService } from '../platform-notification/notification.service';

@Injectable()
export class OperationalEscalationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformEvents: PlatformEventService,
    private readonly notifications: PlatformNotificationService,
  ) {}

  async evaluateAndPersist(tenantId: string, branchId: string, counts: OperationalSnapshotCounts) {
    const hits = evaluateEscalationRules({ counts, branchId, now: new Date() });
    for (const hit of hits) {
      const existing = await this.prisma.operationalEscalation.findFirst({
        where: {
          tenantId,
          branchId,
          type: hit.type,
          state: { in: ['open', 'acknowledged'] },
        },
      });
      if (existing) continue;

      const row = await this.prisma.operationalEscalation.create({
        data: {
          tenantId,
          branchId,
          type: hit.type,
          severity: hit.severity,
          sourceRuntime: hit.sourceRuntime,
          resourceId: hit.resourceId,
          message: hit.message,
          state: 'open',
        },
      });

      await this.platformEvents.record({
        tenantId,
        branchId,
        eventName: HospitalPlatformEvents.escalation.created,
        resourceType: 'escalation',
        resourceId: row.id,
        payload: { type: hit.type, severity: hit.severity },
      });

      if (hit.severity === 'critical') {
        await this.notifications.enqueueFromEvent(tenantId, {
          channel: 'sms',
          recipient: 'ops-oncall@tenant.local',
          templateCode: 'escalation_critical',
          eventName: HospitalPlatformEvents.escalation.created,
          payload: { escalationId: row.id, message: hit.message },
        }).catch(() => undefined);
      }
    }
  }

  async evaluate(tenantId: string, branchId: string, counts: OperationalSnapshotCounts) {
    await this.evaluateAndPersist(tenantId, branchId, counts);
    return this.listOpen(tenantId, branchId);
  }

  async evaluateFromBranch(tenantId: string, branchId: string) {
    const branchFilter = { tenantId, branchId };
    const counts: OperationalSnapshotCounts = {
      opdActiveVisits: await this.prisma.opdVisit.count({ where: { ...branchFilter, state: { notIn: ['completed', 'cancelled'] } } }),
      opdWaitingQueue: await this.prisma.opdVisit.count({ where: { ...branchFilter, state: 'queued' } }),
      ipdActiveAdmissions: await this.prisma.ipdAdmission.count({ where: { ...branchFilter, state: { notIn: ['discharged', 'cancelled'] } } }),
      bedsOccupied: await this.prisma.bed.count({ where: { ...branchFilter, state: 'occupied' } }),
      bedsAvailable: await this.prisma.bed.count({ where: { ...branchFilter, state: 'available' } }),
      labPending: await this.prisma.labDiagnosticOrder.count({ where: { ...branchFilter, state: { notIn: ['completed', 'cancelled'] } } }),
      labCriticalUnacked: await this.prisma.labDiagnosticOrder.count({ where: { ...branchFilter, isCritical: true, criticalAckAt: null } }),
      pharmacyPending: await this.prisma.pharmacyFulfillment.count({ where: { ...branchFilter, state: { notIn: ['dispense_completed', 'cancelled'] } } }),
      nursingOpenTasks: await this.prisma.nursingTask.count({ where: { ...branchFilter, state: { in: ['scheduled', 'acknowledged', 'in_progress'] } } }),
      nursingMissed: await this.prisma.nursingTask.count({ where: { ...branchFilter, state: 'missed' } }),
      dischargeInProgress: await this.prisma.dischargeOrchestration.count({ where: { ...branchFilter, state: { notIn: ['discharged', 'cancelled'] } } }),
      insurancePending: await this.prisma.insuranceAuthorization.count({ where: { ...branchFilter, state: { notIn: ['approved', 'settled', 'rejected', 'withdrawn'] } } }),
      openEscalations: await this.prisma.operationalEscalation.count({ where: { ...branchFilter, state: 'open' } }),
      billingDraftInvoices: await this.prisma.invoice.count({ where: { ...branchFilter, status: { in: ['draft', 'partial'] } } }),
    };
    return this.evaluate(tenantId, branchId, counts);
  }

  listOpen(tenantId: string, branchId: string) {
    return this.prisma.operationalEscalation.findMany({
      where: { tenantId, branchId, state: { in: ['open', 'acknowledged'] } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async acknowledge(tenantId: string, id: string, _actorId?: string) {
    const row = await this.prisma.operationalEscalation.findFirst({ where: { id, tenantId } });
    if (!row) throw new NotFoundException('Escalation not found');
    return this.prisma.operationalEscalation.update({
      where: { id },
      data: { state: 'acknowledged', acknowledgedAt: new Date() },
    });
  }

  async resolve(tenantId: string, id: string, actorId?: string) {
    const row = await this.prisma.operationalEscalation.findFirst({ where: { id, tenantId } });
    if (!row) throw new NotFoundException('Escalation not found');
    const updated = await this.prisma.operationalEscalation.update({
      where: { id },
      data: { state: 'resolved', resolvedAt: new Date() },
    });
    await this.platformEvents.record({
      tenantId,
      branchId: row.branchId,
      eventName: HospitalPlatformEvents.escalation.resolved,
      actorId,
      resourceType: 'escalation',
      resourceId: id,
      payload: { type: row.type },
    });
    return updated;
  }
}
