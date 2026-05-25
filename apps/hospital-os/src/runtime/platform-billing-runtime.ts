import { platformFetch } from './platform-client';
import { getPlatformSession, isPlatformRuntimeEnabled } from './platform-session';

function kernelBase(): string | undefined {
  return import.meta.env.VITE_KERNEL_API_URL as string | undefined;
}

export function canUsePlatformBillingRuntime(): boolean {
  return isPlatformRuntimeEnabled() && !!kernelBase() && !!getPlatformSession();
}

export async function platformGetUsage() {
  return platformFetch<unknown[]>(kernelBase()!, '/billing/platform/usage');
}

export async function platformGetInvoices() {
  return platformFetch<unknown[]>(kernelBase()!, '/billing/platform/invoices');
}

export async function platformSubscribe(planCode: string) {
  return platformFetch(kernelBase()!, '/billing/platform/subscribe', {
    method: 'POST',
    body: JSON.stringify({ planCode }),
  });
}
