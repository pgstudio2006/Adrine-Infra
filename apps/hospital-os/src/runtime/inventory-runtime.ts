import type { InventoryValidationContext } from '@adrine/hospital-operations';
import { platformFetch } from './platform-client';
import { getPlatformSession, isPlatformRuntimeEnabled } from './platform-session';

export type PlatformInventoryItem = {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  qtyOnHand: number;
  reorderLevel: number;
  unitCostCents: number;
};

export type PlatformStockMove = {
  id: string;
  moveType: string;
  quantity: number;
  state: string;
  fromLocation?: string | null;
  toLocation?: string | null;
  version: number;
  catalogItem?: PlatformInventoryItem;
};

function domainBase(): string | undefined {
  return import.meta.env.VITE_DOMAIN_API_URL as string | undefined;
}

export function canUseInventoryRuntime(): boolean {
  return isPlatformRuntimeEnabled() && !!domainBase() && !!getPlatformSession();
}

export async function platformListInventoryCatalog(take = 200): Promise<PlatformInventoryItem[]> {
  return platformFetch(domainBase()!, `/inventory/catalog?take=${take}`);
}

export async function platformListInventoryMoves(take = 100): Promise<PlatformStockMove[]> {
  return platformFetch(domainBase()!, `/inventory/moves?take=${take}`);
}

export async function platformUpsertInventoryItem(input: {
  sku: string;
  name: string;
  category?: string;
  unit?: string;
  qtyOnHand?: number;
  reorderLevel?: number;
}): Promise<PlatformInventoryItem> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, '/inventory/catalog', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      actorRole: session.role,
      actorId: session.userId,
    }),
  });
}

export async function platformCreateStockMove(input: {
  catalogItemId: string;
  moveType: string;
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  externalRef?: string;
}): Promise<PlatformStockMove> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, '/inventory/moves', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      actorRole: session.role,
      actorId: session.userId,
    }),
  });
}

export async function platformInventoryTransition(
  moveId: string,
  action: string,
  context?: InventoryValidationContext,
  expectedVersion?: number,
): Promise<{ move: PlatformStockMove }> {
  const session = getPlatformSession()!;
  return platformFetch(domainBase()!, `/inventory/moves/${moveId}/transition`, {
    method: 'POST',
    body: JSON.stringify({
      action,
      actorRole: session.role,
      actorId: session.userId,
      context,
      expectedVersion,
    }),
  });
}
