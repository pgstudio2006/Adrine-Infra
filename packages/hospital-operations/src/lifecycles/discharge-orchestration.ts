import { HospitalPlatformEvents } from '../events.js';
import type { LifecycleDefinition } from '../types.js';

export type DischargeOrchestrationState =
  | 'initiated'
  | 'clinical_clearance_pending'
  | 'billing_clearance_pending'
  | 'pharmacy_clearance_pending'
  | 'nursing_clearance_pending'
  | 'insurance_clearance_pending'
  | 'ready_for_discharge'
  | 'discharged'
  | 'cancelled';

export const dischargeOrchestrationLifecycle: LifecycleDefinition<DischargeOrchestrationState> = {
  id: 'discharge',
  label: 'Discharge orchestration',
  initial: 'initiated',
  states: [
    'initiated',
    'clinical_clearance_pending',
    'billing_clearance_pending',
    'pharmacy_clearance_pending',
    'nursing_clearance_pending',
    'insurance_clearance_pending',
    'ready_for_discharge',
    'discharged',
    'cancelled',
  ],
  transitions: [
    {
      from: 'initiated',
      to: 'clinical_clearance_pending',
      action: 'start_clinical_clearance',
      roles: ['doctor', 'nurse'],
      validations: ['discharge_summary_draft'],
      emits: [HospitalPlatformEvents.discharge.initiated, HospitalPlatformEvents.discharge.summaryDrafted],
      auditLevel: 'phi',
    },
    {
      from: 'clinical_clearance_pending',
      to: 'billing_clearance_pending',
      action: 'grant_clinical_clearance',
      roles: ['doctor'],
      validations: ['clinical_note_signed', 'discharge_medications_reconciled'],
      emits: [HospitalPlatformEvents.discharge.clinicalCleared],
      auditLevel: 'phi',
    },
    {
      from: 'billing_clearance_pending',
      to: 'pharmacy_clearance_pending',
      action: 'grant_billing_clearance',
      roles: ['billing', 'receptionist'],
      validations: ['interim_bill_reviewed', 'no_billing_blockers'],
      emits: [HospitalPlatformEvents.discharge.billingCleared],
      auditLevel: 'standard',
    },
    {
      from: 'pharmacy_clearance_pending',
      to: 'nursing_clearance_pending',
      action: 'grant_pharmacy_clearance',
      roles: ['pharmacist', 'nurse'],
      validations: ['ip_pharmacy_fulfilled_or_deferred'],
      emits: [HospitalPlatformEvents.discharge.pharmacyCleared],
      auditLevel: 'standard',
    },
    {
      from: 'nursing_clearance_pending',
      to: 'insurance_clearance_pending',
      action: 'grant_nursing_clearance',
      roles: ['nurse', 'nurse_supervisor'],
      validations: ['nursing_tasks_complete', 'patient_education_documented'],
      emits: [HospitalPlatformEvents.discharge.nursingCleared],
      auditLevel: 'standard',
    },
    {
      from: 'insurance_clearance_pending',
      to: 'ready_for_discharge',
      action: 'grant_insurance_clearance',
      roles: ['billing', 'insurance_desk', 'admin'],
      validations: ['insurance_settled_or_self_pay', 'no_discharge_blockers'],
      emits: [HospitalPlatformEvents.discharge.insuranceCleared],
      auditLevel: 'standard',
    },
    {
      from: 'ready_for_discharge',
      to: 'discharged',
      action: 'complete_discharge',
      roles: ['receptionist', 'billing', 'nurse'],
      validations: ['final_bill_settled', 'bed_release_scheduled'],
      emits: [HospitalPlatformEvents.discharge.completed, HospitalPlatformEvents.ipd.discharged],
      notifications: ['patient_discharge_summary'],
      metering: ['discharge.completed'],
      auditLevel: 'phi',
    },
    {
      from: [
        'initiated',
        'clinical_clearance_pending',
        'billing_clearance_pending',
        'pharmacy_clearance_pending',
        'nursing_clearance_pending',
        'insurance_clearance_pending',
      ],
      to: 'cancelled',
      action: 'cancel_discharge',
      roles: ['doctor', 'admin'],
      validations: ['cancel_reason_provided'],
      emits: [HospitalPlatformEvents.discharge.cancelled],
      auditLevel: 'standard',
    },
  ],
};
