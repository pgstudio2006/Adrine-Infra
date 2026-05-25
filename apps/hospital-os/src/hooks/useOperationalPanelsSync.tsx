import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { getPlatformSession } from '@/runtime/platform-session';
import {
  useOperationalEventStream,
  type RealtimeStreamHandlers,
} from '@/runtime/realtime-runtime';

type OperationalPanelsHubValue = {
  connected: boolean;
  subscribe: (handlers: RealtimeStreamHandlers) => () => void;
};

const OperationalPanelsHubContext = createContext<OperationalPanelsHubValue | null>(null);

/** Single SSE anchor for `/reception/flow` — fans snapshot/delta to all Operational* panels. */
export function OperationalPanelsHubProvider({ children }: { children: ReactNode }) {
  const listenersRef = useRef(new Set<RealtimeStreamHandlers>());
  const branchId = getPlatformSession()?.branchId;

  const { connected } = useOperationalEventStream(
    branchId,
    {
      onSnapshot: (snapshot) => {
        for (const handler of listenersRef.current) {
          handler.onSnapshot?.(snapshot);
        }
      },
      onDelta: (payload) => {
        for (const handler of listenersRef.current) {
          handler.onDelta?.(payload);
        }
      },
    },
    15_000,
  );

  const subscribe = useCallback((handlers: RealtimeStreamHandlers) => {
    listenersRef.current.add(handlers);
    return () => {
      listenersRef.current.delete(handlers);
    };
  }, []);

  const value = useMemo(() => ({ connected, subscribe }), [connected, subscribe]);

  return (
    <OperationalPanelsHubContext.Provider value={value}>{children}</OperationalPanelsHubContext.Provider>
  );
}

/** Read shared hub state (connected flag) when inside `/reception/flow`. */
export function useOperationalPanelsSync(): OperationalPanelsHubValue | null {
  return useContext(OperationalPanelsHubContext);
}

/**
 * Subscribe to operational snapshot/delta.
 * Uses the reception-flow hub when present; otherwise opens a dedicated stream (e.g. nurse discharge).
 */
export function useOperationalPanelSubscription(handlers: RealtimeStreamHandlers): void {
  const hub = useContext(OperationalPanelsHubContext);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const branchId = getPlatformSession()?.branchId;

  useEffect(() => {
    if (!hub) return undefined;
    const wrapped: RealtimeStreamHandlers = {
      onSnapshot: (snapshot) => handlersRef.current.onSnapshot?.(snapshot),
      onDelta: (payload) => handlersRef.current.onDelta?.(payload),
    };
    return hub.subscribe(wrapped);
  }, [hub]);

  useOperationalEventStream(
    hub ? undefined : branchId,
    hub
      ? {}
      : {
          onSnapshot: (snapshot) => handlersRef.current.onSnapshot?.(snapshot),
          onDelta: (payload) => handlersRef.current.onDelta?.(payload),
        },
  );
}
