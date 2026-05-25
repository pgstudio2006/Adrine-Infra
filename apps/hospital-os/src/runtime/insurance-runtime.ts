import type { InsuranceValidationContext } from '@adrine/hospital-operations';
import { platformFetch } from './platform-client';
import { getPlatformSession } from './platform-session';
import { canUseIpdRuntime } from './ipd-runtime';

export type PlatformInsuranceAuth = {
  id: string;
  state: string;
  admissionId: string;
  version: number;
};

function domainBase(): string | undefined {
  return import.meta.env.VITE_DOMAIN_API_URL as string | undefined;
}

export function canUseInsuranceRuntime(): boolean {
  return canUseIpdRuntime();
}

export async function platformStartInsurance(input: {
  admissionId: string;
  patientId: string;
  payerName?: string;
  policyNumber?: string;
}): Promise<PlatformInsuranceAuth> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, '/insurance/authorizations', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      actorRole: session.role,
      actorId: session.userId,
    }),
  });
}

export async function platformInsuranceTransition(
  insuranceId: string,
  action: string,
  context?: InsuranceValidationContext,
  expectedVersion?: number,
): Promise<{ authorization: PlatformInsuranceAuth }> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, `/insurance/authorizations/${insuranceId}/transition`, {
    method: 'POST',
    body: JSON.stringify({
      action,
      actorRole: session.role,
      actorId: session.userId,
      context,
      expectedVersion,
      payload: context,
    }),
  });
}
