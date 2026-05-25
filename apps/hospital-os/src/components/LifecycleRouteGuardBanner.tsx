import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import { useOperationalRouteGuard } from '@/hooks/useOperationalRouteGuard';
import { isPlatformAuthoritative } from '@/runtime/platform-store-bridge';

/** Blocks out-of-sequence OPD navigation when platform runtime is on. */
export default function LifecycleRouteGuardBanner() {
  const navigate = useNavigate();
  const { currentAccess } = useOperationalRouteGuard();

  useEffect(() => {
    if (!isPlatformAuthoritative() || currentAccess.allowed || !currentAccess.redirectTo) {
      return;
    }
    const timer = setTimeout(() => {
      navigate(currentAccess.redirectTo!, { replace: true });
    }, 120);
    return () => clearTimeout(timer);
  }, [currentAccess, navigate]);

  if (!isPlatformAuthoritative() || currentAccess.allowed) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <ShieldAlert className="h-4 w-4" />
      <AlertTitle>Workflow step blocked</AlertTitle>
      <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span>{currentAccess.reason}</span>
        {currentAccess.redirectTo && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={() => navigate(currentAccess.redirectTo!)}
          >
            Go to required step
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
