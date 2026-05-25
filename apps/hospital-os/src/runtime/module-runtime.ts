import { platformFetch } from './platform-client';
import { getPlatformSession, isPlatformRuntimeEnabled } from './platform-session';

function kernelBase(): string | undefined {
  return import.meta.env.VITE_KERNEL_API_URL as string | undefined;
}

let cachedModules: Record<string, boolean> | null = null;

export function canUseModuleRuntime(): boolean {
  return isPlatformRuntimeEnabled() && !!kernelBase() && !!getPlatformSession();
}

export async function loadEffectiveModules(branchId?: string): Promise<Record<string, boolean>> {
  const session = getPlatformSession();
  const bid = branchId ?? session?.branchId;
  const qs = bid ? `?branchId=${encodeURIComponent(bid)}` : '';
  const data = await platformFetch<Record<string, boolean>>(kernelBase()!, `/modules/effective${qs}`);
  cachedModules = data;
  return data;
}

export async function canUseModule(code: string): Promise<boolean> {
  if (!canUseModuleRuntime()) return true;
  if (!cachedModules) await loadEffectiveModules();
  return cachedModules?.[code.toLowerCase()] ?? false;
}

export async function platformEnableModule(moduleCode: string) {
  return platformFetch(kernelBase()!, '/modules/enable', {
    method: 'POST',
    body: JSON.stringify({ moduleCode }),
  });
}
