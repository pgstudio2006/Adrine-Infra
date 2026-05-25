import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type Props = {
  platformOn: boolean;
  blockers: string[];
  warnings?: string[];
  error?: string | null;
  label?: string;
};

export function BillingPlatformStrip({
  platformOn,
  blockers,
  warnings = [],
  error,
  label = 'Live platform billing',
}: Props) {
  if (!platformOn) return null;

  return (
    <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm space-y-1">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[10px]">
          {label}
        </Badge>
        {blockers.length > 0 && (
          <Badge variant="destructive" className="text-[10px] gap-1">
            <AlertTriangle className="h-3 w-3" />
            {blockers.length} blocker(s)
          </Badge>
        )}
      </div>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : blockers.length > 0 ? (
        <ul className="text-xs text-destructive list-disc pl-4">
          {blockers.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      ) : warnings.length > 0 ? (
        <ul className="text-xs text-muted-foreground list-disc pl-4">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">No settlement blockers on live invoice.</p>
      )}
    </div>
  );
}
