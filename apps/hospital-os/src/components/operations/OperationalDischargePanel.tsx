import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, LogOut } from 'lucide-react';
import type { DischargeValidationContext } from '@adrine/hospital-operations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  canUseDischargeRuntime,
  platformDischargeTransition,
  platformGetLiveDischargeState,
  type LiveDischargeState,
} from '@/runtime/discharge-runtime';
import { formatPlatformErrorBody, PlatformApiError } from '@/runtime/platform-client';
import { useOperationalPanelSubscription } from '@/hooks/useOperationalPanelsSync';
import { getPlatformSession } from '@/runtime/platform-session';
import { toast } from 'sonner';

type ClearanceStep = {
  id: string;
  label: string;
  pendingState: string;
  action: string;
  roles: string[];
  clearedField: keyof NonNullable<LiveDischargeState['discharge']>;
};

const CLEARANCE_STEPS: ClearanceStep[] = [
  {
    id: 'clinical',
    label: 'Clinical',
    pendingState: 'clinical_clearance_pending',
    action: 'grant_clinical_clearance',
    roles: ['doctor'],
    clearedField: 'clinicalClearedAt',
  },
  {
    id: 'billing',
    label: 'Billing',
    pendingState: 'billing_clearance_pending',
    action: 'grant_billing_clearance',
    roles: ['billing', 'receptionist'],
    clearedField: 'billingClearedAt',
  },
  {
    id: 'pharmacy',
    label: 'Pharmacy',
    pendingState: 'pharmacy_clearance_pending',
    action: 'grant_pharmacy_clearance',
    roles: ['pharmacist', 'nurse'],
    clearedField: 'pharmacyClearedAt',
  },
  {
    id: 'nursing',
    label: 'Nursing',
    pendingState: 'nursing_clearance_pending',
    action: 'grant_nursing_clearance',
    roles: ['nurse', 'nurse_supervisor'],
    clearedField: 'nursingClearedAt',
  },
  {
    id: 'insurance',
    label: 'Insurance / final',
    pendingState: 'insurance_clearance_pending',
    action: 'grant_insurance_clearance',
    roles: ['billing', 'receptionist', 'insurance_desk', 'admin'],
    clearedField: 'insuranceClearedAt',
  },
];

type Props = {
  admissionId?: string;
  patientName?: string;
  clinicalClearanceContext?: DischargeValidationContext;
  billingClearanceContext?: DischargeValidationContext;
  pharmacyClearanceContext?: DischargeValidationContext;
  nurseClearanceContext?: DischargeValidationContext;
  insuranceClearanceContext?: DischargeValidationContext;
  completeDischargeContext?: DischargeValidationContext;
  onBlockersChange?: (blockers: LiveDischargeState['blockers']) => void;
  onLiveStateChange?: (live: LiveDischargeState | null) => void;
  onTransitionComplete?: () => void;
};

function contextForStep(
  stepId: string,
  props: Props,
): DischargeValidationContext | undefined {
  switch (stepId) {
    case 'clinical':
      return props.clinicalClearanceContext;
    case 'billing':
      return props.billingClearanceContext;
    case 'pharmacy':
      return props.pharmacyClearanceContext;
    case 'nursing':
      return props.nurseClearanceContext;
    case 'insurance':
      return props.insuranceClearanceContext;
    default:
      return undefined;
  }
}

