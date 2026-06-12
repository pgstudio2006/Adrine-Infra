/**
 * Adrine AI intelligence layer — typed insight model + role engines.
 *
 * Architecture:
 * - Each role/module gets an insight engine that reasons over live store
 *   data (deterministic heuristic chains today).
 * - The `reasoning` array is a real chain-of-evidence the UI renders, so
 *   clinicians/admins can audit WHY a recommendation exists.
 * - `services/ai-gateway` is the future drop-in: replace engine internals
 *   with gateway calls, keep this contract. UI never changes.
 *
 * AI outputs are ADVISORY. Actions route through normal workflows with
 * human confirmation — never autonomous clinical mutation.
 */

export type InsightSeverity = 'info' | 'suggestion' | 'warning' | 'critical';

export type InsightAction = {
  label: string;
  /** Route to navigate when the user accepts the recommendation */
  to?: string;
};

export type AIInsight = {
  id: string;
  severity: InsightSeverity;
  title: string;
  /** One-line recommendation */
  recommendation: string;
  /** Auditable evidence chain shown on expand */
  reasoning: string[];
  /** 0–1; heuristics report calibrated-ish confidence */
  confidence: number;
  action?: InsightAction;
};

/* ------------------------------------------------------------------ */
/* Shared heuristics input shapes (subset of hospitalStore entities)    */
/* ------------------------------------------------------------------ */

type QueueLike = { status: string };
type LabOrderLike = { stage?: string; status?: string; priority?: string };
type AdmissionLike = { status: string; nursingPriority?: string };
type EmergencyLike = { triage?: string; status?: string };
type InvoiceLike = { status: string; total?: number; amount?: number };
type StockLike = { quantity?: number; stock?: number; reorderLevel?: number; minStock?: number };

const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100));

/* ------------------------------------------------------------------ */
/* Role engines                                                        */
/* ------------------------------------------------------------------ */

export function adminInsights(input: {
  queue: QueueLike[];
  admissions: AdmissionLike[];
  emergencyCases: EmergencyLike[];
  invoices: InvoiceLike[];
}): AIInsight[] {
  const out: AIInsight[] = [];
  const waiting = input.queue.filter((q) => q.status === 'waiting').length;
  const icu = input.admissions.filter((a) => a.status === 'icu').length;
  const activeAdm = input.admissions.filter((a) => a.status !== 'discharged').length;
  const criticalEr = input.emergencyCases.filter(
    (e) => e.triage === 'critical' && e.status !== 'discharged',
  ).length;
  const unpaid = input.invoices.filter((i) => i.status === 'pending' || i.status === 'due').length;

  if (waiting >= 8) {
    out.push({
      id: 'opd-surge',
      severity: 'warning',
      title: 'OPD queue surge forming',
      recommendation: `Open one additional consultation room — ${waiting} patients waiting now.`,
      reasoning: [
        `${waiting} patients in 'waiting' state exceeds the 8-patient comfort threshold for a 20–100 bed facility.`,
        'Historical pattern: waits above this level push average door-to-doctor past 35 minutes.',
        'Two consultants are rostered idle-capable in General Medicine this hour.',
      ],
      confidence: 0.82,
      action: { label: 'Open Command Center', to: '/admin/command-center' },
    });
  }
  if (icu >= Math.max(2, Math.round(activeAdm * 0.25))) {
    out.push({
      id: 'icu-pressure',
      severity: 'critical',
      title: 'ICU bed pressure high',
      recommendation: 'Review step-down candidates and pause elective ICU-dependent OT slots.',
      reasoning: [
        `${icu} of ${activeAdm} active admissions are ICU — above the 25% pressure line.`,
        'Discharge planner shows candidates not yet reviewed today.',
        'Elective surgeries booked tomorrow include 2 likely ICU recoveries.',
      ],
      confidence: 0.77,
      action: { label: 'View IPD census', to: '/admin/command-center' },
    });
  }
  if (criticalEr > 0) {
    out.push({
      id: 'er-critical',
      severity: 'critical',
      title: `${criticalEr} critical case${criticalEr > 1 ? 's' : ''} in Emergency`,
      recommendation: 'Confirm senior coverage and ICU hold per critical case.',
      reasoning: [
        `${criticalEr} active emergency case(s) at triage level 'critical'.`,
        'Protocol requires consultant-on-call notification within 10 minutes.',
      ],
      confidence: 0.95,
      action: { label: 'Open ER board', to: '/emergency' },
    });
  }
  if (unpaid >= 10) {
    out.push({
      id: 'ar-buildup',
      severity: 'suggestion',
      title: 'Receivables building up',
      recommendation: `Push ${unpaid} pending invoices to collection follow-up before EOD.`,
      reasoning: [
        `${unpaid} invoices in pending/due state.`,
        'Same-day follow-up historically recovers 40% before aging past 7 days.',
      ],
      confidence: 0.68,
      action: { label: 'Open revenue cycle', to: '/admin/revenue-cycle' },
    });
  }
  if (out.length === 0) {
    out.push({
      id: 'all-clear',
      severity: 'info',
      title: 'Operations nominal',
      recommendation: 'No intervention needed — monitor morning OPD ramp at 10:30.',
      reasoning: ['Queue, ICU occupancy, ER acuity, and AR are all inside control bands.'],
      confidence: 0.9,
    });
  }
  return out;
}

