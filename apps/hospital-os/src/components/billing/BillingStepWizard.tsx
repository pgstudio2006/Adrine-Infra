import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export type WizardStep = {
  id: string;
  label: string;
};

type Props = {
  steps: WizardStep[];
  currentStep: number;
  onStepChange?: (index: number) => void;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  onFinish?: () => void;
  nextLabel?: string;
  finishLabel?: string;
  canNext?: boolean;
  canFinish?: boolean;
  loading?: boolean;
};

export function BillingStepWizard({
  steps,
  currentStep,
  onStepChange,
  children,
  onBack,
  onNext,
  onFinish,
  nextLabel = 'Continue',
  finishLabel = 'Complete',
  canNext = true,
  canFinish = true,
  loading = false,
}: Props) {
  const isLast = currentStep >= steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            Step {currentStep + 1} of {steps.length}
          </span>
          <span>{steps[currentStep]?.label}</span>
        </div>
        <Progress value={progress} className="h-1.5" />
        <div className="flex flex-wrap gap-2">
          {steps.map((step, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <button
                key={step.id}
                type="button"
                disabled={!onStepChange || i > currentStep}
                onClick={() => onStepChange?.(i)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] border transition-colors',
                  active && 'border-primary bg-primary/10 text-foreground',
                  done && 'border-green-500/40 text-green-700 dark:text-green-400',
                  !active && !done && 'border-border text-muted-foreground',
                )}
              >
                {done ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <span className="font-mono w-4 text-center">{i + 1}</span>
                )}
                {step.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-[120px]">{children}</div>

      <div className="flex justify-between gap-2 pt-2 border-t">
        <Button
          type="button"
          variant="outline"
          disabled={currentStep === 0 || loading}
          onClick={onBack}
        >
          Back
        </Button>
        {isLast ? (
          <Button
            type="button"
            disabled={!canFinish || loading}
            onClick={onFinish}
          >
            {finishLabel}
          </Button>
        ) : (
          <Button
            type="button"
            disabled={!canNext || loading}
            onClick={onNext}
          >
            {nextLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
