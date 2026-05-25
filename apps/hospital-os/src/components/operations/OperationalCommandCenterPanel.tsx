import { useCallback, useEffect, useState } from 'react';
import { Activity, AlertTriangle } from 'lucide-react';
import type { OperationalSnapshot } from '@adrine/hospital-operations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { canUseCommandRuntime, platformGetCommandSnapshot } from '@/runtime/command-runtime';
import { useOperationalPanelSubscription } from '@/hooks/useOperationalPanelsSync';

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
      <p className="font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function OperationalCommandCenterPanel() {
  const [snapshot, setSnapshot] = useState<OperationalSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!canUseCommandRuntime()) return;
    try {
      const data = await platformGetCommandSnapshot();
      setSnapshot(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Command snapshot unavailable');
    }
  }, []);

  useOperationalPanelSubscription({
    onSnapshot: (snap) => {
      setSnapshot(snap);
      setError(null);
    },
    onDelta: () => {
      void load();
    },
  });

  useEffect(() => {
    if (!canUseCommandRuntime()) return;
    void load();
  }, [load]);

  if (!canUseCommandRuntime()) return null;

  const c = snapshot?.counts;

  return (
    <Card className="border-dashed border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-600" />
            <CardTitle className="text-sm">Operational command center</CardTitle>
          </div>
          {snapshot && (
            <Badge
              variant={snapshot.healthStatus === 'healthy' ? 'outline' : 'destructive'}
              className="text-[10px] uppercase"
            >
              {snapshot.healthStatus}
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">
          Live platform snapshot · shared SSE
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {error ? (
          <p className="text-destructive text-xs">{error}</p>
        ) : !c ? (
          <p className="text-muted-foreground text-xs">Loading live snapshot…</p>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-center">
              <StatCell label="OPD active" value={c.opdActiveVisits} />
              <StatCell label="Queue" value={c.opdWaitingQueue} />
              <StatCell label="IPD" value={c.ipdActiveAdmissions} />
              <StatCell label="Lab pend." value={c.labPending} />
              <StatCell label="Rx pend." value={c.pharmacyPending} />
              <StatCell label="Discharge" value={c.dischargeInProgress} />
              <StatCell label="Escalations" value={c.openEscalations} />
              <StatCell label="Beds free" value={c.bedsAvailable} />
            </div>
            {snapshot && snapshot.escalations.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                {snapshot.escalations.length} open escalation(s)
              </div>
            )}
            {snapshot && snapshot.blockers.length > 0 && (
              <ul className="text-xs text-muted-foreground space-y-1">
                {snapshot.blockers.slice(0, 3).map((b) => (
                  <li key={b.id}>• {b.message}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
