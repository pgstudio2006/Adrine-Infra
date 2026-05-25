import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type InlinePlatformErrorProps = {
  error?: string | null;
  title?: string;
  onRetry?: () => void;
  className?: string;
};

export function InlinePlatformError({
  error,
  title = 'Platform request failed',
  onRetry,
  className = '',
}: InlinePlatformErrorProps) {
  if (!error?.trim()) return null;

  return (
    <div
      role="alert"
      className={`rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm flex gap-3 items-start ${className}`}
    >
      <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-destructive text-xs">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 break-words">{error}</p>
        <p className="text-[10px] text-muted-foreground mt-1">
          Check kernel/domain connectivity and session headers (see ops/PRODUCTION_AUTH.md).
        </p>
      </div>
      {onRetry && (
        <Button type="button" variant="outline" size="sm" className="shrink-0 h-8 text-xs" onClick={onRetry}>
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}
