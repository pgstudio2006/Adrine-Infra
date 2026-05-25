import { PlatformConnectivityStrip } from '@/components/PlatformConnectivityStrip';
import { useDialysisPlatformData } from '@/hooks/useDialysisPlatformData';

export function DialysisPlatformStrip({ label = 'Dialysis unit' }: { label?: string }) {
  const { platformOn, sessions, machines, loading } = useDialysisPlatformData();
  return (
    <PlatformConnectivityStrip
      label={label}
      detail={
        platformOn
          ? loading
            ? 'Loading from domain-api…'
            : `${sessions.length} session(s), ${machines.length} machine(s) on platform`
          : 'Demo data — enable platform runtime for live dialysis'
      }
    />
  );
}
