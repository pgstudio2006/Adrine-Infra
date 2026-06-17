'use client';

import { useState } from 'react';
import * as Icons from 'lucide-react';

export interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

interface FilterBarProps {
  filters: FilterOption[];
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export function FilterBar({ filters, searchPlaceholder, searchValue, onSearchChange }: FilterBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--c-space-2)',
        flexWrap: 'wrap',
      }}
    >
      {/* Search */}
      {onSearchChange && (
        <div
          style={{
            position: 'relative',
            flex: 1,
            maxWidth: 280,
          }}
        >
          <Icons.Search
            size={14}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--c-text-tertiary)',
              pointerEvents: 'none',
            }}
          />
          <input
            value={searchValue || ''}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder || 'Search...'}
            style={{
              width: '100%',
              height: 32,
              paddingLeft: 30,
              paddingRight: 10,
              borderRadius: 'var(--c-radius-md)',
              border: '1px solid var(--c-border)',
              background: 'var(--c-surface)',
              color: 'var(--c-text)',
              fontSize: 12,
              outline: 'none',
              transition: 'border-color var(--c-transition-fast)',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--c-accent)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; }}
          />
        </div>
      )}

      {/* Filter selects */}
      {filters.map(f => (
        <select
          key={f.key}
          value={f.value}
          onChange={e => f.onChange(e.target.value)}
          style={{
            height: 32,
            padding: '0 8px',
            borderRadius: 'var(--c-radius-md)',
            border: '1px solid var(--c-border)',
            background: 'var(--c-surface)',
            color: 'var(--c-text)',
            fontSize: 11,
            fontWeight: 500,
            cursor: 'pointer',
            outline: 'none',
            minWidth: 100,
          }}
        >
          {f.options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ))}
    </div>
  );
}
