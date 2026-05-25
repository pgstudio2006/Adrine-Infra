import { PlatformConnectivityStrip } from '@/components/PlatformConnectivityStrip';
import { useInventoryPlatformData } from '@/hooks/useInventoryPlatformData';

export function InventoryPlatformStrip({ label = 'Inventory' }: { label?: string }) {
  const { platformOn, catalog, moves, loading } = useInventoryPlatformData();
  return (
    <PlatformConnectivityStrip
      label={label}
      detail={
        platformOn
          ? loading
            ? 'Loading from domain-api…'
            : `${catalog.length} SKU(s), ${moves.length} stock move(s) on platform`
          : 'Demo data — enable platform runtime for live inventory'
      }
    />
  );
}