export function OperationalDischargePanel({
  admissionId,
  patientName,
  clinicalClearanceContext,
  billingClearanceContext,
  pharmacyClearanceContext,
  nurseClearanceContext,
  insuranceClearanceContext,
  completeDischargeContext,
  onBlockersChange,
  onLiveStateChange,
  onTransitionComplete,
}: Props) {
  const [state, setState] = useState<LiveDischargeState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  const sessionRole = getPlatformSession()?.role ?? '';

  const load = useCallback(async () => {
    if (!admissionId) return;
    try {
      const data = await platformGetLiveDischargeState(admissionId);
      setState(data);
      setError(null);
      onBlockersChange?.(data.blockers);
      onLiveStateChange?.(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load discharge state');
      onLiveStateChange?.(null);
    }
  }, [admissionId, onBlockersChange, onLiveStateChange]);

  useOperationalPanelSubscription({
    onDelta: (payload) => {
      if (payload.type === 'discharge.transition' && payload.admissionId === admissionId) {
        void load();
      }
    },
    onSnapshot: () => {
      void load();
    },
  });

  useEffect(() => {
    if (!admissionId || !canUseDischargeRuntime()) return;
    void load();
  }, [load, admissionId]);

  const runTransition = async (
    action: string,
    context?: DischargeValidationContext,
    successLabel?: string,
  ) => {
    if (!state?.discharge) {
      toast.error('Discharge orchestration not started on platform');
      return;
    }
    setTransitioning(true);
    try {
      await platformDischargeTransition(
        state.discharge.id,
        action,
        context,
        state.discharge.version,
      );
      toast.success(successLabel ?? 'Discharge step recorded on platform');
      await load();
      onTransitionComplete?.();
    } catch (err) {
      const body = err instanceof PlatformApiError ? err.body : undefined;
      toast.error('Platform rejected discharge action', {
        description:
          formatPlatformErrorBody(body)
          ?? (err instanceof Error ? err.message : 'Transition failed'),
      });
    } finally {
      setTransitioning(false);
    }
  };

  const blockers = state?.blockers ?? [];
  const critical = blockers.filter((b) => b.severity === 'critical');
  const warnings = blockers.filter((b) => b.severity !== 'critical');
  const orchestrationState = state?.discharge?.state;
  const discharge = state?.discharge;

  const checklist = useMemo(() => {
    if (!discharge) {
      return CLEARANCE_STEPS.map((s) => ({ ...s, status: 'pending' as const }));
    }
    return CLEARANCE_STEPS.map((step) => {
      const cleared = Boolean(discharge[step.clearedField]);
      const isCurrent = orchestrationState === step.pendingState;
      return {
        ...step,
        status: cleared ? ('done' as const) : isCurrent ? ('active' as const) : ('pending' as const),
      };
    });
  }, [discharge, orchestrationState]);

  const roleCanAct = (roles: string[]) =>
    roles.includes(sessionRole) || sessionRole === 'admin';

  const activeStep = checklist.find((s) => s.status === 'active');
  const activeContext = activeStep ? contextForStep(activeStep.id, {
    clinicalClearanceContext,
    billingClearanceContext,
    pharmacyClearanceContext,
    nurseClearanceContext,
    insuranceClearanceContext,
  }) : undefined;

  const canActOnActiveStep =
    activeStep
    && roleCanAct(activeStep.roles)
    && activeContext !== undefined
    && critical.length === 0;

  const canStartClinical =
    orchestrationState === 'initiated'
    && roleCanAct(['doctor', 'nurse'])
    && clinicalClearanceContext?.dischargeSummaryDraft !== false;

  const canCompletePlatformDischarge =
    orchestrationState === 'ready_for_discharge'
    && roleCanAct(['receptionist', 'billing', 'nurse'])
    && completeDischargeContext !== undefined
    && critical.length === 0;

  if (!admissionId || !canUseDischargeRuntime()) return null;

  return (
    <Card className="border-dashed border-violet-500/30 bg-violet-500/5">
      <CardHeader className="pb-2">
        <motion.div className="flex items-center justify-between gap-2">
          <motion.div className="flex items-center gap-2">
            <LogOut className="w-4 h-4 text-violet-600" />
            <CardTitle className="text-sm">Discharge orchestration</CardTitle>
          </motion.div>
          {discharge ? (
            <Badge variant="outline" className="text-[10px]">
              {discharge.state.replace(/_/g, ' ')}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">
              not started
            </Badge>
          )}
        </motion.div>
        <CardDescription>
          {patientName ? `${patientName} — ` : ''}
          Governed clearance checklist (platform)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <ul className="space-y-1">
          {checklist.map((step) => (
            <li key={step.id} className="flex items-center gap-2 text-xs">
              {step.status === 'done' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : step.status === 'active' ? (
                <Circle className="w-3.5 h-3.5 text-violet-600 fill-violet-500/20 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              )}
              <span
                className={
                  step.status === 'active'
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground'
                }
              >
                {step.label}
                {step.status === 'active' ? ' (current)' : ''}
              </span>
            </li>
          ))}
        </ul>

        {error ? (
          <p className="text-destructive text-xs">{error}</p>
        ) : blockers.length > 0 ? (
          <ul className="space-y-1">
            {critical.map((b) => (
              <li key={b.code} className="text-xs text-destructive font-medium">
                {b.message}
              </li>
            ))}
            {warnings.map((b) => (
              <li key={b.code} className="text-xs text-violet-900 dark:text-violet-200">
                {b.message}
              </li>
            ))}
          </ul>
        ) : discharge ? (
          <p className="text-xs text-muted-foreground">No live discharge blockers</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Orchestration starts when admission moves to discharge planning on platform.
          </p>
        )}

        {canStartClinical ? (
          <Button
            size="sm"
            className="text-xs h-7"
            disabled={transitioning}
            onClick={() =>
              void runTransition(
                'start_clinical_clearance',
                clinicalClearanceContext ?? { dischargeSummaryDraft: true },
                'Clinical clearance started',
              )
            }
          >
            {transitioning ? 'Starting…' : 'Start clinical clearance'}
          </Button>
        ) : null}

        {canActOnActiveStep && activeStep ? (
          <Button
            size="sm"
            className="text-xs h-7"
            disabled={transitioning}
            onClick={() =>
              void runTransition(
                activeStep.action,
                activeContext,
                `${activeStep.label} clearance granted`,
              )
            }
          >
            {transitioning ? 'Granting…' : `Grant ${activeStep.label.toLowerCase()} clearance`}
          </Button>
        ) : activeStep && roleCanAct(activeStep.roles) && activeContext === undefined ? (
          <p className="text-[10px] text-muted-foreground">
            Complete local checklist to enable {activeStep.label.toLowerCase()} clearance on platform.
          </p>
        ) : null}

        {canCompletePlatformDischarge ? (
          <Button
            size="sm"
            variant="secondary"
            className="text-xs h-7"
            disabled={transitioning}
            onClick={() =>
              void runTransition(
                'complete_discharge',
                completeDischargeContext,
                'Discharge completed on platform',
              )
            }
          >
            {transitioning ? 'Completing…' : 'Complete discharge (platform)'}
          </Button>
        ) : orchestrationState === 'ready_for_discharge' ? (
          <p className="text-[10px] text-muted-foreground">
            Final bill settlement and bed release required before platform discharge completion.
          </p>
        ) : null}

        {discharge?.state === 'discharged' ? (
          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
            Platform discharge complete — local status may be synced.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
