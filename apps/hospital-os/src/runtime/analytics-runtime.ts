import { platformFetch } from './platform-client';
import { getPlatformSession, isPlatformRuntimeEnabled } from './platform-session';

export type OperationalAnalyticsPayload = {
  branchId: string;
  period: string;
  metrics: Record<string, number | null>;
  platformEventCounts: Record<string, number>;
};

function domainBase(): string | undefined {
  return import.meta.env.VITE_DOMAIN_API_URL as string | undefined;
}

export function canUseAnalyticsRuntime(): boolean {
  return isPlatformRuntimeEnabled() && !!domainBase() && !!getPlatformSession()?.branchId;
}

export async function platformGetOperationalAnalytics(
  period: '24h' | '7d' = '24h',
  branchId?: string,
): Promise<OperationalAnalyticsPayload> {
  const session = getPlatformSession();
  const bid = branchId ?? session?.branchId ?? 'branch_main';
  return platformFetch<OperationalAnalyticsPayload>(
    domainBase()!,
    `/analytics/operational?branchId=${encodeURIComponent(bid)}&period=${period}`,
  );
}
