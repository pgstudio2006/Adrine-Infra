import { createLifecycleRuntime } from './lifecycle-runtime.js';
import { otCaseLifecycle, type OtCaseState } from '../lifecycles/ot-case.js';
import { runOtValidations, type OtValidationContext } from '../ot/ot-validation.js';

const otRuntime = createLifecycleRuntime<OtCaseState, OtValidationContext>({
  definition: otCaseLifecycle,
  validate: runOtValidations,
});

export const evaluateOtTransition = otRuntime.evaluate.bind(otRuntime);
export const listAllowedOtActions = otRuntime.allowedActions.bind(otRuntime);

export const OT_TERMINAL_STATES: readonly OtCaseState[] = ['completed', 'cancelled'];

export const OT_ACTIVE_STATES: readonly OtCaseState[] = [
  'scheduled',
  'confirmed',
  'preop_ready',
  'in_progress',
  'postop_recovery',
];
