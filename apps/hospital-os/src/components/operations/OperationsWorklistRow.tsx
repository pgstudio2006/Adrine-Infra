import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import type { LifecycleNextAction } from '@/lib/operations/module-lifecycle-ui';

type Props = {
  primary: string;
  secondary?: string;
  meta?: string;
  stateLabel: string;
  stateClassName?: string;
  nextAction?: LifecycleNextAction | null;
  onAction?: () => void;
};

export function OperationsWorklistRow({
  primary,
  secondary,
  meta,
  stateLabel,
  stateClassName = 'bg-muted text-muted-foreground',
  nextAction,
  onAction,
}: Props) {
  const cta = nextAction ? (
    nextAction.href ? (
      <Button size="sm" variant={nextAction.variant ?? 'default'} className="gap-1" asChild>
        <Link to={nextAction.href}>
          {nextAction.label}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Button>
    ) : (
      <Button
        size="sm"
        variant={nextAction.variant ?? 'default'}
        className="gap-1"
        onClick={onAction}
      >
        {nextAction.label}
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    )
  ) : null;

  return (
    <Card className="p-4 border-border/60 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold truncate">{primary}</p>
            <Badge className={`text-[10px] ${stateClassName}`}>{stateLabel}</Badge>
          </div>
          {secondary ? (
            <p className="text-xs text-muted-foreground">{secondary}</p>
          ) : null}
          {meta ? <p className="text-[11px] text-muted-foreground font-mono">{meta}</p> : null}
        </div>
        {cta}
      </div>
    </Card>
  );
}
