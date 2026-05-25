export type PlatformSession = {
  accessToken: string;
  tenantId: string;
  branchId: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  patientId?: string;
};

const SESSION_KEY = 'adrine_platform_session';

export function isPlatformRuntimeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PLATFORM_RUNTIME === 'true';
}

export function getPlatformSession(): PlatformSession | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PlatformSession;
  } catch {
    return null;
  }
}

export function setPlatformSession(session: PlatformSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearPlatformSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function platformHeaders(): Record<string, string> {
  const session = getPlatformSession();
  const tenantId =
    session?.tenantId ?? process.env.NEXT_PUBLIC_DEV_TENANT_ID ?? 'tenant_dev';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-tenant-id': tenantId,
  };
  if (session?.branchId) headers['x-branch-id'] = session.branchId;
  if (session?.accessToken) headers.Authorization = `Bearer ${session.accessToken}`;
  if (session?.role) headers['x-actor-role'] = session.role;
  if (session?.userId) headers['x-actor-id'] = session.userId;
  return headers;
}
