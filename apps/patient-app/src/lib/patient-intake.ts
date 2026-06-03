import {
  NAVAYU_INTAKE_FORM_ID,
  NAVAYU_INTAKE_VERSION,
  type NavayuIntakePayload,
  type NavayuIntakeSubmitResult,
} from './navayu-intake-v0';
import {
  domainBase,
  isPlatformRuntimeEnabled,
  PlatformApiError,
  platformFetch,
} from '../runtime/platform-client';

const INTAKE_STUB_KEY = 'adrine.navayu.intake.v0';

export async function submitPatientIntake(
  payload: NavayuIntakePayload,
): Promise<NavayuIntakeSubmitResult> {
  const storedAt = new Date().toISOString();
  const domain = domainBase();

  if (domain && isPlatformRuntimeEnabled()) {
    try {
      await platformFetch(domain, `/opd/visits/${encodeURIComponent(payload.visitId)}/intake`, {
        method: 'POST',
        body: JSON.stringify({
          formId: NAVAYU_INTAKE_FORM_ID,
          version: NAVAYU_INTAKE_VERSION,
          answers: {
            complaintType: payload.complaintType,
            complaintText: payload.complaintText,
            durationBucket: payload.durationBucket,
            vas: payload.vas,
            redFlag: payload.redFlags,
          },
        }),
      });
      return { ok: true, stub: false, storedAt };
    } catch (err) {
      if (!(err instanceof PlatformApiError) || (err.status !== 404 && err.status !== 405)) {
        throw err;
      }
    }
  }

  if (typeof window !== 'undefined') {
    const prior = JSON.parse(sessionStorage.getItem(INTAKE_STUB_KEY) ?? '[]') as unknown[];
    const next = Array.isArray(prior) ? prior : [];
    next.push({ ...payload, submittedAt: storedAt });
    sessionStorage.setItem(INTAKE_STUB_KEY, JSON.stringify(next));
  }

  return { ok: true, stub: true, storedAt };
}
