import { Injectable } from '@nestjs/common';
import {
  evaluateEscalationRules,
  type OperationalSnapshot,
  type OperationalSnapshotCounts,
} from '@adrine/hospital-operations';
import { PrismaService } from '../prisma/prisma.service';
import { OperationalEscalationService } from '../escalation/operational-escalation.service';
import { OperationalHealthService } from '../orchestration/operational-health.service';

const ACTIVE_OPD = ['registered', 'checked_in', 'routed', 'queued', 'in_consultation', 'post_consult'];
const ACTIVE_IPD = ['admission_requested', 'bed_assignment_pending', 'admitted', 'active_care', 'discharge_pending'];
const PENDING_DISCHARGE = ['initiated', 'clinical_pending', 'billing_pending', 'pharmacy_pending', 'nursing_pending', 'insurance_pending', 'ready'];
const PENDING_INSURANCE = ['initiated', 'submitted', 'under_review', 'documents_pending'];

@Injectable()
export class OperationalCommandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly escalations: OperationalEscalationService,
    private readonly health: OperationalHealthService,
  ) {}

  async buildSnapshot(
    tenantId: string,
    branchId: string,
    lite = false,
  ): Promise<OperationalSnapshot> {
    const branchFilter = { tenantId, branchId };
    const now = new Date();

    const labBlocking = [
      'ordered',
      'awaiting_collection',
      'collected',
      'in_processing',
      'awaiting_review',
      'critical_review',
      'approved',
      'published',
    ];
    const radiologyBlocking = [
      'ordered',
      'scheduled',
      'imaging_in_progress',
      'awaiting_review',
      'critical_review',
      'approved',
      'published',
    ];
    const pharmacyBlocking = [
      'prescribed',
      'verified',
      'inventory_reserved',
      'dispense_preparing',
    ];

    const [
      opdActiveVisits,
      opdWaitingQueue,
      ipdActiveAdmissions,
      bedsOccupied,
      bedsAvailable,
      labPending,
      labCriticalUnacked,
      radiologyPending,
      pharmacyPending,
      nursingOpenTasks,
      nursingMissed,
      dischargeInProgress,
      insurancePending,
      openEscalations,
      billingDraftInvoices,
      healthSummary,
    ] = await Promise.all([
      this.prisma.opdVisit.count({ where: { ...branchFilter, state: { in: ACTIVE_OPD } } }),
      this.prisma.opdVisit.count({ where: { ...branchFilter, state: 'queued' } }),
      this.prisma.ipdAdmission.count({ where: { ...branchFilter, state: { in: ACTIVE_IPD } } }),
      this.prisma.bed.count({ where: { ...branchFilter, state: 'occupied' } }),
      this.prisma.bed.count({ where: { ...branchFilter, state: 'available' } }),
      this.prisma.labDiagnosticOrder.count({ where: { ...branchFilter, state: { in: labBlocking } } }),
      this.prisma.labDiagnosticOrder.count({
        where: { ...branchFilter, isCritical: true, criticalAckAt: null },
      }),
      this.prisma.radiologyStudyOrder.count({ where: { ...branchFilter, state: { in: radiologyBlocking } } }),
      this.prisma.pharmacyFulfillment.count({ where: { ...branchFilter, state: { in: pharmacyBlocking } } }),
      this.prisma.nursingTask.count({
        where: { ...branchFilter, state: { in: ['scheduled', 'acknowledged', 'in_progress'] } },
      }),
      this.prisma.nursingTask.count({ where: { ...branchFilter, state: 'missed' } }),
      this.prisma.dischargeOrchestration.count({ where: { ...branchFilter, state: { in: PENDING_DISCHARGE } } }),
      this.prisma.insuranceAuthorization.count({ where: { ...branchFilter, state: { in: PENDING_INSURANCE } } }),
      this.prisma.operationalEscalation.count({ where: { ...branchFilter, state: 'open' } }),
      this.prisma.invoice.count({
        where: { ...branchFilter, status: { in: ['draft', 'pending_approval', 'issued', 'partial'] } },
      }),
      lite
        ? Promise.resolve({ status: 'healthy' as const, blockers: [], warnings: [] })
        : this.health.getHealthSummary(tenantId, branchId),
    ]);

    const counts: OperationalSnapshotCounts = {
      opdActiveVisits,
      opdWaitingQueue,
      ipdActiveAdmissions,
      bedsOccupied,
      bedsAvailable,
      labPending,
      labCriticalUnacked,
      radiologyPending,
      pharmacyPending,
      nursingOpenTasks,
      nursingMissed,
      dischargeInProgress,
      insurancePending,
      openEscalations,
      billingDraftInvoices,
    };

    await this.escalations.evaluateAndPersist(tenantId, branchId, counts);

    const openRows = await this.prisma.operationalEscalation.findMany({
      where: { ...branchFilter, state: { in: ['open', 'acknowledged'] } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const ruleHits = evaluateEscalationRules({ counts, branchId, now });
    const blockers = [
      ...healthSummary.blockers,
      ...ruleHits.map((h) => ({
        id: `rule-${h.type}`,
        domain: h.sourceRuntime,
        severity: h.severity === 'critical' ? ('critical' as const) : h.severity === 'high' ? ('warning' as const) : ('info' as const),
        message: h.message,
        resourceId: h.resourceId,
      })),
    ];

    const healthStatus =
      blockers.some((b) => b.severity === 'critical') || labCriticalUnacked > 0
        ? 'critical'
        : healthSummary.status === 'degraded' || blockers.length > 0
          ? 'degraded'
          : 'healthy';

    return {
      branchId,
      tenantId,
      generatedAt: now.toISOString(),
      counts: {
        ...counts,
        openEscalations: openRows.filter((r) => r.state === 'open').length,
      },
      blockers,
      escalations: openRows.map((e) => ({
        id: e.id,
        type: e.type,
        severity: e.severity,
        state: e.state,
        sourceRuntime: e.sourceRuntime,
        resourceId: e.resourceId ?? undefined,
        message: e.message,
        createdAt: e.createdAt.toISOString(),
      })),
      healthStatus,
      reconciliationWarnings: healthSummary.warnings,
    };
  }
}
