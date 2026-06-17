import { ROLE_BASE_PATH, ROLE_TABS, RoleTab } from '@/config/roleNavigation';
import { isNavRouteVisible } from '@/config/nav-visibility';
import { NavProfile, NavProfileMatch, TenantSettings } from '@/config/tenantSettings';
import { isNavayuTenant } from '@/lib/navayu/navayu-forms';
import { filterNavTabsForTwentyFullApp } from '@/lib/twenty/twenty-config';
import { UserRole } from '@/types/roles';

export interface NavUserContext {
  role: UserRole;
  department?: string;
  email?: string;
  name?: string;
}

const PUBLIC_PATHS = new Set(['/', '/dashboard']);

const ADMIN_HR_ROUTE_TAB: Record<string, string> = {
  '/hr/staff': 'hr-staff',
  '/hr/scheduling': 'hr-scheduling',
  '/hr/leave': 'hr-leave',
};

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1);
  }
  return path;
}

export function matchesNavProfile(match: NavProfileMatch, ctx: NavUserContext): boolean {
  if (match.role && match.role !== ctx.role) {
    return false;
  }
  if (match.department && match.department !== ctx.department) {
    return false;
  }
  if (match.emailPattern || match.namePattern) {
    const email = ctx.email?.toLowerCase() ?? '';
    const name = ctx.name?.toLowerCase() ?? '';
    const emailOk = match.emailPattern
      ? email.includes(match.emailPattern.toLowerCase())
      : false;
    const nameOk = match.namePattern
      ? name.includes(match.namePattern.toLowerCase())
      : false;
    if (!emailOk && !nameOk) {
      return false;
    }
  }
  return true;
}

export function resolveNavProfile(settings: TenantSettings, ctx: NavUserContext): NavProfile | null {
  if (!settings.navProfiles) {
    return null;
  }

  for (const profile of Object.values(settings.navProfiles)) {
    if (matchesNavProfile(profile.match, ctx)) {
      return profile;
    }
  }

  return null;
}

export function getEffectiveTabVisibility(
  settings: TenantSettings,
  role: UserRole,
  tabKey: string,
  ctx: NavUserContext,
): boolean {
  const baseVisible = settings.navigation[role][tabKey]?.visible ?? false;
  const profile = resolveNavProfile(settings, ctx);
  const patchVisible = profile?.navigationPatches?.[role]?.[tabKey]?.visible;
  return typeof patchVisible === 'boolean' ? patchVisible : baseVisible;
}

function findRoleForPath(path: string): UserRole | null {
  const normalized = normalizePath(path);
  let best: { role: UserRole; pathLength: number } | null = null;

  (Object.keys(ROLE_TABS) as UserRole[]).forEach((role) => {
    const base = ROLE_BASE_PATH[role];
    if (normalized === base || normalized.startsWith(`${base}/`)) {
      if (!best || base.length > best.pathLength) {
        best = { role, pathLength: base.length };
      }
    }
  });

  return best?.role ?? null;
}

function findTabForPath(role: UserRole, path: string): RoleTab | undefined {
  const normalized = normalizePath(path);
  const tabs = ROLE_TABS[role];
  const exact = tabs.find((tab) => tab.path === normalized);
  if (exact) {
    return exact;
  }

  return tabs
    .filter((tab) => tab.path !== ROLE_BASE_PATH[role] && normalized.startsWith(`${tab.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];
}

function isFeatureBlocked(settings: TenantSettings, role: UserRole, tab: RoleTab): boolean {
  if (tab.key === 'teleconsult' && !settings.featureFlags.telemedicineEnabled) {
    return true;
  }

  if (
    (role === 'crm_manager' || tab.path.startsWith('/crm') || tab.path === '/admin/crm') &&
    !settings.featureFlags.patientRelationsEnabled
  ) {
    return true;
  }

  return false;
}

function isOperationalChildRoute(normalized: string, role: UserRole): boolean {
  if (role === 'doctor' && normalized.startsWith('/doctor/consultation/')) {
    return true;
  }
  if (role === 'jr_doctor' && normalized.startsWith('/jr-doctor/consultation/')) {
    return true;
  }
  return false;
}

export function canAccessRoute(
  path: string,
  settings: TenantSettings,
  ctx: NavUserContext,
): boolean {
  const normalized = normalizePath(path);
  if (PUBLIC_PATHS.has(normalized)) {
    return true;
  }

  if (!isNavRouteVisible(normalized)) {
    return false;
  }

  if (isNavayuTenant() && ctx.role === 'admin') {
    const hrTabKey = ADMIN_HR_ROUTE_TAB[normalized];
    if (hrTabKey) {
      return getEffectiveTabVisibility(settings, 'admin', hrTabKey, ctx);
    }
    if (normalized.startsWith('/hr/staff/')) {
      return getEffectiveTabVisibility(settings, 'admin', 'hr-staff', ctx);
    }
  }

  if (!settings.roles[ctx.role]?.enabled) {
    return false;
  }

  const profile = resolveNavProfile(settings, ctx);
  if (profile?.allowedRoutePrefixes?.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`))) {
    return settings.featureFlags.patientRelationsEnabled;
  }

  const owningRole = findRoleForPath(normalized);
  if (!owningRole) {
    return true;
  }

  if (owningRole !== ctx.role) {
    if (normalized.startsWith('/admin/crm') && ctx.role === 'admin') {
      return getEffectiveTabVisibility(settings, 'admin', 'crm', ctx);
    }
    return false;
  }

  const tab =
    findTabForPath(owningRole, normalized) ??
    (normalized === ROLE_BASE_PATH[owningRole]
      ? ROLE_TABS[owningRole].find((item) => item.key === 'dashboard')
      : undefined);

  if (!tab) {
    return isOperationalChildRoute(normalized, owningRole);
  }

  if (isFeatureBlocked(settings, owningRole, tab)) {
    return false;
  }

  return getEffectiveTabVisibility(settings, owningRole, tab.key, ctx);
}

export function getCounsellorCrmTabs(settings: TenantSettings, ctx: NavUserContext): RoleTab[] {
  const profile = resolveNavProfile(settings, ctx);
  if (!profile?.allowedRoutePrefixes?.some((prefix) => prefix.startsWith('/crm'))) {
    return [];
  }
  if (!settings.featureFlags.patientRelationsEnabled) {
    return [];
  }

  return filterNavTabsForTwentyFullApp(
    ROLE_TABS.crm_manager.filter((tab) => {
      if (settings.navigation.crm_manager[tab.key]?.visible === false) {
        return false;
      }
      return !isFeatureBlocked(settings, 'crm_manager', tab);
    }),
    settings,
  );
}
