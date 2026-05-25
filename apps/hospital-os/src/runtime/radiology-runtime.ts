import type { RadiologyValidationContext } from '@adrine/hospital-operations';
import { platformFetch } from './platform-client';
import { getPlatformSession, isPlatformRuntimeEnabled } from './platform-session';

export type PlatformRadiologyOrder = {
  id: string;
  externalRef?: string | null;
  study: string;
  state: string;
  modality: string;
  priority: string;
  isCritical: boolean;
  version: number;
  amountCents: number;
};

export type LiveRadiologyState = {
  orders: {
    id: string;
    externalRef?: string | null;
    study: string;
    state: string;
    modality: string;
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

export function canUseRadiologyRuntime(): boolean {
  return isPlatformRuntimeEnabled() && !!domainBase() && !!getPlatformSession();
}

export async function platformCreateRadiologyOrder(input: {
  patientId: string;
  opdVisitId?: string;
  encounterId?: string;
  externalRef: string;
  study: string;
  modality?: string;
  priority?: string;
  orderingDoctor: string;
  amountCents?: number;
  syncBilling?: boolean;
}): Promise<{ order: PlatformRadiologyOrder }> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, '/radiology/orders', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      actorRole: session.role,
      actorId: session.userId,
    }),
  });
}

export async function platformRadiologyTransition(
  orderId: string,
  action: string,
  context?: RadiologyValidationContext,
  payload?: Record<string, unknown>,
  expectedVersion?: number,
): Promise<{ order: PlatformRadiologyOrder }> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, `/radiology/orders/${orderId}/transition`, {
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

export async function platformApplyRadiologyUiStatus(
  orderId: string,
  status: RadiologyOrderUiStatus,
  critical?: boolean,
): Promise<PlatformRadiologyOrder> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, `/radiology/orders/${orderId}/ui-status`, {
    method: 'POST',
    body: JSON.stringify({
      status,
      critical,
      actorRole: session.role,
      actorId: session.userId,
    }),
  });
}

export type RadiologyOrderUiStatus =
  | 'Ordered'
  | 'Scheduled'
  | 'In Progress'
  | 'Completed'
  | 'Reported';

export async function platformGetLiveRadiologyState(opdVisitId: string): Promise<LiveRadiologyState> {
  return platformFetch(domainBase()!, `/radiology/opd/${opdVisitId}/live`);
}

export async function platformListRadiologyOrders(opdVisitId: string): Promise<PlatformRadiologyOrder[]> {
  return platformFetch(domainBase()!, `/radiology/opd/${opdVisitId}/orders?take=50`);
}

export async function platformListRadiologyBranchWorklist(take = 100) {
  return platformFetch<unknown[]>(domainBase()!, `/radiology/branch/worklist?take=${take}`);
}
