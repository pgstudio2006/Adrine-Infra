import { platformHeaders } from './platform-session';

export class PlatformApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'PlatformApiError';
  }
}

/** Human-readable message from a failed platform request (NestJS often nests message). */
export function formatPlatformErrorBody(body: unknown): string | undefined {
  if (body == null) return undefined;
  if (typeof body === 'string') return body;
  if (typeof body !== 'object') return String(body);
  const o = body as Record<string, unknown>;
  if (typeof o.message === 'string') return o.message;
  if (o.message && typeof o.message === 'object') {
    const m = o.message as Record<string, unknown>;
    if (typeof m.message === 'string') return m.message;
    if (typeof m.reason === 'string') return m.reason;
  }
  if (typeof o.reason === 'string') return o.reason;
  const blockers = o.blockers;
  if (Array.isArray(blockers) && blockers.length > 0) {
    const lines = blockers.map((b) => {
      if (typeof b === 'string') return b;
      if (b && typeof b === 'object' && 'message' in b) {
        return String((b as { message: string }).message);
      }
      return JSON.stringify(b);
    });
    return lines.join(' · ');
  }
  return undefined;
}

export async function platformFetch<T>(
  baseUrl: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
    ...init,
    headers: {
      ...platformHeaders(),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    const msg = formatPlatformErrorBody(body) ?? res.statusText;
    throw new PlatformApiError(msg, res.status, body);
  }
  return res.json() as Promise<T>;
}
