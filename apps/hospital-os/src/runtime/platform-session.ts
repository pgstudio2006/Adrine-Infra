export type PlatformSession = {
  accessToken: string;
  tenantId: string;
  branchId: string;
  userId: string;
  email: string;
  name: string;
  role: string;
};

const STORAGE_KEY = 'adrine_platform_session';

export function isPlatformRuntimeEnabled(): boolean {
  return import.meta.env.VITE_PLATFORM_RUNTIME === 'true';
}

export function getPlatformSession(): PlatformSession | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PlatformSession;
  } catch {
    return null;
  }
}

export function setPlatformSession(session: PlatformSession): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearPlatformSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function platformHeaders(): Record<string, string> {
  const session = getPlatformSession();
  const runtimeOn = isPlatformRuntimeEnabled();
  const production = import.meta.env.PROD === true;

  if (runtimeOn && production && !session?.accessToken) {
    throw new Error(
      'Platform session required in production. Sign in with email and password (kernel /auth/login) or configure OIDC (see ops/PRODUCTION_AUTH.md).',
    );
  }

  const tenantId =
    session?.tenantId ?? (import.meta.env.VITE_DEV_TENANT_ID as string) ?? 'tenant_dev';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-tenant-id': tenantId,
  };
  if (session?.branchId) {
    headers['x-branch-id'] = session.branchId;
  } else if (runtimeOn && production) {
    throw new Error('Branch context required for platform API calls in production.');
  }
  if (session?.accessToken) headers.Authorization = `Bearer ${session.accessToken}`;
  if (session?.role) headers['x-actor-role'] = session.role;
  if (session?.userId) headers['x-actor-id'] = session.userId;
  return headers;
}
