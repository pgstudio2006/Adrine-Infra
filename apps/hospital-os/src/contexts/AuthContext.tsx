import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, UserRole, hasAccess, ModuleKey } from '@/types/roles';
import {
  clearPlatformSession,
  getPlatformSession,
  isPlatformRuntimeEnabled,
  setPlatformSession,
} from '@/runtime/platform-session';
import { loadEffectiveModules } from '@/runtime/module-runtime';
import { getServerTenantSettings, loadBranchConfig } from '@/runtime/branch-config';
import { platformFetch } from '@/runtime/platform-client';
import { coerceTenantSettings } from '@/config/tenantSettings';
import { roleCanAccessModule } from '@engines/packs';
import { toast } from 'sonner';

function isProductionHospitalOs(): boolean {
  return import.meta.env.PROD === true;
}

function kernelApiConfigured(): boolean {
  const url = import.meta.env.VITE_KERNEL_API_URL as string | undefined;
  return Boolean(url?.trim());
}

type AuthUserPayload = {
  sub: string;
  tenantId: string;
  branchId: string;
  role: string;
  name: string;
  email: string;
  department?: string;
};

interface AuthContextType {
  user: User | null;
  login: (role: UserRole, name: string, options?: { department?: string }) => void;
  loginWithCredentials: (
    email: string,
    password: string,
    options?: { branchId?: string },
  ) => Promise<boolean>;
  logout: () => void;
  canAccess: (module: ModuleKey) => boolean;
  platformConnected: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function applyPlatformAuth(auth: { accessToken: string; user: AuthUserPayload }) {
  if (!auth.user.tenantId || !auth.user.branchId) {
    throw new Error('Kernel session missing tenant or branch scope');
  }
  setPlatformSession({
    accessToken: auth.accessToken,
    tenantId: auth.user.tenantId,
    branchId: auth.user.branchId,
    userId: auth.user.sub,
    email: auth.user.email,
    name: auth.user.name,
    role: auth.user.role,
  });
  await Promise.all([loadBranchConfig(), loadEffectiveModules(auth.user.branchId)]);
  return auth.user;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('adrine_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [platformConnected, setPlatformConnected] = useState(!!sessionStorage.getItem('adrine_platform_session'));

  useEffect(() => {
    if (!isPlatformRuntimeEnabled()) return;

    if (isProductionHospitalOs() && !getPlatformSession()?.accessToken) {
      const stored = localStorage.getItem('adrine_user');
      if (stored) {
        localStorage.removeItem('adrine_user');
        setUser(null);
        setPlatformConnected(false);
      }
      return;
    }

    const kernel = import.meta.env.VITE_KERNEL_API_URL as string | undefined;
    const session = getPlatformSession();
    if (!kernel || !session?.accessToken) return;

    const restore = async () => {
      try {
        const me = await platformFetch<{ user: AuthUserPayload | null }>(kernel, '/auth/me');
        if (!me.user) {
          clearPlatformSession();
          setPlatformConnected(false);
          return;
        }
        setPlatformSession({
          accessToken: session.accessToken,
          tenantId: me.user.tenantId,
          branchId: me.user.branchId,
          userId: me.user.sub,
          email: me.user.email,
          name: me.user.name,
          role: me.user.role,
        });
        setPlatformConnected(true);
        setUser((prev) =>
          prev
            ? {
                ...prev,
                id: me.user!.sub,
                name: me.user!.name,
                role: me.user!.role as UserRole,
                department: me.user!.department,
              }
            : prev,
        );
        await Promise.all([loadBranchConfig(), loadEffectiveModules(me.user.branchId)]);
      } catch {
        clearPlatformSession();
        setPlatformConnected(false);
      }
    };

    void restore();
  }, []);

  const persistUser = useCallback((newUser: User) => {
    setUser(newUser);
    localStorage.setItem('adrine_user', JSON.stringify(newUser));
  }, []);

  const loginWithCredentials = useCallback(
    async (email: string, password: string, options?: { branchId?: string }) => {
      const kernel = import.meta.env.VITE_KERNEL_API_URL as string | undefined;
      if (!kernel) {
        toast.error('Platform auth not configured', {
          description: 'Set VITE_KERNEL_API_URL for password login.',
        });
        return false;
      }

      try {
        const auth = await platformFetch<{
          accessToken: string;
          user: AuthUserPayload;
        }>(
          kernel,
          '/auth/login',
          {
            method: 'POST',
            body: JSON.stringify({
              email: email.trim(),
              password,
              tenantId: import.meta.env.VITE_DEV_TENANT_ID ?? 'tenant_navayu',
              branchId: options?.branchId,
            }),
          },
          { unauthenticated: true },
        );

        const profile = await applyPlatformAuth(auth);
        setPlatformConnected(true);

        persistUser({
          id: profile.sub,
          name: profile.name,
          role: profile.role as UserRole,
          department: profile.department,
        });

        toast.success('Signed in', {
          description: `${profile.name} · ${profile.role}`,
        });
        return true;
      } catch (err) {
        setPlatformConnected(false);
        toast.error('Login failed', {
          description: err instanceof Error ? err.message : 'Check email, password, and branch.',
        });
        return false;
      }
    },
    [persistUser],
  );

  const login = useCallback(
    (role: UserRole, name: string, options?: { department?: string }) => {
      const run = async () => {
        const newUser: User = {
          id: crypto.randomUUID(),
          name,
          role,
          department: options?.department,
        };

        if (isPlatformRuntimeEnabled()) {
          const kernel = import.meta.env.VITE_KERNEL_API_URL as string | undefined;
          if (isProductionHospitalOs() && !kernel) {
            toast.error('Platform auth not configured', {
              description:
                'Set VITE_KERNEL_API_URL (and OIDC when available). Mock-only login is disabled in production builds.',
            });
            return;
          }
          if (kernel && !isProductionHospitalOs()) {
            try {
              const email = `${role}@adrine.local`;
              const auth = await platformFetch<{
                accessToken: string;
                user: AuthUserPayload;
              }>(
                kernel,
                '/auth/dev-login',
                {
                  method: 'POST',
                  body: JSON.stringify({
                    email,
                    fullName: name,
                    role,
                    tenantId: import.meta.env.VITE_DEV_TENANT_ID ?? 'tenant_dev',
                  }),
                },
                { unauthenticated: true },
              );
              const profile = await applyPlatformAuth(auth);
              newUser.id = profile.sub;
              setPlatformConnected(true);
            } catch (err) {
              setPlatformConnected(false);
              toast.error('Platform login failed', {
                description: err instanceof Error ? err.message : 'Check kernel-api and CORS.',
              });
            }
          } else if (!kernelApiConfigured()) {
            toast.warning('Running without kernel session', {
              description:
                'VITE_PLATFORM_RUNTIME is on but VITE_KERNEL_API_URL is unset — APIs use dev tenant headers only.',
            });
          }
        }

        persistUser(newUser);
      };

      void run();
    },
    [persistUser],
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('adrine_user');
    clearPlatformSession();
    setPlatformConnected(false);
  }, []);

  const canAccess = useCallback(
    (module: ModuleKey) => {
      if (!user) return false;

      const serverSettings = getServerTenantSettings();
      if (isPlatformRuntimeEnabled() && serverSettings) {
        const settings = coerceTenantSettings(serverSettings);
        const session = getPlatformSession();
        return roleCanAccessModule(settings, {
          role: user.role,
          department: user.department,
          email: session?.email,
          name: user.name,
        }, module);
      }

      return hasAccess(user.role, module);
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{ user, login, loginWithCredentials, logout, canAccess, platformConnected }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
