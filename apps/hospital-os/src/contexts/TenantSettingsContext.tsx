import React, { useEffect, useState } from 'react';
import { ROLE_TABS } from '@/config/roleNavigation';
import { mergeOperationalTabs } from '@/operations/merge-navigation';
import {
  DEFAULT_TENANT_SETTINGS,
  TenantBranding,
  TenantDynamicFormDefinition,
  TenantFeatureFlag,
  TenantFormTemplateConfig,
  TenantFormTemplateKey,
  TenantNavigationItemConfig,
  TenantRegistrationConfig,
  TenantRoleConfig,
  TenantMasterData,
  TenantSettings,
  coerceTenantSettings,
  getDocumentTitle,
} from '@/config/tenantSettings';
import { TenantSettingsContext, TenantSettingsContextType } from '@/contexts/tenantSettingsStore';
import { getCounsellorCrmTabs, getEffectiveTabVisibility, NavUserContext, resolveNavProfile } from '@/config/routeAccess';
import { filterNavTabsForTwentyFullApp } from '@/lib/twenty/twenty-config';
import { getNavayuRoleDisplayLabel } from '@/lib/navayu/navayu-forms';
import { isNavRouteVisible } from '@/config/nav-visibility';
import { getServerTenantSettings, loadBranchConfig } from '@/runtime/branch-config';
import { getPlatformSession, isPlatformRuntimeEnabled } from '@/runtime/platform-session';
import { UserRole } from '@/types/roles';
import { listEnabledRoles } from '@engines/packs';
import { coerceMasterData, DEFAULT_MASTER_DATA } from '@/lib/admin/master-data';

const STORAGE_KEY = 'adrine_tenant_settings';

