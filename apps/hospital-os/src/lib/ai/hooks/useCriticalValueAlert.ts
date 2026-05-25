import { useMemo } from 'react';
import { detectCriticalLabValues } from '../engines/clinical.engine';
import type { CriticalValueAlert } from '../types';

/**
 * Real-time critical lab value detection — use inside LabEntry.
 * Returns an alert if the entered value breaches critical thresholds.
 */
export function useCriticalValueAlert(
  testName: string,
  value: string | number,
  unit: string
): CriticalValueAlert | null {
  return useMemo(() => {
    const numVal = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numVal) || !testName) return null;
    try {
      return detectCriticalLabValues(testName, numVal, unit);
    } catch {
      return null;
    }
  }, [testName, value, unit]);
}
