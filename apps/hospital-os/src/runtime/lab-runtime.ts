import type { LabValidationContext } from '@adrine/hospital-operations';
import { platformFetch } from './platform-client';
import { getPlatformSession, isPlatformRuntimeEnabled } from './platform-session';

export type PlatformLabOrder = {
  id: string;
  externalRef?: string | null;
  tests: string;
  state: string;
  priority: string;
  isCritical: boolean;
  version: number;
  amountCents: number;
  sampleId?: string | null;
  sampleBarcode?: string | null;
};

export type LiveLabState = {
  orders: {
    id: string;
    externalRef?: string | null;
    tests: string;
    state: string;
    priority: string;
    isCritical: boolean;
  }[];
  pendingCount: number;
  criticalCount: number;
  blockers: { code: string; message: string; severity: string }[];
};

function domainBase(): string | undefined {
  return import.meta.env.VITE_DOMAIN_API_URL as string | undefined;
}

export function canUseLabRuntime(): boolean {
  return isPlatformRuntimeEnabled() && !!domainBase() && !!getPlatformSession();
}

export async function platformCreateLabOrder(input: {
  patientId: string;
  opdVisitId?: string;
  encounterId?: string;
  externalRef: string;
  tests: string;
  category?: string;
  priority?: string;
  orderingDoctor: string;
  amountCents?: number;
  syncBilling?: boolean;
}): Promise<{ order: PlatformLabOrder }> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, '/lab/orders', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      actorRole: session.role,
      actorId: session.userId,
    }),
  });
}

export async function platformLabTransition(
  orderId: string,
  action: string,
  context?: LabValidationContext,
  payload?: Record<string, unknown>,
  expectedVersion?: number,
): Promise<{ order: PlatformLabOrder }> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, `/lab/orders/${orderId}/transition`, {
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

export async function platformApplyLabUiStage(
  orderId: string,
  stage: 'Pending Analysis' | 'In Analysis' | 'Awaiting Validation' | 'Validated' | 'Reported',
  critical?: boolean,
): Promise<PlatformLabOrder> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, `/lab/orders/${orderId}/ui-stage`, {
    method: 'POST',
    body: JSON.stringify({
      stage,
      critical,
      actorRole: session.role,
      actorId: session.userId,
    }),
  });
}

export async function platformGetLiveLabState(opdVisitId: string): Promise<LiveLabState> {
  return platformFetch(domainBase()!, `/lab/opd/${opdVisitId}/live`);
}

export async function platformListLabBranchWorklist(take = 100) {
  return platformFetch<unknown[]>(domainBase()!, `/lab/branch/worklist?take=${take}`);
}
