/**
 * Domain API route RBAC — maps operational roles to route prefixes.
 * Enforced via x-actor-role when DOMAIN_RBAC_ENFORCE=true (default in production).
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

/** Route prefix → roles allowed to mutate (GET generally allowed for same prefix). */
export const DOMAIN_ROUTE_ROLE_MATRIX: Record<string, readonly DomainRbacRole[]> = {
  '/opd': ['admin', 'doctor', 'jr_doctor', 'receptionist', 'reception', 'emergency'],
  '/lab': ['admin', 'doctor', 'jr_doctor', 'lab_technician', 'emergency'],
  '/pharmacy': ['admin', 'doctor', 'jr_doctor', 'pharmacist', 'emergency'],
  '/radiology': ['admin', 'doctor', 'jr_doctor', 'radiologist', 'emergency'],
  '/ipd': ['admin', 'doctor', 'jr_doctor', 'nurse', 'receptionist', 'reception', 'emergency'],
  '/beds': ['admin', 'nurse', 'receptionist', 'reception'],
  '/nursing': ['admin', 'nurse'],
  '/billing': ['admin', 'billing', 'receptionist', 'reception'],
  '/migration': ['admin'],
  '/command': ['admin', 'doctor', 'jr_doctor', 'nurse', 'receptionist', 'reception'],
};

export function resolveAllowedRoles(path: string): readonly DomainRbacRole[] | null {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  for (const prefix of Object.keys(DOMAIN_ROUTE_ROLE_MATRIX)) {
    if (normalized.startsWith(prefix)) {
      return DOMAIN_ROUTE_ROLE_MATRIX[prefix];
    }
  }
  return null;
}

export function normalizeActorRole(role: string | undefined): string | undefined {
  if (!role) return undefined;
  const r = role.toLowerCase();
  if (r === 'reception') return 'receptionist';
  return r;
}
