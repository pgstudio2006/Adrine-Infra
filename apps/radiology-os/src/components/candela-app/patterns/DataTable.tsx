'use client';

import { useState, useMemo, type ReactNode } from 'react';
import * as Icons from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  density?: 'comfortable' | 'default' | 'compact';
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  rowKey: (row: T) => string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  density = 'default',
  onRowClick,
  emptyMessage = 'No data',
  rowKey,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const rowHeight = density === 'comfortable' ? 44 : density === 'compact' ? 30 : 36;

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div style={{
      background: 'var(--c-surface)',
      borderRadius: 'var(--c-radius-lg)',
      border: '1px solid var(--c-border)',
      overflow: 'hidden',
    }}>
      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          {/* Header */}
          <thead>
            <tr style={{ borderBottom: '1px solid var(--c-border)' }}>
              {columns.map(col => (
                <th
                  key={col.key}
                  style={{
                    textAlign: col.align || 'left',
                    padding: '0 12px',
                    height: 32,
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--c-text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: col.sortable ? 'pointer' : 'default',
                    whiteSpace: 'nowrap',
                    width: col.width,
                    userSelect: 'none',
                  }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortDir === 'asc' ? <Icons.ChevronUp size={12} /> : <Icons.ChevronDown size={12} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    textAlign: 'center',
                    padding: 'var(--c-space-8)',
                    color: 'var(--c-text-tertiary)',
                    fontSize: 12,
                  }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sorted.map(row => (
                <tr
                  key={rowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  style={{
                    borderBottom: '1px solid var(--c-border-light)',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background var(--c-transition-fast)',
                    height,
                  }}
                  className={onRowClick ? 'c-surface-hoverable' : ''}
                >
                  {columns.map(col => (
                    <td
                      key={col.key}
                      style={{
                        textAlign: col.align || 'left',
                        padding: '0 12px',
                        color: 'var(--c-text)',
                        fontSize: 12,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
