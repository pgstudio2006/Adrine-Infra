/**
 * Twenty CRM integration config.
 * UI embeds https://github.com/twentyhq/twenty when baseUrl is set.
 * Lead sync uses domain-api TWENTY_* env (never expose API key to browser).
 */
import type { TenantSettings } from '@/config/tenantSettings';

export type TwentyCrmIntegration = {
  enabled: boolean;
  /** Twenty workspace URL, e.g. https://crm.hospital.in or http://localhost:3000 */
  baseUrl: string;
  /** When true, all /crm/* routes render the Twenty iframe instead of legacy CRM UI */
  embedMode: boolean;
};

const ENV_URL = (import.meta.env.VITE_TWENTY_CRM_URL as string | undefined)?.trim();

export function getTwentyCrmFromTenant(settings: TenantSettings): TwentyCrmIntegration | null {
  const twenty = settings.integrations?.twentyCrm;
  if (!twenty?.enabled) return null;
  const baseUrl = (twenty.baseUrl ?? ENV_URL ?? '').replace(/\/$/, '');
  if (!baseUrl) return null;
  return {
    enabled: true,
    baseUrl,
    embedMode: twenty.embedMode !== false,
  };
}

export function resolveTwentyCrmConfig(settings: TenantSettings): TwentyCrmIntegration | null {
  const fromTenant = getTwentyCrmFromTenant(settings);
  if (fromTenant) return fromTenant;
  if (!ENV_URL) return null;
  return {
    enabled: true,
    baseUrl: ENV_URL.replace(/\/$/, ''),
    embedMode: true,
  };
}

/** Hospital OS route → Twenty app path */
export const TWENTY_ROUTE_MAP: Record<string, string> = {
  '/crm': '/',
  '/admin/crm': '/',
  '/crm/leads': '/objects/people',
  '/crm/lifecycle': '/objects/opportunities',
  '/crm/campaigns': '/workflows',
  '/crm/drip-campaigns': '/workflows',
  '/crm/experience': '/objects/notes',
  '/crm/reports': '/settings',
};

export function mapHospitalPathToTwenty(hospitalPath: string): string {
  return TWENTY_ROUTE_MAP[hospitalPath] ?? '/';
}
