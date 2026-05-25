'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { devLogin, resolvePatientId } from '../lib/patient-api';
import {
  clearPlatformSession,
  getPlatformSession,
  isPlatformRuntimeEnabled,
  setPlatformSession,
  type PlatformSession,
} from '../runtime/platform-session';

type AuthContextType = {
  session: PlatformSession | null;
  patientId: string | null;
  platformConnected: boolean;
  loading: boolean;
  login: (fullName: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<PlatformSession | null>(null);
  const [platformConnected, setPlatformConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getPlatformSession();
    if (stored) {
      setSession(stored);
      setPlatformConnected(isPlatformRuntimeEnabled());
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (fullName: string) => {
    if (!isPlatformRuntimeEnabled()) {
      const local: PlatformSession = {
        accessToken: 'local',
        tenantId: process.env.NEXT_PUBLIC_DEV_TENANT_ID ?? 'tenant_dev',
        branchId: 'branch_main',
        userId: crypto.randomUUID(),
        email: 'patient@local.dev',
        name: fullName,
        role: 'patient',
        patientId: process.env.NEXT_PUBLIC_DEV_PATIENT_ID,
      };
      setPlatformSession(local);
      setSession(local);
      setPlatformConnected(false);
      return;
    }

    const auth = await devLogin(fullName);
    const patientId = await resolvePatientId(fullName);
    const next: PlatformSession = {
      accessToken: auth.accessToken,
      tenantId: auth.user.tenantId,
      branchId: auth.user.branchId,
      userId: auth.user.sub,
      email: auth.user.email,
      name: auth.user.name,
      role: auth.user.role,
      patientId,
    };
    setPlatformSession(next);
    setSession(next);
    setPlatformConnected(true);
  }, []);

  const logout = useCallback(() => {
    clearPlatformSession();
    setSession(null);
    setPlatformConnected(false);
  }, []);

  const value = useMemo(
    () => ({
      session,
      patientId: session?.patientId ?? null,
      platformConnected,
      loading,
      login,
      logout,
    }),
    [session, platformConnected, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
