import { useCallback, useEffect, useRef, useState } from 'react';
import { getPlatformSession, isPlatformRuntimeEnabled, platformHeaders } from './platform-session';
import type { OperationalSnapshot } from '@adrine/hospital-operations';

function domainBase(): string | undefined {
  return import.meta.env.VITE_DOMAIN_API_URL as string | undefined;
}

/**
 * Domain SSE sends two shapes over the `delta` event:
 * - **Direct transitions** (e.g. radiology): `{ type: 'radiology.transition', opdVisitId, … }`
 * - **Platform audit fan-out** (`PlatformEventService.record`): `{ type: 'platform.event', eventName, resourceType, resourceId, opdVisitId?, admissionId? }`
 *
 * Operational panels historically filtered on the former; map `platform.event` into the
 * same discriminant `type` + id fields so subscribers do not miss updates.
 */
export function normalizeOperationalDelta(raw: Record<string, unknown>): Record<string, unknown> {
  if (raw.type !== 'platform.event') {
    return raw;
  }
  const eventName = String(raw.eventName ?? '');
  const resourceType = String(raw.resourceType ?? '');
  const resourceId = typeof raw.resourceId === 'string' ? raw.resourceId : undefined;
  const opdVisitId = typeof raw.opdVisitId === 'string' ? raw.opdVisitId : undefined;
  const admissionFromPayload = typeof raw.admissionId === 'string' ? raw.admissionId : undefined;

  if (eventName.includes('adrine.lab.') || resourceType === 'lab_order') {
    return { ...raw, type: 'lab.transition', opdVisitId };
  }
  if (eventName.includes('adrine.pharmacy.') || resourceType === 'pharmacy_fulfillment') {
    return { ...raw, type: 'pharmacy.transition', opdVisitId };
  }
  if (eventName.includes('adrine.radiology.') || resourceType === 'radiology_order') {
    return { ...raw, type: 'radiology.transition', opdVisitId };
  }
  if (eventName.includes('adrine.billing.') || resourceType === 'invoice') {
    return { ...raw, type: 'billing.transition', opdVisitId };
  }
  if (eventName.includes('adrine.ipd.') || resourceType === 'ipd_admission') {
    const admissionId = admissionFromPayload ?? resourceId;
    return { ...raw, type: 'ipd.transition', admissionId };
  }
  if (eventName.includes('adrine.discharge.') || resourceType === 'discharge_orchestration') {
    const admissionId = admissionFromPayload;
    return { ...raw, type: 'discharge.transition', admissionId };
  }
  if (eventName.includes('adrine.emergency.') || resourceType === 'emergency_case') {
    return { ...raw, type: 'emergency.transition', opdVisitId };
  }
  if (eventName.includes('adrine.opd.') || resourceType === 'opd_visit') {
    return { ...raw, type: 'opd.transition', opdVisitId };
  }
  if (
    eventName.includes('adrine.appointment.') ||
    eventName.includes('adrine.public_booking.') ||
    resourceType === 'appointment'
  ) {
    return { ...raw, type: 'scheduling.transition' };
  }
  return raw;
}

export type RealtimeStreamHandlers = {
  onSnapshot?: (snapshot: OperationalSnapshot) => void;
  onDelta?: (payload: Record<string, unknown>) => void;
};

type BranchStream = {
  handlers: Set<RealtimeStreamHandlers>;
  es: EventSource | null;
  pollTimer: ReturnType<typeof setInterval> | null;
  connectTimeout: ReturnType<typeof setTimeout> | null;
  cancelled: boolean;
  sawOpen: boolean;
  connected: boolean;
  connectedListeners: Set<(connected: boolean) => void>;
  fallbackPollMs: number;
};

const branchStreams = new Map<string, BranchStream>();

function notifyConnected(stream: BranchStream, connected: boolean) {
  if (stream.connected === connected) return;
  stream.connected = connected;
  for (const listener of stream.connectedListeners) {
    listener(connected);
  }
}

function fanOutSnapshot(stream: BranchStream, snapshot: OperationalSnapshot) {
  for (const handler of stream.handlers) {
    handler.onSnapshot?.(snapshot);
  }
}

function fanOutDelta(stream: BranchStream, payload: Record<string, unknown>) {
  const normalized = normalizeOperationalDelta(payload);
  for (const handler of stream.handlers) {
    handler.onDelta?.(normalized);
  }
}

async function pollBranchSnapshot(branchId: string, stream: BranchStream) {
  if (!domainBase() || !getPlatformSession()) return;
  try {
    const res = await fetch(
      `${domainBase()}/command/center/snapshot?branchId=${encodeURIComponent(branchId)}&lite=true`,
      { headers: platformHeaders() },
    );
    if (res.ok) {
      fanOutSnapshot(stream, (await res.json()) as OperationalSnapshot);
    }
  } catch {
    /* ignore */
  }
}

