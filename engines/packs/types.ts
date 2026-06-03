/** Minimal branch-pack shape (from clients/navayu/packs/*-pack.json → tenant.settings). */
export type PackRoleConfig = {
  enabled?: boolean;
  label?: string;
  description?: string;
};

export type PackNavItem = {
  visible?: boolean;
  label?: string;
};

export type PackNavProfileMatch = {
  role?: string;
  department?: string;
  emailPattern?: string;
  namePattern?: string;
};

export type PackNavProfile = {
  match: PackNavProfileMatch;
  navigationPatches?: Record<string, Record<string, PackNavItem>>;
  allowedRoutePrefixes?: string[];
};

export type BranchPackSettings = {
  roles: Record<string, PackRoleConfig>;
  navigation: Record<string, Record<string, PackNavItem>>;
  featureFlags?: Record<string, boolean>;
  navProfiles?: Record<string, PackNavProfile>;
};

export type PackNavContext = {
  role: string;
  department?: string;
  email?: string;
  name?: string;
};
