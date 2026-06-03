import { platformFetch } from '@/runtime/platform-client';
import { getPlatformSession } from '@/runtime/platform-session';
import { canUseOpdRuntime } from '@/runtime/opd-runtime';
import {
  isNavayuLumbarExamComplete,
  type NavayuFormValues,
  type NavayuInvestigationUpload,
  type NavayuLumbarExamData,
  type NavayuProtocolMapData,
  type NavayuRegistrationMetadata,
  type NavayuSeniorReviewData,
} from '@/lib/navayu/navayu-forms';
import type {
  NavayuCounsellingRecord,
  NavayuFollowUpHandoff,
} from '@/lib/navayu/navayu-protocol-engine';

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
  mskExams?: Record<string, NavayuFormValues & { savedAt?: string }>;
  investigations?: NavayuFormValues;
  protocolMap?: NavayuProtocolMapData;
  seniorReview?: NavayuSeniorReviewData;
  counselling?: NavayuCounsellingRecord;
  followUp?: NavayuFollowUpHandoff;
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
    seniorReview: navayu.seniorReview as NavayuSeniorReviewData | undefined,
    mskExams: navayu.mskExams as NavayuVisitBundle['mskExams'],
    investigations: navayu.investigations as NavayuFormValues | undefined,
    protocolMap: navayu.protocolMap as NavayuProtocolMapData | undefined,
    counselling: navayu.counselling as NavayuCounsellingRecord | undefined,
    followUp: navayu.followUp as NavayuFollowUpHandoff | undefined,
    mskLifecycleState: meta.mskLifecycleState as NavayuMskLifecycleState | undefined,
  };
}

export function canUseNavayuRuntime(): boolean {
  return canUseOpdRuntime();
}

export function resolveMskStateAfterLumbarSave(
  exam: NavayuLumbarExamData,
  seniorDoctor: boolean,
): NavayuMskLifecycleState {
  if (seniorDoctor) return 'ai_summary_ready';
  if (isNavayuLumbarExamComplete(exam)) return 'msk_exam_complete';
  return 'associate_eval';
}

/** After junior completes MSK exam, advance to AI-summary-ready for senior handoff. */
export async function platformHandoffJuniorToSenior(visitId: string): Promise<void> {
  await platformAdvanceMskState(visitId, 'ai_summary_ready');
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
      navayu: { ...registration, registeredAt: new Date().toISOString() },
      mskLifecycleState: 'registered',
    }),
  });
  await platformMskTransition(visitId, 'send_intake_link');
}

export type MskTransitionResult = {
  visit: { id: string; metadata?: unknown };
  previousState: NavayuMskLifecycleState;
  nextState: NavayuMskLifecycleState;
};

/** Governed Navayu MSK workflow transition via domain-api workflow engine. */
export async function platformMskTransition(
  visitId: string,
  action: string,
  payload?: Record<string, unknown>,
  validationContext?: Record<string, unknown>,
): Promise<MskTransitionResult> {
  const base = domainBase();
  if (!base || !canUseNavayuRuntime()) {
    throw new Error('Navayu platform runtime unavailable');
  }
  const session = getPlatformSession();
  return platformFetch<MskTransitionResult>(base, `/opd/visits/${visitId}/msk/transition`, {
    method: 'POST',
    body: JSON.stringify({
      action,
      actorRole: session?.role ?? 'receptionist',
      actorId: session?.userId,
      context: validationContext,
      payload,
    }),
  });
}

export async function platformListMskAllowedActions(
  visitId: string,
): Promise<{ state: NavayuMskLifecycleState; allowed: string[] }> {
  const base = domainBase();
  if (!base || !canUseNavayuRuntime()) {
    return { state: 'registered', allowed: [] };
  }
  return platformFetch(base, `/opd/visits/${visitId}/msk/allowed-actions`);
}

export async function platformSaveNavayuLumbarExam(
  visitId: string,
  exam: NavayuLumbarExamData,
  seniorDoctor = false,
): Promise<NavayuMskLifecycleState> {
  const base = domainBase();
  const mskState = resolveMskStateAfterLumbarSave(exam, seniorDoctor);
  if (!base || !canUseNavayuRuntime()) return mskState;

  await platformFetch(base, `/opd/visits/${visitId}/metadata`, {
    method: 'PATCH',
    body: JSON.stringify({
      navayu: {
        lumbarExam: { ...exam, savedAt: new Date().toISOString() },
      },
      mskLifecycleState: mskState,
    }),
  });

  if (!seniorDoctor && mskState === 'msk_exam_complete') {
    await platformHandoffJuniorToSenior(visitId);
    return 'ai_summary_ready';
  }

  return mskState;
}

