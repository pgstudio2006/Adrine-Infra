import { PlatformConnectivityStrip } from '@/components/PlatformConnectivityStrip';
import { useOtPlatformData } from '@/hooks/useOtPlatformData';

export function OtPlatformStrip({ label = 'OT operations' }: { label?: string }) {
  const { platformOn, cases, rooms, loading } = useOtPlatformData();
  return (
    <PlatformConnectivityStrip
      label={label}
      detail={
        platformOn
          ? loading
            ? 'Loading from domain-api…'
            : `${cases.length} case(s), ${rooms.length} room(s) on platform`
          : 'Demo data — enable platform runtime for live OT'
      }
    />
  );
}
