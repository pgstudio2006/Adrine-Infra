import { createLifecycleRuntime } from './lifecycle-runtime.js';
import {
  dischargeOrchestrationLifecycle,
  type DischargeOrchestrationState,
} from '../lifecycles/discharge-orchestration.js';
import { runDischargeValidations, type DischargeValidationContext } from '../discharge/discharge-validation.js';

const dischargeRuntime = createLifecycleRuntime<
  DischargeOrchestrationState,
  DischargeValidationContext
>({
  definition: dischargeOrchestrationLifecycle,
  validate: runDischargeValidations,
});

export const evaluateDischargeTransition = dischargeRuntime.evaluate.bind(dischargeRuntime);
export const listAllowedDischargeActions = dischargeRuntime.allowedActions.bind(dischargeRuntime);

export const DISCHARGE_TERMINAL_STATES: readonly DischargeOrchestrationState[] = [
  'discharged',
  'cancelled',
];

export const DISCHARGE_READY_STATE: DischargeOrchestrationState = 'ready_for_discharge';
