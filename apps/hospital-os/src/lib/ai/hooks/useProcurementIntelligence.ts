import { useMemo } from 'react';
import { useHospital } from '@/stores/hospitalStore';
import { computeProcurementIntelligence } from '../engines/procurement.engine';

export function useProcurementIntelligence() {
  const { pharmacyInventory, prescriptions } = useHospital();
  return useMemo(
    () => computeProcurementIntelligence({ pharmacyInventory, prescriptions }),
    [pharmacyInventory, prescriptions]
  );
}
