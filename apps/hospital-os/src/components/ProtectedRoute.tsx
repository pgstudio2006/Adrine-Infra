import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ModuleKey } from '@/types/roles';
import ModuleEntitlementGate from '@/components/ModuleEntitlementGate';
import { ModuleAccessDenied } from '@/components/auth/ModuleAccessDenied';
import { useTenantSettings } from '@/hooks/useTenantSettings';
import { canAccessRoute } from '@/config/routeAccess';
import { getPlatformSession, isPlatformRuntimeEnabled } from '@/runtime/platform-session';

interface ProtectedRouteProps {
  children: React.ReactNode;
  module?: ModuleKey;
}

export default function ProtectedRoute({ children, module }: ProtectedRouteProps) {
  const { user, canAccess } = useAuth();
  const { pathname } = useLocation();
  const { settings } = useTenantSettings();
  const session = getPlatformSession();

  if (!user) return <Navigate to="/" replace />;

  const packDenied =
    isPlatformRuntimeEnabled() &&
    session?.accessToken &&
    !canAccessRoute(pathname, settings, {
      role: user.role,
      department: user.department,
      email: session.email,
      name: user.name,
    });

  if (packDenied || (module && !canAccess(module))) {
    return <ModuleAccessDenied reason="role" />;
  }

  return <ModuleEntitlementGate module={module}>{children}</ModuleEntitlementGate>;
}