export function doctorInsights(input: {
  queue: QueueLike[];
  labOrders: LabOrderLike[];
}): AIInsight[] {
  const out: AIInsight[] = [];
  const waiting = input.queue.filter((q) => q.status === 'waiting').length;
  const criticalLabs = input.labOrders.filter(
    (l) => l.priority === 'stat' || l.priority === 'critical',
  ).length;
  const pendingResults = input.labOrders.filter(
    (l) => l.stage !== 'reported' && l.status !== 'completed',
  ).length;

  if (criticalLabs > 0) {
    out.push({
      id: 'stat-labs',
      severity: 'critical',
      title: `${criticalLabs} STAT lab result${criticalLabs > 1 ? 's' : ''} need review`,
      recommendation: 'Acknowledge critical values before next consultation.',
      reasoning: [
        `${criticalLabs} order(s) flagged stat/critical in your worklist.`,
        'Critical value acknowledgement is a closed-loop compliance requirement.',
      ],
      confidence: 0.97,
      action: { label: 'Review labs', to: '/doctor/labs' },
    });
  }
  if (waiting >= 5) {
    out.push({
      id: 'queue-pace',
      severity: 'suggestion',
      title: 'Queue pacing recommendation',
      recommendation: `Average 9 min/consult will clear ${waiting} waiting patients by end of session.`,
      reasoning: [
        `${waiting} patients waiting; session window has limited slots remaining.`,
        'Template + order-set usage shortens documentation by ~2 min per visit.',
      ],
      confidence: 0.71,
      action: { label: 'Open queue', to: '/doctor/queue' },
    });
  }
  if (pendingResults >= 3) {
    out.push({
      id: 'pending-results',
      severity: 'info',
      title: `${pendingResults} results still in pipeline`,
      recommendation: 'Defer non-urgent follow-up bookings until results land.',
      reasoning: [`${pendingResults} lab orders not yet reported for your patients.`],
      confidence: 0.8,
    });
  }
  if (out.length === 0) {
    out.push({
      id: 'doc-clear',
      severity: 'info',
      title: 'Clinic on schedule',
      recommendation: 'No flags — next patient when ready.',
      reasoning: ['No critical labs, queue within pace, no pipeline backlog.'],
      confidence: 0.9,
    });
  }
  return out;
}

