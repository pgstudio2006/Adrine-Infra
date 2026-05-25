import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReconciliationService } from './reconciliation.service';

const STUCK_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class OperationalHealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reconciliation: ReconciliationService,
  ) {}

  async getHealthSummary(tenantId: string, branchId?: string) {
    const base = await this.reconciliation.getOrchestrationHealth(tenantId);
    const branchFilter = branchId ? { tenantId, branchId } : { tenantId };
    const stuckSince = new Date(Date.now() - STUCK_MS);

    const [stuckOpd, stuckIpd, stuckDischarge, unresolvedBlockers, billingDrift] = await Promise.all([
      this.prisma.opdVisit.count({
        where: { ...branchFilter, updatedAt: { lt: stuckSince }, state: { notIn: ['completed', 'cancelled'] } },
      }),
      this.prisma.ipdAdmission.count({
        where: { ...branchFilter, updatedAt: { lt: stuckSince }, state: { notIn: ['discharged', 'cancelled'] } },
      }),
      this.prisma.dischargeOrchestration.count({
        where: { ...branchFilter, updatedAt: { lt: stuckSince }, state: { notIn: ['discharged', 'cancelled'] } },
      }),
      this.prisma.operationalEscalation.count({
        where: { ...branchFilter, state: 'open' },
      }),
      this.prisma.invoice.count({
        where: {
          ...branchFilter,
          status: { in: ['draft', 'partial'] },
          updatedAt: { lt: stuckSince },
        },
      }),
    ]);

    const blockers: { id: string; domain: string; severity: 'critical' | 'warning' | 'info'; message: string }[] = [];
    const warnings: string[] = [];

    if (base.orphanedBeds > 0) {
      blockers.push({
        id: 'orphaned-beds',
        domain: 'bed',
        severity: 'critical',
        message: `${base.orphanedBeds} occupied bed(s) without admission`,
      });
    }
    if (base.admissionsWithoutBed > 0) {
      blockers.push({
        id: 'admissions-no-bed',
        domain: 'ipd',
        severity: 'warning',
        message: `${base.admissionsWithoutBed} admission(s) without bed`,
      });
    }
    if (stuckOpd > 0) warnings.push(`${stuckOpd} OPD visit(s) stuck >24h`);
    if (stuckIpd > 0) warnings.push(`${stuckIpd} IPD admission(s) stuck >24h`);
    if (stuckDischarge > 0) warnings.push(`${stuckDischarge} discharge orchestration(s) stuck >24h`);
    if (billingDrift > 0) warnings.push(`${billingDrift} invoice(s) with billing drift`);

    const status =
      blockers.some((b) => b.severity === 'critical') || base.status === 'degraded'
        ? 'degraded'
        : warnings.length > 0
          ? 'degraded'
          : 'healthy';

    return {
      status,
      blockers,
      warnings,
      stuckTransitions: { opd: stuckOpd, ipd: stuckIpd, discharge: stuckDischarge },
      unresolvedBlockers,
      billingDrift,
      base,
    };
  }

  async getDiagnostics(tenantId: string, branchId?: string) {
    const summary = await this.getHealthSummary(tenantId, branchId);
    const orphanedWorkflows = summary.stuckTransitions.opd + summary.stuckTransitions.ipd;
    return {
      ...summary,
      orphanedWorkflows,
      checkedAt: new Date().toISOString(),
    };
  }
}
