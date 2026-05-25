import { useCallback, useEffect, useState } from 'react';
import {
  canUseDialysisRuntime,
  platformListDialysisMachines,
  platformListDialysisWorklist,
  type PlatformDialysisMachine,
  type PlatformDialysisSession,
} from '@/runtime/dialysis-runtime';

export function useDialysisPlatformData() {
  const platformOn = canUseDialysisRuntime();
  const [sessions, setSessions] = useState<PlatformDialysisSession[]>([]);
  const [machines, setMachines] = useState<PlatformDialysisMachine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!platformOn) {
      setSessions([]);
      setMachines([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [worklist, machineList] = await Promise.all([
        platformListDialysisWorklist(),
        platformListDialysisMachines(),
      ]);
      setSessions(worklist);
      setMachines(machineList);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dialysis data');
    } finally {
      setLoading(false);
    }
  }, [platformOn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { platformOn, sessions, machines, loading, error, refresh };
}
