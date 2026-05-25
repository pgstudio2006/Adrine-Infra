import { Badge } from '@/components/ui/badge';
import { User, Hash, Activity } from 'lucide-react';

export type PatientContextBarProps = {
  uhid: string;
  name: string;
  visitState?: string;
  patientType?: string;
  platformPatientId?: string;
  platformOpdVisitId?: string;
  platformAdmissionId?: string;
  department?: string;
  compact?: boolean;
};

function PlatformIdChip({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded border border-border/80 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
      <Hash className="h-2.5 w-2.5 shrink-0" />
      <span className="text-foreground/80">{label}</span>
      <span className="truncate max-w-[120px]" title={value}>
        {value.slice(0, 8)}…
      </span>
    </span>
  );
}

export function PatientContextBar({
  uhid,
  name,
  visitState,
  patientType,
  platformPatientId,
  platformOpdVisitId,
  platformAdmissionId,
  department,
  compact,
}: PatientContextBarProps) {
  const hasPlatformIds = platformPatientId || platformOpdVisitId || platformAdmissionId;

  return (
    <div
      className={`rounded-lg border border-border/80 bg-card ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}
      role="region"
      aria-label="Active patient context"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{name}</p>
            <p className="text-xs text-muted-foreground font-mono">{uhid}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {patientType && (
            <Badge variant="secondary" className="text-[10px]">
              {patientType}
            </Badge>
          )}
          {department && (
            <Badge variant="outline" className="text-[10px]">
              {department}
            </Badge>
          )}
          {visitState && (
            <Badge variant="outline" className="text-[10px] gap-1">
              <Activity className="h-3 w-3" />
              {visitState.replaceAll('_', ' ')}
            </Badge>
          )}
        </div>
      </div>
      {hasPlatformIds && (
        <div className="mt-2 flex flex-wrap gap-1.5 pt-2 border-t border-border/60">
          <PlatformIdChip label="patient" value={platformPatientId} />
          <PlatformIdChip label="opd" value={platformOpdVisitId} />
          <PlatformIdChip label="admission" value={platformAdmissionId} />
        </div>
      )}
    </div>
  );
}
