import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, IndianRupee, Receipt } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { canUseBillingRuntime, platformGetLiveFinancialState, type LiveFinancialState } from '@/runtime/billing-runtime';
import { useOperationalPanelSubscription } from '@/hooks/useOperationalPanelsSync';

type Props = {
  opdVisitId?: string;
  patientName?: string;
};

export function OperationalFinancialPanel({ opdVisitId, patientName }: Props) {
  const [state, setState] = useState<LiveFinancialState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!opdVisitId) return;
    try {
      const data = await platformGetLiveFinancialState(opdVisitId);
      setState(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load live invoice');
    }
  }, [opdVisitId]);

  useOperationalPanelSubscription({
    onDelta: (payload) => {
      if (payload.opdVisitId === opdVisitId) {
        void load();
      }
    },
    onSnapshot: () => {
      void load();
    },
  });

  useEffect(() => {
    if (!opdVisitId || !canUseBillingRuntime()) return;
    void load();
  }, [load, opdVisitId]);

  if (!opdVisitId || !canUseBillingRuntime()) return null;

  const inv = state?.invoice;
  const total = inv ? inv.amountCents / 100 : 0;
  const paid = inv ? inv.paidCents / 100 : 0;
  const due = inv ? inv.outstandingCents / 100 : 0;

  return (
    <Card className="border-dashed border-primary/25 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">Live operational invoice</CardTitle>
          </div>
          {inv ? (
            <Badge variant="outline" className="text-[10px] uppercase">
              {inv.status}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">
              No draft
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">
          {patientName ? `${patientName} · ` : ''}
          Platform-synced charges · visit {state?.visit.state ?? '…'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {error ? (
          <p className="text-destructive text-xs">{error}</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Total</p>
              <p className="font-semibold flex items-center gap-0.5">
                <IndianRupee className="w-3 h-3" />
                {total.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Paid</p>
              <p className="font-semibold">₹{paid.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Due</p>
              <p className={`font-semibold ${due > 0 ? 'text-amber-600' : ''}`}>
                ₹{due.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        )}
        {inv && inv.lineCount > 0 ? (
          <p className="text-[10px] text-muted-foreground">
            {inv.lineCount} operational charge(s) on authoritative draft
            {inv.corporatePayer ? ' · corporate routing' : ''}
            {inv.insuranceMode !== 'self' ? ` · ${inv.insuranceMode}` : ''}
          </p>
        ) : null}
        {(state?.blockers.length ?? 0) > 0 && (
          <ul className="text-xs space-y-1">
            {state!.blockers.map((b) => (
              <li key={b} className="flex items-start gap-1.5 text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {b}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
