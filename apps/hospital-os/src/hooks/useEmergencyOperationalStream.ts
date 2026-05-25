import { useCallback, useEffect } from 'react';
import { useHospital } from '@/stores/hospitalStore';
import { getPlatformSession } from '@/runtime/platform-session';
import { useOperationalEventStream } from '@/runtime/realtime-runtime';

const ER_DELTA_TYPES = new Set([
  'platform.event',
  'lab.transition',
  'radiology.transition',
  'pharmacy.transition',
  'ipd.transition',
  'discharge.transition',
  'opd.transition',
  'emergency.transition',
  'billing.transition',
]);

export type EmergencyStreamOptions = {
  /** Refresh lab/radiology/pharmacy branch worklists. Default true. */
  worklists?: boolean;
  /** Refresh IPD census for transfer/disposition views. Default false. */
  ipd?: boolean;
};

/** SSE + fallback poll for ER screens — mirrors lab worklist hydration when platform runtime is on. */
export function useEmergencyOperationalStream(options: EmergencyStreamOptions = {}) {
  const { worklists = true, ipd = false } = options;
  const { refreshDepartmentWorklistsFromPlatform, refreshPlatformIpdSnapshots } = useHospital();
  const branchId = getPlatformSession()?.branchId;

  const refresh = useCallback(async () => {
    const tasks: Promise<void>[] = [];
    if (worklists) tasks.push(refreshDepartmentWorklistsFromPlatform());
    if (ipd) tasks.push(refreshPlatformIpdSnapshots());
    await Promise.all(tasks);
  }, [worklists, ipd, refreshDepartmentWorklistsFromPlatform, refreshPlatformIpdSnapshots]);

  useOperationalEventStream(branchId, {
    onSnapshot: () => {
      void refresh();
    },
    onDelta: (p) => {
      const t = p.type as string | undefined;
      if (t && ER_DELTA_TYPES.has(t)) {
        void refresh();
      }
    },
  });

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { refresh };
}
