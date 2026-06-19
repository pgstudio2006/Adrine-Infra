import { coerceTenantSettings, type TenantSettings } from '@/config/tenantSettings';
import { getServerTenantSettings } from '@/runtime/branch-config';

export function readTenantSettingsSnapshot(): TenantSettings | null {
  const server = getServerTenantSettings();
  if (server) {
    return coerceTenantSettings(server);
  }

  try {
    const raw = localStorage.getItem('adrine_tenant_settings');
    if (raw) {
      return coerceTenantSettings(JSON.parse(raw));
    }
  } catch {
    /* ignore corrupt cache */
  }

  return null;
}

/** Unlocks all roles, nav tabs, and preview routes for investor / full-platform demos. */
export function isFullHospitalDemoEnabled(settings?: TenantSettings | null): boolean {
  if (import.meta.env.VITE_FULL_HOSPITAL_DEMO === 'true') {
    return true;
  }

  const resolved = settings ?? readTenantSettingsSnapshot();
  return resolved?.featureFlags?.fullHospitalDemo === true;
}
