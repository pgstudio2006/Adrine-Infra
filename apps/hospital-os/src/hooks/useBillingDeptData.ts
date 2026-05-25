import { useCallback, useEffect, useState } from 'react';
import {
  canUseFinanceRuntime,
  platformGetBillingFinanceDesk,
  platformGetBillingGst,
  platformGetBillingHealthPlans,
  platformGetBillingInsuranceDesk,
  platformGetBillingPackages,
  platformGetBillingRevenue,
  platformGetBillingTpaCharges,
} from '@/runtime/finance-runtime';

function useBillingDeptFetch<T>(loader: () => Promise<T>, enabled: boolean) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setData(null);
      return;
    }
    setLoading(true);
    try {
      const result = await loader();
      setData(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load billing data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, loader]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, error, loading, refresh, platformOn: enabled };
}

export function useBillingPackagesData() {
  const enabled = canUseFinanceRuntime();
  return useBillingDeptFetch(platformGetBillingPackages, enabled);
}

export function useBillingHealthPlansData() {
  const enabled = canUseFinanceRuntime();
  return useBillingDeptFetch(platformGetBillingHealthPlans, enabled);
}

export function useBillingTpaChargesData() {
  const enabled = canUseFinanceRuntime();
  return useBillingDeptFetch(platformGetBillingTpaCharges, enabled);
}

export function useBillingRevenueData(days = 30) {
  const enabled = canUseFinanceRuntime();
  const loader = useCallback(() => platformGetBillingRevenue(days), [days]);
  return useBillingDeptFetch(loader, enabled);
}

export function useBillingGstData(days = 90) {
  const enabled = canUseFinanceRuntime();
  const loader = useCallback(() => platformGetBillingGst(days), [days]);
  return useBillingDeptFetch(loader, enabled);
}

export function useBillingInsuranceDeskData() {
  const enabled = canUseFinanceRuntime();
  return useBillingDeptFetch(platformGetBillingInsuranceDesk, enabled);
}

export function useBillingFinanceDeskData() {
  const enabled = canUseFinanceRuntime();
  return useBillingDeptFetch(platformGetBillingFinanceDesk, enabled);
}
