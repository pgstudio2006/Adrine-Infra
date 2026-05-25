import type { RadiologyOrderState } from '../lifecycles/radiology-order.js';
import {
  RADIOLOGY_BLOCKING_STATES,
  RADIOLOGY_TERMINAL_STATES,
} from '../engine/radiology-runtime-engine.js';

export type OpdRadiologyDependencyInput = {
  opdVisitState: string;
  radiologyOrders: readonly { state: RadiologyOrderState; isCritical?: boolean; study: string }[];
  mandatoryStudiesPending?: boolean;
  criticalUnacknowledged?: boolean;
};

export type OpdRadiologyBlocker = {
  code: string;
  message: string;
  severity: 'warning' | 'critical';
};

/** Cross-runtime: OPD cannot safely close while radiology studies incomplete. */
export function evaluateOpdRadiologyBlockers(
  input: OpdRadiologyDependencyInput,
): OpdRadiologyBlocker[] {
  const blockers: OpdRadiologyBlocker[] = [];
  const pending = input.radiologyOrders.filter((o) => RADIOLOGY_BLOCKING_STATES.includes(o.state));

  if (pending.length > 0 && ['orders_pending', 'billing_pending'].includes(input.opdVisitState)) {
    blockers.push({
      code: 'RADIOLOGY_PENDING',
      message: `${pending.length} radiology order(s) still in progress`,
      severity: 'warning',
    });
  }

  const critical = input.radiologyOrders.filter(
    (o) =>
      o.state === 'critical_review' ||
      (o.isCritical && !RADIOLOGY_TERMINAL_STATES.includes(o.state)),
  );
  if (critical.length > 0) {
    blockers.push({
      code: 'RADIOLOGY_CRITICAL',
      message: `${critical.length} critical imaging finding(s) require review`,
      severity: 'critical',
    });
  }

  if (input.mandatoryStudiesPending) {
    blockers.push({
      code: 'RADIOLOGY_MANDATORY',
      message: 'Mandatory imaging must complete before visit closure',
      severity: 'critical',
    });
  }

  if (input.criticalUnacknowledged) {
    blockers.push({
      code: 'RADIOLOGY_CRITICAL_ACK',
      message: 'Critical imaging findings must be acknowledged',
      severity: 'critical',
    });
  }

  return blockers;
}
