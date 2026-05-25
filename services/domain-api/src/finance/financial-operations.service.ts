import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReconciliationService } from '../orchestration/reconciliation.service';

@Injectable()
export class FinancialOperationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reconciliation: ReconciliationService,
  ) {}

  async getLiveOperations(tenantId: string, branchId: string) {
    const branchFilter = { tenantId, branchId };

    const [invoices, chargeLines, dischargeBlockers, reconciliation] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          ...branchFilter,
          status: { in: ['draft', 'pending_approval', 'issued', 'partial', 'overdue'] },
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      }),
      this.prisma.invoiceChargeLine.findMany({
        where: { tenantId, invoice: { branchId } },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { invoice: { select: { id: true, status: true, opdVisitId: true, ipdAdmissionId: true } } },
      }),
      this.prisma.dischargeOrchestration.findMany({
        where: {
          ...branchFilter,
          state: { notIn: ['discharged', 'cancelled'] },
          billingClearedAt: null,
        },
        take: 20,
      }),
      this.reconciliation.getOrchestrationHealth(tenantId),
    ]);

    const insuranceExposure = await this.prisma.insuranceAuthorization.aggregate({
      where: {
        ...branchFilter,
        state: { in: ['approved', 'partially_approved', 'under_review'] },
      },
      _sum: { approvedCents: true },
      _count: true,
    });

    const outstandingCents = invoices.reduce((sum, inv) => sum + (inv.amountCents - inv.paidCents), 0);

    const warnings: string[] = [];
    if (reconciliation.orphanedBeds > 0) warnings.push('Bed/billing occupancy mismatch detected');
    if (dischargeBlockers.length > 0) {
      warnings.push(`${dischargeBlockers.length} discharge(s) blocked on billing clearance`);
    }

    return {
      branchId,
      generatedAt: new Date().toISOString(),
      summary: {
        openInvoices: invoices.length,
        outstandingCents,
        chargeLineCount: chargeLines.length,
        insuranceAuthorizations: insuranceExposure._count,
        insuranceApprovedCents: insuranceExposure._sum.approvedCents ?? 0,
        dischargeBillingBlockers: dischargeBlockers.length,
      },
      invoices: invoices.map((i) => ({
        id: i.id,
        status: i.status,
        amountCents: i.amountCents,
        paidCents: i.paidCents,
        outstandingCents: i.amountCents - i.paidCents,
        opdVisitId: i.opdVisitId,
        ipdAdmissionId: i.ipdAdmissionId,
      })),
      dischargeBillingBlockers: dischargeBlockers.map((d) => ({
        id: d.id,
        admissionId: d.admissionId,
        state: d.state,
      })),
      reconciliationWarnings: warnings,
      reconciliation,
    };
  }
}
