import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  AF_BASE_PATH,
  AF_NAV_GROUPS,
  AF_SECTIONS,
  type AfSectionId,
} from '@/lib/accounts-finance/sections';

export function AccountsFinanceLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex flex-col lg:flex-row gap-5 min-h-[calc(100vh-8rem)]">
      <aside className="lg:w-60 shrink-0">
        <div className="rounded-xl border bg-card/80 backdrop-blur p-3 sticky top-20">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-700 px-2 mb-3">
            Accounts & Finance
          </p>
          <nav className="space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
            {AF_NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold px-2 mb-1.5">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((id: AfSectionId) => {
                    const section = AF_SECTIONS[id];
                    const Icon = section.icon;
                    const active =
                      location.pathname === section.path ||
                      (section.path !== AF_BASE_PATH &&
                        location.pathname.startsWith(section.path));
                    return (
                      <NavLink
                        key={id}
                        to={section.path}
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors',
                          active
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-foreground/80 hover:bg-muted/60',
                        )}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{section.title.replace(' Management', '').replace('General ', '')}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
