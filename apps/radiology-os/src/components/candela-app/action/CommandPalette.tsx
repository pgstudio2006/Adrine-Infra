'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShell } from '../shell/Shell';
import { CANDELA_MODULES } from '@/design-system/candela';
import * as Icons from 'lucide-react';
import { resolveIcon } from '@/design-system/candela/icons';

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useShell();
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const results = query.trim()
    ? CANDELA_MODULES.filter(m =>
        m.label.toLowerCase().includes(query.toLowerCase()) ||
        m.id.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10)
    : CANDELA_MODULES.slice(0, 10);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  const close = useCallback(() => {
    setCommandPaletteOpen(false);
  }, [setCommandPaletteOpen]);

  const handleSelect = useCallback((path: string) => {
    navigate(path);
    close();
  }, [navigate, close]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIdx]) {
      handleSelect(results[selectedIdx].path);
    } else if (e.key === 'Escape') {
      close();
    }
  }, [results, selectedIdx, handleSelect, close]);

  if (!commandPaletteOpen) return null;

  return (
    <>
      <div
        onClick={close}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--c-overlay)',
          zIndex: 'var(--c-z-palette)',
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 520,
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: '60vh',
          background: 'var(--c-surface-raised)',
          borderRadius: 'var(--c-radius-xl)',
          boxShadow: 'var(--c-shadow-lg)',
          border: '1px solid var(--c-border)',
          zIndex: 'calc(var(--c-z-palette) + 1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Search input */}
        <div style={{ padding: 'var(--c-space-3)', borderBottom: '1px solid var(--c-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icons.Search size={16} style={{ color: 'var(--c-text-tertiary)', flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedIdx(0); }}
              onKeyDown={handleKeyDown}
              placeholder="Search modules, patients, actions..."
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                color: 'var(--c-text)',
                fontSize: 14,
                outline: 'none',
                fontFamily: 'var(--c-font-sans)',
              }}
            />
            <span className="c-kbd">esc</span>
          </div>
        </div>

        {/* Results */}
        <div style={{ overflow: 'auto', flex: 1, padding: 'var(--c-space-2)' }}>
          {results.length === 0 ? (
            <div style={{ padding: 'var(--c-space-6)', textAlign: 'center', color: 'var(--c-text-tertiary)', fontSize: 12 }}>
              No results for &quot;{query}&quot;
            </div>
          ) : (
            results.map((m, i) => {
              const Icon = resolveIcon(m.icon);
              const isSelected = i === selectedIdx;
              return (
                <button
                  key={m.id}
                  onClick={() => handleSelect(m.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--c-radius-md)',
                    border: 'none',
                    background: isSelected ? 'var(--c-surface-hover)' : 'transparent',
                    color: 'var(--c-text)',
                    cursor: 'pointer',
                    fontSize: 13,
                    textAlign: 'left',
                    transition: 'background var(--c-transition-fast)',
                  }}
                >
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 'var(--c-radius-md)',
                    background: 'var(--c-surface-hover)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={14} style={{ color: 'var(--c-text-secondary)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 500, fontSize: 12 }}>{m.label}</p>
                    <p style={{ fontSize: 10, color: 'var(--c-text-tertiary)' }}>{m.id}</p>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--c-text-tertiary)' }}>Go</span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 12px',
          borderTop: '1px solid var(--c-border)',
          display: 'flex',
          gap: 12,
          fontSize: 10,
          color: 'var(--c-text-tertiary)',
        }}>
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>esc Close</span>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: translateX(-50%) scale(0.96); }
          to { opacity: 1; transform: translateX(-50%) scale(1); }
        }
      `}</style>
    </>
  );
}
