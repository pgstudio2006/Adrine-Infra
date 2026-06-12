import { getRouteConnectivityClass } from '@/config/routeReadiness';
import { allowDemoFallback, allowDemoLogin } from '@/lib/platform/demo-fallback';
import { isPlatformRuntimeEnabled } from '@/runtime/platform-session';
import { isAdrine2026Experience } from '@/lib/adrine/experience';

/** Sidebar + route guards: hide Preview-only screens unless local demo mode is on. */
export function isNavRouteVisible(path: string): boolean {
  if (isAdrine2026Experience()) return true;
  if (allowDemoFallback()) return true;
  // Static Vercel demo (no kernel): LIS / Blood Bank preview screens are intentional.
  if (allowDemoLogin() && import.meta.env.PROD && !isPlatformRuntimeEnabled()) {
    return true;
  }
  return getRouteConnectivityClass(path) !== 'preview';
}
