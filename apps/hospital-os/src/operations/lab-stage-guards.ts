import {
  guardLabUiStageAdvance,
  mapUiLabStageToState,
  type LabOrderState,
} from '@adrine/hospital-operations';
import { toast } from 'sonner';

export type UiLabStage =
  | 'Pending Analysis'
  | 'In Analysis'
  | 'Awaiting Validation'
  | 'Validated'
  | 'Reported';

export function resolveLabPlatformState(
  platformState: string | undefined,
  localStage?: UiLabStage,
): LabOrderState | undefined {
  return (platformState ?? (localStage ? mapUiLabStageToState(localStage) : undefined)) as
    | LabOrderState
    | undefined;
}

export function assertLabUiStageAllowed(
  platformState: string | undefined,
  uiStage: UiLabStage,
  localStage?: UiLabStage,
): void {
  const state = resolveLabPlatformState(platformState, localStage);
  if (!state) {
    if (uiStage === 'Validated' || uiStage === 'Reported') {
      const msg = 'Cannot verify or release without platform lab state.';
      toast.error('Lab verify gate', { description: msg });
      throw new Error(msg);
    }
    return;
  }
  const gate = guardLabUiStageAdvance(state, uiStage);
  if (gate.ok === false) {
    toast.error('Lab verify gate', { description: gate.reason });
    throw new Error(gate.reason);
  }
}

export function canReleaseLabReport(
  platformState: string | undefined,
  localStage?: UiLabStage,
): boolean {
  const state = resolveLabPlatformState(platformState, localStage);
  if (!state) return localStage === 'Validated';
  return guardLabUiStageAdvance(state, 'Reported').ok;
}

export function canVerifyLabResults(
  platformState: string | undefined,
  localStage?: UiLabStage,
): boolean {
  const state = resolveLabPlatformState(platformState, localStage);
  if (!state) return localStage === 'Awaiting Validation';
  return guardLabUiStageAdvance(state, 'Validated').ok;
}

/** GAP-005: human-readable reason when verify is disabled. */
export function getLabVerifyDisabledReason(input: {
  platformState?: string;
  localStage?: UiLabStage;
  hasResults?: boolean;
}): string | null {
  const { platformState, localStage, hasResults } = input;
  if (!hasResults) {
    return 'Enter result summary before pathologist verification.';
  }
  const state = resolveLabPlatformState(platformState, localStage);
  if (!state) {
    if (localStage !== 'Awaiting Validation') {
      return 'Order must be awaiting validation before verify.';
    }
    return null;
  }
  const gate = guardLabUiStageAdvance(state, 'Validated');
  if (gate.ok === false) return gate.reason;
  if (state === 'critical_review') {
    return 'Critical result — use approve after secondary review.';
  }
  return null;
}

/** GAP-005: human-readable reason when release is disabled. */
export function getLabReleaseDisabledReason(input: {
  platformState?: string;
  localStage?: UiLabStage;
}): string | null {
  const { platformState, localStage } = input;
  const state = resolveLabPlatformState(platformState, localStage);
  if (!state) {
    if (localStage !== 'Validated') {
      return 'Validate results before releasing the report to clinicians.';
    }
    return null;
  }
  const gate = guardLabUiStageAdvance(state, 'Reported');
  if (gate.ok === false) return gate.reason;
  return null;
}