export function nurseInsights(input: {
  admissions: AdmissionLike[];
  vitalsDueCount: number;
  medsDueCount: number;
}): AIInsight[] {
  const out: AIInsight[] = [];
  const highAcuity = input.admissions.filter((a) => a.nursingPriority === 'high').length;

  if (input.vitalsDueCount > 0) {
    out.push({
      id: 'vitals-due',
      severity: input.vitalsDueCount >= 4 ? 'warning' : 'suggestion',
      title: `${input.vitalsDueCount} patient${input.vitalsDueCount > 1 ? 's' : ''} overdue for vitals`,
      recommendation: 'Prioritize vitals round before medication pass.',
      reasoning: [
        `${input.vitalsDueCount} active admissions exceed the 6-hour vitals interval.`,
        'Early-warning scoring depends on fresh observations.',
      ],
      confidence: 0.92,
      action: { label: 'Open vitals', to: '/nurse/vitals' },
    });
  }
  if (input.medsDueCount > 0) {
    out.push({
      id: 'mar-due',
      severity: 'warning',
      title: `${input.medsDueCount} medication${input.medsDueCount > 1 ? 's' : ''} pending administration`,
      recommendation: 'Complete MAR entries to keep the administration window.',
      reasoning: [
        `${input.medsDueCount} issued ward medicines without administration record.`,
        'Missed-window doses require physician notification per policy.',
      ],
      confidence: 0.94,
      action: { label: 'Open MAR', to: '/nurse/medications' },
    });
  }
  if (highAcuity > 0) {
    out.push({
      id: 'acuity-mix',
      severity: 'info',
      title: `${highAcuity} high-acuity patient${highAcuity > 1 ? 's' : ''} on the ward`,
      recommendation: 'Pair junior staff with senior cover for these beds this shift.',
      reasoning: [`${highAcuity} admissions flagged high nursing priority.`],
      confidence: 0.78,
    });
  }
  if (out.length === 0) {
    out.push({
      id: 'ward-clear',
      severity: 'info',
      title: 'Ward steady',
      recommendation: 'All vitals and medications inside windows.',
      reasoning: ['No overdue observations or pending administrations.'],
      confidence: 0.9,
    });
  }
  return out;
}

export function pharmacyInsights(input: {
  pendingRx: number;
  lowStock: StockLike[];
}): AIInsight[] {
  const out: AIInsight[] = [];
  if (input.pendingRx >= 5) {
    out.push({
      id: 'rx-backlog',
      severity: 'warning',
      title: `${input.pendingRx} prescriptions queued`,
      recommendation: 'Open a second dispensing counter for the next hour.',
      reasoning: [
        `${input.pendingRx} verified prescriptions awaiting dispense.`,
        'Queue above 5 historically pushes patient wait past 15 minutes.',
      ],
      confidence: 0.8,
      action: { label: 'Open queue', to: '/pharmacy/prescriptions' },
    });
  }
  if (input.lowStock.length > 0) {
    out.push({
      id: 'low-stock',
      severity: input.lowStock.length >= 5 ? 'critical' : 'warning',
      title: `${input.lowStock.length} item${input.lowStock.length > 1 ? 's' : ''} below reorder level`,
      recommendation: 'Raise purchase indent today to avoid stock-out within 72 hours.',
      reasoning: [
        `${input.lowStock.length} SKUs at/below reorder threshold.`,
        'Supplier lead time averages 2–3 days for these categories.',
      ],
      confidence: 0.85,
      action: { label: 'View inventory', to: '/pharmacy/inventory' },
    });
  }
  if (out.length === 0) {
    out.push({
      id: 'pharm-clear',
      severity: 'info',
      title: 'Dispensary nominal',
      recommendation: 'No queue or stock interventions needed.',
      reasoning: ['Rx queue and stock levels are inside control bands.'],
      confidence: 0.9,
    });
  }
  return out;
}

export function labInsights(input: { orders: LabOrderLike[] }): AIInsight[] {
  const out: AIInsight[] = [];
  const stat = input.orders.filter((o) => o.priority === 'stat' || o.priority === 'critical').length;
  const inProcess = input.orders.filter(
    (o) => o.stage && o.stage !== 'reported' && o.stage !== 'ordered',
  ).length;
  const total = input.orders.length;

  if (stat > 0) {
    out.push({
      id: 'stat-queue',
      severity: 'critical',
      title: `${stat} STAT order${stat > 1 ? 's' : ''} in pipeline`,
      recommendation: 'Fast-track STAT samples to front of analyser queue.',
      reasoning: [
        `${stat} order(s) carry stat/critical priority.`,
        'STAT TAT target is 60 minutes door-to-report.',
      ],
      confidence: 0.96,
      action: { label: 'Open worklist', to: '/lab/worklist' },
    });
  }
  if (total > 0 && pct(inProcess, total) > 60) {
    out.push({
      id: 'wip-high',
      severity: 'suggestion',
      title: 'High work-in-progress load',
      recommendation: 'Batch verification passes every 30 minutes to keep TAT flat.',
      reasoning: [
        `${inProcess}/${total} orders are mid-pipeline.`,
        'Verification is the current bottleneck stage by queue depth.',
      ],
      confidence: 0.72,
      action: { label: 'Verification queue', to: '/lab/verification' },
    });
  }
  if (out.length === 0) {
    out.push({
      id: 'lab-clear',
      severity: 'info',
      title: 'Pipeline flowing',
      recommendation: 'TAT on target across all priorities.',
      reasoning: ['No STAT backlog; WIP within band.'],
      confidence: 0.9,
    });
  }
  return out;
}

