import type { DischargeValidationContext } from '@adrine/hospital-operations';
import { platformFetch } from './platform-client';
import { getPlatformSession } from './platform-session';
import { canUseIpdRuntime } from './ipd-runtime';

export type PlatformDischarge = {
  id: string;
  state: string;
  admissionId: string;
  version: number;
  clinicalClearedAt?: string | null;
  billingClearedAt?: string | null;
  pharmacyClearedAt?: string | null;
  nursingClearedAt?: string | null;
  insuranceClearedAt?: string | null;
  readyAt?: string | null;
};

export type LiveDischargeState = {
  discharge: PlatformDischarge | null;
  blockers: { code: string; message: string; severity: string; domain?: string }[];
};

function domainBase(): string | undefined {
  return import.meta.env.VITE_DOMAIN_API_URL as string | undefined;
}

export function canUseDischargeRuntime(): boolean {
  return canUseIpdRuntime();
}

/** Local "Mark discharged" only after platform orchestration reached `discharged`. */
export function canMarkLocalDischarged(live: LiveDischargeState | null | undefined): boolean {
  if (!canUseDischargeRuntime()) return true;
  return live?.discharge?.state === 'discharged';
}

/** Local discharge-ready allowed when orchestration not started or still in early clearance. */
export function canMarkLocalDischargeReady(live: LiveDischargeState | null | undefined): boolean {
  if (!canUseDischargeRuntime()) return true;
  if (!live?.discharge) return true;
  const terminal = ['discharged', 'cancelled', 'ready_for_discharge'];
  return !terminal.includes(live.discharge.state);
}

export async function platformStartDischarge(input: {
  admissionId: string;
  patientId: string;
}): Promise<PlatformDischarge> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, '/discharge/orchestrations', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      actorRole: session.role,
      actorId: session.userId,
    }),
  });
}

export async function platformDischargeTransition(
  dischargeId: string,
  action: string,
  context?: DischargeValidationContext,
  expectedVersion?: number,
): Promise<{ discharge: PlatformDischarge; blockers: LiveDischargeState['blockers'] }> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, `/discharge/orchestrations/${dischargeId}/transition`, {
    method: 'POST',
    body: JSON.stringify({
      action,
      actorRole: session.role,
      actorId: session.userId,
      context,
      expectedVersion,
    }),
  });
}

export async function platformGetLiveDischargeState(
  admissionId: string,
): Promise<LiveDischargeState> {
  const discharge = await platformFetch<PlatformDischarge | null>(
    domainBase()!,
    `/discharge/admissions/${admissionId}`,
  );
  if (!discharge) {
    return { discharge: null, blockers: [] };
  }
  const blockers = await platformFetch<LiveDischargeState['blockers']>(
    domainBase()!,
    `/discharge/orchestrations/${discharge.id}/blockers`,
  );
  return { discharge, blockers };
}
