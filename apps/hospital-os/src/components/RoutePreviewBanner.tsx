import { useLocation } from 'react-router-dom';
import { Info } from 'lucide-react';
import {
  getRoutePreviewMessage,
  shouldShowRoutePreviewBanner,
} from '@/config/routeReadiness';

export default function RoutePreviewBanner() {
  const { pathname } = useLocation();
  if (!shouldShowRoutePreviewBanner(pathname)) {
    return null;
  }

  return (
    <div
      role="status"
      className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm flex gap-3 items-start"
    >
      <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-amber-900 dark:text-amber-200">Preview module</p>
        <p className="text-xs text-muted-foreground mt-1">{getRoutePreviewMessage(pathname)}</p>
      </div>
    </div>
  );
}
