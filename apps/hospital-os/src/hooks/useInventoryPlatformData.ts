import { useCallback, useEffect, useState } from 'react';
import {
  canUseInventoryRuntime,
  platformListInventoryCatalog,
  platformListInventoryMoves,
  type PlatformInventoryItem,
  type PlatformStockMove,
} from '@/runtime/inventory-runtime';

export function useInventoryPlatformData() {
  const platformOn = canUseInventoryRuntime();
  const [catalog, setCatalog] = useState<PlatformInventoryItem[]>([]);
  const [moves, setMoves] = useState<PlatformStockMove[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!platformOn) {
      setCatalog([]);
      setMoves([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [items, stockMoves] = await Promise.all([
        platformListInventoryCatalog(),
        platformListInventoryMoves(),
      ]);
      setCatalog(items);
      setMoves(stockMoves);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [platformOn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { platformOn, catalog, moves, loading, error, refresh };
}
