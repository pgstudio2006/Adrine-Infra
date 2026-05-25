import type { OperationalSnapshot } from '@adrine/hospital-operations';
import { platformFetch } from './platform-client';
import {
  canUseAnalyticsRuntime,
  platformGetOperationalAnalytics,
  type OperationalAnalyticsPayload,
} from './analytics-runtime';
import { canUseCommandRuntime, platformGetCommandSnapshot } from './command-runtime';
import { getPlatformSession, isPlatformRuntimeEnabled } from './platform-session';

function domainBase(): string | undefined {
  return import.meta.env.VITE_DOMAIN_API_URL as string | undefined;
}

export type FinanceLiveOperations = {
  branchId: string;
  generatedAt: string;
  summary: {
    openInvoices: number;
    outstandingCents: number;
    chargeLineCount: number;
    insuranceAuthorizations: number;
    insuranceApprovedCents: number;
    dischargeBillingBlockers: number;
  };
  reconciliationWarnings: string[];
};

export type PlatformAuditEvent = {
  id: string;
  eventName: string;
  timestamp: string;
  resourceType?: string;
  resourceId?: string;
  payload?: unknown;
};

export type AdminOperationalBundle = {
  snapshot: OperationalSnapshot | null;
  analytics: OperationalAnalyticsPayload | null;
  finance: FinanceLiveOperations | null;
  auditEvents: PlatformAuditEvent[];
  error: string | null;
};

export function canUseAdminRuntime(): boolean {
  return canUseCommandRuntime() && canUseAnalyticsRuntime();
}

export async function platformGetFinanceLive(branchId?: string): Promise<FinanceLiveOperations> {
  const session = getPlatformSession();
  const bid = branchId ?? session?.branchId ?? 'branch_main';
  return platformFetch<FinanceLiveOperations>(
    domainBase()!,
    `/finance/operations/live?branchId=${encodeURIComponent(bid)}`,
  );
}

export async function platformListAnalyticsEvents(
  period: '24h' | '7d' = '24h',
  branchId?: string,
  limit = 200,
): Promise<PlatformAuditEvent[]> {
  const session = getPlatformSession();
  const bid = branchId ?? session?.branchId ?? 'branch_main';
  const res = await platformFetch<{ events: PlatformAuditEvent[] }>(
    domainBase()!,
    `/analytics/events?branchId=${encodeURIComponent(bid)}&period=${period}&limit=${limit}`,
  );
  return res.events ?? [];
}

export async function fetchAdminOperationalBundle(
  period: '24h' | '7d' = '24h',
): Promise<AdminOperationalBundle> {
  if (!isPlatformRuntimeEnabled() || !domainBase() || !getPlatformSession()?.branchId) {
    return { snapshot: null, analytics: null, finance: null, auditEvents: [], error: null };
  }

  try {
    const [snapshot, analytics, finance, auditEvents] = await Promise.all([
      platformGetCommandSnapshot(),
      platformGetOperationalAnalytics(period),
      platformGetFinanceLive(),
      platformListAnalyticsEvents(period),
    ]);
    return { snapshot, analytics, finance, auditEvents, error: null };
  } catch (e) {
    return {
      snapshot: null,
      analytics: null,
      finance: null,
      auditEvents: [],
      error: e instanceof Error ? e.message : 'Admin operational data unavailable',
    };
  }
}
