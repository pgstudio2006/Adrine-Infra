import { getRouteConnectivityClass } from '@/config/routeReadiness';
import { allowDemoFallback } from '@/lib/platform/demo-fallback';

/** Sidebar + route guards: hide Preview-only screens unless local demo mode is on. */
export function isNavRouteVisible(path: string): boolean {
  if (allowDemoFallback()) return true;
  return getRouteConnectivityClass(path) !== 'preview';
}
