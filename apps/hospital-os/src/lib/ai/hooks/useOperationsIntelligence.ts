import { useMemo } from 'react';
import { useHospital } from '@/stores/hospitalStore';
import { computeOperationsIntelligence } from '../engines/operations.engine';

export function useOperationsIntelligence() {
  const { queue, admissions, emergencyCases, appointments, labOrders, nursingRounds } = useHospital();
  return useMemo(
    () => computeOperationsIntelligence({ queue, admissions, emergencyCases, appointments, labOrders, nursingRounds }),
    [queue, admissions, emergencyCases, appointments, labOrders, nursingRounds]
  );
}
