import { useMemo } from 'react';
import { checkDrugAllergySafety, checkDrugInteractions } from '../engines/clinical.engine';
import type { DrugSafetyAlert } from '../types';

/**
 * Real-time drug safety check — use inside DoctorConsultation / ConsultationMedications.
 * Returns combined allergy + interaction alerts as medications are being added.
 */
export function useDrugSafetyCheck(
  patientAllergies: string,
  medications: { drug: string }[]
): DrugSafetyAlert[] {
  return useMemo(() => {
    if (medications.length === 0) return [];
    try {
      const allergyAlerts = checkDrugAllergySafety(patientAllergies, medications);
      const interactionAlerts = checkDrugInteractions(medications);
      return [...allergyAlerts, ...interactionAlerts];
    } catch {
      return [];
    }
  }, [patientAllergies, medications]);
}
