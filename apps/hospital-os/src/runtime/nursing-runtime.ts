import type { NursingValidationContext } from '@adrine/hospital-operations';
import { platformFetch } from './platform-client';
import { getPlatformSession } from './platform-session';
import { canUseIpdRuntime } from './ipd-runtime';

export type PlatformNursingTask = {
  id: string;
  state: string;
  description: string;
  version: number;
  admissionId: string;
  patientId: string;
  taskType: string;
  priority?: string | null;
  assignedTo?: string | null;
  dueAt?: string | null;
  completedAt?: string | null;
};

function domainBase(): string | undefined {
  return import.meta.env.VITE_DOMAIN_API_URL as string | undefined;
}

export function canUseNursingRuntime(): boolean {
  return canUseIpdRuntime();
}

export async function platformListNursingTasksForAdmission(
  admissionId: string,
): Promise<PlatformNursingTask[]> {
  return platformFetch(domainBase()!, `/nursing/tasks/admission/${admissionId}`);
}

export async function platformCreateNursingTask(input: {
  admissionId: string;
  patientId: string;
  taskType: string;
  description: string;
  assignedTo?: string;
}): Promise<PlatformNursingTask> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, '/nursing/tasks', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      actorRole: session.role,
      actorId: session.userId,
    }),
  });
}

export async function platformNursingTransition(
  taskId: string,
  action: string,
  context?: NursingValidationContext,
  expectedVersion?: number,
): Promise<{ task: PlatformNursingTask }> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, `/nursing/tasks/${taskId}/transition`, {
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

export type PlatformNursingVital = {
  id: string;
  admissionId: string;
  patientId: string;
  nurse: string;
  shift: string;
  bp: string;
  pulse: number;
  temp: number;
  spo2: number;
  painScore: number;
  notes?: string | null;
  recordedAt: string;
};

export type PlatformNursingNote = {
  id: string;
  admissionId: string;
  patientId: string;
  nurse: string;
  noteType: string;
  body: string;
  createdAt: string;
};

export async function platformRecordVitals(input: {
  admissionId: string;
  patientId: string;
  nurse: string;
  shift?: string;
  bp: string;
  pulse: number;
  temp: number;
  spo2: number;
  painScore: number;
  notes?: string;
}): Promise<PlatformNursingVital> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, '/nursing/vitals', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      actorRole: session.role,
      actorId: session.userId,
    }),
  });
}

export async function platformListVitalsForAdmission(
  admissionId: string,
): Promise<PlatformNursingVital[]> {
  return platformFetch(domainBase()!, `/nursing/vitals/admission/${admissionId}`);
}

export async function platformListNotesForAdmission(
  admissionId: string,
): Promise<PlatformNursingNote[]> {
  return platformFetch(domainBase()!, `/nursing/notes/admission/${admissionId}`);
}

export async function platformCreateNursingNote(input: {
  admissionId: string;
  patientId: string;
  nurse: string;
  noteType: string;
  body: string;
}): Promise<PlatformNursingNote> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, '/nursing/notes', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      actorRole: session.role,
      actorId: session.userId,
    }),
  });
}

export async function platformGetNurseReport(admissionId: string) {
  return platformFetch<{
    vitals: PlatformNursingVital[];
    notes: PlatformNursingNote[];
    mar: unknown[];
    auditTrail: { at: string; nurse: string; action: string; detail: string }[];
    admission: { uhid?: string | null; patientName: string };
  }>(domainBase()!, `/nursing/reports/admission/${admissionId}`);
}
