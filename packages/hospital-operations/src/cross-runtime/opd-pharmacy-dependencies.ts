import type { PharmacyFulfillmentState } from '../lifecycles/pharmacy-fulfillment.js';
import {
  PHARMACY_BLOCKING_STATES,
  PHARMACY_TERMINAL_STATES,
} from '../engine/pharmacy-runtime-engine.js';

export type OpdPharmacyDependencyInput = {
  opdVisitState: string;
  fulfillments: readonly {
    state: PharmacyFulfillmentState;
    isControlled?: boolean;
    controlledApproved?: boolean;
    priority?: string;
  }[];
  dischargeMedicationsPending?: boolean;
};

export type OpdPharmacyBlocker = {
  code: string;
  message: string;
  severity: 'warning' | 'critical';
};

/** Cross-runtime: OPD/discharge blocked while medication fulfillment incomplete. */
export function evaluateOpdPharmacyBlockers(input: OpdPharmacyDependencyInput): OpdPharmacyBlocker[] {
  const blockers: OpdPharmacyBlocker[] = [];
  const pending = input.fulfillments.filter((f) => PHARMACY_BLOCKING_STATES.includes(f.state));

  if (
    pending.length > 0 &&
    ['orders_pending', 'billing_pending'].includes(input.opdVisitState)
  ) {
    blockers.push({
      code: 'PHARMACY_PENDING',
      message: `${pending.length} prescription(s) awaiting pharmacy fulfillment`,
      severity: 'warning',
    });
  }

  const controlledUnapproved = input.fulfillments.filter(
    (f) =>
      f.isControlled &&
      !f.controlledApproved &&
      !PHARMACY_TERMINAL_STATES.includes(f.state),
  );
  if (controlledUnapproved.length > 0) {
    blockers.push({
      code: 'PHARMACY_CONTROLLED',
      message: `${controlledUnapproved.length} controlled medication(s) need approval`,
      severity: 'critical',
    });
  }

  const urgentPending = input.fulfillments.filter(
    (f) =>
      f.priority === 'Emergency' &&
      !['completed', 'cancelled', 'returned'].includes(f.state),
  );
  if (urgentPending.length > 0) {
    blockers.push({
      code: 'PHARMACY_URGENT',
      message: `${urgentPending.length} emergency prescription(s) must be fulfilled`,
      severity: 'critical',
    });
  }

  if (input.dischargeMedicationsPending) {
    blockers.push({
      code: 'PHARMACY_DISCHARGE',
      message: 'Discharge medications must be dispensed before closure',
      severity: 'critical',
    });
  }

  return blockers;
}
