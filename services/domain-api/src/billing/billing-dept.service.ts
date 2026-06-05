import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InsuranceRuntimeService } from '../insurance/insurance-runtime.service';
import {
  BILLING_CHARGE_MASTER,
  BILLING_DEPT_HEALTH_PLANS,
  BILLING_DEPT_PACKAGES,
  BILLING_DEPT_TPA_PROVIDERS,
  BILLING_DEPT_TPA_RATES,
} from './billing-dept-catalog';

@Injectable()
export class BillingDeptService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly insurance: InsuranceRuntimeService,
  ) {}

  getPackages() {
    return {
      generatedAt: new Date().toISOString(),
      packages: BILLING_DEPT_PACKAGES.map((p) => ({
        ...p,
        price: p.priceCents / 100,
      })),
    };
  }

  getHealthPlans() {
    return {
      generatedAt: new Date().toISOString(),
      plans: BILLING_DEPT_HEALTH_PLANS.map((p) => ({
        ...p,
        price: p.priceCents / 100,
        discountedPrice: p.discountedPriceCents / 100,
      })),
    };
  }

  getTpaCharges() {
    return {
      generatedAt: new Date().toISOString(),
      providers: BILLING_DEPT_TPA_PROVIDERS,
      serviceRates: BILLING_DEPT_TPA_RATES.map((r) => ({
        service: r.service,
        general: r.generalCents / 100,
        rates: Object.fromEntries(
          Object.entries(r.ratesByPayer).map(([k, v]) => [k, v / 100]),
        ),
      })),
    };
  }

  getChargeMaster() {
    return {
      generatedAt: new Date().toISOString(),
      charges: BILLING_CHARGE_MASTER.map((c) => ({
        ...c,
        baseRate: c.baseRateCents / 100,
      })),
    };
  }

  async getRevenue(tenantId: string, branchId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [settled, chargeLines] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          tenantId,
          branchId,
          status: 'settled',
          settledAt: { gte: since },
        },
        select: {
          amountCents: true,
          paidCents: true,
          settledAt: true,
          opdVisitId: true,
          ipdAdmissionId: true,
        },
      }),
      this.prisma.invoiceChargeLine.findMany({
        where: {
          tenantId,
          status: 'active',
          createdAt: { gte: since },
          invoice: { branchId, status: { notIn: ['void'] } },
        },
        select: {
          amountCents: true,
          sourceModule: true,
          createdAt: true,
        },
      }),
    ]);

    const byModule: Record<string, number> = {};
    for (const line of chargeLines) {
      const key = line.sourceModule || 'other';
      byModule[key] = (byModule[key] ?? 0) + line.amountCents;
    }

    const totalRevenueCents = settled.reduce((s, i) => s + i.paidCents, 0);
    const opdCents = settled.filter((i) => i.opdVisitId).reduce((s, i) => s + i.paidCents, 0);
    const ipdCents = settled.filter((i) => i.ipdAdmissionId).reduce((s, i) => s + i.paidCents, 0);

    const dailyMap = new Map<string, number>();
    for (const inv of settled) {
      if (!inv.settledAt) continue;
      const key = inv.settledAt.toISOString().slice(0, 10);
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + inv.paidCents);
    }

    return {
      branchId,
      generatedAt: new Date().toISOString(),
      periodDays: days,
      summary: {
        totalRevenueCents,
        opdCents,
        ipdCents,
        settledInvoiceCount: settled.length,
      },
      revenueByModule: Object.entries(byModule).map(([module, cents]) => ({
        module,
        amountCents: cents,
        amount: cents / 100,
      })),
      daily: [...dailyMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, amountCents]) => ({ date, amountCents, amount: amountCents / 100 })),
    };
  }

  async getGstReport(tenantId: string, branchId: string, days = 90) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        branchId,
        status: { in: ['issued', 'partial', 'paid', 'settled'] },
        updatedAt: { gte: since },
      },
      include: {
        patient: { select: { fullName: true, mrn: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });

    const rows = invoices.map((inv) => {
      const taxable = inv.amountCents;
      const rate = inv.gstRateBps / 10000;
      const gstTotal = Math.round(taxable * rate);
      const half = Math.round(gstTotal / 2);
      return {
        invoiceId: inv.id,
        receiptNumber: inv.receiptNumber,
        patientName: inv.patient.fullName,
        uhid: inv.patient.mrn,
        taxableCents: taxable,
        gstRateBps: inv.gstRateBps,
        cgstCents: half,
        sgstCents: gstTotal - half,
        totalCents: taxable + gstTotal,
        status: inv.status,
        updatedAt: inv.updatedAt.toISOString(),
      };
    });

    const totals = rows.reduce(
      (acc, r) => ({
        taxableCents: acc.taxableCents + r.taxableCents,
        cgstCents: acc.cgstCents + r.cgstCents,
        sgstCents: acc.sgstCents + r.sgstCents,
      }),
      { taxableCents: 0, cgstCents: 0, sgstCents: 0 },
    );

    return {
      branchId,
      generatedAt: new Date().toISOString(),
      summary: totals,
      invoices: rows,
    };
  }

  async getInsuranceDesk(tenantId: string, branchId: string) {
    const authorizations = await this.insurance.listForBranch(tenantId, branchId);
    return {
      generatedAt: new Date().toISOString(),
      authorizations,
    };
  }

  async getFinanceDesk(tenantId: string, branchId: string) {
    const branchFilter = { tenantId, branchId };

    const [openInvoices, dischargeBlockers, pendingApproval, insuranceExposure] =
      await Promise.all([
        this.prisma.invoice.findMany({
          where: {
            ...branchFilter,
            status: { in: ['draft', 'pending_approval', 'issued', 'partial', 'overdue'] },
          },
          orderBy: { updatedAt: 'desc' },
          take: 50,
        }),
        this.prisma.dischargeOrchestration.findMany({
          where: {
            ...branchFilter,
            state: { notIn: ['discharged', 'cancelled'] },
            billingClearedAt: null,
          },
          take: 20,
        }),
        this.prisma.invoice.findMany({
          where: { ...branchFilter, status: 'pending_approval' },
          take: 30,
          orderBy: { updatedAt: 'desc' },
          include: { patient: { select: { fullName: true, mrn: true } } },
        }),
        this.prisma.insuranceAuthorization.aggregate({
          where: {
            ...branchFilter,
            state: { in: ['approved', 'partially_approved', 'under_review'] },
          },
          _sum: { approvedCents: true },
          _count: true,
        }),
      ]);

    const outstandingCents = openInvoices.reduce(
      (sum, inv) => sum + (inv.amountCents - inv.paidCents),
      0,
    );

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        openInvoices: openInvoices.length,
        outstandingCents,
        dischargeBillingBlockers: dischargeBlockers.length,
        insuranceAuthorizations: insuranceExposure._count,
        insuranceApprovedCents: insuranceExposure._sum.approvedCents ?? 0,
      },
      pendingApprovals: pendingApproval.map((i) => ({
        invoiceId: i.id,
        patientName: i.patient.fullName,
        uhid: i.patient.mrn,
        amountCents: i.amountCents,
        outstandingCents: i.amountCents - i.paidCents,
        status: i.status,
      })),
    };
  }

  async getDashboard(tenantId: string, branchId: string) {
    const [revenue, finance, insurance] = await Promise.all([
      this.getRevenue(tenantId, branchId, 7),
      this.getFinanceDesk(tenantId, branchId),
      this.getInsuranceDesk(tenantId, branchId),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      revenue: revenue.summary,
      finance: finance.summary,
      insuranceCount: insurance.authorizations.length,
    };
  }
}
