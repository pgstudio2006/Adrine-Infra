import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ModuleKey } from '@/types/roles';
import ModuleEntitlementGate from '@/components/ModuleEntitlementGate';
import { ModuleAccessDenied } from '@/components/auth/ModuleAccessDenied';

interface ProtectedRouteProps {
  children: React.ReactNode;
  module?: ModuleKey;
}

export default function ProtectedRoute({ children, module }: ProtectedRouteProps) {
  const { user, canAccess } = useAuth();

  if (!user) return <Navigate to="/" replace />;
  if (module && !canAccess(module)) {
    return <ModuleAccessDenied reason="role" />;
  }

  return <ModuleEntitlementGate module={module}>{children}</ModuleEntitlementGate>;
}