export async function platformSaveNavayuSeniorReview(
  visitId: string,
  review: NavayuSeniorReviewData,
): Promise<void> {
  const base = domainBase();
  if (!base || !canUseNavayuRuntime()) return;
  await platformFetch(base, `/opd/visits/${visitId}/metadata`, {
    method: 'PATCH',
    body: JSON.stringify({
      navayu: {
        seniorReview: { ...review, savedAt: new Date().toISOString() },
      },
      mskLifecycleState: 'senior_consult',
    }),
  });
}

export async function platformAdvanceMskState(
  visitId: string,
  state: NavayuMskLifecycleState,
  extra?: Record<string, unknown>,
): Promise<void> {
  await platformPatchNavayuMetadata(visitId, { mskLifecycleState: state, ...extra });
}

export async function platformSaveNavayuCounselling(
  visitId: string,
  counselling: NavayuCounsellingRecord,
): Promise<void> {
  const base = domainBase();
  if (!base || !canUseNavayuRuntime()) return;

  const bundle = await platformLoadNavayuVisitBundle(visitId);
  const state = bundle?.mskLifecycleState ?? 'protocol_mapped';

  if (state === 'protocol_mapped') {
    await platformMskTransition(visitId, 'start_counselling', { navayu: { counselling } });
    return;
  }

  await platformPatchNavayuMetadata(visitId, {
    navayu: { counselling },
    mskLifecycleState: 'counselling',
  });
}

export async function platformSaveNavayuPackagePlanned(
  visitId: string,
  counselling: NavayuCounsellingRecord,
): Promise<void> {
  const base = domainBase();
  if (!base || !canUseNavayuRuntime()) return;

  const bundle = await platformLoadNavayuVisitBundle(visitId);
  const state = bundle?.mskLifecycleState ?? 'counselling';

  if (state === 'counselling' || state === 'protocol_mapped') {
    if (state === 'protocol_mapped') {
      await platformMskTransition(visitId, 'start_counselling', { navayu: { counselling } });
    }
    await platformMskTransition(visitId, 'plan_package', { navayu: { counselling } });
    return;
  }

  await platformPatchNavayuMetadata(visitId, {
    navayu: { counselling },
    mskLifecycleState: 'package_planned',
  });
}

export async function platformSaveNavayuFollowUp(
  visitId: string,
  followUp: NavayuFollowUpHandoff,
): Promise<void> {
  const base = domainBase();
  if (!base || !canUseNavayuRuntime()) return;

  const bundle = await platformLoadNavayuVisitBundle(visitId);
  const state = bundle?.mskLifecycleState ?? 'package_planned';

  await platformPatchNavayuMetadata(visitId, { navayu: { followUp } });

  if (state === 'package_planned') {
    await platformMskTransition(visitId, 'close_visit', { navayu: { followUp } });
    return;
  }

  await platformPatchNavayuMetadata(visitId, {
    navayu: { followUp },
    mskLifecycleState: 'closed',
  });
}

export type NavayuCounsellorQueueRow = {
  visitId: string;
  patientId: string;
  patientName: string;
  mrn?: string | null;
  department?: string | null;
  assignedDoctor?: string | null;
  mskLifecycleState: NavayuMskLifecycleState;
  protocolLabel?: string;
  tierLabel?: string;
  createdAt: string;
};

