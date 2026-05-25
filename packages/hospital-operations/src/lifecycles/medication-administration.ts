import { HospitalPlatformEvents } from '../events.js';
import type { LifecycleDefinition } from '../types.js';

export type MedicationAdminState =
  | 'scheduled'
  | 'held'
  | 'administered'
  | 'missed'
  | 'refused';

export const medicationAdminLifecycle: LifecycleDefinition<MedicationAdminState> = {
  id: 'medication_administration',
  label: 'Medication administration',
  initial: 'scheduled',
  states: ['scheduled', 'held', 'administered', 'missed', 'refused'],
  transitions: [
    {
      from: 'scheduled',
      to: 'administered',
      action: 'administer',
      roles: ['nurse', 'nurse_supervisor'],
      validations: ['nurse_assigned'],
      emits: [HospitalPlatformEvents.mar.administered],
      metering: ['mar.medication.administered'],
      auditLevel: 'phi',
    },
    {
      from: 'held',
      to: 'administered',
      action: 'administer',
      roles: ['nurse', 'nurse_supervisor'],
      validations: ['nurse_assigned'],
      emits: [HospitalPlatformEvents.mar.administered],
      metering: ['mar.medication.administered'],
      auditLevel: 'phi',
    },
    {
      from: 'scheduled',
      to: 'held',
      action: 'hold',
      roles: ['nurse', 'nurse_supervisor'],
      validations: ['nurse_assigned'],
      emits: [HospitalPlatformEvents.mar.held],
      auditLevel: 'standard',
    },
    {
      from: 'held',
      to: 'scheduled',
      action: 'release_hold',
      roles: ['nurse', 'nurse_supervisor'],
      auditLevel: 'standard',
    },
    {
      from: 'scheduled',
      to: 'missed',
      action: 'mark_missed',
      roles: ['nurse', 'nurse_supervisor', 'admin'],
      validations: ['miss_reason_documented'],
      emits: [HospitalPlatformEvents.mar.missed],
      auditLevel: 'standard',
    },
    {
      from: 'scheduled',
      to: 'refused',
      action: 'mark_refused',
      roles: ['nurse', 'nurse_supervisor'],
      validations: ['refusal_reason_documented'],
      emits: [HospitalPlatformEvents.mar.refused],
      auditLevel: 'phi',
    },
  ],
};
