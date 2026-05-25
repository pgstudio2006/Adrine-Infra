import type { InvoiceValidationContext } from '@adrine/hospital-operations';
import { platformFetch } from './platform-client';
import { getBranchConfigOverrides } from './branch-config';
import { canUseIpdRuntime } from './ipd-runtime';
import { canUseOpdRuntime, platformKernelAudit, platformRecordMetering } from './opd-runtime';
import { getPlatformSession } from './platform-session';

export type PlatformInvoice = {
  id: string;
  status: string;
  amountCents: number;
  paidCents: number;
  receiptNumber?: string | null;
  version: number;
  opdVisitId?: string | null;
  ipdAdmissionId?: string | null;
};

export type LiveFinancialState = {
  visit: { id: string; state: string; escalationLevel: number; department?: string | null };
  invoice: {
    id: string;
    status: string;
    version: number;
    amountCents: number;
    paidCents: number;
    outstandingCents: number;
    corporatePayer: boolean;
    insuranceMode: string;
    lineCount: number;
    lines: { id: string; description: string; amountCents: number; chargeCode?: string | null }[];
  } | null;
  blockers: string[];
  warnings: string[];
};

export type LiveIpdFinancialState = {
  admission: { id: string; state: string; ward?: string | null; insuranceMode: string };
  invoice: {
    id: string;
    status: string;
    version: number;
    amountCents: number;
    paidCents: number;
    outstandingCents: number;
    lineCount: number;
    lines: { id: string; description: string; amountCents: number; chargeCode?: string | null }[];
  } | null;
  blockers: string[];
  warnings: string[];
};

function domainBase(): string | undefined {
  return import.meta.env.VITE_DOMAIN_API_URL as string | undefined;
}

export async function platformGetOpdBillingContext(visitId: string) {
  return platformFetch<LiveFinancialState>(domainBase()!, `/opd/visits/${visitId}/billing`);
}

export async function platformGetLiveFinancialState(visitId: string) {
  return platformFetch<LiveFinancialState>(
    domainBase()!,
    `/billing/sync/opd/${visitId}/live`,
  );
}

export async function platformGetLiveIpdFinancialState(admissionId: string) {
  return platformFetch<LiveIpdFinancialState>(
    domainBase()!,
    `/billing/sync/ipd/${admissionId}/live`,
  );
}

export async function platformEnsureIpdDraft(input: {
  admissionId: string;
  patientId: string;
  corporatePayer?: boolean;
  insuranceMode?: string;
}): Promise<PlatformInvoice> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, '/billing/sync/ipd/ensure-draft', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      actorRole: session.role,
      actorId: session.userId,
    }),
  });
}

export async function platformSyncIpdCharge(input: {
  admissionId: string;
  patientId: string;
  idempotencyKey: string;
  description: string;
  amountCents: number;
  chargeCode?: string;
  sourceModule: string;
  sourceAction: string;
  sourceRefId?: string;
  expectedVersion?: number;
  corporatePayer?: boolean;
  insuranceMode?: string;
}): Promise<{ invoice: PlatformInvoice; duplicate?: boolean }> {
  const session = getPlatformSession()!;
  const result = await platformFetch<{
    invoice: PlatformInvoice;
    duplicate?: boolean;
  }>(domainBase()!, '/billing/sync/ipd/charge', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      actorRole: session.role,
      actorId: session.userId,
    }),
  });
  await platformRecordMetering(['billing.charge_synced'], result.invoice.id);
  await platformKernelAudit('billing.ipd_charge_synced', `invoice:${result.invoice.id}`, {
    admissionId: input.admissionId,
    idempotencyKey: input.idempotencyKey,
    amountCents: input.amountCents,
  });
  return result;
}

export async function platformEnsureOpdDraft(input: {
  opdVisitId: string;
  patientId: string;
  corporatePayer?: boolean;
  insuranceMode?: string;
}): Promise<PlatformInvoice> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, '/billing/sync/ensure-draft', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      actorRole: session.role,
      actorId: session.userId,
    }),
  });
}

export async function platformSyncCharge(input: {
  opdVisitId: string;
  patientId: string;
  encounterId?: string;
  idempotencyKey: string;
  description: string;
  amountCents: number;
  chargeCode?: string;
  sourceModule: string;
  sourceAction: string;
  sourceRefId?: string;
  expectedVersion?: number;
  corporatePayer?: boolean;
  insuranceMode?: string;
}): Promise<{ invoice: PlatformInvoice; duplicate?: boolean }> {
  const session = getPlatformSession()!;
  const result = await platformFetch<{
    invoice: PlatformInvoice;
    duplicate?: boolean;
  }>(domainBase()!, '/billing/sync/charge', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      actorRole: session.role,
      actorId: session.userId,
    }),
  });
  await platformRecordMetering(['billing.charge_synced'], result.invoice.id);
  await platformKernelAudit('billing.charge_synced', `invoice:${result.invoice.id}`, {
    idempotencyKey: input.idempotencyKey,
    amountCents: input.amountCents,
  });
  return result;
}

