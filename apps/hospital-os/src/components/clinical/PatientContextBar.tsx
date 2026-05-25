import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bed, User } from 'lucide-react';
import type { ReactNode } from 'react';

export type ClinicalPatientContextBarProps = {
  patientName: string;
  uhid: string;
  ward?: string;
  bed?: string;
  status?: string;
  attendingDoctor?: string;
  platformLinked?: boolean;
  backTo?: string;
  backLabel?: string;
  actions?: ReactNode;
};

export function PatientContextBar({
  patientName,
  uhid,
  ward,
  bed,
  status,
  attendingDoctor,
  platformLinked,
  backTo,
  backLabel = 'Back',
  actions,
}: ClinicalPatientContextBarProps) {
  return (
    <div className="rounded-lg border border-border/80 bg-card px-4 py-3 space-y-2" role="region" aria-label="Inpatient context">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {backTo ? (
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
              <Link to={backTo} aria-label={backLabel}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{patientName}</p>
            <p className="text-xs text-muted-foreground font-mono">{uhid}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {status && (
            <Badge variant="secondary" className="text-[10px] capitalize">
              {status.replace('-', ' ')}
            </Badge>
          )}
          {platformLinked && (
            <Badge variant="outline" className="text-[10px]">
              Platform linked
            </Badge>
          )}
          {(ward || bed) && (
            <Badge variant="outline" className="text-[10px] gap-1">
              <Bed className="h-3 w-3" />
              {[ward, bed].filter(Boolean).join(' · ')}
            </Badge>
          )}
          {attendingDoctor && (
            <span className="text-[10px] text-muted-foreground">{attendingDoctor}</span>
          )}
          {actions}
        </div>
      </div>
    </div>
  );
}
