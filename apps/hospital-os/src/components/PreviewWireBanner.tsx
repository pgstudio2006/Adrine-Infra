import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles } from 'lucide-react';

type Props = {
  title?: string;
  description: string;
};

/** Minimal preview wiring — shown on routes marked Preview in routeReadiness. */
export function PreviewWireBanner({ title = 'Preview module', description }: Props) {
  return (
    <Alert className="border-dashed border-warning/40 bg-warning/5">
      <Sparkles className="h-4 w-4 text-warning" />
      <AlertTitle className="flex items-center gap-2 text-sm">
        {title}
        <Badge variant="outline" className="text-[10px] border-warning/30 text-warning">
          Preview
        </Badge>
      </AlertTitle>
      <AlertDescription className="text-xs text-muted-foreground">{description}</AlertDescription>
    </Alert>
  );
}
