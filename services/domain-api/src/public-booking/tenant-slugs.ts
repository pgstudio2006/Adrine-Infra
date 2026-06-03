/** Public tenant slug → domain tenantId (Wave 0 Navayu). */
export const TENANT_SLUG_TO_ID: Record<string, string> = {
  navayu: 'tenant_navayu',
};

export function resolveTenantIdFromSlug(slug: string): string | undefined {
  return TENANT_SLUG_TO_ID[slug.toLowerCase()];
}

/** Valid Navayu branch codes from clients/navayu/branches.json */
export const NAVAYU_BRANCH_CODES = new Set(['gurgaon', 'pataudi']);
