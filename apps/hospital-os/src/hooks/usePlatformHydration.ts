import { useCallback, useEffect, useRef, useState } from 'react';
import { isPlatformAuthoritative, fetchPlatformHydrationSnapshot } from '@/runtime/platform-store-bridge';
import { getPlatformSession } from '@/runtime/platform-session';

const HYDRATION_DEBOUNCE_MS = 800;

export type PlatformHydrationCallbacks = {
  onPatients?: (platformIds: string[]) => void;
  onSnapshot?: (snapshot: Awaited<ReturnType<typeof fetchPlatformHydrationSnapshot>>) => void;
};

/** On mount when VITE_PLATFORM_RUNTIME, fetch command snapshot and notify store hydrators. */
export function usePlatformHydration(callbacks: PlatformHydrationCallbacks) {
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;
  const ranRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const runHydration = useCallback(() => {
    if (!isPlatformAuthoritative()) {
      setError(null);
      return;
    }
    const branchId = getPlatformSession()?.branchId ?? 'branch_main';
    void (async () => {
      try {
        const snapshot = await fetchPlatformHydrationSnapshot(branchId);
        callbacksRef.current.onSnapshot?.(snapshot);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Platform hydration failed');
      }
    })();
  }, []);

  useEffect(() => {
    if (!isPlatformAuthoritative() || ranRef.current) return;
    ranRef.current = true;

    const timer = setTimeout(() => runHydration(), HYDRATION_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [runHydration]);

  return { error, retry: runHydration };
}
