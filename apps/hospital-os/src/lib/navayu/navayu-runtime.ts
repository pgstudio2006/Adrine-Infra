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

const SENIOR_HANDOFF_STATES: NavayuMskLifecycleState[] = [
  'ai_summary_ready',
  'senior_consult',
  'navayu_classified',
  'protocol_mapped',
  'counselling',
  'package_planned',
  'closed',
];

/** After junior completes MSK exam, advance to AI-summary-ready for senior handoff. */
export async function platformHandoffJuniorToSenior(visitId: string): Promise<NavayuMskLifecycleState> {
  const bundle = await platformLoadNavayuVisitBundle(visitId);
  let state = bundle?.mskLifecycleState ?? 'associate_eval';

  if (SENIOR_HANDOFF_STATES.includes(state)) {
    return state;
  }

  if (state === 'intake_complete') {
    const started = await platformMskTransition(visitId, 'start_associate_eval');
    state = started.nextState;
  }

  if (state === 'associate_eval') {
    const completed = await platformMskTransition(visitId, 'complete_msk_exam');
    state = completed.nextState;
  }

  if (state === 'msk_exam_complete') {
    const result = await platformMskTransition(visitId, 'generate_ai_summary');
    return result.nextState;
  }

  throw new Error(`Cannot hand off to senior from MSK state "${state}"`);
}

/** Start junior associate evaluation when intake is complete. */
export async function platformStartAssociateEval(visitId: string): Promise<NavayuMskLifecycleState> {
  const bundle = await platformLoadNavayuVisitBundle(visitId);
  const state = bundle?.mskLifecycleState ?? 'registered';
  if (state === 'intake_complete') {
    const result = await platformMskTransition(visitId, 'start_associate_eval');
    return result.nextState;
  }
  return state;
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
  const fallbackState = resolveMskStateAfterLumbarSave(exam, seniorDoctor);
  const base = domainBase();
  if (!base || !canUseNavayuRuntime()) return fallbackState;

  await platformFetch(base, `/opd/visits/${visitId}/metadata`, {
    method: 'PATCH',
    body: JSON.stringify({
      navayu: {
        lumbarExam: { ...exam, savedAt: new Date().toISOString() },
      },
    }),
  });

  const bundle = await platformLoadNavayuVisitBundle(visitId);
  return (bundle?.mskLifecycleState ?? fallbackState) as NavayuMskLifecycleState;
}

export async function platformSaveNavayuSeniorReview(
  visitId: string,
  review: NavayuSeniorReviewData,
): Promise<NavayuMskLifecycleState> {
  const base = domainBase();
  if (!base || !canUseNavayuRuntime()) return 'senior_consult';

  await platformFetch(base, `/opd/visits/${visitId}/metadata`, {
    method: 'PATCH',
    body: JSON.stringify({
      navayu: {
        seniorReview: { ...review, savedAt: new Date().toISOString() },
      },
    }),
  });

  const bundle = await platformLoadNavayuVisitBundle(visitId);
  const state = bundle?.mskLifecycleState;
  if (state === 'ai_summary_ready') {
    const result = await platformMskTransition(visitId, 'start_senior_consult', {
      navayu: { seniorReview: review },
    });
    return result.nextState;
  }
  if (state === 'senior_consult') {
    return state;
  }
  return (state ?? 'senior_consult') as NavayuMskLifecycleState;
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

  if (state === 'counselling' || state === 'package_planned') {
    await platformPatchNavayuMetadata(visitId, { navayu: { counselling } });
    return;
  }

  const { allowed } = await platformListMskAllowedActions(visitId);
  if (allowed.includes('start_counselling')) {
    await platformMskTransition(visitId, 'start_counselling', { navayu: { counselling } });
    return;
  }

  throw new Error(`Cannot save counselling from MSK state "${state}"`);
}

export async function platformSaveNavayuPackagePlanned(
  visitId: string,
  counselling: NavayuCounsellingRecord,
): Promise<void> {
  const base = domainBase();
  if (!base || !canUseNavayuRuntime()) return;

  const bundle = await platformLoadNavayuVisitBundle(visitId);
  const state = bundle?.mskLifecycleState ?? 'counselling';

  if (state === 'counselling') {
    await platformMskTransition(visitId, 'plan_package', { navayu: { counselling } });
    return;
  }

  if (state === 'package_planned') {
    await platformPatchNavayuMetadata(visitId, { navayu: { counselling } });
    return;
  }

  if (state === 'protocol_mapped') {
    await platformMskTransition(visitId, 'start_counselling', { navayu: { counselling } });
    await platformMskTransition(visitId, 'plan_package', { navayu: { counselling } });
    return;
  }

  const { allowed } = await platformListMskAllowedActions(visitId);
  if (allowed.includes('plan_package')) {
    await platformMskTransition(visitId, 'plan_package', { navayu: { counselling } });
    return;
  }

  throw new Error(`Cannot plan package from MSK state "${state}"`);
}

