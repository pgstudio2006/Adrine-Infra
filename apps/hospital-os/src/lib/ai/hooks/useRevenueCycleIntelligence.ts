import { useMemo } from 'react';
import { useHospital } from '@/stores/hospitalStore';
import { computeRevenueCycleIntelligence } from '../engines/revenue-cycle.engine';

export function useRevenueCycleIntelligence() {
  const { invoices, patients, admissions } = useHospital();
  return useMemo(
    () => computeRevenueCycleIntelligence({ invoices, patients, admissions }),
    [invoices, patients, admissions]
  );
}
