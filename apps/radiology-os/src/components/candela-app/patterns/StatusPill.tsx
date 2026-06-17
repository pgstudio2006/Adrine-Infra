'use client';

import type { ReactNode } from 'react';

type PillVariant = 'critical' | 'warning' | 'success' | 'info' | 'neutral';

interface StatusPillProps {
  variant: PillVariant;
  children: ReactNode;
  size?: 'sm' | 'md';
  dot?: boolean;
}

const VARIANT_STYLES: Record<PillVariant, { bg: string; text: string }> = {
  critical: { bg: 'var(--c-critical-bg)', text: 'var(--c-critical)' },
  warning: { bg: 'var(--c-warning-bg)', text: 'var(--c-warning)' },
  success: { bg: 'var(--c-success-bg)', text: 'var(--c-success)' },
  info: { bg: 'var(--c-info-bg)', text: 'var(--c-info)' },
  neutral: { bg: 'var(--c-surface-hover)', text: 'var(--c-text-secondary)' },
};

export function StatusPill({ variant, children, size = 'md', dot = false }: StatusPillProps) {
  const styles = VARIANT_STYLES[variant];
  const height = size === 'sm' ? 18 : 22;
  const fontSize = size === 'sm' ? 9 : 10;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        height,
        padding: `0 ${size === 'sm' ? 6 : 8}px`,
        borderRadius: 'var(--c-radius-full)',
        background: styles.bg,
        color: styles.text,
        fontSize,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        lineHeight: `${height}px`,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
      }}
    >
      {dot && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: styles.text,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}
