import { HospitalPlatformEvents } from '../events.js';
import type { LifecycleDefinition } from '../types.js';

export type IpdAdmissionState =
  | 'admission_requested'
  | 'awaiting_approval'
  | 'bed_assignment_pending'
  | 'admitted'
  | 'active_care'
  | 'transfer_pending'
  | 'transferred'
  | 'discharge_pending'
  | 'discharged'
  | 'cancelled';

export const ipdAdmissionLifecycle: LifecycleDefinition<IpdAdmissionState> = {
  id: 'admission',
  label: 'IPD admission',
  initial: 'admission_requested',
  states: [
    'admission_requested',
    'awaiting_approval',
    'bed_assignment_pending',
    'admitted',
    'active_care',
    'transfer_pending',
    'transferred',
    'discharge_pending',
    'discharged',
    'cancelled',
  ],
  transitions: [
    {
      from: 'admission_requested',
      to: 'awaiting_approval',
      action: 'submit_for_approval',
      roles: ['receptionist', 'nurse', 'admin'],
      validations: ['patient_identified', 'admission_reason_documented'],
      emits: [HospitalPlatformEvents.ipd.admissionRequested],
      metering: ['ipd.admission.requested'],
      auditLevel: 'standard',
    },
    {
      from: 'awaiting_approval',
      to: 'bed_assignment_pending',
      action: 'approve_admission',
      roles: ['admin', 'medical_superintendent', 'billing'],
      validations: ['approval_granted', 'deposit_or_preauth'],
      emits: [HospitalPlatformEvents.ipd.admissionApproved],
      metering: ['ipd.admission.approved'],
      auditLevel: 'phi',
    },
    {
      from: ['admission_requested', 'awaiting_approval', 'bed_assignment_pending'],
      to: 'bed_assignment_pending',
      action: 'request_bed_assignment',
      roles: ['receptionist', 'nurse', 'ward_incharge'],
      validations: ['ward_selected'],
      emits: [HospitalPlatformEvents.bed.reserved],
      auditLevel: 'standard',
    },
    {
      from: 'bed_assignment_pending',
      to: 'admitted',
      action: 'confirm_admission',
      roles: ['receptionist', 'nurse', 'ward_incharge'],
      validations: ['bed_assigned', 'consent_signed', 'attending_doctor_assigned'],
      emits: [
        HospitalPlatformEvents.ipd.admitted,
        HospitalPlatformEvents.bed.occupied,
        HospitalPlatformEvents.encounter.opened,
      ],
      notifications: ['admission_confirmed_sms'],
      metering: ['ipd.admission.confirmed'],
      auditLevel: 'phi',
    },
    {
      from: 'admitted',
      to: 'active_care',
      action: 'start_active_care',
      roles: ['nurse', 'doctor'],
      validations: ['care_plan_documented'],
      emits: [HospitalPlatformEvents.ipd.activeCareStarted],
      metering: ['ipd.care.started'],
      auditLevel: 'standard',
    },
    {
      from: ['admitted', 'active_care'],
      to: 'transfer_pending',
      action: 'initiate_transfer',
      roles: ['doctor', 'nurse', 'admin'],
      validations: ['transfer_destination_valid', 'bed_available_at_destination'],
      emits: [HospitalPlatformEvents.ipd.transferInitiated],
      auditLevel: 'critical',
    },
    {
      from: 'transfer_pending',
      to: 'transferred',
      action: 'complete_transfer',
      roles: ['nurse', 'ward_incharge', 'admin'],
      validations: ['bed_assigned', 'handover_documented'],
      emits: [
        HospitalPlatformEvents.ipd.transferred,
        HospitalPlatformEvents.bed.released,
        HospitalPlatformEvents.bed.occupied,
      ],
      auditLevel: 'phi',
    },
    {
      from: ['active_care', 'transferred'],
      to: 'discharge_pending',
      action: 'initiate_discharge',
      roles: ['doctor', 'nurse'],
      validations: ['discharge_orchestration_started'],
      emits: [HospitalPlatformEvents.ipd.dischargeInitiated],
      auditLevel: 'phi',
    },
    {
      from: 'discharge_pending',
      to: 'discharged',
      action: 'complete_discharge',
      roles: ['receptionist', 'billing', 'nurse'],
      validations: ['discharge_clearances_complete', 'final_bill_settled'],
      emits: [
        HospitalPlatformEvents.ipd.discharged,
        HospitalPlatformEvents.discharge.completed,
        HospitalPlatformEvents.bed.released,
      ],
      notifications: ['patient_discharge_summary'],
      metering: ['ipd.discharge.completed'],
      auditLevel: 'phi',
    },
    {
      from: ['admission_requested', 'awaiting_approval', 'bed_assignment_pending'],
      to: 'cancelled',
      action: 'cancel_admission',
      roles: ['admin', 'receptionist'],
      validations: ['cancel_reason_provided'],
      emits: [HospitalPlatformEvents.ipd.admissionCancelled, HospitalPlatformEvents.bed.released],
      auditLevel: 'standard',
    },
  ],
};

/** @deprecated Use ipdAdmissionLifecycle */
export const admissionLifecycle = ipdAdmissionLifecycle;
export type AdmissionState = IpdAdmissionState;
