import { useCallback, useEffect, useState } from 'react';
import { canUseBillingRuntime, platformGetLiveFinancialState } from '@/runtime/billing-runtime';
import { canUseLabRuntime, platformGetLiveLabState } from '@/runtime/lab-runtime';
import { canUsePharmacyRuntime, platformGetLivePharmacyState } from '@/runtime/pharmacy-runtime';
import { canUseRadiologyRuntime, platformGetLiveRadiologyState } from '@/runtime/radiology-runtime';

export type ConsultationBlocker = {
  source: 'lab' | 'radiology' | 'pharmacy' | 'billing';
  code: string;
  message: string;
  severity: 'critical' | 'warning';
};

export function useConsultationBlockers(opdVisitId?: string) {
  const [blockers, setBlockers] = useState<ConsultationBlocker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!opdVisitId) {
      setBlockers([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const merged: ConsultationBlocker[] = [];

    try {
      if (canUseLabRuntime()) {
        const live = await platformGetLiveLabState(opdVisitId);
        live.blockers.forEach((b) =>
          merged.push({
            source: 'lab',
            code: b.code,
            message: b.message,
            severity: b.severity === 'critical' ? 'critical' : 'warning',
          }),
        );
      }
      if (canUseRadiologyRuntime()) {
        const live = await platformGetLiveRadiologyState(opdVisitId);
        live.blockers.forEach((b) =>
          merged.push({
            source: 'radiology',
            code: b.code,
            message: b.message,
            severity: b.severity === 'critical' ? 'critical' : 'warning',
          }),
        );
      }
      if (canUsePharmacyRuntime()) {
        const live = await platformGetLivePharmacyState(opdVisitId);
        live.blockers.forEach((b) =>
          merged.push({
            source: 'pharmacy',
            code: b.code,
            message: b.message,
            severity: b.severity === 'critical' ? 'critical' : 'warning',
          }),
        );
      }
      if (canUseBillingRuntime()) {
        const fin = await platformGetLiveFinancialState(opdVisitId);
        fin.blockers.forEach((msg) =>
          merged.push({
            source: 'billing',
            code: 'BILLING',
            message: msg,
            severity: 'critical',
          }),
        );
        fin.warnings.forEach((msg) =>
          merged.push({
            source: 'billing',
            code: 'BILLING_WARN',
            message: msg,
            severity: 'warning',
          }),
        );
      }
      setBlockers(merged);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load live blockers');
      setBlockers([]);
    } finally {
      setLoading(false);
    }
  }, [opdVisitId]);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 45_000);
    return () => clearInterval(t);
  }, [refresh]);

  const hasCritical = blockers.some((b) => b.severity === 'critical');

  return { blockers, loading, error, hasCritical, refresh };
}