export async function platformListNavayuCounsellorQueue(): Promise<NavayuCounsellorQueueRow[]> {
  const base = domainBase();
  if (!base || !canUseNavayuRuntime()) return [];
  try {
    const result = await platformFetch<{ items: NavayuCounsellorQueueRow[] }>(
      base,
      '/navayu/counsellor-queue',
    );
    return result.items ?? [];
  } catch {
    return [];
  }
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

export async function platformSaveNavayuMskExams(
  visitId: string,
  exams: Record<string, NavayuFormValues>,
  seniorDoctor = false,
): Promise<NavayuMskLifecycleState> {
  const lumbar = exams['navayu.exam.lumbar'] as NavayuLumbarExamData | undefined;
  if (lumbar) {
    return platformSaveNavayuLumbarExam(visitId, lumbar, seniorDoctor);
  }
  const base = domainBase();
  const mskState = seniorDoctor ? 'ai_summary_ready' : 'msk_exam_complete';
  if (!base || !canUseNavayuRuntime()) return mskState;
  const stamped = Object.fromEntries(
    Object.entries(exams).map(([k, v]) => [k, { ...v, savedAt: new Date().toISOString() }]),
  );
  await platformFetch(base, `/opd/visits/${visitId}/metadata`, {
    method: 'PATCH',
    body: JSON.stringify({ navayu: { mskExams: stamped }, mskLifecycleState: mskState }),
  });
  if (!seniorDoctor) await platformHandoffJuniorToSenior(visitId);
  return seniorDoctor ? mskState : 'ai_summary_ready';
}

export async function platformSaveNavayuInvestigations(
  visitId: string,
  investigations: NavayuFormValues,
): Promise<void> {
  const base = domainBase();
  if (!base || !canUseNavayuRuntime()) return;
  await platformFetch(base, `/opd/visits/${visitId}/metadata`, {
    method: 'PATCH',
    body: JSON.stringify({ navayu: { investigations }, mskLifecycleState: 'msk_exam_complete' }),
  });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.includes(',') ? result.split(',')[1]! : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function platformUploadNavayuInvestigation(
  visitId: string,
  fieldId: string,
  file: File,
): Promise<NavayuInvestigationUpload> {
  if (!canUseNavayuRuntime() || !domainBase()) {
    return {
      fieldId,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      uploadedAt: new Date().toISOString(),
    };
  }
  const dataBase64 = await fileToBase64(file);
  const result = await platformFetch<{ upload: NavayuInvestigationUpload }>(
    domainBase()!,
    `/opd/visits/${visitId}/investigations/upload`,
    {
      method: 'POST',
      body: JSON.stringify({
        fieldId,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        dataBase64,
      }),
    },
  );
  return result.upload;
}

async function platformPatchNavayuMetadata(
  visitId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const base = domainBase();
  if (!base || !canUseNavayuRuntime()) return;
  await platformFetch(base, `/opd/visits/${visitId}/metadata`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

/** Senior → counsellor handoff: classify (if needed) then map_protocol via workflow engine. */
export async function platformHandoffProtocolToCounsellor(
  visitId: string,
  protocolMap: NavayuProtocolMapData,
): Promise<NavayuMskLifecycleState> {
  const stamped = { ...protocolMap, mappedAt: new Date().toISOString() };
  const base = domainBase();
  if (!base || !canUseNavayuRuntime()) return 'protocol_mapped';

  const bundle = await platformLoadNavayuVisitBundle(visitId);
  let state = bundle?.mskLifecycleState ?? 'senior_consult';

  if (state === 'senior_consult') {
    const classified = await platformMskTransition(visitId, 'classify_diagnosis');
    state = classified.nextState;
  }
  if (state === 'navayu_classified') {
    await platformPatchNavayuMetadata(visitId, { navayu: { protocolMap: stamped } });
    const mapped = await platformMskTransition(visitId, 'map_protocol', {
      navayu: { protocolMap: stamped },
    });
    return mapped.nextState;
  }

  await platformPatchNavayuMetadata(visitId, {
    navayu: { protocolMap: stamped },
    mskLifecycleState: 'protocol_mapped',
  });
  return 'protocol_mapped';
}

export async function platformSaveNavayuProtocolMap(
  visitId: string,
  protocolMap: NavayuProtocolMapData,
): Promise<void> {
  await platformHandoffProtocolToCounsellor(visitId, protocolMap);
}

export type NavayuLlmSummaryResult = {
  mode: 'rule' | 'llm' | 'blocked';
  sections?: Array<{ label: string; lines: string[]; urgent?: boolean }>;
  blockedReason?: string;
  requiredEnv?: string;
};

export async function platformFetchNavayuAiSummary(
  visitId: string,
  payload: Record<string, unknown>,
): Promise<NavayuLlmSummaryResult> {
  const base = domainBase();
  if (!base || !canUseNavayuRuntime()) return { mode: 'rule' };
  try {
    return await platformFetch<NavayuLlmSummaryResult>(base, `/opd/visits/${visitId}/ai-summary`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch {
    return { mode: 'rule' };
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
