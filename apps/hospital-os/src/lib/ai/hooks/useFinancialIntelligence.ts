import { useMemo } from 'react';
import { useHospital } from '@/stores/hospitalStore';
import { computeFinancialIntelligence } from '../engines/financial.engine';

export function useFinancialIntelligence() {
  const { invoices, admissions, patients, prescriptions } = useHospital();
  return useMemo(
    () => computeFinancialIntelligence({ invoices, admissions, patients, prescriptions }),
    [invoices, admissions, patients, prescriptions]
  );
}
