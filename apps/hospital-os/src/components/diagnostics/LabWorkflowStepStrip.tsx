import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LabOrder } from '@/stores/hospitalStore';

const STEPS = ['Sample', 'Verify', 'Report'] as const;

function labWorkflowStepIndex(order: LabOrder): number {
  if (order.stage === 'Reported') return 3;
  if (order.stage === 'Validated' || order.stage === 'Awaiting Validation') return 2;
  return 1;
}

export function LabWorkflowStepStrip({ order, className }: { order: LabOrder; className?: string }) {
  const active = labWorkflowStepIndex(order);

  return (
    <div className={cn('flex items-center gap-1 text-xs', className)} aria-label="Lab workflow progress">
      {STEPS.map((step, index) => {
        const stepNum = index + 1;
        const done = active > stepNum;
        const current = active === stepNum;
        return (
          <div key={step} className="flex items-center gap-1">
            {index > 0 && <span className="text-muted-foreground/50 px-0.5">→</span>}
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 border',
                done && 'bg-primary/10 text-primary border-primary/20',
                current && 'bg-secondary text-secondary-foreground border-border font-medium',
                !done && !current && 'bg-muted/40 text-muted-foreground border-transparent',
              )}
            >
              {done ? (
                <Check className="h-3 w-3" />
              ) : (
                <Circle className={cn('h-3 w-3', current && 'fill-current')} />
              )}
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}
