import type { OperationalSnapshot } from '@adrine/hospital-operations';
import { platformFetch } from './platform-client';
import { getPlatformSession, isPlatformRuntimeEnabled } from './platform-session';

function domainBase(): string | undefined {
  return import.meta.env.VITE_DOMAIN_API_URL as string | undefined;
}

export function canUseCommandRuntime(): boolean {
  return isPlatformRuntimeEnabled() && !!domainBase() && !!getPlatformSession()?.branchId;
}

export async function platformGetCommandSnapshot(branchId?: string): Promise<OperationalSnapshot> {
  const session = getPlatformSession();
  const bid = branchId ?? session?.branchId ?? 'branch_main';
  return platformFetch<OperationalSnapshot>(
    domainBase()!,
    `/command/center/snapshot?branchId=${encodeURIComponent(bid)}`,
  );
}
