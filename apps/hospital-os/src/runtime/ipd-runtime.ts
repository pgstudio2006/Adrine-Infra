import type { IpdValidationContext } from '@adrine/hospital-operations';
import { platformFetch } from './platform-client';
import { getPlatformSession, isPlatformRuntimeEnabled } from './platform-session';

export type PlatformIpdAdmission = {
  id: string;
  state: string;
  patientId: string;
  branchId: string;
  bedId?: string | null;
  ward?: string | null;
  externalRef?: string | null;
  version: number;
  patient?: { id: string; fullName: string; mrn?: string | null };
};

/** Full admission row from domain-api `GET /ipd/admissions/:id` (includes bed graph). */
export type PlatformIpdAdmissionDetail = PlatformIpdAdmission & {
  bed?: {
    id: string;
    label: string;
    state?: string;
    bedUnit?: { name: string };
  } | null;
};

export type LiveIpdState = {
  admission: {
    id: string;
    state: string;
    ward?: string | null;
    insuranceMode: string;
  };
  blockers: { code: string; message: string; severity: string }[];
};

function domainBase(): string | undefined {
  return import.meta.env.VITE_DOMAIN_API_URL as string | undefined;
}

export function canUseIpdRuntime(): boolean {
  return isPlatformRuntimeEnabled() && !!domainBase() && !!getPlatformSession();
}

export async function platformCreateAdmission(input: {
  patientId: string;
  opdVisitId?: string;
  ward?: string;
  attendingDoctor?: string;
  admissionSource?: string;
  primaryDiagnosis?: string;
  insuranceMode?: string;
  externalRef?: string;
}): Promise<PlatformIpdAdmission> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, '/ipd/admissions', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      actorRole: session.role,
      actorId: session.userId,
    }),
  });
}

export async function platformGetActiveAdmission(
  patientId: string,
): Promise<PlatformIpdAdmission | null> {
  return platformFetch(domainBase()!, `/ipd/admissions/patient/${patientId}/active`);
}

/** Branch-wide active IPD census (bed board + ward dashboards). */
export type PlatformIpdCensusRow = PlatformIpdAdmissionDetail & {
  externalRef?: string | null;
};

export async function platformListActiveIpdCensus(): Promise<PlatformIpdCensusRow[]> {
  return platformFetch(domainBase()!, '/ipd/admissions/branch/active');
}

export async function platformListIpdAllowedActions(
  admissionId: string,
): Promise<{ state: string; allowed: string[] }> {
  const session = getPlatformSession()!;
  return platformFetch(
    domainBase()!,
    `/ipd/admissions/${admissionId}/allowed-actions`,
    { headers: { 'x-actor-role': session.role } },
  );
}

export async function platformIpdTransition(
  admissionId: string,
  action: string,
  context?: IpdValidationContext,
  expectedVersion?: number,
): Promise<{ admission: PlatformIpdAdmission }> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, `/ipd/admissions/${admissionId}/transition`, {
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

export async function platformAssignBed(
  admissionId: string,
  bedId: string,
): Promise<PlatformIpdAdmission> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, `/ipd/admissions/${admissionId}/assign-bed`, {
    method: 'POST',
    body: JSON.stringify({
      bedId,
      actorRole: session.role,
      actorId: session.userId,
    }),
  });
}

export async function platformGetAdmissionBlockers(admissionId: string) {
  return platformFetch<LiveIpdState['blockers']>(
    domainBase()!,
    `/ipd/admissions/${admissionId}/blockers`,
  );
}

export async function platformGetLiveIpdState(admissionId: string): Promise<LiveIpdState> {
  const blockers = await platformGetAdmissionBlockers(admissionId);
  const admission = await platformFetch<PlatformIpdAdmission>(
    domainBase()!,
    `/ipd/admissions/${admissionId}`,
  );
  return {
    admission: {
      id: admission.id,
      state: admission.state,
      ward: admission.ward,
      insuranceMode: 'self',
    },
    blockers,
  };
}

export async function platformGetIpdAdmissionDetail(
  admissionId: string,
): Promise<PlatformIpdAdmissionDetail> {
  return platformFetch(domainBase()!, `/ipd/admissions/${admissionId}`);
}

/**
 * Moves admission toward `discharge_pending` using governed transitions (start_active_care → initiate_discharge).
 * No-op if lifecycle is blocked earlier (e.g. bed_assignment_pending without platform bed).
 */
export async function platformAdvanceAdmissionTowardDischargePlanning(
  admissionId: string,
): Promise<void> {
  let detail = await platformGetIpdAdmissionDetail(admissionId);
  let version = detail.version;

  const apply = async (action: string, context: IpdValidationContext) => {
    const res = await platformIpdTransition(admissionId, action, context, version);
    version = res.admission.version;
    return res.admission.state;
  };

  let state = detail.state;
  if (['discharge_pending', 'discharged', 'cancelled'].includes(state)) {
    return;
  }
  if (
    state === 'bed_assignment_pending'
    || state === 'awaiting_approval'
    || state === 'admission_requested'
  ) {
    return;
  }

  if (state === 'admitted') {
    state = await apply('start_active_care', { carePlanDocumented: true });
  }
  if (state === 'active_care' || state === 'transferred') {
    await apply('initiate_discharge', { dischargeOrchestrationStarted: true });
  }
}

/** Reach platform `discharged` when validations allow (chains earlier states). */
export async function platformCompleteAdmissionDischargeChain(admissionId: string): Promise<void> {
  let detail = await platformGetIpdAdmissionDetail(admissionId);
  let version = detail.version;

  const apply = async (action: string, context: IpdValidationContext) => {
    const res = await platformIpdTransition(admissionId, action, context, version);
    version = res.admission.version;
    return res.admission.state;
  };

  let state = detail.state;
  if (state === 'discharged' || state === 'cancelled') {
    return;
  }
  if (
    state === 'bed_assignment_pending'
    || state === 'awaiting_approval'
    || state === 'admission_requested'
  ) {
    return;
  }

  if (state === 'admitted') {
    state = await apply('start_active_care', { carePlanDocumented: true });
  }
  if (state === 'active_care' || state === 'transferred') {
    state = await apply('initiate_discharge', { dischargeOrchestrationStarted: true });
  }
  if (state === 'discharge_pending') {
    await apply('complete_discharge', {
      dischargeClearancesComplete: true,
      finalBillSettled: true,
    });
  }
}
