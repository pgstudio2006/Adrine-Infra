import { useMemo } from 'react';
import { useHospital } from '@/stores/hospitalStore';
import { computeWorkforceIntelligence } from '../engines/workforce.engine';

export function useWorkforceIntelligence() {
  const { admissions, nursingRounds, queue, appointments } = useHospital();
  return useMemo(
    () => computeWorkforceIntelligence({ admissions, nursingRounds, queue, appointments }),
    [admissions, nursingRounds, queue, appointments]
  );
}
