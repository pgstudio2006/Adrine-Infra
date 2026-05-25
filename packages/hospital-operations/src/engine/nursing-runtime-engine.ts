import { createLifecycleRuntime } from './lifecycle-runtime.js';
import { nursingTaskLifecycle, type NursingTaskState } from '../lifecycles/nursing-task.js';
import { runNursingValidations, type NursingValidationContext } from '../nursing/nursing-validation.js';

const nursingRuntime = createLifecycleRuntime<NursingTaskState, NursingValidationContext>({
  definition: nursingTaskLifecycle,
  validate: runNursingValidations,
});

export const evaluateNursingTransition = nursingRuntime.evaluate.bind(nursingRuntime);
export const listAllowedNursingActions = nursingRuntime.allowedActions.bind(nursingRuntime);

export const NURSING_OPEN_STATES: readonly NursingTaskState[] = [
  'scheduled',
  'acknowledged',
  'in_progress',
  'escalated',
];
