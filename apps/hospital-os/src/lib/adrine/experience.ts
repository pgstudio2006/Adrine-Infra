import { isNavayuTenant } from '@/lib/navayu/navayu-forms';

/** Adrine 2026 product shell — Vercel demo & generic tenants. Navayu keeps legacy UI. */
export function isAdrine2026Experience(): boolean {
  return !isNavayuTenant();
}
