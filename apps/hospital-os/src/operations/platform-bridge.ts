import type { PlatformEventName } from '@adrine/hospital-operations';
import { platformHeaders } from '@/runtime/platform-session';
import { platformRecordMetering } from '@/runtime/opd-runtime';

export type PlatformEmitPayload = {
  event: PlatformEventName | string;
  tenantId?: string;
  branchId?: string;
  actorId?: string;
  uhid?: string;
  refId?: string;
  module: string;
  details: Record<string, unknown>;
};

/**
 * Emits operational events toward Adrine infra (domain-api / NATS outbox).
 * Today: structured console + optional POST when VITE_DOMAIN_API_URL is set.
 */
export async function emitPlatformEvent(payload: PlatformEmitPayload): Promise<void> {
  const envelope = {
    type: 'adrine.platform.event',
    occurredAt: new Date().toISOString(),
    ...payload,
  };

  if (import.meta.env.DEV) {
    console.info('[Adrine Platform Event]', envelope);
  }

  const base = import.meta.env.VITE_DOMAIN_API_URL as string | undefined;
  if (!base) return;

  try {
    await fetch(`${base}/internal/events`, {
      method: 'POST',
      headers: platformHeaders(),
      body: JSON.stringify({
        event: payload.event,
        actorId: payload.actorId,
        module: payload.module,
        uhid: payload.uhid,
        refId: payload.refId,
        details: payload.details,
        occurredAt: envelope.occurredAt,
      }),
    });

    const metric = `opd.event.${String(payload.event).split('.').slice(-2).join('_')}`;
    void platformRecordMetering([metric], payload.refId);
  } catch {
    // Endpoint lands with domain-api; swallow until route exists.
  }
}
