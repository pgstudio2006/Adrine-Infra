import { HospitalPlatformEvents } from '../events.js';
import type { LifecycleDefinition } from '../types.js';

export type PatientIdentityState = 'anonymous' | 'registered' | 'verified' | 'merged' | 'deactivated';

export const patientIdentityLifecycle: LifecycleDefinition<PatientIdentityState> = {
  id: 'patient_identity',
  label: 'Patient identity',
  initial: 'anonymous',
  states: ['anonymous', 'registered', 'verified', 'merged', 'deactivated'],
  transitions: [
    {
      from: 'anonymous',
      to: 'registered',
      action: 'register_patient',
      roles: ['receptionist', 'admin', 'emergency'],
      validations: ['demographics_complete'],
      emits: [HospitalPlatformEvents.patient.registered],
      auditLevel: 'phi',
    },
    {
      from: 'registered',
      to: 'verified',
      action: 'verify_identity',
      roles: ['receptionist', 'admin'],
      emits: [HospitalPlatformEvents.patient.updated],
      auditLevel: 'phi',
    },
    {
      from: 'registered',
      to: 'merged',
      action: 'merge_duplicate',
      roles: ['admin'],
      emits: [HospitalPlatformEvents.patient.merged],
      auditLevel: 'critical',
    },
  ],
};
