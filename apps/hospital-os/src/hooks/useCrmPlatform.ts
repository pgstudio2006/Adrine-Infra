import { useCallback, useEffect, useState } from 'react';
import {
  canUseCrmRuntime,
  platformGetCrmSummary,
  platformListCrmCampaigns,
  platformListCrmLeads,
  platformListCrmLifecycle,
  type PlatformCrmCampaign,
  type PlatformCrmLead,
  type PlatformCrmLifecycleEvent,
  type PlatformCrmSummary,
} from '@/runtime/crm-runtime';

export function useCrmPlatform() {
  const platformOn = canUseCrmRuntime();
  const [loading, setLoading] = useState(platformOn);
  const [summary, setSummary] = useState<PlatformCrmSummary | null>(null);
  const [leads, setLeads] = useState<PlatformCrmLead[]>([]);
  const [campaigns, setCampaigns] = useState<PlatformCrmCampaign[]>([]);
  const [lifecycle, setLifecycle] = useState<PlatformCrmLifecycleEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!canUseCrmRuntime()) {
      setSummary(null);
      setLeads([]);
      setCampaigns([]);
      setLifecycle([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [s, l, c, ev] = await Promise.all([
        platformGetCrmSummary(),
        platformListCrmLeads(),
        platformListCrmCampaigns(),
        platformListCrmLifecycle(),
      ]);
      setSummary(s);
      setLeads(l);
      setCampaigns(c);
      setLifecycle(ev);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load CRM data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { platformOn, loading, error, summary, leads, campaigns, lifecycle, refresh };
}
