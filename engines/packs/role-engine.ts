import type { BranchPackSettings, PackNavContext, PackNavProfile } from './types.js';

export function matchesNavProfile(
  profile: PackNavProfile,
  ctx: PackNavContext,
): boolean {
  const match = profile.match;
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

export function resolveNavProfile(
  settings: BranchPackSettings,
  ctx: PackNavContext,
): PackNavProfile | null {
  if (!settings.navProfiles) {
    return null;
  }
  for (const profile of Object.values(settings.navProfiles)) {
    if (matchesNavProfile(profile, ctx)) {
      return profile;
    }
  }
  return null;
}

export function getEffectiveTabVisibility(
  settings: BranchPackSettings,
  role: string,
  tabKey: string,
  ctx: PackNavContext,
): boolean {
  const baseVisible = settings.navigation[role]?.[tabKey]?.visible ?? false;
  const profile = resolveNavProfile(settings, ctx);
  const patchVisible = profile?.navigationPatches?.[role]?.[tabKey]?.visible;
  return typeof patchVisible === 'boolean' ? patchVisible : baseVisible;
}

export function isRoleEnabled(settings: BranchPackSettings, role: string): boolean {
  return settings.roles[role]?.enabled !== false;
}

/** Tab keys per coarse module gate (Hospital OS ModuleKey → pack navigation keys). */
export const MODULE_TAB_KEYS: Record<string, string[]> = {
  dashboard: ['dashboard'],
  patients: ['patients', 'patient-registry', 'registry'],
  appointments: ['appointments', 'schedule', 'calendar'],
  opd: ['queue', 'opd', 'consultation', 'check-in', 'flow'],
  ipd: ['ipd', 'admissions', 'ward', 'beds'],
  bed_management: ['beds', 'bed-management'],
  nursing: ['tasks', 'medications', 'vitals', 'nursing', 'task-board'],
  laboratory: ['labs', 'laboratory', 'lab'],
  radiology: ['radiology', 'imaging'],
  pharmacy: ['pharmacy', 'dispensing', 'medications'],
  billing: ['billing', 'invoices', 'payments', 'cashier', 'packages'],
  revenue: ['revenue', 'revenue-cycle'],
  insurance: ['insurance', 'pre-auth', 'tpa-desk', 'claims'],
  ot_management: ['ot', 'surgery'],
  inventory: ['inventory', 'stock', 'procurement'],
  reports: ['reports', 'mis', 'analytics'],
  settings: ['settings'],
  crm: ['crm', 'leads', 'lifecycle'],
};

export function roleCanAccessModule(
  settings: BranchPackSettings,
  ctx: PackNavContext,
  moduleKey: string,
): boolean {
  if (!isRoleEnabled(settings, ctx.role)) {
    return false;
  }

  const tabKeys = MODULE_TAB_KEYS[moduleKey];
  if (!tabKeys?.length) {
    return false;
  }

  const roleNav = settings.navigation[ctx.role];
  if (!roleNav) {
    return false;
  }

  return tabKeys.some(
    (tabKey) =>
      tabKey in roleNav && getEffectiveTabVisibility(settings, ctx.role, tabKey, ctx),
  );
}

export function listEnabledRoles(settings: BranchPackSettings): string[] {
  return Object.keys(settings.roles).filter((role) => isRoleEnabled(settings, role));
}
