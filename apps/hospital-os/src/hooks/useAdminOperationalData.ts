import { useCallback, useEffect, useState } from 'react';
import {
  canUseAdminRuntime,
  fetchAdminOperationalBundle,
  type AdminOperationalBundle,
} from '@/runtime/admin-runtime';

export function useAdminOperationalData(period: '24h' | '7d' = '24h') {
  const [data, setData] = useState<AdminOperationalBundle>({
    snapshot: null,
    analytics: null,
    finance: null,
    auditEvents: [],
    error: null,
  });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!canUseAdminRuntime()) {
      setData({ snapshot: null, analytics: null, finance: null, auditEvents: [], error: null });
      return;
    }
    setLoading(true);
    const bundle = await fetchAdminOperationalBundle(period);
    setData(bundle);
    setLoading(false);
  }, [period]);

  useEffect(() => {
    void refresh();
    if (!canUseAdminRuntime()) return;
    const poll = setInterval(() => void refresh(), 30_000);
    return () => clearInterval(poll);
  }, [refresh]);

  return { ...data, loading, refresh, platformOn: canUseAdminRuntime() };
}
