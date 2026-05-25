import { Link } from 'react-router-dom';
import { ShieldOff, KeyRound, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isPlatformRuntimeEnabled } from '@/runtime/platform-session';

type DenialReason = 'role' | 'entitlement' | 'session';

const COPY: Record<
  DenialReason,
  { title: string; body: string; hint: string }
> = {
  role: {
    title: 'Role cannot access this module',
    body: 'Your signed-in role does not include this workspace tab. Switch role at login or ask an administrator to adjust role assignments.',
    hint: 'Role permissions are enforced before tenant module entitlements.',
  },
  entitlement: {
    title: 'Module not enabled for your branch',
    body: 'This capability is not on your tenant subscription for the current branch. A platform administrator can enable it under Platform Admin → Modules.',
    hint: 'Entitlements are loaded after kernel login from effective module policy.',
  },
  session: {
    title: 'Platform session required',
    body: 'Production builds with platform runtime need a kernel session (Bearer token, tenant, and branch). Sign in again or configure OIDC when available.',
    hint: 'See ops/PRODUCTION_AUTH.md for VITE_KERNEL_API_URL, branch headers, and dev-login staging setup.',
  },
};

export function ModuleAccessDenied({ reason }: { reason: DenialReason }) {
  const copy = COPY[reason];
  const runtimeOn = isPlatformRuntimeEnabled();

  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] text-center px-6 max-w-lg mx-auto">
      <div className="rounded-full bg-muted p-4 mb-4">
        {reason === 'session' ? (
          <KeyRound className="h-8 w-8 text-muted-foreground" />
        ) : reason === 'entitlement' ? (
          <Building2 className="h-8 w-8 text-muted-foreground" />
        ) : (
          <ShieldOff className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <h1 className="text-xl font-bold tracking-tight mb-2">{copy.title}</h1>
      <p className="text-sm text-muted-foreground mb-3">{copy.body}</p>
      <p className="text-xs text-muted-foreground/90 mb-6">{copy.hint}</p>
      {runtimeOn && reason !== 'role' && (
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4">
          VITE_PLATFORM_RUNTIME=true
        </p>
      )}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button variant="default" size="sm" asChild>
          <Link to="/">Return to login</Link>
        </Button>
        {reason === 'entitlement' && (
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/platform">Platform Admin</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
