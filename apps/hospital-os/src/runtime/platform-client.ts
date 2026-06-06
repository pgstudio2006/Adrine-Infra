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

export type PlatformFetchOptions = {
  /** Login / dev-login — do not require an existing platform session. */
  unauthenticated?: boolean;
  /** Skip client backoff gate (queue board, active patient context). */
  critical?: boolean;
};

// ── Request deduplication + backoff ──────────────────────────────────────────
// Prevents ERR_INSUFFICIENT_RESOURCES storms when multiple components
// independently poll the same endpoints on the same domain.

/** In-flight request cache: keyed by `method url`, value = the shared Promise. */
const inflight = new Map<string, Promise<unknown>>();

/** Per-URL failure count for exponential backoff (resets on success). */
const failCounts = new Map<string, number>();
/** Per-URL cooldown expiry timestamp (ms). While active the URL is skipped. */
const cooldowns = new Map<string, number>();

const MAX_BACKOFF_MS = 30_000;
const MAX_COOLDOWN_ENTRIES = 200;

function backoffDelay(url: string): number {
  const n = failCounts.get(url) ?? 0;
  // exponential: 500ms, 1s, 2s, 4s … capped at 30s, with ±30% jitter
  const base = Math.min(500 * 2 ** n, MAX_BACKOFF_MS);
  const jitter = base * 0.3 * (Math.random() * 2 - 1);
  return Math.max(200, Math.round(base + jitter));
}

function recordSuccess(url: string) {
  failCounts.delete(url);
  cooldowns.delete(url);
}

function recordFailure(url: string) {
  const n = (failCounts.get(url) ?? 0) + 1;
  failCounts.set(url, n);
  cooldowns.set(url, Date.now() + backoffDelay(url));
  // Evict oldest entries to prevent unbounded memory growth
  if (cooldowns.size > MAX_COOLDOWN_ENTRIES) {
    const now = Date.now();
    for (const [k, expiry] of cooldowns) {
      if (expiry <= now) {
        cooldowns.delete(k);
        failCounts.delete(k);
      }
    }
  }
}

/** Build the dedup key: `METHOD normalizedUrl` (query-param order normalised). */
function dedupKey(method: string, fullUrl: string): string {
  return `${method} ${fullUrl}`;
}

// ── Core fetch wrapper ──────────────────────────────────────────────────────

export async function platformFetch<T>(
  baseUrl: string,
  path: string,
  init?: RequestInit,
  options?: PlatformFetchOptions,
): Promise<T> {
  const tenantId =
    (import.meta.env.VITE_DEV_TENANT_ID as string | undefined)?.trim() || 'tenant_navayu';
  const authHeaders = options?.unauthenticated
    ? { 'Content-Type': 'application/json', 'x-tenant-id': tenantId }
    : platformHeaders();

  const method = (init?.method ?? 'GET').toUpperCase();
  const fullUrl = `${baseUrl.replace(/\/$/, '')}${path}`;
  const key = dedupKey(method, fullUrl);

  // ── Backoff gate (GET only): skip if URL is in cooldown after consecutive failures ─
  const canDedup = method === 'GET' && !options?.critical;
  if (method === 'GET' && !options?.critical) {
    const cooldownExpiry = cooldowns.get(key);
    if (cooldownExpiry && Date.now() < cooldownExpiry) {
      // status 0 = client-side throttle, not a real HTTP error
      throw new PlatformApiError('Rate-limited by client backoff', 0);
    }
  }

  // ── Dedup GET only: if an identical request is already in-flight, return it ─
  if (canDedup) {
    const existing = inflight.get(key);
    if (existing) {
      return existing as Promise<T>;
    }
  }

  const promise = (async () => {
    try {
      const res = await fetch(fullUrl, {
        ...init,
        headers: {
          ...authHeaders,
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
        if (canDedup) recordFailure(key);
        throw new PlatformApiError(msg, res.status, body);
      }
      if (canDedup) recordSuccess(key);
      return (await res.json()) as T;
    } catch (err) {
      if (canDedup && !(err instanceof PlatformApiError && err.status === 0)) {
        recordFailure(key);
      }
      throw err;
    }
  })();

  if (canDedup) {
    inflight.set(key, promise);
  }
  try {
    return await promise;
  } finally {
    if (canDedup) {
      inflight.delete(key);
    }
  }
}
