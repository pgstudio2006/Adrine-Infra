import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

const FRONT_DESK_PATH_TO_STEP: Record<string, string> = {
  '/reception': 'register',
  '/reception/flow': 'register',
  '/reception/registration': 'register',
  '/reception/appointments': 'schedule',
  '/reception/checkin': 'checkin',
  '/reception/queue': 'queue',
  '/reception/billing': 'billing_exit',
};

const CLINICAL_PATH_TO_STEP: Record<string, string> = {
  '/doctor': 'queue',
  '/doctor/queue': 'queue',
  '/doctor/patients': 'consult',
  '/doctor/labs': 'orders',
  '/doctor/radiology': 'orders',
};

export function useFrontDeskStepId(fallback = 'register'): string {
  const { pathname } = useLocation();
  return useMemo(() => {
    if (pathname.startsWith('/reception/consultation')) return 'queue';
    return FRONT_DESK_PATH_TO_STEP[pathname] ?? fallback;
  }, [pathname, fallback]);
}

export function useClinicalOpdStepId(fallback = 'queue'): string {
  const { pathname } = useLocation();
  return useMemo(() => {
    if (pathname.startsWith('/doctor/consultation')) return 'consult';
    return CLINICAL_PATH_TO_STEP[pathname] ?? fallback;
  }, [pathname, fallback]);
}
