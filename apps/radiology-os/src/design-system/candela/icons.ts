/* ═══════════════════════════════════════════
   Candela Design System v2 — Icon Resolution
   Shared utility to avoid duplication across components
   ═══════════════════════════════════════════ */

import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Resolve a lucide-react icon by its exported name.
 * Falls back to Circle if the icon is not found.
 */
export function resolveIcon(name: string): LucideIcon {
  const key = name as keyof typeof Icons;
  return (Icons[key] as LucideIcon | undefined) || Icons.Circle;
}
