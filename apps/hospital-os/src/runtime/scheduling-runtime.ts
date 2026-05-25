import { platformFetch } from './platform-client';
import { getPlatformSession, isPlatformRuntimeEnabled } from './platform-session';

export type PlatformAppointment = {
  id: string;
  patientId: string;
  startAt: string;
  endAt: string;
  resourceLabel: string;
  status: string;
  patient?: { id: string; fullName: string; mrn?: string | null };
};

export type PlatformPatientRow = {
  id: string;
  fullName: string;
  mrn?: string | null;
  createdAt?: string;
};

function domainBase(): string | undefined {
  return import.meta.env.VITE_DOMAIN_API_URL as string | undefined;
}

export function canUseSchedulingRuntime(): boolean {
  return isPlatformRuntimeEnabled() && !!domainBase() && !!getPlatformSession();
}

export type PlatformSchedulingResource = {
  id: string;
  code: string;
  label: string;
  resourceType: string;
  department?: string | null;
  isActive: boolean;
};

export type PlatformWaitlistEntry = {
  id: string;
  patientId: string;
  resourceLabel: string;
  preferredStart?: string | null;
  status: string;
  priority: string;
  patient?: { id: string; fullName: string; mrn?: string | null };
};

function branchQuery(branchId?: string): string {
  const session = getPlatformSession();
  const bid = branchId ?? session?.branchId ?? 'branch_main';
  return `branchId=${encodeURIComponent(bid)}`;
}

export async function platformBookAppointment(input: {
  patientId: string;
  startAt: string;
  endAt: string;
  resourceLabel: string;
  status?: string;
}): Promise<PlatformAppointment> {
  const base = domainBase()!;
  try {
    return await platformFetch<PlatformAppointment>(base, '/scheduling/appointments', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  } catch {
    return platformFetch<PlatformAppointment>(base, '/appointments', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }
}

export async function platformListAppointmentsForPatient(
  patientId: string,
): Promise<PlatformAppointment[]> {
  const base = domainBase();
  if (!base) return [];
  return platformFetch<PlatformAppointment[]>(base, `/appointments/patient/${patientId}`);
}

export async function platformListAppointmentsInRange(
  from: string,
  to: string,
): Promise<PlatformAppointment[]> {
  const base = domainBase();
  if (!base) return [];
  try {
    return await platformFetch<PlatformAppointment[]>(
      base,
      `/scheduling/appointments/range?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    );
  } catch {
    return platformFetch<PlatformAppointment[]>(
      base,
      `/appointments/range?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    );
  }
}

export async function platformListSchedulingResources(
  branchId?: string,
): Promise<PlatformSchedulingResource[]> {
  const base = domainBase();
  if (!base) return [];
  return platformFetch<PlatformSchedulingResource[]>(base, `/scheduling/resources?${branchQuery(branchId)}`);
}

export async function platformUpsertSchedulingResource(
  body: {
    code: string;
    label: string;
    resourceType?: string;
    department?: string;
  },
  branchId?: string,
): Promise<PlatformSchedulingResource> {
  return platformFetch<PlatformSchedulingResource>(domainBase()!, `/scheduling/resources?${branchQuery(branchId)}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function platformListSchedulingWaitlist(
  branchId?: string,
  status?: string,
): Promise<PlatformWaitlistEntry[]> {
  const base = domainBase();
  if (!base) return [];
  const statusQ = status ? `&status=${encodeURIComponent(status)}` : '';
  return platformFetch<PlatformWaitlistEntry[]>(
    base,
    `/scheduling/waitlist?${branchQuery(branchId)}${statusQ}`,
  );
}

export async function platformEnqueueSchedulingWaitlist(
  body: {
    patientId: string;
    resourceLabel: string;
    preferredStart?: string;
    priority?: string;
    notes?: string;
  },
  branchId?: string,
): Promise<PlatformWaitlistEntry> {
  return platformFetch<PlatformWaitlistEntry>(domainBase()!, `/scheduling/waitlist?${branchQuery(branchId)}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function platformUpdateAppointmentStatus(
  appointmentId: string,
  status: 'cancelled' | 'completed' | 'no_show' | 'confirmed' | 'checked_in',
): Promise<PlatformAppointment> {
  return platformFetch<PlatformAppointment>(domainBase()!, `/appointments/${appointmentId}/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  });
}

export async function platformListPatients(): Promise<PlatformPatientRow[]> {
  const base = domainBase();
  if (!base) return [];
  return platformFetch<PlatformPatientRow[]>(base, '/patients');
}

export async function platformSearchPatients(query: string): Promise<PlatformPatientRow[]> {
  const base = domainBase();
  if (!base) return [];
  return platformFetch<PlatformPatientRow[]>(
    base,
    `/patients/search?q=${encodeURIComponent(query)}`,
  );
}
