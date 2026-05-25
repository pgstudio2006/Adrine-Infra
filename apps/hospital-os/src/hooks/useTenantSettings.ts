import { useContext } from 'react';
import { TenantSettingsContext } from '@/contexts/tenantSettingsStore';

export function useTenantSettings() {
  const context = useContext(TenantSettingsContext);
  if (!context) {
    throw new Error('useTenantSettings must be used within TenantSettingsProvider');
  }

  return context;
}
