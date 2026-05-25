import { createContext } from 'react';
import { ROLE_TABS, RoleTab } from '@/config/roleNavigation';
import {
  TenantBranding,
  TenantFeatureFlag,
  TenantFormTemplateConfig,
  TenantFormTemplateKey,
  TenantNavigationItemConfig,
  TenantRegistrationConfig,
  TenantRoleConfig,
  TenantSettings,
} from '@/config/tenantSettings';
import { UserRole } from '@/types/roles';

export interface TenantSettingsContextType {
  settings: TenantSettings;
  updateBranding: (patch: Partial<TenantBranding>) => void;
  updateRole: (role: UserRole, patch: Partial<TenantRoleConfig>) => void;
  updateNavigation: (role: UserRole, tabKey: string, patch: Partial<TenantNavigationItemConfig>) => void;
  updateFeatureFlag: (flag: TenantFeatureFlag, value: boolean) => void;
  updateRegistration: (patch: Partial<TenantRegistrationConfig>) => void;
  updateFormTemplate: (templateKey: TenantFormTemplateKey, patch: Partial<TenantFormTemplateConfig>) => void;
  replaceSettings: (next: unknown) => void;
  resetSettings: () => void;
  getRoleLabel: (role: UserRole) => string;
  getRoleDescription: (role: UserRole) => string;
  getAvailableRoles: () => UserRole[];
  getTabsForRole: (role: UserRole) => RoleTab[];
}

export const TenantSettingsContext = createContext<TenantSettingsContextType | null>(null);
