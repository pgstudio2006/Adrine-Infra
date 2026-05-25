import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useHospital } from '@/stores/hospitalStore';
import {
  evaluateOperationalRouteAccess,
  type RouteAccessResult,
} from '@/operations/operational-route-guards';

/** Enforce OPD spine route guards when platform is authoritative. */
export function useOperationalRouteGuard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { patients, queue, appointments } = useHospital();

  const context = useMemo(
    () => ({
      role: user?.role ?? 'receptionist',
      patients,
      queue,
      appointments,
    }),
    [user?.role, patients, queue, appointments],
  );

  const currentAccess = useMemo(
    () => evaluateOperationalRouteAccess(location.pathname, context),
    [location.pathname, context],
  );

  const assertRouteAccess = useCallback(
    (targetPath: string): RouteAccessResult => {
      const result = evaluateOperationalRouteAccess(targetPath, context);
      if (!result.allowed) {
        toast.error('Step not allowed yet', { description: result.reason });
        if (result.redirectTo) {
          navigate(result.redirectTo);
        }
      }
      return result;
    },
    [context, navigate],
  );

  const guardedNavigate = useCallback(
    (targetPath: string) => {
      const result = assertRouteAccess(targetPath);
      if (result.allowed) {
        navigate(targetPath);
      }
    },
    [assertRouteAccess, navigate],
  );

  return {
    currentAccess,
    assertRouteAccess,
    guardedNavigate,
  };
}
