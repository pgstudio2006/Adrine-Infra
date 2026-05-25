import { useEffect } from 'react';
import { getPlatformSession } from '@/runtime/platform-session';
import { useOperationalEventStream } from '@/runtime/realtime-runtime';
import { useHospital } from '@/stores/hospitalStore';

export type DepartmentWorklistModule = 'lab' | 'radiology' | 'pharmacy';

const MODULE_EVENT_TYPES: Record<DepartmentWorklistModule, string[]> = {
  lab: ['platform.event', 'lab.transition'],
  radiology: ['platform.event', 'radiology.transition'],
  pharmacy: ['platform.event', 'pharmacy.transition'],
};

/** Poll branch worklists on mount and refresh on operational SSE (merge pattern in platform-store-bridge). */
export function useDepartmentWorklistSync(module: DepartmentWorklistModule): void {
  const { refreshDepartmentWorklistsFromPlatform } = useHospital();
  const branchId = getPlatformSession()?.branchId;
  const eventTypes = MODULE_EVENT_TYPES[module];

  useOperationalEventStream(branchId, {
    onSnapshot: () => {
      void refreshDepartmentWorklistsFromPlatform();
    },
    onDelta: (payload) => {
      const t = payload.type as string | undefined;
      if (t && eventTypes.includes(t)) {
        void refreshDepartmentWorklistsFromPlatform();
      }
    },
  });

  useEffect(() => {
    void refreshDepartmentWorklistsFromPlatform();
  }, [refreshDepartmentWorklistsFromPlatform]);
}
