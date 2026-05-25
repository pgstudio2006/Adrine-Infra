import { useCallback, useEffect, useState } from 'react';
import {
  canUseHrRuntime,
  platformListHrStaff,
  type PlatformHrStaffResponse,
  type PlatformStaffMember,
} from '@/runtime/hr-runtime';

export function useHrPlatform() {
  const platformOn = canUseHrRuntime();
  const [loading, setLoading] = useState(platformOn);
  const [data, setData] = useState<PlatformHrStaffResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!canUseHrRuntime()) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await platformListHrStaff();
      setData(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load HR data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const staff: PlatformStaffMember[] = data?.staff ?? [];
  const departments = data?.departments ?? [];

  return { platformOn, loading, error, staff, departments, refresh };
}
