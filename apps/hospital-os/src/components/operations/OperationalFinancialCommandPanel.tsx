import { useCallback, useEffect, useState } from 'react';
import { IndianRupee } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { platformFetch } from '@/runtime/platform-client';
import { canUseCommandRuntime } from '@/runtime/command-runtime';
import { getPlatformSession, isPlatformRuntimeEnabled } from '@/runtime/platform-session';
import { useOperationalPanelSubscription } from '@/hooks/useOperationalPanelsSync';

type FinanceLive = {
  summary: {
    openInvoices: number;
    outstandingCents: number;
    dischargeBillingBlockers: number;
  };
  reconciliationWarnings: string[];
};

function domainBase(): string | undefined {
  return import.meta.env.VITE_DOMAIN_API_URL as string | undefined;
}

export function OperationalFinancialCommandPanel() {
  const [data, setData] = useState<FinanceLive | null>(null);

  const load = useCallback(async () => {
    if (!isPlatformRuntimeEnabled() || !domainBase() || !getPlatformSession()?.branchId) return;
    const session = getPlatformSession();
    const bid = session?.branchId ?? 'branch_main';
    try {
      const res = await platformFetch<FinanceLive>(
        domainBase()!,
        `/finance/operations/live?branchId=${encodeURIComponent(bid)}`,
      );
      setData(res);
    } catch {
      setData(null);
    }
  }, []);

  useOperationalPanelSubscription({
    onDelta: () => {
      void load();
    },
    onSnapshot: () => {
      void load();
    },
  });

  useEffect(() => {
    void load();
  }, [load]);

  if (!canUseCommandRuntime()) return null;
  if (!data) return null;

  const due = data.summary.outstandingCents / 100;

  return (
    <Card className="border-dashed border-emerald-500/25 bg-emerald-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <IndianRupee className="w-4 h-4" />
          Financial operations
        </CardTitle>
        <CardDescription className="text-xs">Branch-wide live billing posture</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase">Open invoices</p>
          <p className="font-semibold">{data.summary.openInvoices}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase">Outstanding</p>
          <p className="font-semibold">₹{due.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase">DC blockers</p>
          <p className="font-semibold">{data.summary.dischargeBillingBlockers}</p>
        </div>
        {data.reconciliationWarnings.length > 0 && (
          <p className="col-span-3 text-xs text-muted-foreground">{data.reconciliationWarnings[0]}</p>
        )}
      </CardContent>
    </Card>
  );
}
