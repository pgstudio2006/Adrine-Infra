// ── Layer 5: Billing Intelligence — Revenue Cycle Engine ──

import type {
  BillingInvoice,
  HospitalPatient,
  AdmissionCase,
} from '@/stores/hospitalStore';

import type {
  RevenueCycleIntelligence,
  CollectionDashboard,
  AgingBucket,
  PreAuthSummary,
  BillingError,
  IntelligenceAlert,
} from '../types';

import { AGING_BUCKETS, COLLECTION_THRESHOLDS } from '../constants';
import { groupBy, countBy, pct, parseStoreDate, daysBetween, alertId } from '../utils';

// ── Input contract ──
export interface RevenueCycleInput {
  invoices: BillingInvoice[];
  patients: HospitalPatient[];
  admissions: AdmissionCase[];
}

// ── Main computation ──
export function computeRevenueCycleIntelligence(input: RevenueCycleInput): RevenueCycleIntelligence {
  const { invoices, patients, admissions } = input;
  const alerts: IntelligenceAlert[] = [];
  const now = new Date();
  const nowIso = now.toISOString();

  // ── 1. Collection dashboard ──
  const collection = computeCollectionDashboard(invoices);

  // ── 2. Aging analysis ──
  const aging = computeAgingAnalysis(invoices, now);

  // ── 3. Pre-auth summary ──
  const preAuth = computePreAuthSummary(patients);

  // ── 4. Billing errors ──
  const billingErrors = detectBillingErrors(invoices);

  // ── 5. Generate alerts ──

  if (collection.totalBilled > 0) {
    if (collection.collectionRate < COLLECTION_THRESHOLDS.criticalRate) {
      alerts.push({
        id: alertId('revenue'),
        category: 'collection-risk',
        severity: 'critical',
        title: 'Critical Collection Rate',
        message: `Collection rate is at ${collection.collectionRate}%, well below the ${COLLECTION_THRESHOLDS.criticalRate}% threshold. Immediate intervention required.`,
        timestamp: nowIso,
        actionable: true,
        suggestedAction: 'Escalate unpaid invoices, engage collection team, and review payment terms.',
      });
    } else if (collection.collectionRate < COLLECTION_THRESHOLDS.warningRate) {
      alerts.push({
        id: alertId('revenue'),
        category: 'collection-risk',
        severity: 'high',
        title: 'Low Collection Rate',
        message: `Collection rate is ${collection.collectionRate}%, below the target of ${COLLECTION_THRESHOLDS.warningRate}%.`,
        timestamp: nowIso,
        actionable: true,
        suggestedAction: 'Follow up on outstanding invoices and review payment collection processes.',
      });
    }
  }

  const aged90Plus = aging.find((b) => b.label === '90+ days');
  if (aged90Plus && aged90Plus.count > 0) {
    alerts.push({
      id: alertId('revenue'),
      category: 'collection-risk',
      severity: 'high',
      title: 'Invoices Aged Beyond 90 Days',
      message: `${aged90Plus.count} invoice(s) totaling ${formatCurrency(aged90Plus.amount)} are overdue by more than 90 days.`,
      timestamp: nowIso,
      actionable: true,
      suggestedAction: 'Prioritize collection on aged receivables. Consider write-off review for uncollectible accounts.',
    });
  }

  if (billingErrors.length > 0) {
    alerts.push({
      id: alertId('revenue'),
      category: 'billing-gap',
      severity: 'medium',
      title: 'Billing Anomalies Detected',
      message: `${billingErrors.length} billing error(s) found — including zero-total invoices, overpayments, or duplicates.`,
      timestamp: nowIso,
      actionable: true,
      suggestedAction: 'Review flagged invoices and correct billing entries.',
    });
  }

  if (collection.outstandingAmount > 0 && collection.totalBilled > 0) {
    const outstandingPct = pct(collection.outstandingAmount, collection.totalBilled);
    if (outstandingPct > 40) {
      alerts.push({
        id: alertId('revenue'),
        category: 'revenue-leakage',
        severity: 'high',
        title: 'High Outstanding Balance',
        message: `Outstanding amount is ${formatCurrency(collection.outstandingAmount)} (${outstandingPct}% of total billed).`,
        timestamp: nowIso,
        actionable: true,
        suggestedAction: 'Accelerate payment follow-ups and enforce payment policies.',
      });
    }
  }

  return {
    collection,
    aging,
    preAuth,
    billingErrors,
    alerts,
  };
}

