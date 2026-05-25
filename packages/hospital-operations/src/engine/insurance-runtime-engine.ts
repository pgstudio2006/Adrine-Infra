import { createLifecycleRuntime } from './lifecycle-runtime.js';
import {
  insuranceTpaLifecycle,
  type InsuranceAuthorizationState,
} from '../lifecycles/insurance-tpa.js';
import { runInsuranceValidations, type InsuranceValidationContext } from '../insurance/insurance-validation.js';

const insuranceRuntime = createLifecycleRuntime<
  InsuranceAuthorizationState,
  InsuranceValidationContext
>({
  definition: insuranceTpaLifecycle,
  validate: runInsuranceValidations,
});

export const evaluateInsuranceTransition = insuranceRuntime.evaluate.bind(insuranceRuntime);
export const listAllowedInsuranceActions = insuranceRuntime.allowedActions.bind(insuranceRuntime);

export const INSURANCE_APPROVED_STATES: readonly InsuranceAuthorizationState[] = [
  'approved',
  'partially_approved',
  'settled',
];
