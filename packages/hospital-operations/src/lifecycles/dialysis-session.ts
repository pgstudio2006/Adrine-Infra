import { HospitalPlatformEvents } from '../events.js';
import type { LifecycleDefinition } from '../types.js';

/** Haemodialysis session lifecycle (unit operations). */
export type DialysisSessionState =
  | 'scheduled'
  | 'checked_in'
  | 'in_progress'
  | 'monitoring'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export const dialysisSessionLifecycle: LifecycleDefinition<DialysisSessionState> = {
  id: 'dialysis_session',
  label: 'Dialysis session',
  initial: 'scheduled',
  states: [
    'scheduled',
    'checked_in',
    'in_progress',
    'monitoring',
    'completed',
    'cancelled',
    'no_show',
  ],
  transitions: [
    {
      from: 'scheduled',
      to: 'checked_in',
      action: 'check_in_patient',
      roles: ['dialysis_nurse', 'receptionist', 'nurse'],
      validations: ['patient_identified', 'machine_assigned'],
      emits: [HospitalPlatformEvents.dialysis.patientCheckedIn],
      metering: ['dialysis.check_in'],
      auditLevel: 'phi',
    },
    {
      from: 'checked_in',
      to: 'in_progress',
      action: 'start_session',
      roles: ['dialysis_nurse', 'doctor'],
      validations: ['vitals_baseline_recorded', 'ipd_admission_linked_if_inpatient'],
      emits: [HospitalPlatformEvents.dialysis.sessionStarted],
      metering: ['dialysis.session.started'],
      auditLevel: 'phi',
    },
    {
      from: 'in_progress',
      to: 'monitoring',
      action: 'begin_monitoring',
      roles: ['dialysis_nurse'],
      metering: ['dialysis.monitoring'],
      auditLevel: 'phi',
    },
    {
      from: ['in_progress', 'monitoring'],
      to: 'completed',
      action: 'complete_session',
      roles: ['dialysis_nurse', 'doctor'],
      validations: ['session_notes_complete', 'consumables_logged'],
      emits: [HospitalPlatformEvents.dialysis.sessionCompleted],
      metering: ['dialysis.session.completed'],
      auditLevel: 'phi',
    },
    {
      from: 'scheduled',
      to: 'no_show',
      action: 'mark_no_show',
      roles: ['dialysis_nurse', 'receptionist'],
      metering: ['dialysis.no_show'],
      auditLevel: 'standard',
    },
    {
      from: ['scheduled', 'checked_in'],
      to: 'cancelled',
      action: 'cancel_session',
      roles: ['dialysis_nurse', 'receptionist', 'admin'],
      validations: ['cancel_reason_provided'],
      emits: [HospitalPlatformEvents.dialysis.sessionCancelled],
      metering: ['dialysis.session.cancelled'],
      auditLevel: 'standard',
    },
  ],
};
