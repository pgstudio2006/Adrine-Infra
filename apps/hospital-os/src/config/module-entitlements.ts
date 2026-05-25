import type { ModuleKey } from '@/types/roles';

/** Hospital OS module → kernel module entitlement code (lowercase). */
export const MODULE_ENTITLEMENT_MAP: Partial<Record<ModuleKey, string>> = {
  opd: 'opd',
  ipd: 'ipd',
  laboratory: 'lims',
  radiology: 'lims',
  pharmacy: 'pharmacy',
  insurance: 'insurance',
  billing: 'corporate_billing',
  revenue: 'corporate_billing',
  crm: 'analytics',
};
