import { Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function DiagnosticsPreviewBanner({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="text-sm">{description}</AlertDescription>
    </Alert>
  );
}
