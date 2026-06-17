'use client';

import { useEffect, useCallback } from 'react';

type ShortcutHandler = (e: KeyboardEvent) => void;

interface ShortcutDef {
  key: string;
  ctrlOrMeta?: boolean;
  shift?: boolean;
  handler: ShortcutHandler;
  /** Don't trigger when typing in inputs */
  ignoreWhenEditing?: boolean;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutDef[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      for (const s of shortcuts) {
        const mod = s.ctrlOrMeta ?? false;
        const modMatch = mod ? (e.ctrlKey || e.metaKey) : true;
        const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey;
        const keyMatch = e.key.toLowerCase() === s.key.toLowerCase();

        if (modMatch && shiftMatch && keyMatch) {
          // Skip if the user is typing in an input/textarea and the shortcut allows it
          if (s.ignoreWhenEditing !== false) {
            const target = e.target as HTMLElement;
            if (
              target.tagName === 'INPUT' ||
              target.tagName === 'TEXTAREA' ||
              target.isContentEditable
            ) {
              continue;
            }
          }
          e.preventDefault();
          s.handler(e);
          return;
        }
      }
    },
    [shortcuts],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
