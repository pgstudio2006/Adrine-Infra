import { platformFetch } from './platform-client';
import { getPlatformSession, isPlatformRuntimeEnabled } from './platform-session';

function kernelBase(): string | undefined {
  return import.meta.env.VITE_KERNEL_API_URL as string | undefined;
}

export function canUseIntegrationRuntime(): boolean {
  return isPlatformRuntimeEnabled() && !!kernelBase() && !!getPlatformSession();
}

export async function platformListApiKeys() {
  return platformFetch<unknown[]>(kernelBase()!, '/integrations/api-keys');
}

export async function platformCreateApiKey(name: string) {
  return platformFetch(kernelBase()!, '/integrations/api-keys', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}
