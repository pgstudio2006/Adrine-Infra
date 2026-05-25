import { createLifecycleRuntime } from './lifecycle-runtime.js';
import {
  medicationAdminLifecycle,
  type MedicationAdminState,
} from '../lifecycles/medication-administration.js';
import { runMarValidations, type MarValidationContext } from '../mar/mar-validation.js';

const marRuntime = createLifecycleRuntime<MedicationAdminState, MarValidationContext>({
  definition: medicationAdminLifecycle,
  validate: runMarValidations,
});

export const evaluateMarTransition = marRuntime.evaluate.bind(marRuntime);
export const listAllowedMarActions = marRuntime.allowedActions.bind(marRuntime);

export const MAR_OPEN_STATES: readonly MedicationAdminState[] = ['scheduled', 'held'];
