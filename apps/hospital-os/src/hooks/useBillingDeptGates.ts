import { useCallback, useEffect, useMemo, useState } from 'react';
import { canUseFinanceRuntime, platformGetFinanceOperationsLive } from '@/runtime/finance-runtime';
import { useBillingDeptPlatform } from '@/hooks/useBillingDeptPlatform';
import {
  branchGateHints,
  type BillingGateMessage,
} from '@/components/billing/billing-gate-messages';

export function useBillingDeptGates() {
  const { platformOn } = useBillingDeptPlatform();
  const [branchHints, setBranchHints] = useState<BillingGateMessage[]>([]);

  const refresh = useCallback(async () => {
    if (!canUseFinanceRuntime()) {
      setBranchHints([]);
      return;
    }
    try {
      const live = await platformGetFinanceOperationsLive();
      setBranchHints(
        branchGateHints({
          dischargeBillingBlockers: live.summary.dischargeBillingBlockers,
          stuckInsurance: live.reconciliation.stuckInsurance,
          reconciliationWarnings: live.reconciliationWarnings,
        }),
      );
    } catch {
      setBranchHints([]);
    }
  }, []);

  useEffect(() => {
    if (!platformOn) {
      setBranchHints([]);
      return;
    }
    void refresh();
  }, [platformOn, refresh]);

  return useMemo(
    () => ({
      messages: platformOn ? branchHints : [],
      refresh,
    }),
    [platformOn, branchHints, refresh],
  );
}
