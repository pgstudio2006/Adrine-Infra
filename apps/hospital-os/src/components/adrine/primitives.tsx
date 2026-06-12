/**
 * Adrine 2026 design-system primitives.
 *
 * Every redesigned module composes these — no one-off page scaffolding.
 * Aesthetic: minimalist monochrome, high-density-but-clean, restrained
 * semantic color, sharp type hierarchy, premium "operating system" feel.
 */
import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ---------------------------------------------------------------- */
/* Page scaffold                                                     */
/* ---------------------------------------------------------------- */

export function PageScaffold({
  title,
  subtitle,
  eyebrow,
  actions,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  /** Small uppercase label above the title, e.g. module name */
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-5', className)}>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1">
              {eyebrow}
            </p>
          )}
          <motion.h1
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-[22px] leading-tight font-semibold tracking-tight text-foreground"
          >
            {title}
          </motion.h1>
          {subtitle && (
            <p className="text-[13px] text-muted-foreground mt-1 max-w-2xl">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </header>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Metrics                                                           */
/* ---------------------------------------------------------------- */

export type Metric = {
  id: string;
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  delta?: { value: string; direction: 'up' | 'down' | 'flat'; positive?: boolean };
  /** Optional click-through */
  onClick?: () => void;
};

export function MetricGrid({
  metrics,
  columns = 4,
  className,
}: {
  metrics: Metric[];
  columns?: 3 | 4 | 5 | 6;
  className?: string;
}) {
  const grid = {
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-2 xl:grid-cols-4',
    5: 'sm:grid-cols-3 xl:grid-cols-5',
    6: 'sm:grid-cols-3 xl:grid-cols-6',
  }[columns];

  return (
    <div className={cn('grid grid-cols-1 gap-px rounded-lg border border-border bg-border overflow-hidden', grid, className)}>
      {metrics.map((m, i) => {
        const DeltaIcon =
          m.delta?.direction === 'up' ? TrendingUp : m.delta?.direction === 'down' ? TrendingDown : Minus;
        return (
          <motion.div
            key={m.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.03 }}
            onClick={m.onClick}
            className={cn(
              'bg-card p-4 min-w-0',
              m.onClick && 'cursor-pointer transition-colors hover:bg-accent/40',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground truncate">
                {m.label}
              </p>
              {m.icon && <m.icon className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" strokeWidth={1.75} />}
            </div>
            <p className="text-[26px] leading-none font-semibold tracking-tight mt-2.5 tabular-nums">
              {m.value}
            </p>
            {(m.hint || m.delta) && (
              <div className="flex items-center gap-1.5 mt-2 min-h-[16px]">
                {m.delta && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums',
                      m.delta.positive === true && 'text-success',
                      m.delta.positive === false && 'text-destructive',
                      m.delta.positive === undefined && 'text-muted-foreground',
                    )}
                  >
                    <DeltaIcon className="h-3 w-3" />
                    {m.delta.value}
                  </span>
                )}
                {m.hint && <span className="text-[11px] text-muted-foreground truncate">{m.hint}</span>}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Section panel                                                     */
/* ---------------------------------------------------------------- */

export function SectionPanel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  flush = false,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Remove body padding (for tables) */
  flush?: boolean;
}) {
  return (
    <section className={cn('rounded-lg border border-border bg-card overflow-hidden', className)}>
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border">
        <div className="min-w-0">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground">{title}</h2>
          {description && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-1.5 shrink-0">{actions}</div>}
      </div>
      <div className={cn(!flush && 'p-4', bodyClassName)}>{children}</div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Status chip — hospital operational states                          */
/* ---------------------------------------------------------------- */

export type StatusTone = 'neutral' | 'active' | 'success' | 'warning' | 'critical' | 'info';

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  active: 'bg-foreground text-background',
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/15 text-warning',
  critical: 'bg-destructive/12 text-destructive',
  info: 'bg-info/12 text-info',
};

export function StatusChip({
  tone = 'neutral',
  children,
  pulse = false,
  className,
}: {
  tone?: StatusTone;
  children: ReactNode;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium tracking-wide whitespace-nowrap',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-60" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------- */
/* Workflow stepper — clinical/operational sequences                  */
/* ---------------------------------------------------------------- */

export type WorkflowStep = {
  id: string;
  label: string;
  status: 'done' | 'active' | 'pending' | 'blocked';
  meta?: string;
};

export function WorkflowStepper({ steps, className }: { steps: WorkflowStep[]; className?: string }) {
  return (
    <ol className={cn('space-y-0', className)}>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <li key={step.id} className="relative flex gap-3 pb-4 last:pb-0">
            {!isLast && (
              <span
                className={cn(
                  'absolute left-[11px] top-6 bottom-0 w-px',
                  step.status === 'done' ? 'bg-foreground/30' : 'bg-border',
                )}
              />
            )}
            <span
              className={cn(
                'relative z-10 flex h-[23px] w-[23px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                step.status === 'done' && 'bg-foreground text-background',
                step.status === 'active' && 'bg-background text-foreground ring-2 ring-foreground',
                step.status === 'pending' && 'bg-muted text-muted-foreground',
                step.status === 'blocked' && 'bg-destructive/15 text-destructive ring-1 ring-destructive/40',
              )}
            >
              {step.status === 'done' ? '✓' : i + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  'text-[13px] leading-tight',
                  step.status === 'pending' ? 'text-muted-foreground' : 'font-medium text-foreground',
                )}
              >
                {step.label}
              </p>
              {step.meta && <p className="text-[11px] text-muted-foreground mt-0.5">{step.meta}</p>}
            </div>
            {step.status === 'active' && (
              <StatusChip tone="active" className="ml-auto self-start">
                Now
              </StatusChip>
            )}
            {step.status === 'blocked' && (
              <StatusChip tone="critical" className="ml-auto self-start">
                Blocked
              </StatusChip>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ---------------------------------------------------------------- */
/* Empty state                                                        */
/* ---------------------------------------------------------------- */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-10 text-center', className)}>
      {Icon && (
        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mb-3">
          <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
        </div>
      )}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* List row — dense, scannable entity rows                            */
/* ---------------------------------------------------------------- */

export function ListRow({
  primary,
  secondary,
  trailing,
  onClick,
  className,
}: {
  primary: ReactNode;
  secondary?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center justify-between gap-3 py-2 px-1 border-b border-border/60 last:border-0',
        onClick && 'cursor-pointer transition-colors hover:bg-accent/40 -mx-1 px-2 rounded-sm',
        className,
      )}
    >
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-foreground truncate">{primary}</div>
        {secondary && <div className="text-[11px] text-muted-foreground truncate mt-0.5">{secondary}</div>}
      </div>
      {trailing && <div className="flex items-center gap-2 shrink-0">{trailing}</div>}
    </div>
  );
}
