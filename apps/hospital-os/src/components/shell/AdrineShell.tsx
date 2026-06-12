import { ReactNode, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTenantSettings } from '@/hooks/useTenantSettings';
import { getHeaderBrandMark } from '@/config/tenantSettings';
import { canAccessRoute } from '@/config/routeAccess';
import { getPlatformSession } from '@/runtime/platform-session';
import { ModuleAccessDenied } from '@/components/auth/ModuleAccessDenied';
import { useOperationalRouteGuard } from '@/hooks/useOperationalRouteGuard';
import { cn } from '@/lib/utils';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Search,
  Sparkles,
  PanelLeft,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AdrineShellProps {
  children: ReactNode;
}

export default function AdrineShell({ children }: AdrineShellProps) {
  const { user, logout } = useAuth();
  const { settings, getRoleLabel, getTabsForRole } = useTenantSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const { guardedNavigate } = useOperationalRouteGuard();
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState('');

  const session = getPlatformSession();
  const tabs = getTabsForRole(user?.role ?? 'admin', {
    department: user?.department,
    name: user?.name,
  }) ?? [];

  const blocked =
    user &&
    !canAccessRoute(location.pathname, settings, {
      role: user.role,
      department: user.department,
      email: session?.email,
      name: user.name,
    });

  const filteredTabs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tabs;
    return tabs.filter((t) => t.label.toLowerCase().includes(q));
  }, [tabs, query]);

  const initials = user?.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#fafaf8] text-foreground flex">
      <aside
        className={cn(
          'sticky top-0 h-screen border-r border-border/80 bg-white flex flex-col transition-all duration-300 z-30',
          collapsed ? 'w-[72px]' : 'w-[260px]',
        )}
      >
        <div className="h-14 px-4 flex items-center justify-between border-b border-border/60">
          {!collapsed && (
            <div>
              <p className="text-sm font-bold tracking-tight">{getHeaderBrandMark(settings)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                {getRoleLabel(user.role)}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </Button>
        </div>

        {!collapsed && (
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search modules…"
                className="h-9 pl-8 text-xs bg-muted/40 border-transparent"
              />
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
          {filteredTabs.map((tab) => {
            const active =
              location.pathname === tab.path ||
              (tab.path !== '/' && location.pathname.startsWith(`${tab.path}/`));
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => guardedNavigate(tab.path)}
                className={cn(
                  'w-full text-left rounded-md px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-foreground text-background font-medium'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  collapsed && 'px-2 text-center text-[10px] leading-tight py-2.5',
                )}
                title={collapsed ? tab.label : undefined}
              >
                {collapsed ? tab.label.split(' ')[0] : tab.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border/60 space-y-2">
          {!collapsed && (
            <div className="flex items-center gap-2 px-2">
              <div className="h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{user.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.department ?? 'Hospital OS'}</p>
              </div>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className={cn('w-full gap-2', collapsed && 'px-0')}
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            <LogOut className="h-3.5 w-3.5" />
            {!collapsed && 'Sign out'}
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border/60 bg-white/80 backdrop-blur-md sticky top-0 z-20 px-4 md:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="outline" className="text-[10px] font-normal hidden sm:inline-flex">
              AI-native Hospital OS · 2026
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 hidden md:inline-flex">
              <Sparkles className="h-3.5 w-3.5" />
              AI Assist
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {blocked ? <ModuleAccessDenied reason="role" /> : children}
        </main>
      </div>
    </div>
  );
}
