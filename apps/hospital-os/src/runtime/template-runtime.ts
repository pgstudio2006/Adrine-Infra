import { platformFetch } from './platform-client';
import { getPlatformSession, isPlatformRuntimeEnabled } from './platform-session';

function kernelBase(): string | undefined {
  return import.meta.env.VITE_KERNEL_API_URL as string | undefined;
}

export function canUseTemplateRuntime(): boolean {
  return isPlatformRuntimeEnabled() && !!kernelBase() && !!getPlatformSession();
}

export async function platformListTemplateCatalog() {
  return platformFetch<unknown[]>(kernelBase()!, '/templates/catalog');
}

export async function platformInstantiateTemplate(branchId: string, packCode: string) {
  return platformFetch(kernelBase()!, '/templates/instantiate', {
    method: 'POST',
    body: JSON.stringify({ branchId, packCode }),
  });
}
