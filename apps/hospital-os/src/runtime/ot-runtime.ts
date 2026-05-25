import type { OtValidationContext } from '@adrine/hospital-operations';
import { platformFetch } from './platform-client';
import { getPlatformSession, isPlatformRuntimeEnabled } from './platform-session';

export type PlatformOtCase = {
  id: string;
  state: string;
  procedureName: string;
  surgeonName?: string | null;
  priority: string;
  scheduledAt?: string | null;
  otRoomId?: string | null;
  ipdAdmissionId?: string | null;
  version: number;
  patient?: { id: string; fullName: string; mrn?: string | null };
  otRoom?: { id: string; code: string; label: string; state: string } | null;
};

export type PlatformOtRoom = {
  id: string;
  code: string;
  label: string;
  state: string;
};

function domainBase(): string | undefined {
  return import.meta.env.VITE_DOMAIN_API_URL as string | undefined;
}

export function canUseOtRuntime(): boolean {
  return isPlatformRuntimeEnabled() && !!domainBase() && !!getPlatformSession();
}

export async function platformListOtWorklist(take = 100): Promise<PlatformOtCase[]> {
  return platformFetch(domainBase()!, `/ot/branch/worklist?take=${take}`);
}

export async function platformListOtRooms(): Promise<PlatformOtRoom[]> {
  return platformFetch(domainBase()!, '/ot/rooms');
}

export async function platformCreateOtCase(input: {
  patientId: string;
  ipdAdmissionId?: string;
  otRoomId?: string;
  procedureName: string;
  surgeonName?: string;
  priority?: string;
  scheduledAt?: string;
  externalRef?: string;
  syncBilling?: boolean;
}): Promise<PlatformOtCase> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, '/ot/cases', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      actorRole: session.role,
      actorId: session.userId,
    }),
  });
}

export async function platformOtTransition(
  caseId: string,
  action: string,
  context?: OtValidationContext,
  expectedVersion?: number,
): Promise<{ case: PlatformOtCase }> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, `/ot/cases/${caseId}/transition`, {
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

export async function platformListOtCasesForAdmission(
  admissionId: string,
): Promise<PlatformOtCase[]> {
  return platformFetch(domainBase()!, `/ot/admission/${admissionId}/cases`);
}
