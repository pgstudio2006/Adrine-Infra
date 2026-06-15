import { useMemo } from 'react';
import { useTenantSettings } from '@/hooks/useTenantSettings';
import { resolveTwentyCrmConfig, type TwentyCrmIntegration } from '@/lib/twenty/twenty-config';

export function useTwentyCrmConfig(): TwentyCrmIntegration | null {
  const { settings } = useTenantSettings();
  return useMemo(() => resolveTwentyCrmConfig(settings), [settings]);
}
