/**
 * AdrineTopShell — 2026 global shell.
 *
 * Pattern (per product constraint): TOP navigation, two tiers —
 *   Tier 1: brand · role · command trigger · AI · theme · notifications · user
 *   Tier 2: contextual module tabs for the active role (scrollable, underline)
 *
 * No left sidebar. Data-dense modules get their density from DenseTable +
 * SectionPanel, not from chrome.
 *
 * Served only when isAdrine2026Experience(); Navayu keeps legacy TopNavbar.
 */
import { ReactNode, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Command as CommandIcon, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenantSettings } from '@/hooks/useTenantSettings';
import { getHeaderBrandMark } from '@/config/tenantSettings';
import { ROLE_BASE_PATH } from '@/config/roleNavigation';
import { canAccessRoute } from '@/config/routeAccess';
import { getPlatformSession } from '@/runtime/platform-session';
import { ModuleAccessDenied } from '@/components/auth/ModuleAccessDenied';
import { useOperationalRouteGuard } from '@/hooks/useOperationalRouteGuard';
import LifecycleRouteGuardBanner from '@/components/LifecycleRouteGuardBanner';
import { CommandPalette } from '@/components/adrine/command-palette';
import { ThemeToggle } from '@/components/adrine/theme-toggle';
import { cn } from '@/lib/utils';

const NOTIFICATIONS = [
  { id: 1, title: 'Critical lab value', message: 'K+ 6.2 — patient UH-10234, acknowledged required', time: '2m', unread: true },
  { id: 2, title: 'ICU bed request', message: 'ER case #E-118 awaiting ICU allocation', time: '9m', unread: true },
  { id: 3, title: 'Pharmacy stock', message: 'Inj. Piperacillin below reorder level', time: '41m', unread: false },
  { id: 4, title: 'OT schedule', message: 'Tomorrow 08:00 TKR — implant confirmation pending', time: '1h', unread: false },
];

export default function AdrineTopShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { settings, getRoleLabel, getTabsForRole } = useTenantSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const { guardedNavigate } = useOperationalRouteGuard();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const session = getPlatformSession();
  const tabs = user
    ? (getTabsForRole(user.role, { department: user.department, name: user.name }) ?? [])
    : [];

  const blocked =
    user &&
    !canAccessRoute(location.pathname, settings, {
      role: user.role,
      department: user.department,
      email: session?.email,
      name: user.name,
    });

  const orderedTabs = useMemo(() => {
    const dash = tabs.find((t) => t.key === 'dashboard');
    return dash ? [dash, ...tabs.filter((t) => t.key !== 'dashboard')] : tabs;
  }, [tabs]);

  const activeKey = useMemo(() => {
    const path = location.pathname;
    const exact = tabs.find((t) => t.path === path);
    if (exact) return exact.key;
    const parent = tabs
      .filter((t) => path.startsWith(`${t.path}/`))
      .sort((a, b) => b.path.length - a.path.length)[0];
    return parent?.key ?? null;
  }, [location.pathname, tabs]);

  if (!user) return <>{children}</>;

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const unread = NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {/* Tier 1 — global bar */}
        <div className="flex items-center h-12 px-4 lg:px-6 gap-4 max-w-[1600px] mx-auto w-full">
          <button
            onClick={() => navigate(ROLE_BASE_PATH[user.role])}
            className="flex items-center gap-2.5 shrink-0 group"
          >
            <span className="h-6 w-6 rounded-md bg-foreground text-background flex items-center justify-center text-[11px] font-bold tracking-tight group-hover:scale-105 transition-transform">
              A
            </span>
            <span className="font-semibold text-[15px] tracking-tight hidden sm:block">
              {getHeaderBrandMark(settings)}
            </span>
          </button>
          <span className="h-4 w-px bg-border hidden sm:block" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground hidden sm:block">
            {getRoleLabel(user.role)}
          </span>

          <div className="flex-1" />

          {/* Command trigger */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="hidden md:flex items-center gap-2 h-8 px-3 rounded-md border border-border bg-muted/40 text-[12px] text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors min-w-[180px]"
          >
            <CommandIcon className="h-3.5 w-3.5" />
            <span>Search modules…</span>
            <kbd className="ml-auto rounded border border-border bg-background px-1.5 text-[10px]">⌘K</kbd>
          </button>

          {/* AI assist — opens the role dashboard where the intelligence panel lives */}
          <button
            onClick={() => guardedNavigate(ROLE_BASE_PATH[user.role])}
            className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-foreground text-background text-[12px] font-medium hover:opacity-90 transition-opacity"
            title="Adrine Intelligence"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">AI</span>
          </button>

          <ThemeToggle />

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="p-1.5 rounded-full hover:bg-accent transition-colors relative text-muted-foreground hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unread > 0 && (
                <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-destructive outline outline-2 outline-background" />
              )}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-lg border border-border bg-popover shadow-lg animate-fade-up overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-border text-[11px] font-semibold uppercase tracking-[0.14em]">
                    Notifications
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {NOTIFICATIONS.map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          'px-4 py-3 border-b border-border/50 last:border-0',
                          n.unread && 'bg-accent/30',
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn('text-[12.5px] leading-tight', n.unread ? 'font-semibold' : 'font-medium text-muted-foreground')}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground shrink-0">{n.time}</span>
                        </div>
                        <p className="text-[11.5px] text-muted-foreground mt-0.5">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <span className="h-4 w-px bg-border" />

          <div className="flex items-center gap-2">
            <span
              className="h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-semibold tracking-wider"
              title={user.name}
            >
              {initials}
            </span>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="p-1.5 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tier 2 — contextual module tabs */}
        <nav className="border-t border-border/60">
          <div className="flex items-center gap-1 px-4 lg:px-6 max-w-[1600px] mx-auto w-full overflow-x-auto scrollbar-hide">
            {orderedTabs.map((tab) => {
              const isActive = tab.key === activeKey;
              return (
                <button
                  key={tab.key}
                  onClick={() => guardedNavigate(tab.path)}
                  className={cn(
                    'relative px-3 py-2.5 text-[12.5px] whitespace-nowrap transition-colors',
                    isActive
                      ? 'text-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground font-medium',
                  )}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-foreground rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="flex-1 px-4 lg:px-6 py-5 max-w-[1600px] mx-auto w-full">
        <LifecycleRouteGuardBanner />
        {blocked ? <ModuleAccessDenied reason="role" /> : children}
      </main>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
