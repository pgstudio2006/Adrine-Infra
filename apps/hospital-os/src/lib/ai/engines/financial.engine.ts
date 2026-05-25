// ── Layer 1: Financial Intelligence Engine ──
//
// Pure computation functions for revenue leakage detection, collection rate analysis,
// department profitability, discount abuse scanning, and daily financial digest.

import type {
  FinancialIntelligence,
  RevenueLeakageEntry,
  DepartmentProfitability,
  DiscountAbuseEntry,
  DailyFinancialDigest,
  IntelligenceAlert,
} from '../types';

import { THRESHOLDS } from '../constants';

import {
  groupBy,
  pct,
  alertId,
  nowISO,
  safeDivide,
  parseStoreDate,
} from '../utils';

import type {
  BillingInvoice,
  AdmissionCase,
  HospitalPatient,
  PrescriptionOrder,
} from '../../../stores/hospitalStore';

// ────────────────────────────────────────────────────────────────────────────
// Input Type
// ────────────────────────────────────────────────────────────────────────────

export interface FinancialIntelligenceInput {
  invoices: BillingInvoice[];
  admissions: AdmissionCase[];
  patients: HospitalPatient[];
  prescriptions: PrescriptionOrder[];
}

// ────────────────────────────────────────────────────────────────────────────
// Main Export
// ────────────────────────────────────────────────────────────────────────────

/**
 * Compute the complete financial intelligence picture:
 *  - Revenue leakage: admissions without invoices, prescriptions dispensed but unbilled
 *  - Collection rate: overall sum(paid) / sum(total)
 *  - Department profitability: grouped by invoice category
 *  - Discount abuse: admissions with discount > 20% of total
 *  - Daily digest: today's key numbers
 *  - Alerts for each finding
 */
