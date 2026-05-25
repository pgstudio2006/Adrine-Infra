import { HospitalPlatformEvents } from '../events.js';
import type { LifecycleDefinition } from '../types.js';

/** Authoritative OT surgical case lifecycle. */
export type OtCaseState =
  | 'scheduled'
  | 'confirmed'
  | 'preop_ready'
  | 'in_progress'
  | 'postop_recovery'
  | 'completed'
  | 'cancelled';

export const otCaseLifecycle: LifecycleDefinition<OtCaseState> = {
  id: 'ot_case',
  label: 'OT surgical case',
  initial: 'scheduled',
  states: [
    'scheduled',
    'confirmed',
    'preop_ready',
    'in_progress',
    'postop_recovery',
    'completed',
    'cancelled',
  ],
  transitions: [
    {
      from: 'scheduled',
      to: 'confirmed',
      action: 'confirm_case',
      roles: ['doctor', 'ot_coordinator', 'admin'],
      validations: ['patient_identified', 'procedure_documented', 'ot_room_assigned'],
      emits: [HospitalPlatformEvents.ot.caseConfirmed],
      metering: ['ot.case.confirmed'],
      auditLevel: 'phi',
    },
    {
      from: ['scheduled', 'confirmed'],
      to: 'preop_ready',
      action: 'complete_preop',
      roles: ['nurse', 'ot_coordinator', 'doctor'],
      validations: ['preop_checklist_complete', 'consent_on_file'],
      emits: [HospitalPlatformEvents.ot.preopCompleted],
      metering: ['ot.preop.completed'],
      auditLevel: 'phi',
    },
    {
      from: 'preop_ready',
      to: 'in_progress',
      action: 'start_surgery',
      roles: ['doctor', 'ot_coordinator'],
      validations: ['team_assigned', 'ipd_admission_linked_if_required'],
      emits: [HospitalPlatformEvents.ot.surgeryStarted],
      metering: ['ot.surgery.started'],
      auditLevel: 'critical',
    },
    {
      from: 'in_progress',
      to: 'postop_recovery',
      action: 'end_surgery',
      roles: ['doctor', 'ot_coordinator'],
      validations: ['intraop_documented'],
      emits: [HospitalPlatformEvents.ot.surgeryCompleted],
      metering: ['ot.surgery.completed'],
      auditLevel: 'critical',
    },
    {
      from: 'postop_recovery',
      to: 'completed',
      action: 'complete_case',
      roles: ['doctor', 'nurse', 'ot_coordinator'],
      validations: ['postop_handover_complete'],
      emits: [HospitalPlatformEvents.ot.caseCompleted],
      metering: ['ot.case.completed'],
      auditLevel: 'phi',
    },
    {
      from: ['scheduled', 'confirmed', 'preop_ready'],
      to: 'cancelled',
      action: 'cancel_case',
      roles: ['doctor', 'ot_coordinator', 'admin'],
      validations: ['cancel_reason_provided'],
      emits: [HospitalPlatformEvents.ot.caseCancelled],
      metering: ['ot.case.cancelled'],
      auditLevel: 'standard',
    },
  ],
};
