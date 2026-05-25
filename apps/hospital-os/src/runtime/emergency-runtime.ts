import { PlatformApiError } from './platform-client';
import {
  canUseOpdRuntime,
  platformGetActiveOpdVisit,
  platformKernelAudit,
  platformRecordMetering,
  platformRegisterOpdPatient,
} from './opd-runtime';
import {
  canUseIpdRuntime,
  platformGetActiveAdmission,
  type PlatformIpdAdmissionDetail,
} from './ipd-runtime';

export type EmergencyEncounterSpine = {
  platformPatientId: string;
  platformOpdVisitId: string;
  opdState: string;
};

/** Emergency operations share the OPD registration + encounter gate when platform is on. */
export function canUseEmergencyRuntime(): boolean {
  return canUseOpdRuntime();
}

/**
 * Ensure a domain patient + OPD encounter exists for an ER case before downstream IPD/orders.
 * Reuses existing platform ids when supplied.
 */
export async function ensureEmergencyPlatformEncounter(input: {
  uhid: string;
  patientName: string;
  assignedDoctor?: string;
  platformPatientId?: string;
  platformOpdVisitId?: string;
}): Promise<EmergencyEncounterSpine | null> {
  if (!canUseEmergencyRuntime()) return null;

  if (input.platformPatientId && input.platformOpdVisitId) {
    return {
      platformPatientId: input.platformPatientId,
      platformOpdVisitId: input.platformOpdVisitId,
      opdState: 'active',
    };
  }

  if (input.platformPatientId && !input.platformOpdVisitId) {
    const active = await platformGetActiveOpdVisit(input.platformPatientId);
    if (active) {
      return {
        platformPatientId: input.platformPatientId,
        platformOpdVisitId: active.id,
        opdState: active.state,
      };
    }
  }

  const { visit, patientId } = await platformRegisterOpdPatient({
    fullName: input.patientName,
    mrn: input.uhid,
    department: 'Emergency',
    assignedDoctor: input.assignedDoctor,
    actorRole: 'emergency',
  });

  await platformRecordMetering(['emergency.registration'], visit.id);
  await platformKernelAudit('emergency.register_encounter', `opd_visit:${visit.id}`, {
    uhid: input.uhid,
  });

  return {
    platformPatientId: patientId,
    platformOpdVisitId: visit.id,
    opdState: visit.state,
  };
}

/** Reuse active platform IPD admission when present (no duplicate admit). */
export async function fetchActivePlatformIpdAdmission(
  platformPatientId: string,
): Promise<PlatformIpdAdmissionDetail | null> {
  if (!canUseIpdRuntime()) return null;
  try {
    return (await platformGetActiveAdmission(platformPatientId)) as PlatformIpdAdmissionDetail | null;
  } catch {
    return null;
  }
}

export { PlatformApiError };
