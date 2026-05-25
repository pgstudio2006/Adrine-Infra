import { createLifecycleRuntime } from './lifecycle-runtime.js';
import {
  dialysisSessionLifecycle,
  type DialysisSessionState,
} from '../lifecycles/dialysis-session.js';
import {
  runDialysisValidations,
  type DialysisValidationContext,
} from '../dialysis/dialysis-validation.js';

const dialysisRuntime = createLifecycleRuntime<DialysisSessionState, DialysisValidationContext>({
  definition: dialysisSessionLifecycle,
  validate: runDialysisValidations,
});

export const evaluateDialysisTransition = dialysisRuntime.evaluate.bind(dialysisRuntime);
export const listAllowedDialysisActions = dialysisRuntime.allowedActions.bind(dialysisRuntime);

export const DIALYSIS_TERMINAL_STATES: readonly DialysisSessionState[] = [
  'completed',
  'cancelled',
  'no_show',
];
