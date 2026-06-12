/**
 * Command palette (Ctrl/Cmd+K) — navigate every module from the keyboard.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenantSettings } from '@/hooks/useTenantSettings';
import { useOperationalRouteGuard } from '@/hooks/useOperationalRouteGuard';

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const { getTabsForRole, getRoleLabel } = useTenantSettings();
  const { guardedNavigate } = useOperationalRouteGuard();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  if (!user) return null;

  const tabs = getTabsForRole(user.role, { department: user.department, name: user.name }) ?? [];

  const go = (path: string) => {
    onOpenChange(false);
    guardedNavigate(path);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command palette"
      className="fixed inset-0 z-[100]"
    >
      <div
        className="fixed inset-0 bg-background/70 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed left-1/2 top-[18%] z-[101] w-full max-w-lg -translate-x-1/2 px-4">
        <div className="overflow-hidden rounded-xl border border-border bg-popover shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border px-4">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder={`Search ${getRoleLabel(user.role)} workspace…`}
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              Esc
            </kbd>
          </div>
          <Command.List className="max-h-[320px] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
              No matching module.
            </Command.Empty>
            <Command.Group
              heading={
                <span className="px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Modules
                </span>
              }
            >
              {tabs.map((tab) => (
                <Command.Item
                  key={tab.key}
                  value={tab.label}
                  onSelect={() => go(tab.path)}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-[13px] text-foreground aria-selected:bg-accent"
                >
                  {tab.label}
                  <span className="ml-auto text-[11px] text-muted-foreground">{tab.path}</span>
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group
              heading={
                <span className="px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Actions
                </span>
              }
            >
              <Command.Item
                value="logout sign out"
                onSelect={() => {
                  onOpenChange(false);
                  navigate('/');
                }}
                className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-[13px] text-foreground aria-selected:bg-accent"
              >
                Go to login
              </Command.Item>
            </Command.Group>
          </Command.List>
        </div>
      </div>
    </Command.Dialog>
  );
}
