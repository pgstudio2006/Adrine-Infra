import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function CriticalResultBanner({
  patientName,
  orderId,
  platformCritical,
}: {
  patientName: string;
  orderId: string;
  platformCritical?: boolean;
}) {
  return (
    <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Critical result — immediate review required</AlertTitle>
      <AlertDescription className="text-sm">
        Platform flagged a critical/panic value for {patientName} ({orderId}). Verify only after
        secondary review{platformCritical ? ' (critical_review state on platform)' : ''}.
      </AlertDescription>
    </Alert>
  );
}
