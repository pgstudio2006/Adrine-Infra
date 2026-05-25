import type { LabOrderState } from '../lifecycles/lab-sample.js';
import { LAB_BLOCKING_STATES, LAB_TERMINAL_STATES } from '../engine/lab-runtime-engine.js';

export type OpdLabDependencyInput = {
  opdVisitState: string;
  labOrders: readonly { state: LabOrderState; isCritical?: boolean; tests: string }[];
  mandatoryTestsPending?: boolean;
  criticalUnacknowledged?: boolean;
};

export type OpdLabBlocker = {
  code: string;
  message: string;
  severity: 'warning' | 'critical';
};

/** Cross-runtime: OPD cannot safely close while mandatory diagnostics incomplete. */
export function evaluateOpdLabBlockers(input: OpdLabDependencyInput): OpdLabBlocker[] {
  const blockers: OpdLabBlocker[] = [];
  const pending = input.labOrders.filter((o) => LAB_BLOCKING_STATES.includes(o.state));

  if (pending.length > 0 && ['orders_pending', 'billing_pending'].includes(input.opdVisitState)) {
    blockers.push({
      code: 'LAB_PENDING',
      message: `${pending.length} lab order(s) still in progress`,
      severity: 'warning',
    });
  }

  const critical = input.labOrders.filter(
    (o) => o.state === 'critical_review' || (o.isCritical && !LAB_TERMINAL_STATES.includes(o.state)),
  );
  if (critical.length > 0) {
    blockers.push({
      code: 'LAB_CRITICAL',
      message: `${critical.length} critical lab result(s) require review`,
      severity: 'critical',
    });
  }

  if (input.mandatoryTestsPending) {
    blockers.push({
      code: 'LAB_MANDATORY',
      message: 'Mandatory lab tests must complete before visit closure',
      severity: 'critical',
    });
  }

  if (input.criticalUnacknowledged) {
    blockers.push({
      code: 'LAB_CRITICAL_ACK',
      message: 'Critical lab values must be acknowledged by clinician',
      severity: 'critical',
    });
  }

  return blockers;
}