export function computeFinancialIntelligence(
  input: FinancialIntelligenceInput,
): FinancialIntelligence {
  const { invoices, admissions, patients, prescriptions } = input;

  const alerts: IntelligenceAlert[] = [];

  // ── Revenue Leakage ──
  const revenueLeakage = detectRevenueLeakage(
    admissions,
    prescriptions,
    invoices,
    patients,
  );

  for (const leak of revenueLeakage) {
    alerts.push({
      id: alertId('financial'),
      category: 'revenue-leakage',
      severity: leak.type === 'unbilled-admission' ? 'high' : 'medium',
      title: leak.type === 'unbilled-admission'
        ? 'Unbilled Admission'
        : 'Unbilled Prescription',
      message: leak.description,
      relatedEntity: leak.type === 'unbilled-admission' ? 'admission' : 'prescription',
      relatedId: leak.relatedId,
      timestamp: nowISO(),
      actionable: true,
      suggestedAction: 'Review and create billing invoice for this service.',
    });
  }

  // ── Collection Rate ──
  const overallCollectionRate = computeCollectionRate(invoices);

  if (overallCollectionRate < THRESHOLDS.COLLECTION_RATE_CRITICAL) {
    alerts.push({
      id: alertId('financial'),
      category: 'collection-risk',
      severity: 'critical',
      title: 'Critical Collection Rate',
      message: `Overall collection rate is ${overallCollectionRate.toFixed(1)}%, below the critical threshold of ${THRESHOLDS.COLLECTION_RATE_CRITICAL}%. Cash flow is at serious risk.`,
      timestamp: nowISO(),
      actionable: true,
      suggestedAction: 'Activate aggressive follow-up on pending invoices. Review credit policies.',
    });
  } else if (overallCollectionRate < THRESHOLDS.COLLECTION_RATE_WARNING) {
    alerts.push({
      id: alertId('financial'),
      category: 'collection-risk',
      severity: 'high',
      title: 'Low Collection Rate',
      message: `Overall collection rate is ${overallCollectionRate.toFixed(1)}%, below the warning threshold of ${THRESHOLDS.COLLECTION_RATE_WARNING}%.`,
      timestamp: nowISO(),
      actionable: true,
      suggestedAction: 'Review outstanding invoices and follow up with patients.',
    });
  }

  // ── Department Profitability ──
  const departmentProfitability = computeDepartmentProfitability(invoices);

  for (const dept of departmentProfitability) {
    if (dept.collectionRate < THRESHOLDS.COLLECTION_RATE_CRITICAL) {
      alerts.push({
        id: alertId('financial'),
        category: 'collection-risk',
        severity: 'high',
        title: `${dept.department} Collection Below Target`,
        message: `${dept.department} collection rate is ${dept.collectionRate.toFixed(1)}% (${dept.invoiceCount} invoices, pending: ${formatCurrency(dept.pendingAmount)}).`,
        relatedEntity: 'department',
        relatedId: dept.department,
        timestamp: nowISO(),
        actionable: true,
        suggestedAction: `Review pending payments for ${dept.department} and initiate follow-ups.`,
      });
    }
  }

  // ── Discount Abuse ──
  const discountAbuse = detectDiscountAbuse(admissions, invoices);

  for (const abuse of discountAbuse) {
    alerts.push({
      id: alertId('financial'),
      category: 'discount-abuse',
      severity: abuse.discountPercent > 40 ? 'high' : 'medium',
      title: 'Excessive Discount',
      message: `${abuse.patientName} (${abuse.uhid}): Discount of ${formatCurrency(abuse.discountAmount)} is ${abuse.discountPercent.toFixed(1)}% of total bill (${formatCurrency(abuse.totalBill)}).${abuse.reason ? ` Reason: ${abuse.reason}` : ' No reason documented.'}`,
      relatedEntity: 'admission',
      relatedId: abuse.admissionId,
      timestamp: nowISO(),
      actionable: true,
      suggestedAction: 'Verify discount authorization. Ensure proper approval chain was followed.',
    });
  }

  // ── Daily Digest ──
  const dailyDigest = computeDailyDigest(invoices, departmentProfitability);

  // ── Overdue Invoice Alerts ──
  const overdueInvoices = invoices.filter((inv) => inv.status === 'overdue');
  if (overdueInvoices.length > 0) {
    const totalOverdue = overdueInvoices.reduce(
      (sum, inv) => sum + (inv.total - inv.paid),
      0,
    );
    alerts.push({
      id: alertId('financial'),
      category: 'billing-gap',
      severity: overdueInvoices.length > 5 ? 'high' : 'medium',
      title: 'Overdue Invoices',
      message: `${overdueInvoices.length} overdue invoices totaling ${formatCurrency(totalOverdue)}. Oldest from patients: ${overdueInvoices.slice(0, 3).map((i) => i.patientName).join(', ')}.`,
      timestamp: nowISO(),
      actionable: true,
      suggestedAction: 'Escalate overdue collections. Consider payment plan offers for high-value overdue accounts.',
    });
  }

  return {
    revenueLeakage,
    overallCollectionRate,
    departmentProfitability,
    discountAbuse,
    dailyDigest,
    alerts,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Revenue Leakage Detection
// ────────────────────────────────────────────────────────────────────────────

function detectRevenueLeakage(
  admissions: AdmissionCase[],
  prescriptions: PrescriptionOrder[],
  invoices: BillingInvoice[],
  patients: HospitalPatient[],
): RevenueLeakageEntry[] {
  const leakage: RevenueLeakageEntry[] = [];

  // Build a set of UHIDs that have IPD invoices
  const uhidsWithIPDInvoice = new Set(
    invoices
      .filter((inv) => inv.category === 'IPD')
      .map((inv) => inv.uhid),
  );

  // Build a set of UHIDs that have Pharmacy invoices
  const uhidsWithPharmacyInvoice = new Set(
    invoices
      .filter((inv) => inv.category === 'Pharmacy')
      .map((inv) => inv.uhid),
  );

  // 1. Admissions without matching IPD invoices
  for (const admission of admissions) {
    // Only check admitted (non-discharged) or recently discharged
    if (admission.status === 'discharged') {
      // For discharged patients, they should definitely have an invoice
      if (!uhidsWithIPDInvoice.has(admission.uhid)) {
        leakage.push({
          type: 'unbilled-admission',
          uhid: admission.uhid,
          patientName: admission.patientName,
          relatedId: admission.id,
          description: `Discharged admission ${admission.id} for ${admission.patientName} (${admission.ward}) has no corresponding IPD invoice.`,
        });
      }
    } else if (
      admission.billingStage === 'finalized' &&
      !uhidsWithIPDInvoice.has(admission.uhid)
    ) {
      // Active admission with finalized billing but no invoice
      leakage.push({
        type: 'unbilled-admission',
        uhid: admission.uhid,
        patientName: admission.patientName,
        relatedId: admission.id,
        description: `Admission ${admission.id} for ${admission.patientName} has finalized billing but no IPD invoice generated.`,
      });
    }
  }

  // 2. Prescriptions that are dispensed but have no pharmacy invoice
  for (const rx of prescriptions) {
    if (rx.status !== 'Dispensed' && rx.status !== 'Partially dispensed') continue;

    // Check if any meds were actually dispensed
    const totalDispensed = rx.meds.reduce((sum, m) => sum + m.dispensed, 0);
    if (totalDispensed === 0) continue;

    if (!uhidsWithPharmacyInvoice.has(rx.uhid)) {
      leakage.push({
        type: 'unbilled-prescription',
        uhid: rx.uhid,
        patientName: rx.patientName,
        relatedId: rx.id,
        description: `Prescription ${rx.id} for ${rx.patientName} has ${totalDispensed} dispensed units across ${rx.meds.length} medications with no Pharmacy invoice.`,
      });
    }
  }

  return leakage;
}

// ────────────────────────────────────────────────────────────────────────────
// Collection Rate
// ────────────────────────────────────────────────────────────────────────────

function computeCollectionRate(invoices: BillingInvoice[]): number {
  if (invoices.length === 0) return 100; // No invoices means nothing owed

  const totalBilled = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paid, 0);

  return pct(totalPaid, totalBilled);
}

// ────────────────────────────────────────────────────────────────────────────
// Department Profitability
// ────────────────────────────────────────────────────────────────────────────

function computeDepartmentProfitability(
  invoices: BillingInvoice[],
): DepartmentProfitability[] {
  if (invoices.length === 0) return [];

  const grouped = groupBy(invoices, (inv) => inv.category);
  const departments: DepartmentProfitability[] = [];

  for (const [dept, deptInvoices] of Object.entries(grouped)) {
    const revenue = deptInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidAmount = deptInvoices.reduce((sum, inv) => sum + inv.paid, 0);
    const pendingAmount = revenue - paidAmount;
    const collectionRate = pct(paidAmount, revenue);

    departments.push({
      department: dept,
      revenue,
      invoiceCount: deptInvoices.length,
      paidAmount,
      pendingAmount,
      collectionRate,
    });
  }

  // Sort by revenue descending
  departments.sort((a, b) => b.revenue - a.revenue);

  return departments;
}

// ────────────────────────────────────────────────────────────────────────────
// Discount Abuse Detection
// ────────────────────────────────────────────────────────────────────────────

function detectDiscountAbuse(
  admissions: AdmissionCase[],
  invoices: BillingInvoice[],
): DiscountAbuseEntry[] {
  const abuse: DiscountAbuseEntry[] = [];

  // Check admissions with discount amounts
  for (const admission of admissions) {
    if (!admission.finalBillDiscountAmount || admission.finalBillDiscountAmount <= 0) continue;

    // Try to find the matching IPD invoice to get the total bill
    const matchingInvoice = invoices.find(
      (inv) => inv.uhid === admission.uhid && inv.category === 'IPD',
    );

    let totalBill: number;
    if (matchingInvoice) {
      totalBill = Math.max(
        matchingInvoice.total,
        matchingInvoice.total + admission.finalBillDiscountAmount,
      );
    } else {
      totalBill = admission.finalBillDiscountAmount * 5; // assume ~20% as baseline
    }

    const discountPercent = safeDivide(
      admission.finalBillDiscountAmount,
      totalBill,
    ) * 100;

    if (discountPercent > THRESHOLDS.DISCOUNT_ABUSE_PERCENT) {
      abuse.push({
        admissionId: admission.id,
        uhid: admission.uhid,
        patientName: admission.patientName,
        discountAmount: admission.finalBillDiscountAmount,
        totalBill,
        discountPercent: Math.round(discountPercent * 10) / 10,
        reason: admission.finalBillDiscountReason,
      });
    }
  }

  // Also check invoice-level discounts
  for (const invoice of invoices) {
    if (!invoice.discountAmount || invoice.discountAmount <= 0) continue;

    const preDiscountTotal = invoice.total + invoice.discountAmount;
    const discountPercent = safeDivide(
      invoice.discountAmount,
      preDiscountTotal,
    ) * 100;

    if (discountPercent > THRESHOLDS.DISCOUNT_ABUSE_PERCENT) {
      const alreadyCaught = abuse.some(
        (a) => a.uhid === invoice.uhid && a.admissionId,
      );
      if (!alreadyCaught) {
        abuse.push({
          admissionId: invoice.id,
          uhid: invoice.uhid,
          patientName: invoice.patientName,
          discountAmount: invoice.discountAmount,
          totalBill: preDiscountTotal,
          discountPercent: Math.round(discountPercent * 10) / 10,
          reason: invoice.discountReason,
        });
      }
    }
  }

  return abuse;
}

// ────────────────────────────────────────────────────────────────────────────
// Daily Financial Digest
// ────────────────────────────────────────────────────────────────────────────

function computeDailyDigest(
  invoices: BillingInvoice[],
  departmentProfitability: DepartmentProfitability[],
): DailyFinancialDigest {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const todayInvoices = invoices.filter((inv) => {
    const invDate = parseStoreDate(inv.date);
    if (!invDate) return false;
    return invDate.toISOString().slice(0, 10) === todayStr;
  });

  // Fall back to all invoices if no today's invoices
  const targetInvoices = todayInvoices.length > 0 ? todayInvoices : invoices;

  const totalRevenue = targetInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalCollected = targetInvoices.reduce((sum, inv) => sum + inv.paid, 0);
  const totalPending = totalRevenue - totalCollected;
  const invoiceCount = targetInvoices.length;
  const collectionRate = pct(totalCollected, totalRevenue);

  const topDept = departmentProfitability.length > 0
    ? departmentProfitability[0]
    : { department: 'N/A', revenue: 0 };

  return {
    totalRevenue,
    totalCollected,
    totalPending,
    invoiceCount,
    collectionRate,
    topDepartment: topDept.department,
    topDepartmentRevenue: topDept.revenue,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
