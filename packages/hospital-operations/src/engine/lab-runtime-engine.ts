import { createLifecycleRuntime } from './lifecycle-runtime.js';
import { labSampleLifecycle, type LabOrderState } from '../lifecycles/lab-sample.js';
import { runLabValidations, type LabValidationContext } from '../lab/lab-validation.js';

const labRuntime = createLifecycleRuntime<LabOrderState, LabValidationContext>({
  definition: labSampleLifecycle,
  validate: runLabValidations,
});

export const evaluateLabTransition = labRuntime.evaluate.bind(labRuntime);
export const listAllowedLabActions = labRuntime.allowedActions.bind(labRuntime);

/** Terminal states for dependency checks (OPD / discharge). */
export const LAB_TERMINAL_STATES: readonly LabOrderState[] = [
  'completed',
  'cancelled',
];

export const LAB_BLOCKING_STATES: readonly LabOrderState[] = [
  'ordered',
  'awaiting_collection',
  'collected',
  'labeled',
  'in_transit',
  'in_processing',
  'awaiting_review',
  'critical_review',
  'approved',
  'published',
  'recollect_required',
];

export function mapUiLabStageToState(
  stage: 'Pending Analysis' | 'In Analysis' | 'Awaiting Validation' | 'Validated' | 'Reported',
): LabOrderState {
  const map = {
    'Pending Analysis': 'awaiting_collection',
    'In Analysis': 'in_processing',
    'Awaiting Validation': 'awaiting_review',
    Validated: 'approved',
    Reported: 'published',
  } as const;
  return map[stage];
}

/** Preferred next platform action when UI advances to a stage. */
const VERIFY_ACTIONS = new Set(['verify_results', 'approve_results']);
const RELEASE_ACTION = 'publish_report';

/** GAP-005: governed verify/release — no shortcut from pre-review states. */
export function getRequiredLabActionForUiStage(
  current: LabOrderState,
  uiStage: 'Pending Analysis' | 'In Analysis' | 'Awaiting Validation' | 'Validated' | 'Reported',
): string | null {
  if (uiStage === 'Validated') {
    if (current === 'awaiting_review' || current === 'critical_review') {
      return 'verify_results';
    }
    return null;
  }
  if (uiStage === 'Reported') {
    if (current === 'approved') return RELEASE_ACTION;
    return null;
  }
  return preferredActionForUiStage(current, uiStage);
}

export function guardLabUiStageAdvance(
  current: LabOrderState,
  uiStage: 'Pending Analysis' | 'In Analysis' | 'Awaiting Validation' | 'Validated' | 'Reported',
): { ok: true } | { ok: false; reason: string } {
  if (uiStage === 'Validated') {
    if (current !== 'awaiting_review' && current !== 'critical_review') {
      return {
        ok: false,
        reason:
          'Results must be in Awaiting Validation before verify. Enter results and submit for validation first.',
      };
    }
    return { ok: true };
  }
  if (uiStage === 'Reported') {
    if (current !== 'approved') {
      return {
        ok: false,
        reason: 'Report release blocked until results are verified (approved state required).',
      };
    }
    return { ok: true };
  }
  return { ok: true };
}

export function isLabVerifyAction(action: string): boolean {
  return VERIFY_ACTIONS.has(action);
}

export function preferredActionForUiStage(
  current: LabOrderState,
  uiStage: 'Pending Analysis' | 'In Analysis' | 'Awaiting Validation' | 'Validated' | 'Reported',
): string | null {
  const target = mapUiLabStageToState(uiStage);
  const shortcuts: Record<string, Record<string, string>> = {
    ordered: { awaiting_collection: 'validate_order' },
    awaiting_collection: { in_processing: 'collect_sample', collected: 'collect_sample' },
    collected: { in_processing: 'start_processing', labeled: 'label_sample' },
    labeled: { in_processing: 'start_processing' },
    in_transit: { in_processing: 'start_processing' },
    in_processing: { awaiting_review: 'enter_results' },
    awaiting_review: {
      approved: 'verify_results',
      critical_review: 'flag_critical',
    },
    critical_review: { approved: 'approve_results' },
    approved: { published: 'publish_report' },
    published: { completed: 'complete_order' },
  };
  return shortcuts[current]?.[target] ?? null;
}
