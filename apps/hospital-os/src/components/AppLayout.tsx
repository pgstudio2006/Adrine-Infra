import { useLocation } from 'react-router-dom';
import TopNavbar from './TopNavbar';
import RoutePreviewBanner from './RoutePreviewBanner';
import LifecycleRouteGuardBanner from './LifecycleRouteGuardBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useTenantSettings } from '@/hooks/useTenantSettings';
import { canAccessRoute } from '@/config/routeAccess';
import { getPlatformSession } from '@/runtime/platform-session';
import { ModuleAccessDenied } from '@/components/auth/ModuleAccessDenied';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

function isConsultationWorkspace(pathname: string): boolean {
  return /\/consultation\/[^/]+/.test(pathname);
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { pathname } = useLocation();
  const consultationWorkspace = isConsultationWorkspace(pathname);
  const { user } = useAuth();
  const { settings } = useTenantSettings();
  const session = getPlatformSession();

  const blocked =
    user &&
    !canAccessRoute(pathname, settings, {
      role: user.role,
      department: user.department,
      email: session?.email,
      name: user.name,
    });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNavbar />
      <main
        className={cn(
          'flex-1 w-full',
          consultationWorkspace
            ? 'px-3 py-3 sm:px-4 lg:px-5 max-w-none'
            : 'p-6 max-w-[1440px] mx-auto',
        )}
      >
        <LifecycleRouteGuardBanner />
        <RoutePreviewBanner />
        {blocked ? <ModuleAccessDenied reason="role" /> : children}
      </main>
    </div>
  );
}
