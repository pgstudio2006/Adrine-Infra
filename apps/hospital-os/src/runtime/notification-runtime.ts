import { platformFetch } from './platform-client';
import { getPlatformSession, isPlatformRuntimeEnabled } from './platform-session';

function domainBase(): string | undefined {
  return import.meta.env.VITE_DOMAIN_API_URL as string | undefined;
}

export function canUseNotificationRuntime(): boolean {
  return isPlatformRuntimeEnabled() && !!domainBase() && !!getPlatformSession();
}

export async function platformListNotificationOutbox(status?: string) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return platformFetch<unknown[]>(domainBase()!, `/notifications/outbox${qs}`);
}

export async function platformSendNotification(body: {
  channel: string;
  recipient: string;
  templateCode?: string;
  payload?: Record<string, unknown>;
}) {
  return platformFetch(domainBase()!, '/notifications/send', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
