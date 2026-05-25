import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BedDouble } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { canUseIpdRuntime, platformGetLiveIpdState, type LiveIpdState } from '@/runtime/ipd-runtime';
import { useOperationalPanelSubscription } from '@/hooks/useOperationalPanelsSync';

type Props = {
  admissionId?: string;
  patientName?: string;
};

export function OperationalIpdPanel({ admissionId, patientName }: Props) {
  const [state, setState] = useState<LiveIpdState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!admissionId) return;
    try {
      const data = await platformGetLiveIpdState(admissionId);
      setState(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load IPD state');
    }
  }, [admissionId]);

  useOperationalPanelSubscription({
    onDelta: (payload) => {
      if (payload.type === 'ipd.transition' && payload.admissionId === admissionId) {
        void load();
      }
    },
    onSnapshot: () => {
      void load();
    },
  });

  useEffect(() => {
    if (!admissionId || !canUseIpdRuntime()) return;
    void load();
  }, [load, admissionId]);

  if (!admissionId || !canUseIpdRuntime()) return null;

  return (
    <Card className="border-dashed border-blue-500/30 bg-blue-500/5">
      <CardHeader className="pb-2">
        <motion.div className="flex items-center justify-between gap-2">
          <motion.div className="flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-blue-600" />
            <CardTitle className="text-sm">Live IPD admission</CardTitle>
          </motion.div>
          {state ? (
            <Badge variant="outline" className="text-[10px]">
              {state.admission.state.replace(/_/g, ' ')}
            </Badge>
          ) : null}
        </motion.div>
        <CardDescription>
          {patientName ? `${patientName} — ` : ''}
          Platform admission lifecycle & blockers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {error ? (
          <p className="text-destructive text-xs">{error}</p>
        ) : (
          <>
            {state?.blockers.length ? (
              <ul className="space-y-1">
                {state.blockers.map((b) => (
                  <li key={b.code} className="text-xs text-muted-foreground">
                    {b.message}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No admission blockers</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
