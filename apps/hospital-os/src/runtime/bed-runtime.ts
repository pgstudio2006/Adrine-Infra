import { platformFetch } from './platform-client';
import { canUseIpdRuntime } from './ipd-runtime';

export type PlatformBed = {
  id: string;
  label: string;
  state: string;
  version: number;
  bedUnitId: string;
  bedUnit?: { id: string; name: string; wardType?: string | null };
};

function domainBase(): string | undefined {
  return import.meta.env.VITE_DOMAIN_API_URL as string | undefined;
}

export function canUseBedRuntime(): boolean {
  return canUseIpdRuntime();
}

export async function platformListBeds(): Promise<PlatformBed[]> {
  return platformFetch(domainBase()!, '/beds');
}

export async function platformCreateBedUnit(
  name: string,
  wardType?: string,
): Promise<{ id: string; name?: string }> {
  return platformFetch<{ id: string; name?: string }>(domainBase()!, '/beds/units', {
    method: 'POST',
    body: JSON.stringify({ name, wardType }),
  });
}

export async function platformCreateBed(bedUnitId: string, label: string): Promise<PlatformBed> {
  return platformFetch(domainBase()!, '/beds', {
    method: 'POST',
    body: JSON.stringify({ bedUnitId, label }),
  });
}

export async function platformGetBed(bedId: string): Promise<PlatformBed> {
  return platformFetch(domainBase()!, `/beds/${bedId}`);
}

/**
 * Resolves a reception/nurse bed label (e.g. `GW-01`) to a stable platform bed UUID.
 * Creates ward unit + bed on domain when missing (minimal inventory bootstrap).
 */
export async function resolvePlatformBedId(ward: string, bedLabel: string): Promise<string> {
  const normalized = bedLabel.trim().toLowerCase();
  const beds = await platformListBeds();
  const match = beds.find((b) => b.label.trim().toLowerCase() === normalized);
  if (match) {
    return match.id;
  }

  const wardKey = ward.trim().toLowerCase();
  let unit = beds.find((b) => b.bedUnit?.name.trim().toLowerCase() === wardKey)?.bedUnit;
  if (!unit) {
    const created = await platformCreateBedUnit(ward);
    unit = { id: created.id, name: ward };
  }

  const createdBed = await platformCreateBed(unit.id, bedLabel.trim());
  return createdBed.id;
}
