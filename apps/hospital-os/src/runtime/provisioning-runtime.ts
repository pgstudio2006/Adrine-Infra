import { platformFetch } from './platform-client';
import { getPlatformSession, isPlatformRuntimeEnabled } from './platform-session';

function kernelBase(): string | undefined {
  return import.meta.env.VITE_KERNEL_API_URL as string | undefined;
}

export function canUseProvisioningRuntime(): boolean {
  return isPlatformRuntimeEnabled() && !!kernelBase() && !!getPlatformSession();
}

export async function platformSignup(body: {
  orgName: string;
  adminEmail: string;
  adminName?: string;
}) {
  return platformFetch<{ tenantId: string; sessionId: string }>(kernelBase()!, '/provisioning/signup', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function platformOnboardingStep(
  sessionId: string,
  stepKey: string,
  payload: Record<string, unknown>,
) {
  return platformFetch(kernelBase()!, `/provisioning/onboarding/${sessionId}/step`, {
    method: 'POST',
    body: JSON.stringify({ stepKey, payload }),
  });
}

export async function platformCompleteOnboarding(sessionId: string) {
  return platformFetch(kernelBase()!, `/provisioning/onboarding/${sessionId}/complete`, {
    method: 'POST',
  });
}
