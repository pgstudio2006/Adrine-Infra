import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type Props = {
  title?: string;
  message: string | null | undefined;
  onDismiss?: () => void;
};

/** Inline platform failure — prefer over toast-only for operator-facing screens. */
export function InlinePlatformError({ title = 'Platform action failed', message, onDismiss }: Props) {
  if (!message?.trim()) return null;

  return (
    <Alert variant="destructive" className="border-destructive/40">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="text-sm">{title}</AlertTitle>
      <AlertDescription className="text-xs flex items-start justify-between gap-2">
        <span>{message}</span>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="text-[10px] underline shrink-0 opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
