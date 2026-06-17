'use client';

import type { ReactNode } from 'react';

export interface MetricCard {
  label: string;
  value: string | number;
  icon?: ReactNode;
  change?: string;
  changePositive?: boolean;
  color?: string;
  onClick?: () => void;
}

interface MetricGridProps {
  metrics: MetricCard[];
  columns?: number;
}

export function MetricGrid({ metrics, columns = 4 }: MetricGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 'var(--c-space-3)',
      }}
    >
      {metrics.map((m, i) => (
        <div
          key={i}
          onClick={m.onClick}
          style={{
            background: 'var(--c-surface)',
            borderRadius: 'var(--c-radius-lg)',
            border: '1px solid var(--c-border)',
            padding: 'var(--c-space-3)',
            cursor: m.onClick ? 'pointer' : 'default',
            transition: 'all var(--c-transition-fast)',
          }}
          className={m.onClick ? 'c-surface-hoverable' : ''}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            {m.icon && <span style={{ color: m.color || 'var(--c-text-tertiary)', display: 'flex' }}>{m.icon}</span>}
            <span style={{ fontSize: 9, color: 'var(--c-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {m.label}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--c-text)' }}>
              {m.value}
            </span>
            {m.change && (
              <span style={{
                fontSize: 10,
                fontWeight: 500,
                color: m.changePositive ? 'var(--c-success)' : 'var(--c-critical)',
              }}>
                {m.change}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
