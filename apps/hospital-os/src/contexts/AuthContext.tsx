import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, UserRole, hasAccess, ModuleKey } from '@/types/roles';
import {
  clearPlatformSession,
  getPlatformSession,
  isPlatformRuntimeEnabled,
  setPlatformSession,
} from '@/runtime/platform-session';
import { loadEffectiveModules } from '@/runtime/module-runtime';
import { loadBranchConfig } from '@/runtime/branch-config';
import { platformFetch } from '@/runtime/platform-client';
import { toast } from 'sonner';

function isProductionHospitalOs(): boolean {
  return import.meta.env.PROD === true;
}

function kernelApiConfigured(): boolean {
  const url = import.meta.env.VITE_KERNEL_API_URL as string | undefined;
  return Boolean(url?.trim());
}

interface AuthContextType {
  user: User | null;
  login: (role: UserRole, name: string, options?: { department?: string }) => void;
  logout: () => void;
  canAccess: (module: ModuleKey) => boolean;
  platformConnected: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('adrine_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [platformConnected, setPlatformConnected] = useState(!!sessionStorage.getItem('adrine_platform_session'));

  useEffect(() => {
    if (!isPlatformRuntimeEnabled()) return;
    const kernel = import.meta.env.VITE_KERNEL_API_URL as string | undefined;
    const session = getPlatformSession();
    if (!kernel || !session?.accessToken) return;

    const restore = async () => {
      try {
        const me = await platformFetch<{
          user: {
            sub: string;
            tenantId: string;
            branchId: string;
            role: string;
            name: string;
            email: string;
          };
        }>(kernel, '/auth/me');
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
        await Promise.all([loadBranchConfig(), loadEffectiveModules(me.user.branchId)]);
      } catch {
        clearPlatformSession();
        setPlatformConnected(false);
      }
    };

    void restore();
  }, []);

  const login = useCallback((role: UserRole, name: string, options?: { department?: string }) => {
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
        if (kernel) {
          try {
            const email = `${role}@adrine.local`;
            const auth = await platformFetch<{
              accessToken: string;
              user: {
                sub: string;
                tenantId: string;
                branchId: string;
                role: string;
                name: string;
                email: string;
              };
            }>(kernel, '/auth/dev-login', {
              method: 'POST',
              body: JSON.stringify({
                email,
                fullName: name,
                role,
                tenantId: import.meta.env.VITE_DEV_TENANT_ID ?? 'tenant_dev',
              }),
            });
            if (!auth.user.tenantId || !auth.user.branchId) {
              throw new Error('Kernel session missing tenant or branch scope');
            }
            newUser.id = auth.user.sub;
            setPlatformSession({
              accessToken: auth.accessToken,
              tenantId: auth.user.tenantId,
              branchId: auth.user.branchId,
              userId: auth.user.sub,
              email: auth.user.email,
              name: auth.user.name,
              role: auth.user.role,
            });
            setPlatformConnected(true);
            await Promise.all([
              loadBranchConfig(),
              loadEffectiveModules(auth.user.branchId),
            ]);
            if (isProductionHospitalOs()) {
              toast.message('Platform session active', {
                description: `Branch ${auth.user.branchId} · tenant ${auth.user.tenantId}. Use OIDC when VITE_OIDC_ISSUER is configured.`,
              });
            }
          } catch (err) {
            setPlatformConnected(false);
            toast.error('Platform login failed', {
              description: err instanceof Error ? err.message : 'Check kernel-api and CORS.',
            });
            if (isProductionHospitalOs()) {
              return;
            }
          }
        } else if (!kernelApiConfigured()) {
          toast.warning('Running without kernel session', {
            description:
              'VITE_PLATFORM_RUNTIME is on but VITE_KERNEL_API_URL is unset — APIs use dev tenant headers only.',
          });
        }
      }

      setUser(newUser);
      localStorage.setItem('adrine_user', JSON.stringify(newUser));
    };

    void run();
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('adrine_user');
    clearPlatformSession();
    setPlatformConnected(false);
  }, []);

  const canAccess = useCallback(
    (module: ModuleKey) => {
      if (!user) return false;
      return hasAccess(user.role, module);
    },
    [user],
  );

  return (
    <AuthContext.Provider value={{ user, login, logout, canAccess, platformConnected }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
