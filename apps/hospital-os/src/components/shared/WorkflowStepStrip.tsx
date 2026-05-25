import { useNavigate } from 'react-router-dom';
import type { JourneyStep } from '@adrine/hospital-operations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';

export type WorkflowStepMeta = {
  done?: boolean;
  hint?: string;
  blocked?: boolean;
};

export type WorkflowStepStripProps = {
  title: string;
  description?: string;
  steps: readonly JourneyStep[];
  stepMeta?: Record<string, WorkflowStepMeta>;
  currentStepId?: string;
  onStepClick?: (step: JourneyStep) => void;
};

export function WorkflowStepStrip({
  title,
  description,
  steps,
  stepMeta = {},
  currentStepId,
  onStepClick,
}: WorkflowStepStripProps) {
  const navigate = useNavigate();

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border/80 bg-muted/20">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="overflow-x-auto">
        <ol className="flex min-w-max items-stretch gap-0 px-2 py-3">
          {steps.map((step, index) => {
            const meta = stepMeta[step.id] ?? {};
            const isCurrent = currentStepId === step.id;
            const done = meta.done ?? false;
            const blocked = meta.blocked ?? false;

            return (
              <li key={step.id} className="flex items-center">
                <div
                  className={`flex flex-col w-[140px] sm:w-[160px] px-2 py-1 rounded-md transition-colors ${
                    isCurrent ? 'bg-primary/10 ring-1 ring-primary/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {done ? (
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="text-[10px] font-bold text-muted-foreground">{index + 1}</span>
                    {blocked && (
                      <Badge variant="outline" className="text-[8px] px-1 py-0">
                        Blocked
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs font-medium text-foreground leading-tight line-clamp-2">{step.label}</p>
                  {meta.hint && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{meta.hint}</p>
                  )}
                  {step.route && (
                    <Button
                      type="button"
                      size="sm"
                      variant={done ? 'outline' : 'default'}
                      className="mt-2 h-7 text-[10px] w-full"
                      disabled={blocked}
                      onClick={() => {
                        if (onStepClick) {
                          onStepClick(step);
                          return;
                        }
                        navigate(step.route!);
                      }}
                    >
                      Open
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className="w-6 h-px bg-border shrink-0 self-center mx-0.5" aria-hidden />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
