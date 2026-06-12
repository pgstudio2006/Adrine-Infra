import { useLocation } from 'react-router-dom';
import TopNavbar from './TopNavbar';
import RoutePreviewBanner from './RoutePreviewBanner';
import LifecycleRouteGuardBanner from './LifecycleRouteGuardBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useTenantSettings } from '@/hooks/useTenantSettings';
import { canAccessRoute } from '@/config/routeAccess';
import { getPlatformSession } from '@/runtime/platform-session';
import { ModuleAccessDenied } from '@/components/auth/ModuleAccessDenied';
import { isAdrine2026Experience } from '@/lib/adrine/experience';
import AdrineTopShell from '@/components/shell/AdrineTopShell';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { settings } = useTenantSettings();
  const session = getPlatformSession();

  if (isAdrine2026Experience()) {
    return <AdrineTopShell>{children}</AdrineTopShell>;
  }

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
      <main className="flex-1 p-6 max-w-[1440px] mx-auto w-full">
        <LifecycleRouteGuardBanner />
        <RoutePreviewBanner />
        {blocked ? <ModuleAccessDenied reason="role" /> : children}
      </main>
    </div>
  );
}
