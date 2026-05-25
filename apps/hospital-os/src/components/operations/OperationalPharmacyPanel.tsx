import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Pill } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  canUsePharmacyRuntime,
  platformGetLivePharmacyState,
  type LivePharmacyState,
} from '@/runtime/pharmacy-runtime';
import { useOperationalPanelSubscription } from '@/hooks/useOperationalPanelsSync';

type Props = {
  opdVisitId?: string;
  patientName?: string;
};

export function OperationalPharmacyPanel({ opdVisitId, patientName }: Props) {
  const [state, setState] = useState<LivePharmacyState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!opdVisitId) return;
    try {
      const data = await platformGetLivePharmacyState(opdVisitId);
      setState(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load pharmacy state');
    }
  }, [opdVisitId]);

  useOperationalPanelSubscription({
    onDelta: (payload) => {
      if (payload.type === 'pharmacy.transition' && payload.opdVisitId === opdVisitId) {
        void load();
      }
    },
    onSnapshot: () => {
      void load();
    },
  });

  useEffect(() => {
    if (!opdVisitId || !canUsePharmacyRuntime()) return;
    void load();
  }, [load, opdVisitId]);

  if (!opdVisitId || !canUsePharmacyRuntime()) return null;

  const criticalBlockers = state?.blockers.filter((b) => b.severity === 'critical') ?? [];

  return (
    <Card className="border-dashed border-emerald-500/30 bg-emerald-500/5">
      <CardHeader className="pb-2">
        <motion.div className="flex items-center justify-between gap-2">
          <motion.div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-emerald-600" />
            <CardTitle className="text-sm">Live pharmacy fulfillment</CardTitle>
          </motion.div>
          {state && state.pendingCount > 0 ? (
            <Badge variant="outline" className="text-[10px]">
              {state.pendingCount} pending
            </Badge>
          ) : null}
        </motion.div>
        <CardDescription>
          {patientName ? `${patientName} — ` : ''}
          Inventory reservations & dispense state
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {error ? (
          <p className="text-destructive text-xs">{error}</p>
        ) : (
          <>
            <motion.div className="flex gap-4 text-xs text-muted-foreground">
              <span>Pending: {state?.pendingCount ?? '—'}</span>
              <span>Controlled: {state?.controlledPending ?? '—'}</span>
            </motion.div>
            {criticalBlockers.length > 0 ? (
              <ul className="space-y-1">
                {criticalBlockers.map((b) => (
                  <li key={b.code} className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {b.message}
                  </li>
                ))}
              </ul>
            ) : null}
            {state?.stockWarnings && state.stockWarnings.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Low stock: {state.stockWarnings.map((s) => s.drug).join(', ')}
              </p>
            ) : null}
            {state?.fulfillments.slice(0, 4).map((f) => (
              <motion.div
                key={f.id}
                className="flex items-center justify-between gap-2 text-xs border-t pt-2"
              >
                <span className="truncate">{f.externalRef ?? f.id.slice(-8)}</span>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {f.state.replace(/_/g, ' ')}
                </Badge>
              </motion.div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
