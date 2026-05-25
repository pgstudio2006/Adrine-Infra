import {
  evaluateOpdTransition,
  evaluateLabTransition,
  evaluateIpdTransition,
  evaluateDischargeTransition,
  guardLabUiStageAdvance,
  ipdAdmissionLifecycle,
  dischargeOrchestrationLifecycle,
  type OpdVisitState,
  type OpdValidationContext,
  type LabOrderState,
  type IpdAdmissionState,
  type DischargeOrchestrationState,
  type IpdValidationContext,
  type DischargeValidationContext,
} from '@adrine/hospital-operations';
import { getBranchConfigOverrides } from '@/runtime/branch-config';
import { transitionFailureReason } from '@/operations/transition-errors';
import { toast } from 'sonner';
import { opdVisitLifecycle } from '@adrine/hospital-operations';

/** Enforce OPD lifecycle transition with validations (client-side mirror of domain-api). */
export function guardOpdTransition(
  from: OpdVisitState,
  action: string,
  role: string,
  context?: OpdValidationContext,
): void {
  const result = evaluateOpdTransition({
    visitState: from,
    action,
    actorRole: role,
    validationContext: context,
    branchOverrides: getBranchConfigOverrides(),
  });
  if (!result.ok) {
    const reason = transitionFailureReason(result);
    toast.error('Action not allowed', { description: reason });
    throw new Error(reason);
  }
}

/** Enforce lab sample lifecycle transition (mirrors domain-api LabRuntimeService). */
export function guardLabTransition(
  from: LabOrderState,
  action: string,
  role: string,
): void {
  const result = evaluateLabTransition({
    state: from,
    action,
    actorRole: role,
    validationContext: { patientIdentified: true, testsDefined: true },
  });
  if (!result.ok) {
    const reason = transitionFailureReason(result, 'Lab workflow blocked');
    toast.error('Lab workflow blocked', { description: reason });
    throw new Error(reason);
  }
}

export function guardIpdTransition(
  from: IpdAdmissionState,
  action: string,
  role: string,
  context?: IpdValidationContext,
): void {
  const result = evaluateIpdTransition({
    state: from,
    action,
    actorRole: role,
    validationContext: context,
  });
  if (!result.ok) {
    const reason = transitionFailureReason(result, 'IPD action not allowed');
    toast.error('IPD action not allowed', { description: reason });
    throw new Error(reason);
  }
}

export function guardDischargeTransition(
  from: DischargeOrchestrationState,
  action: string,
  role: string,
  context?: DischargeValidationContext,
): void {
  const result = evaluateDischargeTransition({
    state: from,
    action,
    actorRole: role,
    validationContext: context,
  });
  if (!result.ok) {
    const reason = transitionFailureReason(result, 'Discharge step blocked');
    toast.error('Discharge step blocked', { description: reason });
    throw new Error(reason);
  }
}

export function getClientIpdState(
  platformState?: string,
  localHint?: IpdAdmissionState,
): IpdAdmissionState {
  if (platformState && ipdAdmissionLifecycle.states.includes(platformState as IpdAdmissionState)) {
    return platformState as IpdAdmissionState;
  }
  return localHint ?? 'admission_requested';
}

export function getClientDischargeState(
  platformState?: string,
  localHint?: DischargeOrchestrationState,
): DischargeOrchestrationState {
  if (
    platformState &&
    dischargeOrchestrationLifecycle.states.includes(platformState as DischargeOrchestrationState)
  ) {
    return platformState as DischargeOrchestrationState;
  }
  return localHint ?? 'initiated';
}

export function getClientOpdState(
  platformState?: string,
  localHint?: OpdVisitState,
): OpdVisitState {
  if (platformState && opdVisitLifecycle.states.includes(platformState as OpdVisitState)) {
    return platformState as OpdVisitState;
  }
  return localHint ?? 'appointment_or_walkin';
}

/** UI lab stage → governed domain action (client mirror before platform ui-stage POST). */
export function labUiStageToGuardAction(
  targetStage: 'Pending Analysis' | 'In Analysis' | 'Awaiting Validation' | 'Validated' | 'Reported',
): string | null {
  switch (targetStage) {
    case 'In Analysis':
      return 'start_processing';
    case 'Awaiting Validation':
      return 'enter_results';
    case 'Validated':
      return 'verify_results';
    case 'Reported':
      return 'publish_report';
    default:
      return null;
  }
}

export function guardLabUiStage(
  from: LabOrderState,
  targetStage: 'Pending Analysis' | 'In Analysis' | 'Awaiting Validation' | 'Validated' | 'Reported',
  role: string,
): void {
  const gate = guardLabUiStageAdvance(from, targetStage);
  if (gate.ok === false) {
    toast.error('Lab verify gate', { description: gate.reason });
    throw new Error(gate.reason);
  }
  const action = labUiStageToGuardAction(targetStage);
  if (action) {
    guardLabTransition(from, action, role);
  }
}

/** Maps local admission status changes to required platform IPD actions. */
export function requiredPlatformActionsForLocalAdmissionStatus(
  target: 'discharge-ready' | 'discharged',
): string[] {
  if (target === 'discharge-ready') {
    return ['start_active_care', 'initiate_discharge'];
  }
  return ['complete_discharge'];
}

export function guardLocalAdmissionStatusAgainstPlatform(
  target: 'discharge-ready' | 'discharged',
  allowedActions: string[],
  platformState?: string,
): void {
  const required = requiredPlatformActionsForLocalAdmissionStatus(target);
  const reachable = required.some((action) => allowedActions.includes(action));
  if (!reachable) {
    const hint = platformState
      ? `Platform admission is in "${platformState}".`
      : 'Platform admission lifecycle is not ready.';
    toast.error('Admission status change blocked', {
      description: `${hint} Allowed next steps: ${allowedActions.join(', ') || 'none'}.`,
    });
    throw new Error('Platform IPD lifecycle does not allow this status change');
  }
}
