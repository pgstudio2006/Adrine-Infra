import type { OpdValidationContext } from '@adrine/hospital-operations';
import { platformFetch, PlatformApiError } from './platform-client';
import { getPlatformSession, isPlatformRuntimeEnabled } from './platform-session';

export type PlatformOpdVisit = {
  id: string;
  state: string;
  patientId: string;
  branchId: string;
  tokenNumber?: number | null;
  encounterId?: string | null;
  appointmentId?: string | null;
  department?: string | null;
  assignedDoctor?: string | null;
  createdAt?: string;
  metadata?: Record<string, unknown> | null;
  patient?: { id: string; fullName: string; mrn?: string | null };
};

function domainBase(): string | undefined {
  return import.meta.env.VITE_DOMAIN_API_URL as string | undefined;
}

function kernelBase(): string | undefined {
  return import.meta.env.VITE_KERNEL_API_URL as string | undefined;
}

export function canUseOpdRuntime(): boolean {
  return isPlatformRuntimeEnabled() && !!domainBase() && !!getPlatformSession();
}

/** Register patient + start OPD visit on domain-api (authoritative). */
export async function platformRegisterOpdPatient(input: {
  fullName: string;
  mrn?: string;
  department?: string;
  assignedDoctor?: string;
  actorRole?: string;
}): Promise<{ visit: PlatformOpdVisit; patientId: string }> {
  const base = domainBase()!;
  const session = getPlatformSession()!;
  const result = await platformFetch<{ visit?: PlatformOpdVisit } & PlatformOpdVisit>(
    base,
    '/opd/visits',
    {
      method: 'POST',
      body: JSON.stringify({
        register: {
          fullName: input.fullName,
          mrn: input.mrn,
        },
        department: input.department,
        assignedDoctor: input.assignedDoctor,
        actorRole: input.actorRole ?? session.role,
        actorId: session.userId,
      }),
    },
  );
  const visit = 'visit' in result && result.visit ? result.visit : result;
  return { visit, patientId: visit.patientId };
}

export async function platformGetActiveOpdVisit(
  patientId: string,
): Promise<PlatformOpdVisit | null> {
  const base = domainBase();
  if (!base) return null;
  try {
    return await platformFetch<PlatformOpdVisit | null>(
      base,
      `/opd/visits/patient/${patientId}/active`,
    );
  } catch {
    return null;
  }
}

/** Resolve or create an active OPD visit for a registered platform patient. */
export async function platformEnsureActiveOpdVisit(input: {
  platformPatientId: string;
  department?: string;
  assignedDoctor?: string;
}): Promise<PlatformOpdVisit> {
  const existing = await platformGetActiveOpdVisit(input.platformPatientId);
  if (existing) return existing;

  const base = domainBase()!;
  const session = getPlatformSession()!;
  const created = await platformFetch<{ visit?: PlatformOpdVisit } & PlatformOpdVisit>(
    base,
    '/opd/visits',
    {
      method: 'POST',
      body: JSON.stringify({
        patientId: input.platformPatientId,
        department: input.department,
        assignedDoctor: input.assignedDoctor,
        actorRole: session.role,
        actorId: session.userId,
      }),
    },
  );
  let visit = 'visit' in created && created.visit ? created.visit : created;

  if (visit.state === 'intent') {
    ({ visit } = await platformOpdTransition(visit.id, 'register_patient', {
      demographicsComplete: true,
      consentCaptured: true,
    }));
  }

  return visit;
}

/** Active visits for branch queue / reception board (domain-api). */
export async function platformListOpdBoard(branchId: string): Promise<PlatformOpdVisit[]> {
  const base = domainBase();
  if (!base) return [];
  const query = `branchId=${encodeURIComponent(branchId)}`;
  /** Prefer alias — old deploys routed visits/board to visits/:id with id=board. */
  const paths = [`/opd/board/visits?${query}`, `/opd/visits/board?${query}`];
  let lastError: PlatformApiError | undefined;
  for (const path of paths) {
    try {
      return await platformFetch<PlatformOpdVisit[]>(base, path);
    } catch (err) {
      if (err instanceof PlatformApiError && err.status === 404) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  throw lastError ?? new PlatformApiError('OPD board unavailable', 404);
}

export async function platformGetOpdVisit(visitId: string): Promise<PlatformOpdVisit> {
  const base = domainBase()!;
  return platformFetch<PlatformOpdVisit>(base, `/opd/visits/${visitId}`);
}

export async function platformOpdTransition(
  visitId: string,
  action: string,
  context?: OpdValidationContext,
  payload?: Record<string, unknown>,
): Promise<{ visit: PlatformOpdVisit }> {
  const base = domainBase()!;
  const session = getPlatformSession()!;
  return platformFetch(base, `/opd/visits/${visitId}/transition`, {
    method: 'POST',
    body: JSON.stringify({
      action,
      actorRole: session.role,
      actorId: session.userId,
      context,
      payload,
    }),
  });
}

export async function platformRecordMetering(
  metrics: readonly string[],
  resourceId?: string,
): Promise<void> {
  const base = kernelBase();
  if (!base || !metrics.length) return;
  await Promise.all(
    metrics.map((metric) =>
      platformFetch(base, '/metering/usage', {
        method: 'POST',
        body: JSON.stringify({ metric, resourceId }),
      }).catch(() => undefined),
    ),
  );
}

export async function platformKernelAudit(
  action: string,
  resource: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const base = kernelBase();
  const session = getPlatformSession();
  if (!base || !session) return;
  try {
    await platformFetch(base, '/audit/events', {
      method: 'POST',
      body: JSON.stringify({
        action,
        resource,
        actorId: session.userId,
        metadata,
      }),
    });
  } catch {
    // non-blocking
  }
}

export { PlatformApiError };
