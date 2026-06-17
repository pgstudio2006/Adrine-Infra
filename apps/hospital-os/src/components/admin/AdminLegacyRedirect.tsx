import { Navigate } from 'react-router-dom';
import { isNavayuTenant } from '@/lib/navayu/navayu-forms';

const NAVAYU_LEGACY_REDIRECTS: Record<string, string> = {
  '/admin/command-center': '/admin',
  '/admin/morning-briefing': '/admin',
  '/admin/ai-workflow': '/admin',
  '/admin/revenue-cycle': '/admin/finance-hub',
  '/admin/audit': '/admin',
  '/admin/crm': '/crm',
  '/admin/staff': '/hr/staff',
  '/admin/expenses': '/admin/finance-hub',
  '/admin/approvals': '/admin/finance-hub',
};

export function navayuOrLegacy<T extends Record<string, unknown>>(
  LegacyComponent: React.ComponentType<T>,
  redirectTo: string,
) {
  return function NavayuOrLegacyPage(props: T) {
    if (isNavayuTenant()) {
      return <Navigate to={redirectTo} replace />;
    }
    return <LegacyComponent {...props} />;
  };
}

export default function AdminLegacyRedirect() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/admin';
  if (!isNavayuTenant()) {
    return <Navigate to="/admin" replace />;
  }
  const target = NAVAYU_LEGACY_REDIRECTS[path] ?? '/admin';
  return <Navigate to={target} replace />;
}
