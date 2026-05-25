import { Badge } from '@/components/ui/badge';

type Props = {
  label?: string;
  detail?: string;
  error?: string | null;
};

export function PlatformConnectivityStrip({
  label = 'Platform runtime',
  detail,
  error,
}: Props) {
  return (
    <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="text-[10px]">
          {label}
        </Badge>
      </div>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : detail ? (
        <p className="text-xs text-muted-foreground">{detail}</p>
      ) : null}
    </div>
  );
}
