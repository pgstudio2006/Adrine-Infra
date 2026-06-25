import { useCallback, useEffect, useState } from 'react';
import { getDemoAdminOperationalBundle } from '@/lib/admin/demo-operational-fallback';
import { allowDemoFallback } from '@/lib/platform/demo-fallback';
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
      if (allowDemoFallback()) {
        setData(getDemoAdminOperationalBundle(period));
      } else {
        setData({ snapshot: null, analytics: null, finance: null, auditEvents: [], error: null });
      }
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

  const platformOn = canUseAdminRuntime();
  const demoMode = !platformOn && allowDemoFallback();

  return { ...data, loading, refresh, platformOn, demoMode };
}
