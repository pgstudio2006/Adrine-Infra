/**
 * Twenty CRM integration — full product embed (https://github.com/twentyhq/twenty).
 * Not a hospital-limited CRM subset: the entire Twenty workspace loads in-frame
 * with its own navigation (people, companies, opportunities, tasks, workflows,
 * email, settings, etc.).
 */
import type { TenantSettings } from '@/config/tenantSettings';
import type { RoleTab } from '@/config/roleNavigation';

export type TwentyCrmIntegration = {
  enabled: boolean;
  /** Twenty workspace URL, e.g. https://crm.hospital.in or http://localhost:3000 */
  baseUrl: string;
  /** When true, all /crm/* routes render Twenty instead of legacy Hospital OS CRM */
  embedMode: boolean;
  /** When true (default), embed the full Twenty app — not hospital-mapped sub-screens */
  fullApp: boolean;
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
    fullApp: twenty.fullApp !== false,
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
