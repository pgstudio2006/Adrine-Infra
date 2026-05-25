import type { PharmacyValidationContext } from '@adrine/hospital-operations';
import { platformFetch } from './platform-client';
import { getPlatformSession, isPlatformRuntimeEnabled } from './platform-session';

export type PlatformPharmacyFulfillment = {
  id: string;
  externalRef?: string | null;
  state: string;
  priority: string;
  isControlled: boolean;
  controlledApproved: boolean;
  version: number;
  medications: unknown;
};

export type LivePharmacyState = {
  fulfillments: {
    id: string;
    externalRef?: string | null;
    state: string;
    priority: string;
    isControlled: boolean;
    controlledApproved: boolean;
  }[];
  pendingCount: number;
  controlledPending: number;
  blockers: { code: string; message: string; severity: string }[];
  stockWarnings: { drug: string; available: number; batch: string }[];
};

function domainBase(): string | undefined {
  return import.meta.env.VITE_DOMAIN_API_URL as string | undefined;
}

export function canUsePharmacyRuntime(): boolean {
  return isPlatformRuntimeEnabled() && !!domainBase() && !!getPlatformSession();
}

export function isControlledDrug(drug: string): boolean {
  const d = drug.toLowerCase();
  return (
    d.includes('morphine') ||
    d.includes('tramadol') ||
    d.includes('fentanyl') ||
    d.includes('codeine') ||
    d.includes('schedule h')
  );
}

export async function platformCreatePrescription(input: {
  patientId: string;
  opdVisitId?: string;
  encounterId?: string;
  externalRef: string;
  prescribingDoctor: string;
  department?: string;
  priority?: string;
  medications: {
    drug: string;
    dosage: string;
    frequency: string;
    duration: string;
    route: string;
    qty: number;
    isControlled?: boolean;
  }[];
}): Promise<{ fulfillment: PlatformPharmacyFulfillment }> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, '/pharmacy/fulfillments', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      actorRole: session.role,
      actorId: session.userId,
    }),
  });
}

export async function platformPharmacyTransition(
  fulfillmentId: string,
  action: string,
  context?: PharmacyValidationContext,
  payload?: Record<string, unknown>,
  expectedVersion?: number,
): Promise<{ fulfillment: PlatformPharmacyFulfillment }> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, `/pharmacy/fulfillments/${fulfillmentId}/transition`, {
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

export async function platformDispensePrescription(
  fulfillmentId: string,
  quantities: Record<number, number>,
): Promise<PlatformPharmacyFulfillment> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, `/pharmacy/fulfillments/${fulfillmentId}/dispense`, {
    method: 'POST',
    body: JSON.stringify({
      quantities,
      actorRole: session.role,
      actorId: session.userId,
    }),
  });
}

export async function platformApplyRxUiStatus(
  fulfillmentId: string,
  status: 'Pending' | 'Verified' | 'Dispensed' | 'Partially dispensed' | 'Cancelled',
  quantities?: Record<number, number>,
): Promise<PlatformPharmacyFulfillment> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, `/pharmacy/fulfillments/${fulfillmentId}/ui-status`, {
    method: 'POST',
    body: JSON.stringify({
      status,
      quantities,
      actorRole: session.role,
      actorId: session.userId,
    }),
  });
}

export async function platformGetLivePharmacyState(opdVisitId: string): Promise<LivePharmacyState> {
  return platformFetch(domainBase()!, `/pharmacy/opd/${opdVisitId}/live`);
}

export async function platformListPharmacyBranchWorklist(take = 100) {
  return platformFetch<unknown[]>(domainBase()!, `/pharmacy/branch/worklist?take=${take}`);
}

export type PlatformPharmacyStockRow = {
  id: string;
  drug: string;
  generic: string;
  batch: string;
  expiry: string;
  qtyOnHand: number;
  qtyReserved: number;
  isControlled: boolean;
  unitPriceCents: number;
};

export async function platformListPharmacyStock(take = 200): Promise<PlatformPharmacyStockRow[]> {
  return platformFetch<PlatformPharmacyStockRow[]>(
    domainBase()!,
    `/pharmacy/branch/stock?take=${take}`,
  );
}
