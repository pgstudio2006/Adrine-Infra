/** Public tenant slug → kernel tenantId (Wave 0 Navayu). */
export const TENANT_SLUG_TO_ID: Record<string, string> = {
  navayu: 'tenant_navayu',
};

export function resolveTenantIdFromSlug(slug: string): string | undefined {
  return TENANT_SLUG_TO_ID[slug.toLowerCase()];
}
