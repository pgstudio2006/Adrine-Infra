import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, FlaskConical } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { canUseLabRuntime, platformGetLiveLabState, type LiveLabState } from '@/runtime/lab-runtime';
import { useOperationalPanelSubscription } from '@/hooks/useOperationalPanelsSync';

type Props = {
  opdVisitId?: string;
  patientName?: string;
};

export function OperationalLabPanel({ opdVisitId, patientName }: Props) {
  const [state, setState] = useState<LiveLabState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!opdVisitId) return;
    try {
      const data = await platformGetLiveLabState(opdVisitId);
      setState(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load lab state');
    }
  }, [opdVisitId]);

  useOperationalPanelSubscription({
    onDelta: (payload) => {
      if (payload.type === 'lab.transition' && payload.opdVisitId === opdVisitId) {
        void load();
      }
    },
    onSnapshot: () => {
      void load();
    },
  });

  useEffect(() => {
    if (!opdVisitId || !canUseLabRuntime()) return;
    void load();
  }, [load, opdVisitId]);

  if (!opdVisitId || !canUseLabRuntime()) return null;

  const criticalBlockers = state?.blockers.filter((b) => b.severity === 'critical') ?? [];

  return (
    <Card className="border-dashed border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-2">
        <motion.div className="flex items-center justify-between gap-2">
          <motion.div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-amber-600" />
            <CardTitle className="text-sm">Live diagnostics</CardTitle>
          </motion.div>
          {state && state.pendingCount > 0 ? (
            <Badge variant="outline" className="text-[10px]">
              {state.pendingCount} pending
            </Badge>
          ) : null}
        </motion.div>
        <CardDescription>
          {patientName ? `${patientName} — ` : ''}
          Governed lab lifecycle synced with OPD & billing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {error ? (
          <p className="text-destructive text-xs">{error}</p>
        ) : (
          <>
            <motion.div className="flex gap-4 text-xs text-muted-foreground">
              <span>Pending: {state?.pendingCount ?? '—'}</span>
              <span>Critical: {state?.criticalCount ?? '—'}</span>
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
            {state?.orders.slice(0, 4).map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-2 text-xs border-t pt-2">
                <span className="truncate">{o.tests}</span>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {o.state.replace(/_/g, ' ')}
                </Badge>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
