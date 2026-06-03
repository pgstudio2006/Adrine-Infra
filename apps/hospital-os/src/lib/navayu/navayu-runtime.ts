import { platformFetch } from '@/runtime/platform-client';
import { canUseOpdRuntime } from '@/runtime/opd-runtime';
import type {
  NavayuLumbarExamData,
  NavayuRegistrationMetadata,
} from '@/lib/navayu/navayu-forms';

export type NavayuMskLifecycleState =
  | 'registered'
  | 'intake_pending'
  | 'intake_complete'
  | 'associate_eval'
  | 'msk_exam_complete'
  | 'ai_summary_ready'
  | 'senior_consult'
  | 'navayu_classified'
  | 'protocol_mapped'
  | 'counselling'
  | 'package_planned'
  | 'closed';

export type NavayuIntakeData = {
  formId?: string;
  version?: string;
  answers?: {
    complaintType?: string;
    complaintText?: string;
    durationBucket?: string;
    vas?: number;
    redFlag?: string[];
    redFlags?: string[];
  };
  submittedAt?: string;
  urgent?: boolean;
};

export type NavayuVisitBundle = {
  registration?: NavayuRegistrationMetadata;
  intake?: NavayuIntakeData;
  lumbarExam?: NavayuLumbarExamData & { savedAt?: string };
  mskLifecycleState?: NavayuMskLifecycleState;
};

export type NavayuTimelineItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  visitId?: string;
};

function domainBase(): string | undefined {
  return import.meta.env.VITE_DOMAIN_API_URL as string | undefined;
}

function parseVisitMetadata(raw: unknown): NavayuVisitBundle {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  const meta = raw as Record<string, unknown>;
  const navayu =
    meta.navayu && typeof meta.navayu === 'object' && !Array.isArray(meta.navayu)
      ? (meta.navayu as Record<string, unknown>)
      : {};

  const registration =
    navayu.hearAboutNavayu && typeof navayu.hearAboutNavayu === 'string'
      ? (navayu as unknown as NavayuRegistrationMetadata)
      : undefined;

  return {
    registration,
    intake: navayu.intake as NavayuIntakeData | undefined,
    lumbarExam: navayu.lumbarExam as NavayuVisitBundle['lumbarExam'],
    mskLifecycleState: meta.mskLifecycleState as NavayuMskLifecycleState | undefined,
  };
}

export function canUseNavayuRuntime(): boolean {
  return canUseOpdRuntime();
}

export async function platformLoadNavayuVisitBundle(
  visitId: string,
): Promise<NavayuVisitBundle | null> {
  const base = domainBase();
  if (!base || !canUseNavayuRuntime()) return null;
  try {
    const visit = await platformFetch<{ metadata?: unknown }>(base, `/opd/visits/${visitId}`);
    return parseVisitMetadata(visit.metadata);
  } catch {
    return null;
  }
}

export async function platformSaveNavayuRegistration(
  visitId: string,
  registration: NavayuRegistrationMetadata,
): Promise<void> {
  const base = domainBase();
  if (!base || !canUseNavayuRuntime()) return;
  await platformFetch(base, `/opd/visits/${visitId}/metadata`, {
    method: 'PATCH',
    body: JSON.stringify({
      navayu: registration,
      mskLifecycleState: 'intake_pending',
    }),
  });
}

export async function platformSaveNavayuLumbarExam(
  visitId: string,
  exam: NavayuLumbarExamData,
  mskState: NavayuMskLifecycleState = 'msk_exam_complete',
): Promise<void> {
  const base = domainBase();
  if (!base || !canUseNavayuRuntime()) return;
  await platformFetch(base, `/opd/visits/${visitId}/metadata`, {
    method: 'PATCH',
    body: JSON.stringify({
      navayu: {
        lumbarExam: { ...exam, savedAt: new Date().toISOString() },
      },
      mskLifecycleState: mskState,
    }),
  });
}

export async function platformAdvanceMskState(
  visitId: string,
  state: NavayuMskLifecycleState,
  extra?: Record<string, unknown>,
): Promise<void> {
  const base = domainBase();
  if (!base || !canUseNavayuRuntime()) return;
  await platformFetch(base, `/opd/visits/${visitId}/metadata`, {
    method: 'PATCH',
    body: JSON.stringify({ mskLifecycleState: state, ...extra }),
  });
}

export async function platformGetPatientTimeline(
  platformPatientId: string,
): Promise<NavayuTimelineItem[]> {
  const base = domainBase();
  if (!base || !canUseNavayuRuntime()) return [];
  try {
    const result = await platformFetch<{ items: NavayuTimelineItem[] }>(
      base,
      `/opd/visits/patient/${encodeURIComponent(platformPatientId)}/timeline`,
    );
    return result.items ?? [];
  } catch {
    return [];
  }
}

export const MSK_STATE_LABELS: Record<NavayuMskLifecycleState, string> = {
  registered: 'Registered',
  intake_pending: 'Intake pending',
  intake_complete: 'Intake complete',
  associate_eval: 'Junior evaluation',
  msk_exam_complete: 'MSK exam complete',
  ai_summary_ready: 'AI summary ready',
  senior_consult: 'Senior consult',
  navayu_classified: 'Diagnosis classified',
  protocol_mapped: 'Protocol mapped',
  counselling: 'Counselling',
  package_planned: 'Package planned',
  closed: 'Visit closed',
};