// ── Helpers ──

function computeCollectionDashboard(invoices: BillingInvoice[]): CollectionDashboard {
  if (invoices.length === 0) {
    return {
      totalBilled: 0,
      totalCollected: 0,
      collectionRate: 0,
      outstandingAmount: 0,
      byPaymentMethod: [],
    };
  }

  const totalBilled = invoices.reduce((s, inv) => s + inv.total, 0);
  const totalCollected = invoices.reduce((s, inv) => s + inv.paid, 0);
  const outstandingAmount = totalBilled - totalCollected;
  const collectionRate = pct(totalCollected, totalBilled);

  const paidInvoices = invoices.filter((inv) => inv.paymentMode && inv.paid > 0);
  const methodGroups = groupBy(paidInvoices, (inv) => inv.paymentMode || 'unknown');
  const byPaymentMethod = Object.entries(methodGroups)
    .map(([method, invs]) => ({
      method,
      amount: invs.reduce((s, i) => s + i.paid, 0),
      count: invs.length,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    totalBilled,
    totalCollected,
    collectionRate,
    outstandingAmount,
    byPaymentMethod,
  };
}

function computeAgingAnalysis(invoices: BillingInvoice[], now: Date): AgingBucket[] {
  const unpaid = invoices.filter((inv) => inv.status !== 'paid');

  return AGING_BUCKETS.map((bucket) => {
    let amount = 0;
    let count = 0;

    for (const inv of unpaid) {
      const invDate = parseStoreDate(inv.date);
      if (!invDate) continue;

      const ageDays = daysBetween(invDate, now);
      if (ageDays >= bucket.min && ageDays <= bucket.max) {
        amount += inv.total - inv.paid;
        count += 1;
      }
    }

    return {
      label: bucket.label,
      amount: Math.round(amount * 100) / 100,
      count,
      color: bucket.color,
    };
  });
}

function computePreAuthSummary(patients: HospitalPatient[]): PreAuthSummary[] {
  if (patients.length === 0) return [];

  const statuses = ['none', 'pending', 'approved', 'rejected'] as const;
  const counts = countBy(patients, (p) => p.tpaPreAuthStatus || 'none');
  const total = patients.length;

  return statuses.map((status) => ({
    status,
    count: counts[status] || 0,
    percentage: pct(counts[status] || 0, total),
  }));
}

function detectBillingErrors(invoices: BillingInvoice[]): BillingError[] {
  const errors: BillingError[] = [];

  for (const inv of invoices) {
    if (inv.total === 0) {
      errors.push({
        invoiceId: inv.id,
        patientName: inv.patientName,
        errorType: 'zero-total',
        description: `Invoice ${inv.id} has a total of 0. This may indicate a data entry error.`,
      });
    }

    if (inv.paid > inv.total) {
      errors.push({
        invoiceId: inv.id,
        patientName: inv.patientName,
        errorType: 'overpayment',
        description: `Invoice ${inv.id} shows payment of ${formatCurrency(inv.paid)} exceeding the total of ${formatCurrency(inv.total)}.`,
      });
    }
  }

  const seen = new Map<string, BillingInvoice>();
  for (const inv of invoices) {
    const key = `${inv.date}|${inv.uhid}|${inv.category}`;
    const existing = seen.get(key);
    if (existing) {
      const alreadyFlagged = errors.some(
        (e) => e.errorType === 'duplicate' && (e.invoiceId === inv.id || e.invoiceId === existing.id),
      );
      if (!alreadyFlagged) {
        errors.push({
          invoiceId: inv.id,
          patientName: inv.patientName,
          errorType: 'duplicate',
          description: `Invoice ${inv.id} appears to be a duplicate of ${existing.id} — same date, UHID (${inv.uhid}), and category (${inv.category}).`,
        });
      }
    } else {
      seen.set(key, inv);
    }
  }

  return errors;
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
