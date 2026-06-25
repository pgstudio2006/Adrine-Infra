import type { OperationalSnapshot } from '@adrine/hospital-operations';
import type { AdminOperationalBundle } from '@/runtime/admin-runtime';
import type { OperationalAnalyticsPayload } from '@/runtime/analytics-runtime';

const DEMO_BRANCH_ID = 'branch_main';

function demoSnapshot(): OperationalSnapshot {
  const now = new Date().toISOString();
  return {
    branchId: DEMO_BRANCH_ID,
    tenantId: 'tenant_adrine_demo',
    generatedAt: now,
    healthStatus: 'degraded',
    reconciliationWarnings: ['3 draft invoices older than 48h'],
    counts: {
      opdActiveVisits: 42,
      opdWaitingQueue: 8,
      ipdActiveAdmissions: 68,
      bedsOccupied: 142,
      bedsAvailable: 38,
      labPending: 23,
      labCriticalUnacked: 2,
      radiologyPending: 11,
      pharmacyPending: 17,
      nursingOpenTasks: 34,
      nursingMissed: 3,
      dischargeInProgress: 5,
      insurancePending: 12,
      openEscalations: 4,
      billingDraftInvoices: 19,
    },
    blockers: [
      {
        id: 'blk-1',
        domain: 'lab',
        severity: 'critical',
        message: 'Critical potassium unacknowledged — UHID-4521',
      },
      {
        id: 'blk-2',
        domain: 'billing',
        severity: 'warning',
        message: 'IPD discharge billing hold — Bed GW-12',
      },
      {
        id: 'blk-3',
        domain: 'nursing',
        severity: 'warning',
        message: 'Vitals overdue >6h — Ward 4 Bed 7',
      },
    ],
    escalations: [
      {
        id: 'esc-1',
        type: 'workflow',
        severity: 'warning',
        state: 'open',
        sourceRuntime: 'Nursing',
        message: 'MEWS score 6 — Ward 8 Bed 3',
        createdAt: new Date(Date.now() - 12 * 60_000).toISOString(),
      },
      {
        id: 'esc-2',
        type: 'lab',
        severity: 'critical',
        state: 'open',
        sourceRuntime: 'Laboratory',
        message: 'Critical value callback pending — CBC',
        createdAt: new Date(Date.now() - 28 * 60_000).toISOString(),
      },
      {
        id: 'esc-3',
        type: 'billing',
        severity: 'moderate',
        state: 'open',
        sourceRuntime: 'Billing',
        message: 'TPA pre-auth expiring in 4h — UHID-3892',
        createdAt: new Date(Date.now() - 45 * 60_000).toISOString(),
      },
      {
        id: 'esc-4',
        type: 'pharmacy',
        severity: 'info',
        state: 'open',
        sourceRuntime: 'Pharmacy',
        message: 'High-alert medication double-check required',
        createdAt: new Date(Date.now() - 62 * 60_000).toISOString(),
      },
      {
        id: 'esc-5',
        type: 'er',
        severity: 'warning',
        state: 'open',
        sourceRuntime: 'Emergency',
        message: 'Trauma bay turnover delayed — Bay 2',
        createdAt: new Date(Date.now() - 95 * 60_000).toISOString(),
      },
    ],
  };
}

function demoAnalytics(period: '24h' | '7d'): OperationalAnalyticsPayload {
  return {
    branchId: DEMO_BRANCH_ID,
    period,
    metrics: {
      opdVisitsCreated: period === '7d' ? 312 : 48,
      dischargeTurnaround: period === '7d' ? 28 : 4,
      nursingMissed: 3,
      labTatBreaches: 5,
    },
    platformEventCounts: {
      'billing.invoice.created': 42,
      'lab.result.critical': 3,
      'ipd.admission.created': 18,
    },
  };
}

export const DEMO_BED_WARDS = [
  { ward: 'General Ward', total: 120, occupied: 89, available: 31 },
  { ward: 'ICU', total: 24, occupied: 21, available: 3 },
  { ward: 'Private Wing', total: 20, occupied: 18, available: 2 },
  { ward: 'Maternity', total: 16, occupied: 14, available: 2 },
];

export function getDemoAdminOperationalBundle(period: '24h' | '7d' = '24h'): AdminOperationalBundle {
  const now = new Date().toISOString();
  return {
    snapshot: demoSnapshot(),
    analytics: demoAnalytics(period),
    finance: {
      branchId: DEMO_BRANCH_ID,
      generatedAt: now,
      summary: {
        openInvoices: 47,
        outstandingCents: 845_200_00,
        chargeLineCount: 312,
        insuranceAuthorizations: 23,
        insuranceApprovedCents: 1_250_000_00,
        dischargeBillingBlockers: 3,
      },
      reconciliationWarnings: ['Cashier day-end pending reconciliation'],
    },
    auditEvents: [
      {
        id: 'aud-1',
        eventName: 'billing.invoice.finalized',
        timestamp: new Date(Date.now() - 20 * 60_000).toISOString(),
        resourceType: 'invoice',
        resourceId: 'INV-2026-0891',
      },
      {
        id: 'aud-2',
        eventName: 'lab.result.critical',
        timestamp: new Date(Date.now() - 35 * 60_000).toISOString(),
        resourceType: 'lab_order',
        resourceId: 'LAB-4421',
      },
      {
        id: 'aud-3',
        eventName: 'ipd.discharge.initiated',
        timestamp: new Date(Date.now() - 50 * 60_000).toISOString(),
        resourceType: 'admission',
        resourceId: 'ADM-2208',
      },
    ],
    error: null,
  };
}