function startPoll(branchId: string, stream: BranchStream) {
  if (stream.pollTimer) return;
  void pollBranchSnapshot(branchId, stream);
  stream.pollTimer = setInterval(() => void pollBranchSnapshot(branchId, stream), stream.fallbackPollMs);
}

function stopPoll(stream: BranchStream) {
  if (!stream.pollTimer) return;
  clearInterval(stream.pollTimer);
  stream.pollTimer = null;
}

function teardownBranchStream(branchId: string, stream: BranchStream) {
  stream.cancelled = true;
  if (stream.connectTimeout) clearTimeout(stream.connectTimeout);
  stream.es?.close();
  stopPoll(stream);
  branchStreams.delete(branchId);
  notifyConnected(stream, false);
}

function createBranchStream(fallbackPollMs: number): BranchStream {
  return {
    handlers: new Set(),
    es: null,
    pollTimer: null,
    connectTimeout: null,
    cancelled: false,
    sawOpen: false,
    connected: false,
    connectedListeners: new Set(),
    fallbackPollMs,
  };
}

function connectBranchStream(branchId: string, stream: BranchStream) {
  if (stream.es || stream.cancelled || !isPlatformRuntimeEnabled() || !domainBase()) {
    return;
  }

  const startPollFallback = () => {
    if (!stream.cancelled) startPoll(branchId, stream);
  };

  try {
    const url = `${domainBase()}/realtime/stream?branchId=${encodeURIComponent(branchId)}`;
    const es = new EventSource(url);
    stream.es = es;

    es.addEventListener('open', () => {
      if (stream.cancelled) return;
      stream.sawOpen = true;
      notifyConnected(stream, true);
      stopPoll(stream);
    });

    es.addEventListener('snapshot', (ev) => {
      try {
        fanOutSnapshot(stream, JSON.parse((ev as MessageEvent).data) as OperationalSnapshot);
      } catch {
        /* ignore */
      }
    });

    es.addEventListener('delta', (ev) => {
      try {
        fanOutDelta(stream, JSON.parse((ev as MessageEvent).data) as Record<string, unknown>);
      } catch {
        /* ignore */
      }
    });

    es.onerror = () => {
      notifyConnected(stream, false);
      es.close();
      stream.es = null;
      startPollFallback();
    };
  } catch {
    startPollFallback();
  }

  stream.connectTimeout = setTimeout(() => {
    if (!stream.sawOpen && !stream.cancelled) startPollFallback();
  }, 5_000);
}

function subscribeBranchStream(
  branchId: string,
  handlers: RealtimeStreamHandlers,
  fallbackPollMs: number,
): () => void {
  let stream = branchStreams.get(branchId);
  if (!stream) {
    stream = createBranchStream(fallbackPollMs);
    branchStreams.set(branchId, stream);
  } else {
    stream.fallbackPollMs = Math.min(stream.fallbackPollMs, fallbackPollMs);
  }

  const firstSubscriber = stream.handlers.size === 0;
  stream.handlers.add(handlers);
  if (firstSubscriber) {
    connectBranchStream(branchId, stream);
  }

  return () => {
    stream!.handlers.delete(handlers);
    if (stream!.handlers.size === 0) {
      teardownBranchStream(branchId, stream!);
    }
  };
}

/** SSE hook with fallback poll when stream unavailable — one connection per branch. */
export function useOperationalEventStream(
  branchId: string | undefined,
  handlers: RealtimeStreamHandlers,
  fallbackPollMs = 15_000,
) {
  const [connected, setConnected] = useState(false);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const stableHandlers = useCallback(
    (): RealtimeStreamHandlers => ({
      onSnapshot: (snapshot) => handlersRef.current.onSnapshot?.(snapshot),
      onDelta: (payload) => handlersRef.current.onDelta?.(payload),
    }),
    [],
  );

  useEffect(() => {
    if (!isPlatformRuntimeEnabled() || !domainBase() || !branchId) {
      setConnected(false);
      return undefined;
    }

    const onConnected = (value: boolean) => setConnected(value);
    const unsubscribe = subscribeBranchStream(branchId, stableHandlers(), fallbackPollMs);
    const stream = branchStreams.get(branchId);
    stream?.connectedListeners.add(onConnected);
    if (stream) setConnected(stream.connected);

    return () => {
      stream?.connectedListeners.delete(onConnected);
      unsubscribe();
      setConnected(false);
    };
  }, [branchId, fallbackPollMs, stableHandlers]);

  return { connected };
}
