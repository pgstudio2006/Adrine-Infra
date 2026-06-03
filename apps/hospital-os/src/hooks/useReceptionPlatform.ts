import { useCallback, useEffect, useState } from 'react';
import { useHospital } from '@/stores/hospitalStore';
import { getPlatformSession, isPlatformRuntimeEnabled } from '@/runtime/platform-session';
import { canUseOpdRuntime } from '@/runtime/opd-runtime';
import { useOperationalEventStream } from '@/runtime/realtime-runtime';

/** Branch-scoped reception platform sync — queue, appointments, patients. */
export function useReceptionPlatform(options?: {
  queue?: boolean;
  appointments?: boolean;
  patients?: boolean;
}) {
  const {
    refreshQueueFromPlatform,
    refreshAppointmentsFromPlatform,
    refreshPatientsFromPlatform,
  } = useHospital();

  const queue = options?.queue !== false;
  const appointments = options?.appointments !== false;
  const patients = options?.patients ?? false;

  const platformOn = isPlatformRuntimeEnabled() && canUseOpdRuntime();
  const branchId = getPlatformSession()?.branchId;
  const [loading, setLoading] = useState(platformOn);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!platformOn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const tasks: Promise<void>[] = [];
      if (queue) tasks.push(refreshQueueFromPlatform());
      if (appointments) tasks.push(refreshAppointmentsFromPlatform());
      if (patients) tasks.push(refreshPatientsFromPlatform());
      await Promise.all(tasks);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reception sync failed');
    } finally {
      setLoading(false);
    }
  }, [
    platformOn,
    queue,
    appointments,
    patients,
    refreshQueueFromPlatform,
    refreshAppointmentsFromPlatform,
    refreshPatientsFromPlatform,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useOperationalEventStream(branchId, {
    onSnapshot: () => {
      void refresh();
    },
    onDelta: () => {
      void refresh();
    },
  });

  return { platformOn, branchId, loading, error, refresh };
}
