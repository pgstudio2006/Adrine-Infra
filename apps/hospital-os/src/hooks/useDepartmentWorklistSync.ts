import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPlatformSession } from '@/runtime/platform-session';
import { isPlatformAuthoritative } from '@/runtime/platform-store-bridge';
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
  const { platformConnected } = useAuth();
  const { refreshDepartmentWorklistsFromPlatform } = useHospital();
  const branchId = getPlatformSession()?.branchId;
  const platformOn = platformConnected && isPlatformAuthoritative();
  const eventTypes = MODULE_EVENT_TYPES[module];

  useOperationalEventStream(platformOn ? branchId : undefined, {
    onSnapshot: () => {
      if (platformOn) void refreshDepartmentWorklistsFromPlatform(module);
    },
    onDelta: (payload) => {
      const t = payload.type as string | undefined;
      if (platformOn && t && eventTypes.includes(t)) {
        void refreshDepartmentWorklistsFromPlatform(module);
      }
    },
  });

  useEffect(() => {
    if (!platformOn) return;
    void refreshDepartmentWorklistsFromPlatform(module);
  }, [module, platformOn, platformConnected, branchId, refreshDepartmentWorklistsFromPlatform]);
}