export function TenantSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<TenantSettings>(() => {
    if (isPlatformRuntimeEnabled()) {
      return DEFAULT_TENANT_SETTINGS;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? coerceTenantSettings(JSON.parse(stored)) : DEFAULT_TENANT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    document.title = getDocumentTitle(settings);
  }, [settings]);

  useEffect(() => {
    if (!isPlatformRuntimeEnabled()) return;
    const server = getServerTenantSettings();
    if (server) {
      setSettings(coerceTenantSettings(server));
      return;
    }
    void loadBranchConfig().then(() => {
      const loaded = getServerTenantSettings();
      if (loaded) setSettings(coerceTenantSettings(loaded));
    });
  }, []);

  function updateBranding(patch: Partial<TenantBranding>) {
    setSettings((current) => ({
      ...current,
      branding: {
        ...current.branding,
        ...patch,
      },
    }));
  }

  function updateRole(role: UserRole, patch: Partial<TenantRoleConfig>) {
    setSettings((current) => ({
      ...current,
      roles: {
        ...current.roles,
        [role]: {
          ...current.roles[role],
          ...patch,
        },
      },
    }));
  }

  function updateNavigation(role: UserRole, tabKey: string, patch: Partial<TenantNavigationItemConfig>) {
    setSettings((current) => ({
      ...current,
      navigation: {
        ...current.navigation,
        [role]: {
          ...current.navigation[role],
          [tabKey]: {
            ...current.navigation[role][tabKey],
            ...patch,
          },
        },
      },
    }));
  }

  function updateFeatureFlag(flag: TenantFeatureFlag, value: boolean) {
    setSettings((current) => ({
      ...current,
      featureFlags: {
        ...current.featureFlags,
        [flag]: value,
      },
    }));
  }

  function updateRegistration(patch: Partial<TenantRegistrationConfig>) {
    setSettings((current) => ({
      ...current,
      registration: {
        ...current.registration,
        ...patch,
      },
    }));
  }

  function updateMasterData(patch: Partial<TenantMasterData>) {
    setSettings((current) => ({
      ...current,
      masterData: coerceMasterData({
        ...(current.masterData ?? DEFAULT_MASTER_DATA),
        ...patch,
        roleDepartments: {
          ...(current.masterData?.roleDepartments ?? DEFAULT_MASTER_DATA.roleDepartments),
          ...(patch.roleDepartments ?? {}),
        },
      }),
    }));
  }

  function updateFormTemplate(templateKey: TenantFormTemplateKey, patch: Partial<TenantFormTemplateConfig>) {
    setSettings((current) => ({
      ...current,
      forms: {
        ...current.forms,
        [templateKey]: {
          ...current.forms[templateKey],
          ...patch,
        },
      },
    }));
  }

  function updateDynamicForm(formKey: string, definition: TenantDynamicFormDefinition) {
    setSettings((current) => ({
      ...current,
      dynamicForms: {
        ...current.dynamicForms,
        [formKey]: definition,
      },
    }));
  }

  function replaceSettings(next: unknown) {
    setSettings(coerceTenantSettings(next));
  }

  function resetSettings() {
    setSettings(DEFAULT_TENANT_SETTINGS);
  }

  function getRoleLabel(role: UserRole) {
    return getNavayuRoleDisplayLabel(role, settings.roles[role].label);
  }

  function getRoleDescription(role: UserRole) {
    return settings.roles[role].description;
  }

  function getAvailableRoles() {
    if (settings.featureFlags.fullHospitalDemo) {
      return (Object.keys(ROLE_TABS) as UserRole[]).filter((role) => {
        if (role === 'crm_manager' && !settings.featureFlags.patientRelationsEnabled) {
          return false;
        }
        return true;
      });
    }

    const enabled = listEnabledRoles(settings) as UserRole[];
    return enabled.filter((role) => {
      if (role === 'crm_manager' && !settings.featureFlags.patientRelationsEnabled) {
        return false;
      }
      return true;
    });
  }

  function buildNavContext(role: UserRole, partial?: Partial<NavUserContext>): NavUserContext {
    const session = getPlatformSession();
    return {
      role,
      department: partial?.department,
      email: partial?.email ?? session?.email,
      name: partial?.name,
    };
  }

  function getTabsForRole(role: UserRole, partialCtx?: Partial<NavUserContext>) {
    const ctx = buildNavContext(role, partialCtx);
    const roleTabs = mergeOperationalTabs(role);
    if (!roleTabs.length) {
      console.error(`No tabs found for role: ${role}`);
      return [];
    }

    const visibleTabs = roleTabs
      .filter((tab) => {
        if (tab.key === 'flow-hub') {
          return false;
        }

        if (!isNavRouteVisible(tab.path)) {
          return false;
        }

        if (!getEffectiveTabVisibility(settings, role, tab.key, ctx)) {
          return false;
        }

        if (!settings.featureFlags.fullHospitalDemo) {
          if (tab.key === 'teleconsult' && !settings.featureFlags.telemedicineEnabled) {
            return false;
          }

          if (
            (role === 'crm_manager' || tab.path.startsWith('/crm') || tab.path === '/admin/crm') &&
            !settings.featureFlags.patientRelationsEnabled
          ) {
            return false;
          }
        }

        return true;
      })
      .map((tab) => ({
        ...tab,
        label: settings.navigation[role][tab.key]?.label ?? tab.label,
      }));

    const profile = resolveNavProfile(settings, ctx);
    const crmExtras =
      profile?.allowedRoutePrefixes?.some((prefix) => prefix.startsWith('/crm'))
        ? getCounsellorCrmTabs(settings, ctx).map((tab) => ({
            ...tab,
            label: settings.navigation.crm_manager[tab.key]?.label ?? tab.label,
          }))
        : [];

    const seen = new Set<string>();
    const merged = [...visibleTabs, ...crmExtras].filter((tab) => {
      if (!isNavRouteVisible(tab.path)) {
        return false;
      }
      if (seen.has(tab.path)) {
        return false;
      }
      seen.add(tab.path);
      return true;
    });

    return filterNavTabsForTwentyFullApp(merged, settings);
  }

  return (
    <TenantSettingsContext.Provider
      value={{
        settings,
        updateBranding,
        updateRole,
        updateNavigation,
        updateFeatureFlag,
        updateRegistration,
        updateMasterData,
        updateFormTemplate,
        updateDynamicForm,
        replaceSettings,
        resetSettings,
        getRoleLabel,
        getRoleDescription,
        getAvailableRoles,
        getTabsForRole,
      }}
    >
      {children}
    </TenantSettingsContext.Provider>
  );
}
