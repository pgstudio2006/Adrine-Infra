/** Maps platform billing blockers to GAP-006 / GAP-007 labels (Hospital OS gap analysis). */
export type BillingGateId = 'GAP-006' | 'GAP-007';

export type BillingGateMessage = {
  gapId: BillingGateId;
  message: string;
};

export const BILLING_GATE_COPY: Record<
  BillingGateId,
  { title: string; hint: string }
> = {
  'GAP-006': {
    title: 'Encounter closure gate',
    hint: 'Close the clinical encounter and move the visit to billing_pending before invoice settlement or charge sync.',
  },
  'GAP-007': {
    title: 'Insurance pre-authorization gate',
    hint: 'Start and approve TPA pre-auth on the admission before IPD charges or high-cost orders exceed the approved cap.',
  },
};

export function classifyBillingBlocker(message: string): BillingGateId | null {
  const m = message.toLowerCase();
  if (
    m.includes('encounter') ||
    m.includes('billing_pending') ||
    m.includes('closed before billing') ||
    m.includes('visit not yet in billing')
  ) {
    return 'GAP-006';
  }
  if (
    m.includes('pre-auth') ||
    m.includes('preauthorization') ||
    m.includes('pre-authorization') ||
    m.includes('insurance authorization')
  ) {
    return 'GAP-007';
  }
  return null;
}

export function blockersToGateMessages(blockers: string[]): BillingGateMessage[] {
  const seen = new Set<string>();
  const out: BillingGateMessage[] = [];
  for (const message of blockers) {
    const gapId = classifyBillingBlocker(message);
    if (!gapId) continue;
    const key = `${gapId}:${message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ gapId, message });
  }
  return out;
}

export function branchGateHints(opts: {
  dischargeBillingBlockers?: number;
  stuckInsurance?: number;
  reconciliationWarnings?: string[];
}): BillingGateMessage[] {
  const out: BillingGateMessage[] = [];
  if ((opts.dischargeBillingBlockers ?? 0) > 0) {
    out.push({
      gapId: 'GAP-006',
      message: `${opts.dischargeBillingBlockers} admission(s) blocked at discharge billing clearance`,
    });
  }
  if ((opts.stuckInsurance ?? 0) > 0) {
    out.push({
      gapId: 'GAP-007',
      message: `${opts.stuckInsurance} insurance authorization(s) awaiting TPA approval`,
    });
  }
  for (const w of opts.reconciliationWarnings ?? []) {
    const gapId = classifyBillingBlocker(w);
    if (gapId) out.push({ gapId, message: w });
  }
  return out;
}
