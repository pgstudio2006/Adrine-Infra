import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export function WorkspacePage({
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-6', className)}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-semibold tracking-tight text-foreground"
          >
            {title}
          </motion.h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      {children}
    </div>
  );
}

export type MetricCard = {
  id: string;
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  trend?: { value: string; positive?: boolean };
};

export function MetricStrip({ metrics, columns = 4 }: { metrics: MetricCard[]; columns?: 3 | 4 | 5 | 6 }) {
  const grid = {
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 xl:grid-cols-4',
    5: 'md:grid-cols-3 xl:grid-cols-5',
    6: 'md:grid-cols-3 xl:grid-cols-6',
  }[columns];

  return (
    <div className={cn('grid grid-cols-1 gap-3', grid)}>
      {metrics.map((m, i) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="rounded-lg border border-border/80 bg-card p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{m.label}</p>
            {m.icon && <m.icon className="h-4 w-4 text-muted-foreground/70" strokeWidth={1.75} />}
          </div>
          <p className="text-2xl font-semibold tracking-tight mt-2">{m.value}</p>
          {(m.hint || m.trend) && (
            <p className={cn('text-xs mt-1', m.trend?.positive ? 'text-emerald-600' : 'text-muted-foreground')}>
              {m.trend?.value ?? m.hint}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}

export function WorkflowPanel({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-xl border border-border/80 bg-card overflow-hidden', className)}>
      <div className="px-4 py-3 border-b border-border/60 bg-muted/30">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
