/**
 * Domain API route RBAC — maps operational roles to route prefixes.
 * Enforced via JWT-derived actor role when DOMAIN_RBAC_ENFORCE=true (default in production).
 */

export const DOMAIN_RBAC_ROLES = [
  'admin',
  'doctor',
  'jr_doctor',
  'nurse',
  'receptionist',
  'reception',
  'lab_technician',
  'pharmacist',
  'billing',
  'radiologist',
  'emergency',
  'ot_coordinator',
  'inventory_manager',
  'hr_manager',
  'scheduler',
  'dialysis_tech',
  'crm_manager',
] as const;

export type DomainRbacRole = (typeof DOMAIN_RBAC_ROLES)[number];

/** Route prefix → roles allowed to read and mutate. */
export const DOMAIN_ROUTE_ROLE_MATRIX: Record<string, readonly DomainRbacRole[]> = {
  '/opd': ['admin', 'doctor', 'jr_doctor', 'receptionist', 'reception', 'emergency', 'nurse', 'billing'],
  '/patients': ['admin', 'doctor', 'jr_doctor', 'nurse', 'receptionist', 'reception', 'emergency'],
  '/encounters': ['admin', 'doctor', 'jr_doctor', 'nurse', 'emergency'],
  '/emr': ['admin', 'doctor', 'jr_doctor', 'nurse'],
  '/appointments': ['admin', 'receptionist', 'reception', 'scheduler', 'doctor', 'jr_doctor'],
  '/scheduling': ['admin', 'receptionist', 'reception', 'scheduler', 'doctor', 'jr_doctor'],
  '/lab': ['admin', 'doctor', 'jr_doctor', 'lab_technician', 'emergency', 'nurse'],
  '/pharmacy': ['admin', 'doctor', 'jr_doctor', 'pharmacist', 'emergency', 'nurse'],
  '/radiology': ['admin', 'doctor', 'jr_doctor', 'radiologist', 'emergency', 'nurse'],
  '/ipd': ['admin', 'doctor', 'jr_doctor', 'nurse', 'receptionist', 'reception', 'emergency'],
  '/beds': ['admin', 'nurse', 'receptionist', 'reception'],
  '/nursing': ['admin', 'nurse'],
  '/mar': ['admin', 'nurse', 'doctor', 'jr_doctor'],
  '/billing': ['admin', 'billing', 'receptionist', 'reception', 'doctor', 'jr_doctor'],
  '/invoices': ['admin', 'billing', 'receptionist', 'reception', 'doctor'],
  '/finance': ['admin', 'billing'],
  '/crm': ['admin', 'crm_manager', 'receptionist', 'reception'],
  '/discharge': ['admin', 'doctor', 'jr_doctor', 'nurse', 'receptionist', 'reception'],
  '/insurance': ['admin', 'billing', 'receptionist', 'reception', 'doctor'],
  '/navayu': ['admin', 'doctor', 'jr_doctor', 'receptionist', 'reception', 'billing', 'crm_manager'],
  '/ai': ['admin', 'doctor', 'jr_doctor'],
  '/realtime': ['admin', 'doctor', 'jr_doctor', 'nurse', 'receptionist', 'reception'],
  '/analytics': ['admin', 'doctor', 'crm_manager'],
  '/notifications': ['admin', 'doctor', 'jr_doctor', 'nurse', 'receptionist', 'reception'],
  '/workflow-config': ['admin'],
  '/orchestration': ['admin'],
  '/escalations': ['admin', 'doctor', 'nurse'],
  '/dialysis': ['admin', 'doctor', 'dialysis_tech', 'nurse'],
  '/ot': ['admin', 'doctor', 'ot_coordinator', 'nurse'],
  '/inventory': ['admin', 'inventory_manager', 'pharmacist'],
  '/migration': ['admin'],
  '/command': ['admin', 'doctor', 'jr_doctor', 'nurse', 'receptionist', 'reception'],
  '/jobs': ['admin'],
  '/internal': ['admin'],
  '/governance': ['admin'],
};

/** Prefixes that expose PHI on GET — require matrix role match in production. */
export const DOMAIN_PHI_READ_PREFIXES = [
  '/patients',
  '/encounters',
  '/emr',
  '/opd',
  '/lab',
  '/pharmacy',
  '/radiology',
  '/ipd',
  '/billing',
  '/invoices',
  '/navayu',
  '/crm',
  '/discharge',
  '/insurance',
  '/nursing',
  '/mar',
  '/realtime',
] as const;

export function resolveAllowedRoles(path: string): readonly DomainRbacRole[] | null {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  for (const prefix of Object.keys(DOMAIN_ROUTE_ROLE_MATRIX)) {
    if (normalized.startsWith(prefix)) {
      return DOMAIN_ROUTE_ROLE_MATRIX[prefix];
    }
  }
  return null;
}

export function isDomainPhiReadPath(path: string, method: string): boolean {
  const m = method.toUpperCase();
  if (m !== 'GET' && m !== 'HEAD') return false;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return DOMAIN_PHI_READ_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

export function normalizeActorRole(role: string | undefined): string | undefined {
  if (!role) return undefined;
  const r = role.toLowerCase();
  if (r === 'reception') return 'receptionist';
  return r;
}

export function actorRolePermitted(
  actorRole: string | undefined,
  allowed: readonly DomainRbacRole[] | null,
): boolean {
  if (!allowed || allowed.length === 0) return false;
  const normalized = normalizeActorRole(actorRole);
  if (!normalized) return false;
  if (allowed.includes('*' as DomainRbacRole)) return true;
  if (allowed.includes(normalized as DomainRbacRole)) return true;
  if (normalized === 'admin' && allowed.includes('admin')) return true;
  return false;
}
