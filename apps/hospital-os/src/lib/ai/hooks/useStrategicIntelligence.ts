import { useMemo } from 'react';
import { useHospital } from '@/stores/hospitalStore';
import { computeStrategicIntelligence } from '../engines/strategic.engine';

export function useStrategicIntelligence() {
  const { patients, admissions, invoices, appointments, queue } = useHospital();
  return useMemo(
    () => computeStrategicIntelligence({ patients, admissions, invoices, appointments, queue }),
    [patients, admissions, invoices, appointments, queue]
  );
}
