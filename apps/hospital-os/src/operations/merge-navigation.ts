import { OPERATIONAL_NAV_BY_ROLE } from '@adrine/hospital-operations';
import { ROLE_TABS, type RoleTab } from '@/config/roleNavigation';
import type { UserRole } from '@/types/roles';

/**
 * Merges journey-first operational tabs with legacy feature tabs.
 * Operational paths win on duplicate keys; legacy tabs fill the rest.
 */
export function mergeOperationalTabs(role: UserRole): RoleTab[] {
  const legacy = ROLE_TABS[role] ?? [];
  const groups = OPERATIONAL_NAV_BY_ROLE[role as keyof typeof OPERATIONAL_NAV_BY_ROLE];
  if (!groups?.length) {
    return legacy;
  }

  const operational: RoleTab[] = [];
  const seenPaths = new Set<string>();
  const seenKeys = new Set<string>();

  for (const group of groups) {
    for (const item of group.items) {
      if (seenPaths.has(item.path) || seenKeys.has(item.key)) continue;
      seenPaths.add(item.path);
      seenKeys.add(item.key);
      operational.push({
        key: item.key,
        label: item.label,
        path: item.path,
      });
    }
  }

  const rest = legacy.filter((tab) => !seenPaths.has(tab.path) && !seenKeys.has(tab.key));
  return [...operational, ...rest];
}
