import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavayuMskLifecycleState } from '@/lib/navayu/navayu-runtime';

const MSK_STEPS: { id: NavayuMskLifecycleState; label: string }[] = [
  { id: 'intake_complete', label: 'Intake' },
  { id: 'associate_eval', label: 'Junior exam' },
  { id: 'msk_exam_complete', label: 'MSK exam' },
  { id: 'ai_summary_ready', label: 'AI summary' },
  { id: 'senior_consult', label: 'Senior consult' },
];

const STATE_ORDER = MSK_STEPS.map((step) => step.id);

function mskStepIndex(state?: NavayuMskLifecycleState): number {
  if (!state) return 0;
  const idx = STATE_ORDER.indexOf(state);
  if (idx < 0) {
    if (state === 'registered' || state === 'intake_pending') return 0;
    if (
      state === 'navayu_classified' ||
      state === 'protocol_mapped' ||
      state === 'counselling' ||
      state === 'package_planned' ||
      state === 'closed'
    ) {
      return MSK_STEPS.length;
    }
    return 0;
  }
  return idx + 1;
}

type Props = {
  state?: NavayuMskLifecycleState;
  seniorView?: boolean;
  className?: string;
};

export function NavayuMskWorkflowStrip({ state, seniorView, className }: Props) {
  const active = mskStepIndex(state);
  const steps = seniorView ? MSK_STEPS.slice(2) : MSK_STEPS;

  return (
    <div
      className={cn('flex flex-wrap items-center gap-1 text-xs', className)}
      aria-label="MSK workflow"
    >
      {steps.map((step, index) => {
        const globalIndex = MSK_STEPS.findIndex((item) => item.id === step.id);
        const stepNum = globalIndex + 1;
        const done = active > stepNum;
        const current = active === stepNum || state === step.id;
        return (
          <div key={step.id} className="flex items-center gap-1">
            {index > 0 && <span className="text-muted-foreground/50 px-0.5">→</span>}
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 border',
                done && 'bg-violet-500/10 text-violet-700 border-violet-500/20',
                current && 'bg-secondary text-secondary-foreground border-border font-medium',
                !done && !current && 'bg-muted/40 text-muted-foreground border-transparent',
              )}
            >
              {done ? (
                <Check className="h-3 w-3" />
              ) : (
                <Circle className={cn('h-3 w-3', current && 'fill-current')} />
              )}
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