export async function platformReverseCharge(input: {
  idempotencyKey: string;
  reason?: string;
  expectedVersion?: number;
}) {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, '/billing/sync/charge/reverse', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      actorRole: session.role,
      actorId: session.userId,
    }),
  });
}

export async function platformInvoiceTransition(
  invoiceId: string,
  action: string,
  context?: InvoiceValidationContext,
  payload?: Record<string, unknown>,
  expectedVersion?: number,
): Promise<{ invoice: PlatformInvoice }> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, `/invoices/${invoiceId}/transition`, {
    method: 'POST',
    body: JSON.stringify({
      action,
      actorRole: session.role,
      actorId: session.userId,
      context,
      payload,
      expectedVersion,
    }),
  });
}

/** Atomic OPD billing exit on domain-api. */
export async function platformCompleteOpdBillingExit(input: {
  visitId: string;
  lineItems?: { description: string; amountCents: number }[];
  paymentAmountCents: number;
  paymentMethod: string;
  reference?: string;
  corporatePayer?: boolean;
  insuranceMode?: 'self' | 'corporate' | 'insurance';
}): Promise<{
  visit: { id: string; state: string };
  invoice: PlatformInvoice;
  receiptNumber?: string | null;
}> {
  const session = getPlatformSession()!;
  const branchOverrides = getBranchConfigOverrides();

  const result = await platformFetch<{
    visit: { id: string; state: string };
    invoice: PlatformInvoice;
    receiptNumber?: string | null;
  }>(domainBase()!, `/opd/visits/${input.visitId}/billing/exit`, {
    method: 'POST',
    body: JSON.stringify({
      actorRole: session.role,
      actorId: session.userId,
      lineItems: input.lineItems ?? [],
      paymentAmountCents: input.paymentAmountCents,
      paymentMethod: input.paymentMethod,
      reference: input.reference,
      corporatePayer: input.corporatePayer,
      insuranceMode: input.insuranceMode ?? 'self',
      branchOverrides,
    }),
  });

  await platformRecordMetering(
    ['billing.invoice_settled', 'opd.visit_completed'],
    input.visitId,
  );
  await platformKernelAudit('opd.billing_exit_completed', `opd_visit:${input.visitId}`, {
    invoiceId: result.invoice.id,
    receiptNumber: result.receiptNumber,
  });

  return result;
}

/** Atomic IPD billing exit on domain-api (mirrors OPD billing/exit). */
export async function platformCompleteIpdBillingExit(input: {
  admissionId: string;
  lineItems?: { description: string; amountCents: number }[];
  paymentAmountCents: number;
  paymentMethod: string;
  reference?: string;
  corporatePayer?: boolean;
  insuranceMode?: 'self' | 'corporate' | 'insurance';
}): Promise<{
  admission: { id: string; state: string };
  invoice: PlatformInvoice;
  receiptNumber?: string | null;
}> {
  const session = getPlatformSession()!;
  const branchOverrides = getBranchConfigOverrides();

  const result = await platformFetch<{
    admission: { id: string; state: string };
    invoice: PlatformInvoice;
    receiptNumber?: string | null;
  }>(domainBase()!, `/ipd/admissions/${input.admissionId}/billing/exit`, {
    method: 'POST',
    body: JSON.stringify({
      actorRole: session.role,
      actorId: session.userId,
      lineItems: input.lineItems ?? [],
      paymentAmountCents: input.paymentAmountCents,
      paymentMethod: input.paymentMethod,
      reference: input.reference,
      corporatePayer: input.corporatePayer,
      insuranceMode: input.insuranceMode ?? 'self',
      branchOverrides,
    }),
  });

  await platformRecordMetering(['billing.invoice_settled', 'ipd.billing.settled'], input.admissionId);
  await platformKernelAudit('ipd.billing_exit_completed', `ipd_admission:${input.admissionId}`, {
    invoiceId: result.invoice.id,
    receiptNumber: result.receiptNumber,
  });

  return result;
}

export function canUseBillingRuntime(): boolean {
  return canUseOpdRuntime();
}

export function canUseIpdBillingRuntime(): boolean {
  return canUseIpdRuntime();
}
