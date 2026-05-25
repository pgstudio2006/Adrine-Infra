import { createLifecycleRuntime } from './lifecycle-runtime.js';
import { ipdAdmissionLifecycle, type IpdAdmissionState } from '../lifecycles/ipd-admission.js';
import { runIpdValidations, type IpdValidationContext } from '../ipd/ipd-validation.js';

const ipdRuntime = createLifecycleRuntime<IpdAdmissionState, IpdValidationContext>({
  definition: ipdAdmissionLifecycle,
  validate: runIpdValidations,
});

export const evaluateIpdTransition = ipdRuntime.evaluate.bind(ipdRuntime);
export const listAllowedIpdActions = ipdRuntime.allowedActions.bind(ipdRuntime);
export const getIpdTransition = ipdRuntime.getTransition.bind(ipdRuntime);

export const IPD_TERMINAL_STATES: readonly IpdAdmissionState[] = ['discharged', 'cancelled'];

export const IPD_BLOCKING_STATES: readonly IpdAdmissionState[] = [
  'admission_requested',
  'awaiting_approval',
  'bed_assignment_pending',
  'admitted',
  'active_care',
  'transfer_pending',
  'transferred',
  'discharge_pending',
];
