import type { OperationalSnapshotCounts } from '../command/operational-snapshot.js';

export type EscalationRuleInput = {
  counts: OperationalSnapshotCounts;
  branchId: string;
  now: Date;
};

export type EscalationRuleHit = {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  sourceRuntime: string;
  resourceId?: string;
  message: string;
};

/**
 * Cross-runtime escalation rules evaluated during snapshot build or explicit evaluate.
 */
export function evaluateEscalationRules(input: EscalationRuleInput): EscalationRuleHit[] {
  const hits: EscalationRuleHit[] = [];
  const { counts } = input;

  if (counts.labCriticalUnacked > 0) {
    hits.push({
      type: 'critical_lab_unacked',
      severity: 'critical',
      sourceRuntime: 'lab',
      message: `${counts.labCriticalUnacked} critical lab result(s) awaiting acknowledgment`,
    });
  }

  if (counts.nursingMissed > 0) {
    hits.push({
      type: 'nursing_task_missed',
      severity: 'high',
      sourceRuntime: 'nursing',
      message: `${counts.nursingMissed} nursing task(s) missed SLA`,
    });
  }

  if (counts.dischargeInProgress > 3) {
    hits.push({
      type: 'discharge_backlog',
      severity: 'medium',
      sourceRuntime: 'discharge',
      message: `${counts.dischargeInProgress} discharge orchestrations in progress`,
    });
  }

  if (counts.opdWaitingQueue > 15) {
    hits.push({
      type: 'queue_sla_breach',
      severity: 'high',
      sourceRuntime: 'opd',
      message: `Queue depth ${counts.opdWaitingQueue} exceeds SLA threshold`,
    });
  }

  if (counts.insurancePending > 5) {
    hits.push({
      type: 'insurance_hold',
      severity: 'medium',
      sourceRuntime: 'insurance',
      message: `${counts.insurancePending} insurance authorization(s) pending`,
    });
  }

  if (counts.bedsAvailable === 0 && counts.ipdActiveAdmissions > 0) {
    hits.push({
      type: 'icu_capacity',
      severity: 'critical',
      sourceRuntime: 'bed',
      message: 'No available beds while admissions are active',
    });
  }

  return hits;
}
