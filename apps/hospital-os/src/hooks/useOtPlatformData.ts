import { useCallback, useEffect, useState } from 'react';
import {
  canUseOtRuntime,
  platformListOtRooms,
  platformListOtWorklist,
  type PlatformOtCase,
  type PlatformOtRoom,
} from '@/runtime/ot-runtime';

export function useOtPlatformData() {
  const platformOn = canUseOtRuntime();
  const [cases, setCases] = useState<PlatformOtCase[]>([]);
  const [rooms, setRooms] = useState<PlatformOtRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!platformOn) {
      setCases([]);
      setRooms([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [worklist, roomList] = await Promise.all([
        platformListOtWorklist(),
        platformListOtRooms(),
      ]);
      setCases(worklist);
      setRooms(roomList);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load OT data');
    } finally {
      setLoading(false);
    }
  }, [platformOn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { platformOn, cases, rooms, loading, error, refresh };
}
