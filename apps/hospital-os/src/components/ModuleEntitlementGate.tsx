import { useEffect, useState } from 'react';
import { ModuleKey } from '@/types/roles';
import { MODULE_ENTITLEMENT_MAP } from '@/config/module-entitlements';
import { canUseModule, canUseModuleRuntime } from '@/runtime/module-runtime';
import { ModuleAccessDenied } from '@/components/auth/ModuleAccessDenied';
import { getPlatformSession, isPlatformRuntimeEnabled } from '@/runtime/platform-session';

type Props = {
  module?: ModuleKey;
  children: React.ReactNode;
};

export default function ModuleEntitlementGate({ module, children }: Props) {
  const [allowed, setAllowed] = useState(true);
  const [checking, setChecking] = useState(!!module && canUseModuleRuntime());

  useEffect(() => {
    if (!module || !canUseModuleRuntime()) {
      setAllowed(true);
      setChecking(false);
      return;
    }
    const code = MODULE_ENTITLEMENT_MAP[module];
    if (!code) {
      setAllowed(true);
      setChecking(false);
      return;
    }
    let cancelled = false;
    canUseModule(code)
      .then((ok) => {
        if (!cancelled) {
          setAllowed(ok);
          setChecking(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAllowed(true);
          setChecking(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [module]);

  if (checking) {
    return (
      <p className="text-sm text-muted-foreground p-4">Checking module entitlement…</p>
    );
  }

  if (!allowed) {
    if (isPlatformRuntimeEnabled() && import.meta.env.PROD && !getPlatformSession()?.accessToken) {
      return <ModuleAccessDenied reason="session" />;
    }
    return <ModuleAccessDenied reason="entitlement" />;
  }

  return <>{children}</>;
}
