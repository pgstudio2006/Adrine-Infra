import { AlertTriangle, ClipboardList } from 'lucide-react';
import {
  loadNavayuVisitMetadata,
  painRegionLabel,
  referralLabel,
  type NavayuRegistrationMetadata,
} from '@/lib/navayu/navayu-forms';
import type { NavayuIntakeData } from '@/lib/navayu/navayu-runtime';

interface Props {
  uhid: string;
  visitMetadata?: NavayuRegistrationMetadata | Record<string, unknown>;
  intake?: NavayuIntakeData | null;
}

function resolveRegistration(
  uhid: string,
  visitMetadata?: Props['visitMetadata'],
): NavayuRegistrationMetadata | null {
  if (visitMetadata && 'hearAboutNavayu' in visitMetadata) {
    return visitMetadata as NavayuRegistrationMetadata;
  }
  if (
    visitMetadata &&
    typeof visitMetadata === 'object' &&
    'navayu' in visitMetadata &&
    visitMetadata.navayu &&
    typeof visitMetadata.navayu === 'object' &&
    'hearAboutNavayu' in (visitMetadata.navayu as object)
  ) {
    return visitMetadata.navayu as NavayuRegistrationMetadata;
  }
  return loadNavayuVisitMetadata(uhid);
}

const DURATION_LABELS: Record<string, string> = {
  lt_1w: 'Less than 1 week',
  '1_4w': '1–4 weeks',
  '1_3m': '1–3 months',
  gt_3m: 'More than 3 months',
};

const RED_FLAG_LABELS: Record<string, string> = {
  fever_weight_loss: 'Fever / weight loss',
  bowel_bladder: 'Bowel / bladder dysfunction',
  saddle_anesthesia: 'Saddle anesthesia',
  progressive_weakness: 'Progressive weakness',
  trauma: 'Recent major trauma',
  night_pain: 'Severe night pain',
  none: 'None',
};

export function NavayuIntakePanel({ uhid, visitMetadata, intake }: Props) {
  const metadata = resolveRegistration(uhid, visitMetadata);
  const answers = intake?.answers;
  const redFlags = answers?.redFlag ?? answers?.redFlags ?? [];
  const hasUrgentFlags = intake?.urgent || (redFlags.length > 0 && !redFlags.every((f) => f === 'none'));

  if (!metadata && !intake) {
    return (
      <div className="border rounded-xl bg-card p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5 mb-2">
          <ClipboardList className="w-3.5 h-3.5" /> Reception & patient intake
        </p>
        <p className="text-xs text-muted-foreground">
          No Navayu data yet. Complete reception registration and send the patient intake link.
        </p>
      </div>
    );
  }

  const lifestyleFlags = metadata
    ? Object.entries(metadata.lifestyle)
        .filter(([, active]) => active)
        .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim())
    : [];

  return (
    <div className="border rounded-xl bg-card p-4 space-y-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
        <ClipboardList className="w-3.5 h-3.5" /> Reception & patient intake
      </p>

      {hasUrgentFlags && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Red flags reported on intake — prioritize clinical review.</span>
        </div>
      )}

      {metadata && (
        <div className="grid grid-cols-1 gap-2 text-xs border-b pb-3">
          <div>
            <span className="text-muted-foreground">Referral:</span>{' '}
            <span className="font-medium">{referralLabel(metadata.hearAboutNavayu)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Pain regions:</span>{' '}
            <span className="font-medium">
              {metadata.bodyRegions.length
                ? metadata.bodyRegions.map(painRegionLabel).join(', ')
                : '—'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Lifestyle:</span>{' '}
            <span className="font-medium">{lifestyleFlags.length ? lifestyleFlags.join(', ') : 'None flagged'}</span>
          </div>
        </div>
      )}

      {answers ? (
        <div className="grid grid-cols-1 gap-2 text-xs">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Tablet intake</p>
          {answers.complaintText && (
            <div>
              <span className="text-muted-foreground">Complaint:</span>{' '}
              <span className="font-medium">{answers.complaintText}</span>
            </div>
          )}
          {answers.durationBucket && (
            <div>
              <span className="text-muted-foreground">Duration:</span>{' '}
              <span className="font-medium">{DURATION_LABELS[answers.durationBucket] ?? answers.durationBucket}</span>
            </div>
          )}
          {answers.vas != null && (
            <div>
              <span className="text-muted-foreground">Pain VAS:</span>{' '}
              <span className="font-medium">{answers.vas}/10</span>
            </div>
          )}
          {redFlags.length > 0 && (
            <div>
              <span className="text-muted-foreground">Red flags:</span>{' '}
              <span className={`font-medium ${hasUrgentFlags ? 'text-destructive' : ''}`}>
                {redFlags.map((f) => RED_FLAG_LABELS[f] ?? f).join(', ')}
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Patient intake pending — share tablet link from registration.</p>
      )}
    </div>
  );
}
