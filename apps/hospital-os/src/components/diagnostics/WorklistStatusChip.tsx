import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type WorklistChipTone = 'default' | 'secondary' | 'outline' | 'destructive';

const toneClass: Record<WorklistChipTone, string> = {
  default: 'bg-primary/10 text-primary border-primary/20',
  secondary: 'bg-secondary text-secondary-foreground',
  outline: 'bg-muted text-muted-foreground',
  destructive: 'bg-destructive/10 text-destructive border-destructive/30',
};

export function WorklistStatusChip({
  label,
  tone = 'outline',
  className,
}: {
  label: string;
  tone?: WorklistChipTone;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn('text-xs font-medium border', toneClass[tone], className)}>
      {label}
    </Badge>
  );
}
