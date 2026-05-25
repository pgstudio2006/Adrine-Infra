import { useCallback, useEffect, useState } from 'react';
import {
  canUseFinanceRuntime,
  platformGetFinanceOperationsLive,
} from '@/runtime/finance-runtime';

export type FinanceOperationsLive = {
  branchId: string;
  generatedAt: string;
  summary: {
    openInvoices: number;
    outstandingCents: number;
    chargeLineCount: number;
    insuranceAuthorizations: number;
    insuranceApprovedCents: number;
    dischargeBillingBlockers: number;
  };
  invoices: {
    id: string;
    status: string;
    amountCents: number;
    paidCents: number;
    outstandingCents: number;
    opdVisitId: string | null;
    ipdAdmissionId: string | null;
  }[];
  dischargeBillingBlockers: {
    id: string;
    admissionId: string;
    state: string;
  }[];
  reconciliationWarnings: string[];
  reconciliation: {
    status: string;
    activeAdmissions: number;
    orphanedBeds: number;
    admissionsWithoutBed: number;
    pendingDischarges: number;
    stuckInsurance: number;
    checkedAt: string;
  };
};

export function useFinanceOperationsLive() {
  const enabled = canUseFinanceRuntime();
  const [data, setData] = useState<FinanceOperationsLive | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setData(null);
      return;
    }
    setLoading(true);
    try {
      const res = await platformGetFinanceOperationsLive();
      setData(res as FinanceOperationsLive);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load finance operations');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, error, loading, refresh, platformOn: enabled };
}
