import { useCallback, useEffect, useState } from 'react';
import {
  canUseSchedulingRuntime,
  platformListAppointmentsInRange,
  platformListSchedulingResources,
  platformListSchedulingWaitlist,
  type PlatformAppointment,
  type PlatformSchedulingResource,
  type PlatformWaitlistEntry,
} from '@/runtime/scheduling-runtime';

function defaultRange() {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 7);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function useSchedulingPlatform(fromIso?: string, toIso?: string) {
  const platformOn = canUseSchedulingRuntime();
  const [loading, setLoading] = useState(platformOn);
  const [appointments, setAppointments] = useState<PlatformAppointment[]>([]);
  const [resources, setResources] = useState<PlatformSchedulingResource[]>([]);
  const [waitlist, setWaitlist] = useState<PlatformWaitlistEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!canUseSchedulingRuntime()) {
      setAppointments([]);
      setResources([]);
      setWaitlist([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const range = defaultRange();
    const from = fromIso ?? range.from;
    const to = toIso ?? range.to;
    try {
      const [appts, res, wait] = await Promise.all([
        platformListAppointmentsInRange(from, to),
        platformListSchedulingResources(),
        platformListSchedulingWaitlist(),
      ]);
      setAppointments(appts);
      setResources(res);
      setWaitlist(wait);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load scheduling data');
    } finally {
      setLoading(false);
    }
  }, [fromIso, toIso]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { platformOn, loading, error, appointments, resources, waitlist, refresh };
}
