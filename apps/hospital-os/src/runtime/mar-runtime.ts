import type { MarValidationContext } from '@adrine/hospital-operations';
import { platformFetch } from './platform-client';
import { getPlatformSession } from './platform-session';
import { canUseIpdRuntime } from './ipd-runtime';

export type PlatformMarSchedule = {
  id: string;
  state: string;
  drug: string;
  dosage: string;
  route: string;
  frequency: string;
  scheduledAt?: string | null;
  administeredAt?: string | null;
  heldAt?: string | null;
  orderedBy?: string | null;
  notes?: string | null;
  version: number;
  admissionId: string;
  patientId: string;
  nursingTaskId?: string | null;
};

function domainBase(): string | undefined {
  return import.meta.env.VITE_DOMAIN_API_URL as string | undefined;
}

export function canUseMarRuntime(): boolean {
  return canUseIpdRuntime();
}

export async function platformListMarSchedulesForAdmission(
  admissionId: string,
  syncNursing = true,
): Promise<PlatformMarSchedule[]> {
  const q = syncNursing ? '' : '?syncNursing=false';
  return platformFetch(
    domainBase()!,
    `/mar/admission/${admissionId}/schedules${q}`,
  );
}

export async function platformCreateMarSchedule(input: {
  admissionId: string;
  patientId: string;
  drug: string;
  dosage?: string;
  route?: string;
  frequency?: string;
  scheduledAt?: string;
  orderedBy?: string;
  nursingTaskId?: string;
  notes?: string;
}): Promise<PlatformMarSchedule> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, '/mar/schedules', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      actorRole: session.role,
      actorId: session.userId,
    }),
  });
}

export async function platformListMarAuditForAdmission(admissionId: string) {
  return platformFetch<{
    schedules: (PlatformMarSchedule & {
      transitions?: { action: string; toState: string; reason?: string | null; createdAt: string }[];
    })[];
    summary: { total: number; administered: number; missed: number; refused: number; held: number; pending: number };
  }>(domainBase()!, `/mar/admission/${admissionId}/audit`);
}

export async function platformMarTransition(
  scheduleId: string,
  action: string,
  context?: MarValidationContext,
  expectedVersion?: number,
  reason?: string,
): Promise<{ schedule: PlatformMarSchedule }> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, `/mar/schedules/${scheduleId}/transition`, {
    method: 'POST',
    body: JSON.stringify({
      action,
      actorRole: session.role,
      actorId: session.userId,
      context,
      expectedVersion,
      reason,
    }),
  });
}
