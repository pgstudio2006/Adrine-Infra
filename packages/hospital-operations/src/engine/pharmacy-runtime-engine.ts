import { createLifecycleRuntime } from './lifecycle-runtime.js';
import {
  pharmacyFulfillmentLifecycle,
  type PharmacyFulfillmentState,
} from '../lifecycles/pharmacy-fulfillment.js';
import {
  runPharmacyValidations,
  type PharmacyValidationContext,
} from '../pharmacy/pharmacy-validation.js';

const pharmacyRuntime = createLifecycleRuntime<PharmacyFulfillmentState, PharmacyValidationContext>({
  definition: pharmacyFulfillmentLifecycle,
  validate: runPharmacyValidations,
});

export const evaluatePharmacyTransition = pharmacyRuntime.evaluate.bind(pharmacyRuntime);
export const listAllowedPharmacyActions = pharmacyRuntime.allowedActions.bind(pharmacyRuntime);

export const PHARMACY_TERMINAL_STATES: readonly PharmacyFulfillmentState[] = [
  'completed',
  'cancelled',
  'returned',
];

export const PHARMACY_BLOCKING_STATES: readonly PharmacyFulfillmentState[] = [
  'prescribed',
  'awaiting_review',
  'inventory_reserved',
  'preparing',
  'ready_to_dispense',
  'partially_dispensed',
  'dispensed',
  'refill_pending',
];

export type UiPrescriptionStatus =
  | 'Pending'
  | 'Verified'
  | 'Dispensed'
  | 'Partially dispensed'
  | 'Cancelled';

export function mapUiRxStatusToState(status: UiPrescriptionStatus): PharmacyFulfillmentState {
  const map: Record<UiPrescriptionStatus, PharmacyFulfillmentState> = {
    Pending: 'awaiting_review',
    Verified: 'ready_to_dispense',
    'Partially dispensed': 'partially_dispensed',
    Dispensed: 'dispensed',
    Cancelled: 'cancelled',
  };
  return map[status];
}

/** Preferred next platform action when UI advances prescription status. */
export function preferredActionForUiRxStatus(
  current: PharmacyFulfillmentState,
  uiStatus: UiPrescriptionStatus,
): string | null {
  const target = mapUiRxStatusToState(uiStatus);
  const shortcuts: Record<string, Record<string, string>> = {
    prescribed: { awaiting_review: 'validate_prescription' },
    awaiting_review: {
      inventory_reserved: 'reserve_inventory',
      ready_to_dispense: 'reserve_inventory',
    },
    inventory_reserved: { preparing: 'start_preparation', ready_to_dispense: 'start_preparation' },
    preparing: { ready_to_dispense: 'approve_dispense' },
    ready_to_dispense: {
      dispensed: 'dispense_full',
      partially_dispensed: 'dispense_partial',
    },
    partially_dispensed: { dispensed: 'complete_dispense' },
    dispensed: { completed: 'complete_fulfillment' },
    completed: { cancelled: 'cancel_prescription' },
  };
  if (uiStatus === 'Cancelled') return 'cancel_prescription';
  return shortcuts[current]?.[target] ?? null;
}
