import { HospitalPlatformEvents } from '../events.js';
import type { LifecycleDefinition } from '../types.js';

export type EmergencyState =
  | 'arrival'
  | 'triage_pending'
  | 'triaged'
  | 'treatment'
  | 'observation'
  | 'transfer_ipd'
  | 'discharged'
  | 'referred_out';

export const emergencyLifecycle: LifecycleDefinition<EmergencyState> = {
  id: 'emergency_case',
  label: 'Emergency case',
  initial: 'arrival',
  states: [
    'arrival',
    'triage_pending',
    'triaged',
    'treatment',
    'observation',
    'transfer_ipd',
    'discharged',
    'referred_out',
  ],
  transitions: [
    {
      from: 'arrival',
      to: 'triage_pending',
      action: 'register_emergency',
      roles: ['receptionist', 'emergency'],
      validations: ['mlc_flag_if_required'],
      emits: [HospitalPlatformEvents.patient.registered],
      auditLevel: 'phi',
    },
    {
      from: 'triage_pending',
      to: 'triaged',
      action: 'complete_triage',
      roles: ['nurse', 'emergency', 'doctor'],
      validations: ['vitals_recorded', 'triage_level_assigned'],
      emits: [HospitalPlatformEvents.emergency.triaged],
      auditLevel: 'critical',
    },
    {
      from: 'triaged',
      to: 'treatment',
      action: 'start_treatment',
      roles: ['doctor', 'emergency'],
      auditLevel: 'phi',
    },
    {
      from: 'treatment',
      to: 'observation',
      action: 'move_to_observation',
      roles: ['doctor', 'nurse'],
      auditLevel: 'standard',
    },
    {
      from: ['treatment', 'observation', 'triaged'],
      to: 'transfer_ipd',
      action: 'admit_from_emergency',
      roles: ['doctor', 'receptionist'],
      emits: [HospitalPlatformEvents.emergency.admitted],
      auditLevel: 'phi',
    },
    {
      from: ['treatment', 'observation'],
      to: 'discharged',
      action: 'discharge_from_ed',
      roles: ['doctor'],
      validations: ['discharge_instructions'],
      emits: [HospitalPlatformEvents.emergency.discharged],
      auditLevel: 'phi',
    },
    {
      from: 'treatment',
      to: 'referred_out',
      action: 'refer_external',
      roles: ['doctor', 'admin'],
      auditLevel: 'phi',
    },
  ],
};
