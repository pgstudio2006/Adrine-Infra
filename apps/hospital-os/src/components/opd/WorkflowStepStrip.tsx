import { frontDeskSpine, clinicalOpdSpine } from '@adrine/hospital-operations';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

type JourneyKind = 'front_desk' | 'clinical_opd';

type Props = {
  journey: JourneyKind;
  currentStepId: string;
  className?: string;
};

const SPINES = {
  front_desk: frontDeskSpine,
  clinical_opd: clinicalOpdSpine,
} as const;

/**
 * Horizontal OPD journey strip — register → appoint → check-in → queue → handoff (reception)
 * or queue → consult → orders (doctor).
 */
export function WorkflowStepStrip({ journey, currentStepId, className }: Props) {
  const navigate = useNavigate();
  const spine = SPINES[journey];
  const stepsWithRoute = spine.steps.filter((s) => s.route);
  const currentIndex = stepsWithRoute.findIndex((s) => s.id === currentStepId);

  return (
    <nav
      aria-label={spine.label}
      className={cn(
        'flex items-center gap-1 overflow-x-auto rounded-lg border bg-card/60 px-2 py-2',
        className,
      )}
    >
      {stepsWithRoute.map((step, index) => {
        const isCurrent = step.id === currentStepId;
        const isPast = currentIndex >= 0 && index < currentIndex;
        const route = step.route!;

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => navigate(route)}
            className={cn(
              'flex items-center gap-1.5 shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
              isCurrent
                ? 'bg-primary text-primary-foreground shadow-sm'
                : isPast
                  ? 'text-foreground hover:bg-accent'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold border',
                isCurrent
                  ? 'border-primary-foreground/40 bg-primary-foreground/15'
                  : isPast
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border bg-muted',
              )}
            >
              {isPast ? <Check className="h-3 w-3" /> : index + 1}
            </span>
            <span className="whitespace-nowrap">{step.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
