import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { User, Hash } from 'lucide-react';

export type OpdPatientContextBarProps = {
  patientName: string;
  uhid: string;
  department?: string;
  doctor?: string;
  tokenNo?: number;
  opdState?: string;
  waitLabel?: string;
  extra?: ReactNode;
};

export function PatientContextBar({
  patientName,
  uhid,
  department,
  doctor,
  tokenNo,
  opdState,
  waitLabel,
  extra,
}: OpdPatientContextBarProps) {
  return (
    <div className="rounded-lg border border-border/80 bg-card px-4 py-3" role="region" aria-label="OPD patient context">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{patientName}</p>
            <p className="text-xs text-muted-foreground font-mono flex items-center gap-1">
              <Hash className="h-3 w-3" />
              {uhid}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tokenNo != null && (
            <Badge variant="secondary" className="text-[10px] font-mono">
              Token #{tokenNo}
            </Badge>
          )}
          {waitLabel && (
            <Badge variant="outline" className="text-[10px]">
              Wait {waitLabel}
            </Badge>
          )}
          {opdState && (
            <Badge variant="outline" className="text-[10px]">
              {opdState.replaceAll('_', ' ')}
            </Badge>
          )}
          {department && (
            <Badge variant="outline" className="text-[10px]">
              {department}
            </Badge>
          )}
          {doctor && (
            <span className="text-[10px] text-muted-foreground">{doctor}</span>
          )}
          {extra}
        </div>
      </div>
    </div>
  );
}
