/**
 * Adrine 2026 experience gate.
 *
 * The redesigned Hospital OS shell, design system, and module screens are
 * served only to non-Navayu tenants. Navayu (Gurgaon MSK / Pataudi) is a
 * frozen tenant pack and always receives the legacy UI untouched.
 *
 * This module is the ONLY coupling point to Navayu detection — read-only,
 * never mutating anything inside lib/navayu.
 */
import { isNavayuTenant } from '@/lib/navayu/navayu-forms';

export function isAdrine2026Experience(): boolean {
  return !isNavayuTenant();
}
