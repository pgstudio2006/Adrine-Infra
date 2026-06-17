'use client';

import type { ReactNode } from 'react';

interface QueueSplitProps {
  /** Left panel — the queue/list */
  queue: ReactNode;
  /** Right panel — detail/content */
  detail: ReactNode;
  /** Width of left panel in px (default 380) */
  queueWidth?: number;
  /** When true, show queue on top for mobile */
  defaultOpen?: boolean;
}

export function QueueSplit({ queue, detail, queueWidth = 380 }: QueueSplitProps) {
  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        borderRadius: 'var(--c-radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--c-border)',
        background: 'var(--c-surface)',
      }}
    >
      {/* Queue list (left) */}
      <div
        style={{
          width: queueWidth,
          flexShrink: 0,
          overflowY: 'auto',
          borderRight: '1px solid var(--c-border)',
          background: 'var(--c-surface)',
        }}
        className="c-scrollbar-thin"
      >
        {queue}
      </div>

      {/* Detail panel (right) */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: 'var(--c-canvas)',
        }}
        className="c-scrollbar-thin"
      >
        {detail}
      </div>
    </div>
  );
}
