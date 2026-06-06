import type { QueueEntry } from '@/stores/hospitalStore';
import { getPlatformSession } from '@/runtime/platform-session';
import type { NavayuMskLifecycleState } from '@/lib/navayu/navayu-runtime';

const JUNIOR_HIDDEN_STATES: NavayuMskLifecycleState[] = [
  'ai_summary_ready',
  'senior_consult',
  'navayu_classified',
  'protocol_mapped',
  'counselling',
  'package_planned',
  'closed',
];

const SENIOR_VISIBLE_STATES: NavayuMskLifecycleState[] = [
  'msk_exam_complete',
  'ai_summary_ready',
  'senior_consult',
  'navayu_classified',
  'protocol_mapped',
  'counselling',
  'package_planned',
];

export function matchesDoctorBranch(entry: QueueEntry, branchId?: string): boolean {
  if (!branchId) return true;
  if (!entry.branchId) return true;
  return entry.branchId === branchId;
}

/** Navayu MSK handoff — junior vs senior doctor queue slices. */
function asMskState(raw?: string): NavayuMskLifecycleState | undefined {
  if (!raw) return undefined;
  return raw as NavayuMskLifecycleState;
}

export function filterNavayuDoctorQueue(
  entries: QueueEntry[],
  seniorDoctor: boolean,
): QueueEntry[] {
  return entries.filter((entry) => {
    const state = asMskState(entry.mskLifecycleState);
    if (seniorDoctor) {
      if (state && SENIOR_VISIBLE_STATES.includes(state)) {
        return true;
      }
      // Show handoff-ready rows even before metadata refresh lands.
      return (
        !state &&
        (entry.status === 'in-consultation' || entry.status === 'completed')
      );
    }
    if (!state) {
      return true;
    }
    return !JUNIOR_HIDDEN_STATES.includes(state);
  });
}

export function scopeQueueToBranch(entries: QueueEntry[]): QueueEntry[] {
  const branchId = getPlatformSession()?.branchId;
  if (!branchId) return entries;
  return entries.filter((entry) => matchesDoctorBranch(entry, branchId));
}
