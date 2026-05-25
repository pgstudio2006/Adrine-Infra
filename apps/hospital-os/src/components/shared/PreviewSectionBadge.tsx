import { Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function PreviewSectionBadge({ explanation }: { explanation: string }) {
  return (
    <div className="rounded-md border border-dashed border-amber-500/40 bg-amber-500/5 px-3 py-2 flex gap-2 items-start">
      <Badge variant="outline" className="text-[9px] shrink-0 border-amber-500/50 text-amber-800 dark:text-amber-200">
        Preview
      </Badge>
      <p className="text-[11px] text-muted-foreground flex gap-1.5">
        <Info className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
        {explanation}
      </p>
    </div>
  );
}