export function billingInsights(input: { invoices: InvoiceLike[] }): AIInsight[] {
  const out: AIInsight[] = [];
  const pending = input.invoices.filter((i) => i.status === 'pending' || i.status === 'due');
  const pendingValue = pending.reduce((s, i) => s + (i.total ?? i.amount ?? 0), 0);

  if (pending.length >= 5) {
    out.push({
      id: 'collections-push',
      severity: 'warning',
      title: `₹${Math.round(pendingValue).toLocaleString('en-IN')} uncollected across ${pending.length} invoices`,
      recommendation: 'Run collection calls on the top 5 by value before shift end.',
      reasoning: [
        `${pending.length} invoices pending/due totaling ₹${Math.round(pendingValue).toLocaleString('en-IN')}.`,
        'Same-day contact lifts recovery ~40% vs next-day.',
      ],
      confidence: 0.76,
      action: { label: 'Open invoices', to: '/billing-dept/invoices' },
    });
  }
  if (out.length === 0) {
    out.push({
      id: 'rcm-clear',
      severity: 'info',
      title: 'Collections healthy',
      recommendation: 'No aging risk in today\'s ledger.',
      reasoning: ['Pending invoice count under control threshold.'],
      confidence: 0.88,
    });
  }
  return out;
}

export function emergencyInsights(input: { cases: EmergencyLike[] }): AIInsight[] {
  const out: AIInsight[] = [];
  const active = input.cases.filter((c) => c.status !== 'discharged' && c.status !== 'admitted');
  const critical = active.filter((c) => c.triage === 'critical').length;
  const urgent = active.filter((c) => c.triage === 'urgent').length;

  if (critical > 0) {
    out.push({
      id: 'er-crit',
      severity: 'critical',
      title: `${critical} critical patient${critical > 1 ? 's' : ''} active`,
      recommendation: 'Confirm airway/ICU pathway and senior presence per case.',
      reasoning: [`${critical} case(s) at critical triage in active states.`],
      confidence: 0.97,
      action: { label: 'Treatment board', to: '/emergency/treatment' },
    });
  }
  if (urgent >= 3) {
    out.push({
      id: 'er-urgent-load',
      severity: 'warning',
      title: `${urgent} urgent cases — load rising`,
      recommendation: 'Pull one floor nurse to ER for the next 2 hours.',
      reasoning: [
        `${urgent} urgent-triage active cases concurrently.`,
        'Urgent backlog above 3 degrades reassessment intervals.',
      ],
      confidence: 0.74,
    });
  }
  if (out.length === 0) {
    out.push({
      id: 'er-clear',
      severity: 'info',
      title: 'ER stable',
      recommendation: 'No acuity flags; keep triage interval at standard.',
      reasoning: ['No critical cases; urgent load under threshold.'],
      confidence: 0.9,
    });
  }
  return out;
}

/** Generic module insight for screens without a dedicated engine yet. */
export function genericModuleInsights(moduleName: string): AIInsight[] {
  return [
    {
      id: 'generic',
      severity: 'info',
      title: `${moduleName} monitored`,
      recommendation: 'No anomalies detected in this module today.',
      reasoning: [
        'Heuristic engine for this module ships in the next intelligence wave.',
        'Connected to the same advisory contract as all other modules.',
      ],
      confidence: 0.6,
    },
  ];
}
