import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { resolveTenantIdFromSlug } from './tenant-slugs';

export type PublicBookingServiceType = {
  code: string;
  label: string;
  branchCodes: string[];
};

export type PublicBookingPatientField = {
  key: string;
  label: string;
  type: 'text' | 'tel' | 'email';
  required: boolean;
};

export type PublicBookingConfig = {
  tenantSlug: string;
  tenantId: string;
  title: string;
  subtitle: string;
  slotMinutes: number;
  serviceTypes: PublicBookingServiceType[];
  patientFields: PublicBookingPatientField[];
};

const CONFIG_BY_SLUG: Record<string, string> = {
  navayu: 'clients/navayu/public-booking-config.json',
};

function repoRoot(): string {
  const cwd = process.cwd();
  if (existsSync(join(cwd, 'clients', 'navayu', 'public-booking-config.json'))) {
    return cwd;
  }
  if (existsSync(join(cwd, '..', '..', 'clients', 'navayu', 'public-booking-config.json'))) {
    return join(cwd, '..', '..');
  }
  return cwd;
}

export function loadPublicBookingConfig(slug: string): PublicBookingConfig | undefined {
  const tenantId = resolveTenantIdFromSlug(slug);
  if (!tenantId) return undefined;

  const relative = CONFIG_BY_SLUG[slug.toLowerCase()];
  if (!relative) return undefined;

  const path = join(repoRoot(), relative);
  if (!existsSync(path)) return undefined;

  const raw = JSON.parse(readFileSync(path, 'utf8')) as Omit<PublicBookingConfig, 'tenantId'>;
  return { ...raw, tenantId, tenantSlug: slug.toLowerCase() };
}
