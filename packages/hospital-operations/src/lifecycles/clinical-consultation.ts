import { HospitalPlatformEvents } from '../events.js';
import type { LifecycleDefinition } from '../types.js';

export type ClinicalConsultationState =
  | 'not_started'
  | 'in_progress'
  | 'orders_open'
  | 'signed_off'
  | 'cancelled';

export const clinicalConsultationLifecycle: LifecycleDefinition<ClinicalConsultationState> = {
  id: 'clinical_consultation',
  label: 'Clinical consultation',
  initial: 'not_started',
  states: ['not_started', 'in_progress', 'orders_open', 'signed_off', 'cancelled'],
  transitions: [
    {
      from: 'not_started',
      to: 'in_progress',
      action: 'start_consultation',
      roles: ['doctor'],
      emits: [HospitalPlatformEvents.encounter.opened],
      auditLevel: 'phi',
    },
    {
      from: 'in_progress',
      to: 'orders_open',
      action: 'open_orders',
      roles: ['doctor'],
      emits: [HospitalPlatformEvents.clinical.prescriptionIssued],
      auditLevel: 'phi',
    },
    {
      from: ['in_progress', 'orders_open'],
      to: 'signed_off',
      action: 'sign_off',
      roles: ['doctor'],
      validations: ['clinical_note_present', 'diagnosis_coded'],
      emits: [HospitalPlatformEvents.clinical.noteSigned, HospitalPlatformEvents.encounter.closed],
      auditLevel: 'phi',
    },
  ],
};
