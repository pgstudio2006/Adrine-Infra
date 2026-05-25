import { AlertTriangle, FlaskConical, Pill, Receipt, Scan } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InlinePlatformError } from '@/components/opd/InlinePlatformError';
import {
  useConsultationBlockers,
  type ConsultationBlocker,
} from '@/hooks/useConsultationBlockers';

const sourceIcon: Record<ConsultationBlocker['source'], typeof FlaskConical> = {
  lab: FlaskConical,
  radiology: Scan,
  pharmacy: Pill,
  billing: Receipt,
};

type Props = {
  opdVisitId?: string;
  patientName?: string;
};

/** Live lab / radiology / pharmacy / billing blockers before consultation save. */
export function ConsultationBlockerStrip({ opdVisitId, patientName }: Props) {
  const { blockers, loading, error, hasCritical, refresh } = useConsultationBlockers(opdVisitId);

  if (!opdVisitId) return null;

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-amber-500/35 bg-amber-500/5 px-4 py-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <p className="text-sm font-medium">
            Pre-save blockers
            {patientName ? ` · ${patientName}` : ''}
          </p>
          {hasCritical ? (
            <Badge variant="destructive" className="text-[10px]">
              Action required
            </Badge>
          ) : blockers.length > 0 ? (
            <Badge variant="secondary" className="text-[10px]">
              Review warnings
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px]">
              Clear
            </Badge>
          )}
        </div>
        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>

      <InlinePlatformError message={error} title="Blocker sync failed" onDismiss={() => void refresh()} />

      {loading && blockers.length === 0 && !error ? (
        <p className="text-xs text-muted-foreground">Loading live operational blockers…</p>
      ) : null}

      {!loading && blockers.length === 0 && !error ? (
        <p className="text-xs text-muted-foreground">
          No open lab, radiology, pharmacy, or billing blockers on this visit.
        </p>
      ) : null}

      {blockers.length > 0 ? (
        <ul className="space-y-1.5">
          {blockers.map((b) => {
            const Icon = sourceIcon[b.source];
            return (
              <li
                key={`${b.source}-${b.code}-${b.message}`}
                className={`flex items-start gap-2 text-xs rounded-md px-2 py-1.5 ${
                  b.severity === 'critical'
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-muted/60 text-muted-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  <span className="font-medium uppercase text-[10px] mr-1">{b.source}</span>
                  {b.message}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
