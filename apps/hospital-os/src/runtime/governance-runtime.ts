import { platformFetch } from './platform-client';
import { getPlatformSession, isPlatformRuntimeEnabled } from './platform-session';

function kernelBase(): string | undefined {
  return import.meta.env.VITE_KERNEL_API_URL as string | undefined;
}

export function canUseGovernanceRuntime(): boolean {
  return isPlatformRuntimeEnabled() && !!kernelBase() && !!getPlatformSession();
}

export async function platformGetEffectivePolicies(branchId?: string): Promise<Record<string, unknown>> {
  const session = getPlatformSession();
  const bid = branchId ?? session?.branchId ?? 'branch_main';
  return platformFetch<Record<string, unknown>>(
    kernelBase()!,
    `/governance/policies/effective?branchId=${encodeURIComponent(bid)}`,
  );
}
