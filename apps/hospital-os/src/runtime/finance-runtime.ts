import { platformFetch } from './platform-client';
import { canUseBillingRuntime } from './billing-runtime';
import { getPlatformSession, isPlatformRuntimeEnabled } from './platform-session';

function domainBase(): string | undefined {
  return import.meta.env.VITE_DOMAIN_API_URL as string | undefined;
}

export function canUseFinanceRuntime(): boolean {
  return isPlatformRuntimeEnabled() && canUseBillingRuntime() && !!domainBase() && !!getPlatformSession();
}

function branchQuery(): string {
  const bid = getPlatformSession()?.branchId ?? 'branch_main';
  return `branchId=${encodeURIComponent(bid)}`;
}

export async function platformGetBillingDeptDashboard() {
  return platformFetch<{ revenue: unknown; finance: unknown; insuranceCount: number }>(
    domainBase()!,
    `/billing/dept/dashboard?${branchQuery()}`,
  );
}

export async function platformGetBillingPackages() {
  return platformFetch<{ packages: unknown[] }>(domainBase()!, '/billing/dept/packages');
}

export async function platformGetBillingHealthPlans() {
  return platformFetch<{ plans: unknown[] }>(domainBase()!, '/billing/dept/health-plans');
}

export async function platformGetBillingTpaCharges() {
  return platformFetch<{ providers: unknown[]; serviceRates: unknown[] }>(
    domainBase()!,
    '/billing/dept/tpa-charges',
  );
}

export type PlatformChargeMasterItem = {
  id: string;
  code: string;
  name: string;
  type: string;
  department: string;
  hsnSac: string;
  baseRate: number;
  baseRateCents: number;
  cgst: number;
  sgst: number;
  igst: number;
  effectiveFrom: string;
  effectiveTo: string;
  status: string;
  packageFlag: boolean;
  notes?: string;
};

export async function platformGetBillingChargeMaster() {
  return platformFetch<{ generatedAt: string; charges: PlatformChargeMasterItem[] }>(
    domainBase()!,
    '/billing/dept/charge-master',
  );
}

export async function platformGetBillingRevenue(days = 30) {
  return platformFetch<{
    summary: {
      totalRevenueCents: number;
      opdCents: number;
      ipdCents: number;
      settledInvoiceCount: number;
    };
    revenueByModule: { module: string; amount: number }[];
    daily: { date: string; amount: number }[];
  }>(domainBase()!, `/billing/dept/revenue?${branchQuery()}&days=${days}`);
}

export async function platformGetBillingGst(days = 90) {
  return platformFetch<{
    summary: { taxableCents: number; cgstCents: number; sgstCents: number };
    invoices: unknown[];
  }>(domainBase()!, `/billing/dept/gst?${branchQuery()}&days=${days}`);
}

export async function platformGetBillingInsuranceDesk() {
  return platformFetch<{ authorizations: unknown[] }>(
    domainBase()!,
    `/billing/dept/insurance?${branchQuery()}`,
  );
}

export async function platformGetBillingFinanceDesk() {
  return platformFetch<{
    summary: {
      openInvoices: number;
      outstandingCents: number;
      dischargeBillingBlockers: number;
      insuranceAuthorizations: number;
    };
    pendingApprovals: unknown[];
  }>(domainBase()!, `/billing/dept/finance?${branchQuery()}`);
}

export type FinanceOperationsLiveResponse = {
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
  invoices: {
    id: string;
    status: string;
    amountCents: number;
    paidCents: number;
    outstandingCents: number;
    opdVisitId: string | null;
    ipdAdmissionId: string | null;
  }[];
  dischargeBillingBlockers: { id: string; admissionId: string; state: string }[];
  reconciliationWarnings: string[];
  reconciliation: {
    status: string;
    activeAdmissions: number;
    orphanedBeds: number;
    admissionsWithoutBed: number;
    pendingDischarges: number;
    stuckInsurance: number;
    checkedAt: string;
  };
};

export async function platformGetFinanceOperationsLive() {
  return platformFetch<FinanceOperationsLiveResponse>(
    domainBase()!,
    `/finance/operations/live?${branchQuery()}`,
  );
}

export async function platformStartInsuranceAuthorization(body: {
  admissionId: string;
  patientId: string;
  payerName?: string;
  policyNumber?: string;
}) {
  const session = getPlatformSession()!;
  return platformFetch<{ id: string; state: string }>(
    domainBase()!,
    '/insurance/authorizations',
    {
      method: 'POST',
      body: JSON.stringify({
        ...body,
        actorRole: session.role,
        actorId: session.userId,
      }),
    },
  );
}

export async function platformListInsuranceAuthorizations() {
  return platformFetch<unknown[]>(domainBase()!, '/insurance/authorizations');
}

export async function platformInsuranceTransition(
  insuranceId: string,
  action: string,
  payload?: Record<string, unknown>,
) {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, `/insurance/authorizations/${insuranceId}/transition`, {
    method: 'POST',
    body: JSON.stringify({
      action,
      actorRole: session.role,
      actorId: session.userId,
      payload,
    }),
  });
}
