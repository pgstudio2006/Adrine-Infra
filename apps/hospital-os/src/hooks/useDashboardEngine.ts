import { useCallback, useEffect, useState } from 'react';
import {
  canUseDashboardRuntime,
  resolveDashboardBranchId,
  type DashboardEngineBundle,
} from '@/lib/dashboard/dashboard-engine';
import { platformGetOperationalAnalytics } from '@/runtime/analytics-runtime';
import { platformGetCommandSnapshot } from '@/runtime/command-runtime';
type Period = '24h' | '7d';

export function useDashboardEngine(period: Period = '24h', branchId?: string) {
  const [bundle, setBundle] = useState<DashboardEngineBundle>({
    branchId: resolveDashboardBranchId(branchId),
    snapshot: null,
    analytics: null,
    error: null,
  });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const bid = resolveDashboardBranchId(branchId);
    if (!canUseDashboardRuntime() || !bid) {
      setBundle({ branchId: bid, snapshot: null, analytics: null, error: null });
      return;
    }

    setLoading(true);
    try {
      const [snapshot, analytics] = await Promise.all([
        platformGetCommandSnapshot(bid),
        platformGetOperationalAnalytics(period, bid),
      ]);
      setBundle({ branchId: bid, snapshot, analytics, error: null });
    } catch (e) {
      setBundle({
        branchId: bid,
        snapshot: null,
        analytics: null,
        error: e instanceof Error ? e.message : 'Dashboard data unavailable',
      });
    } finally {
      setLoading(false);
    }
  }, [branchId, period]);

  useEffect(() => {
    void refresh();
    if (!canUseDashboardRuntime()) return;
    const poll = setInterval(() => void refresh(), 30_000);
    return () => clearInterval(poll);
  }, [refresh]);

  return {
    ...bundle,
    loading,
    refresh,
    platformOn: canUseDashboardRuntime(),
    counts: bundle.snapshot?.counts,
  };
}