export async function platformSaveNavayuFollowUp(
  visitId: string,
  followUp: NavayuFollowUpHandoff,
): Promise<void> {
  const base = domainBase();
  if (!base || !canUseNavayuRuntime()) return;

  const bundle = await platformLoadNavayuVisitBundle(visitId);
  const state = bundle?.mskLifecycleState ?? 'package_planned';

  if (state === 'package_planned') {
    await platformMskTransition(visitId, 'close_visit', { navayu: { followUp } });
    return;
  }

  if (state === 'closed') {
    await platformPatchNavayuMetadata(visitId, { navayu: { followUp } });
    return;
  }

  const { allowed } = await platformListMskAllowedActions(visitId);
  if (allowed.includes('close_visit')) {
    await platformMskTransition(visitId, 'close_visit', { navayu: { followUp } });
    return;
  }

  throw new Error(`Cannot close visit from MSK state "${state}"`);
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

export type NavayuOpdVisitSummary = {
  visitId: string;
  patientId: string;
  patientName: string;
  mrn?: string | null;
  department?: string | null;
  assignedDoctor?: string | null;
  opdState: string;
};

export async function platformGetNavayuOpdVisitSummary(
  visitId: string,
): Promise<NavayuOpdVisitSummary | null> {
  const base = domainBase();
  if (!base || !canUseNavayuRuntime()) return null;
  try {
    const visit = await platformFetch<{
      id: string;
      patientId: string;
      state: string;
      department?: string | null;
      assignedDoctor?: string | null;
      patient?: { fullName?: string; mrn?: string | null };
    }>(base, `/opd/visits/${visitId}`);
    return {
      visitId: visit.id,
      patientId: visit.patientId,
      patientName: visit.patient?.fullName ?? 'Patient',
      mrn: visit.patient?.mrn,
      department: visit.department,
      assignedDoctor: visit.assignedDoctor,
      opdState: visit.state,
    };
  } catch {
    return null;
  }
}

/** Close encounter and advance OPD visit to billing_pending before charge sync. */
export async function platformEnsureNavayuBillingHandoff(visitId: string): Promise<{
  visit: { id: string; state: string; encounterId?: string | null };
  encounterClosed: boolean;
  billingReady: boolean;
}> {
  const base = domainBase();
  if (!base || !canUseNavayuRuntime()) {
    throw new Error('Navayu platform runtime unavailable');
  }
  const session = getPlatformSession();
  return platformFetch(base, `/opd/visits/${visitId}/navayu/billing-handoff`, {
    method: 'POST',
    body: JSON.stringify({
      actorRole: session?.role ?? 'billing',
      actorId: session?.userId,
    }),
  });
}

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
  if (!base || !canUseNavayuRuntime()) {
    return seniorDoctor ? 'ai_summary_ready' : 'associate_eval';
  }
  const stamped = Object.fromEntries(
    Object.entries(exams).map(([k, v]) => [k, { ...v, savedAt: new Date().toISOString() }]),
  );
  await platformFetch(base, `/opd/visits/${visitId}/metadata`, {
    method: 'PATCH',
    body: JSON.stringify({ navayu: { mskExams: stamped } }),
  });
  const bundle = await platformLoadNavayuVisitBundle(visitId);
  return (bundle?.mskLifecycleState ?? 'associate_eval') as NavayuMskLifecycleState;
}

export async function platformSaveNavayuInvestigations(
  visitId: string,
  investigations: NavayuFormValues,
): Promise<void> {
  const base = domainBase();
  if (!base || !canUseNavayuRuntime()) return;
  await platformFetch(base, `/opd/visits/${visitId}/metadata`, {
    method: 'PATCH',
    body: JSON.stringify({ navayu: { investigations } }),
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

  if (state === 'protocol_mapped') {
    await platformPatchNavayuMetadata(visitId, { navayu: { protocolMap: stamped } });
    return 'protocol_mapped';
  }

  throw new Error(`Cannot map protocol from MSK state "${state}"`);
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
