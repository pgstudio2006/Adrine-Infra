import { createLifecycleRuntime } from './lifecycle-runtime.js';
import {
  radiologyOrderLifecycle,
  type RadiologyOrderState,
} from '../lifecycles/radiology-order.js';
import {
  runRadiologyValidations,
  type RadiologyValidationContext,
} from '../radiology/radiology-validation.js';

const radiologyRuntime = createLifecycleRuntime<RadiologyOrderState, RadiologyValidationContext>({
  definition: radiologyOrderLifecycle,
  validate: runRadiologyValidations,
});

export const evaluateRadiologyTransition = radiologyRuntime.evaluate.bind(radiologyRuntime);
export const listAllowedRadiologyActions = radiologyRuntime.allowedActions.bind(radiologyRuntime);

export const RADIOLOGY_TERMINAL_STATES: readonly RadiologyOrderState[] = [
  'completed',
  'cancelled',
];

export const RADIOLOGY_BLOCKING_STATES: readonly RadiologyOrderState[] = [
  'ordered',
  'scheduled',
  'imaging_in_progress',
  'awaiting_review',
  'critical_review',
  'approved',
  'published',
];

export function mapUiRadiologyStatusToState(
  status: 'Ordered' | 'Scheduled' | 'In Progress' | 'Completed' | 'Reported',
): RadiologyOrderState {
  const map = {
    Ordered: 'ordered',
    Scheduled: 'scheduled',
    'In Progress': 'imaging_in_progress',
    Completed: 'awaiting_review',
    Reported: 'published',
  } as const;
  return map[status];
}

export function preferredRadiologyActionForUiStatus(
  current: RadiologyOrderState,
  uiStatus: 'Ordered' | 'Scheduled' | 'In Progress' | 'Completed' | 'Reported',
): string | null {
  const target = mapUiRadiologyStatusToState(uiStatus);
  const shortcuts: Record<string, Record<string, string>> = {
    ordered: { scheduled: 'schedule_study' },
    scheduled: { imaging_in_progress: 'start_imaging' },
    imaging_in_progress: { awaiting_review: 'complete_imaging' },
    awaiting_review: { approved: 'approve_report', critical_review: 'flag_critical' },
    critical_review: { approved: 'approve_report' },
    approved: { published: 'publish_report' },
    published: { completed: 'complete_order' },
  };
  return shortcuts[current]?.[target] ?? null;
}
