import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  canReleaseLabReport,
  canVerifyLabResults,
  getLabReleaseDisabledReason,
  getLabVerifyDisabledReason,
  type UiLabStage,
} from '@/operations/lab-stage-guards';

function GovernedButton({
  label,
  disabled,
  disabledReason,
  onClick,
  variant = 'default',
}: {
  label: string;
  disabled: boolean;
  disabledReason: string | null;
  onClick: () => void;
  variant?: 'default' | 'outline';
}) {
  const btn = (
    <Button
      size="sm"
      variant={variant}
      className="text-xs h-7"
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </Button>
  );

  if (!disabled || !disabledReason) return btn;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{btn}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        {disabledReason}
      </TooltipContent>
    </Tooltip>
  );
}

export function LabGovernedActions({
  platformLabState,
  localStage,
  hasResults,
  onVerify,
  onRelease,
  showVerify = true,
  showRelease = true,
}: {
  platformLabState?: string;
  localStage: UiLabStage;
  hasResults?: boolean;
  onVerify: () => void;
  onRelease: () => void;
  showVerify?: boolean;
  showRelease?: boolean;
}) {
  const verifyReason = getLabVerifyDisabledReason({
    platformState: platformLabState,
    localStage,
    hasResults,
  });
  const releaseReason = getLabReleaseDisabledReason({
    platformState: platformLabState,
    localStage,
  });
  const canVerify = canVerifyLabResults(platformLabState, localStage) && !!hasResults;
  const canRelease = canReleaseLabReport(platformLabState, localStage);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-wrap gap-2">
        {showVerify && (
          <GovernedButton
            label="Validate report"
            disabled={!canVerify}
            disabledReason={verifyReason}
            onClick={onVerify}
          />
        )}
        {showRelease && (
          <GovernedButton
            label="Release to doctor"
            disabled={!canRelease}
            disabledReason={releaseReason}
            onClick={onRelease}
            variant="outline"
          />
        )}
      </div>
    </TooltipProvider>
  );
}
