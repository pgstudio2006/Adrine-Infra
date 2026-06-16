/**
 * Twenty CRM integration — full product embed (https://github.com/twentyhq/twenty).
 * One Twenty instance (crm.adrine.in) can host multiple client workspaces;
 * each HMS tenant (e.g. Navayu) maps to its own Twenty workspace URL.
 */
import type { TenantSettings, TenantTwentyCrmIntegration } from '@/config/tenantSettings';
import type { RoleTab } from '@/config/roleNavigation';

export type TwentyCrmIntegration = {
  enabled: boolean;
  /** Resolved workspace URL (client-specific when configured) */
  baseUrl: string;
  /** When true, all /crm/* routes render Twenty instead of legacy Hospital OS CRM */
  embedMode: boolean;
  /** When true (default), embed the full Twenty app — not hospital-mapped sub-screens */
  fullApp: boolean;
  workspaceSubdomain?: string;
};

const ENV_URL = (import.meta.env.VITE_TWENTY_CRM_URL as string | undefined)?.trim();

/** Build per-client workspace URL from platform base + optional subdomain override */
export function resolveTwentyWorkspaceUrl(twenty: TenantTwentyCrmIntegration): string {
  const platformBase = (twenty.baseUrl ?? ENV_URL ?? '').replace(/\/$/, '');
  if (!platformBase) return '';

  const explicit = twenty.workspaceUrl?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  const sub = twenty.workspaceSubdomain?.trim();
  if (!sub) return platformBase;

  try {
    const u = new URL(platformBase);
    return `${u.protocol}//${sub}.${u.host}`;
  } catch {
    return platformBase;
  }
}

export function getTwentyCrmFromTenant(settings: TenantSettings): TwentyCrmIntegration | null {
  const twenty = settings.integrations?.twentyCrm;
  if (!twenty?.enabled) return null;
  const baseUrl = resolveTwentyWorkspaceUrl(twenty);
  if (!baseUrl) return null;
  return {
    enabled: true,
    baseUrl,
    embedMode: twenty.embedMode !== false,
    fullApp: twenty.fullApp !== false,
    workspaceSubdomain: twenty.workspaceSubdomain?.trim() || undefined,
  };
}

export function resolveTwentyCrmConfig(settings: TenantSettings): TwentyCrmIntegration | null {
  // Respect explicit tenant disable. Do not fall back to ENV in this case.
  if (settings.integrations?.twentyCrm && settings.integrations.twentyCrm.enabled === false) {
    return null;
  }

  const fromTenant = getTwentyCrmFromTenant(settings);
  if (fromTenant) return fromTenant;
  if (!ENV_URL) return null;
  return {
    enabled: true,
    baseUrl: ENV_URL.replace(/\/$/, ''),
    embedMode: true,
    fullApp: true,
  };
}

/** Full Twenty workspace entry — user navigates all features inside Twenty's own UI */
export function getTwentyFullAppUrl(config: TwentyCrmIntegration): string {
  return `${config.baseUrl}/`;
}

/**
 * When Twenty full-app mode is on, hide hospital CRM sub-tabs (leads, lifecycle, …)
 * and keep a single "CRM" entry that opens the complete Twenty product.
 */
export function filterNavTabsForTwentyFullApp(tabs: RoleTab[], settings: TenantSettings): RoleTab[] {
  const twenty = resolveTwentyCrmConfig(settings);
  if (!twenty?.enabled || !twenty.fullApp) return tabs;

  let primaryCrmShown = false;

  return tabs
    .filter((tab) => {
      const isCrmRoute =
        tab.path === '/crm' || tab.path === '/admin/crm' || tab.path.startsWith('/crm/');
      if (!isCrmRoute) return true;

      if (tab.path === '/crm' || tab.path === '/admin/crm') {
        if (primaryCrmShown) return false;
        primaryCrmShown = true;
        return true;
      }
      return false;
    })
    .map((tab) => {
      if (tab.path === '/crm' || tab.path === '/admin/crm') {
        return { ...tab, label: 'CRM' };
      }
      return tab;
    });
}
