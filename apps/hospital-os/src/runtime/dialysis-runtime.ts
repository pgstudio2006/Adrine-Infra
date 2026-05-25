import type { DialysisValidationContext } from '@adrine/hospital-operations';
import { platformFetch } from './platform-client';
import { getPlatformSession, isPlatformRuntimeEnabled } from './platform-session';

export type PlatformDialysisSession = {
  id: string;
  state: string;
  scheduledAt?: string | null;
  packageCode?: string | null;
  machineId?: string | null;
  ipdAdmissionId?: string | null;
  version: number;
  patient?: { id: string; fullName: string; mrn?: string | null };
  machine?: { id: string; code: string; model: string; state: string } | null;
};

export type PlatformDialysisMachine = {
  id: string;
  code: string;
  model: string;
  state: string;
  hoursRun: number;
};

function domainBase(): string | undefined {
  return import.meta.env.VITE_DOMAIN_API_URL as string | undefined;
}

export function canUseDialysisRuntime(): boolean {
  return isPlatformRuntimeEnabled() && !!domainBase() && !!getPlatformSession();
}

export async function platformListDialysisWorklist(take = 100): Promise<PlatformDialysisSession[]> {
  return platformFetch(domainBase()!, `/dialysis/branch/worklist?take=${take}`);
}

export async function platformListDialysisMachines(): Promise<PlatformDialysisMachine[]> {
  return platformFetch(domainBase()!, '/dialysis/machines');
}

export async function platformCreateDialysisSession(input: {
  patientId: string;
  ipdAdmissionId?: string;
  machineId?: string;
  scheduledAt?: string;
  packageCode?: string;
  externalRef?: string;
  syncBilling?: boolean;
}): Promise<PlatformDialysisSession> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, '/dialysis/sessions', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      actorRole: session.role,
      actorId: session.userId,
    }),
  });
}

export async function platformDialysisTransition(
  sessionId: string,
  action: string,
  context?: DialysisValidationContext,
  expectedVersion?: number,
): Promise<{ session: PlatformDialysisSession }> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, `/dialysis/sessions/${sessionId}/transition`, {
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

export async function platformListDialysisSessionsForAdmission(
  admissionId: string,
): Promise<PlatformDialysisSession[]> {
  return platformFetch(domainBase()!, `/dialysis/admission/${admissionId}/sessions`);
}
