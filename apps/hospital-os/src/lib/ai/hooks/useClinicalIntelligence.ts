import { useMemo } from 'react';
import { useHospital } from '@/stores/hospitalStore';
import { computeClinicalIntelligence } from '../engines/clinical.engine';

export function useClinicalIntelligence() {
  const { patients, labOrders, prescriptions, admissions, nursingRounds, pharmacyInventory } = useHospital();
  return useMemo(
    () => computeClinicalIntelligence({ patients, labOrders, prescriptions, admissions, nursingRounds, pharmacyInventory }),
    [patients, labOrders, prescriptions, admissions, nursingRounds, pharmacyInventory]
  );
}
