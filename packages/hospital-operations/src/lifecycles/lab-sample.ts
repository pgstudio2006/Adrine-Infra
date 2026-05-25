import { HospitalPlatformEvents } from '../events.js';
import type { LifecycleDefinition } from '../types.js';

/** Authoritative Lab/LIMS sample & diagnostic lifecycle. */
export type LabOrderState =
  | 'ordered'
  | 'awaiting_collection'
  | 'collected'
  | 'labeled'
  | 'in_transit'
  | 'in_processing'
  | 'awaiting_review'
  | 'critical_review'
  | 'approved'
  | 'published'
  | 'completed'
  | 'cancelled'
  | 'recollect_required';

export const labSampleLifecycle: LifecycleDefinition<LabOrderState> = {
  id: 'lab_order',
  label: 'Laboratory order & sample',
  initial: 'ordered',
  states: [
    'ordered',
    'awaiting_collection',
    'collected',
    'labeled',
    'in_transit',
    'in_processing',
    'awaiting_review',
    'critical_review',
    'approved',
    'published',
    'completed',
    'cancelled',
    'recollect_required',
  ],
  transitions: [
    {
      from: 'ordered',
      to: 'awaiting_collection',
      action: 'validate_order',
      roles: ['doctor', 'lab_technician', 'receptionist', 'nurse'],
      validations: ['tests_defined', 'patient_identified'],
      emits: [HospitalPlatformEvents.lab.ordered],
      metering: ['lab.order_validated'],
      auditLevel: 'standard',
    },
    {
      from: 'awaiting_collection',
      to: 'collected',
      action: 'collect_sample',
      roles: ['nurse', 'lab_technician', 'receptionist'],
      validations: ['patient_identified', 'barcode_linked', 'consent_for_sample'],
      emits: [HospitalPlatformEvents.lab.sampleCollected],
      notifications: ['sample_collected'],
      metering: ['lab.sample_collected'],
      auditLevel: 'phi',
    },
    {
      from: 'collected',
      to: 'labeled',
      action: 'label_sample',
      roles: ['lab_technician', 'nurse'],
      metering: ['lab.sample_labeled'],
      auditLevel: 'standard',
    },
    {
      from: ['collected', 'labeled'],
      to: 'in_transit',
      action: 'transfer_sample',
      roles: ['lab_technician', 'nurse'],
      emits: [HospitalPlatformEvents.lab.sampleTransferred],
      metering: ['lab.sample_transferred'],
      auditLevel: 'standard',
    },
    {
      from: ['labeled', 'in_transit', 'collected'],
      to: 'in_processing',
      action: 'start_processing',
      roles: ['lab_technician'],
      emits: [HospitalPlatformEvents.lab.processingStarted],
      metering: ['lab.processing_started'],
      aiHooks: ['analyzer_readiness_check'],
      auditLevel: 'standard',
    },
    {
      from: 'in_processing',
      to: 'awaiting_review',
      action: 'enter_results',
      roles: ['lab_technician'],
      validations: ['results_complete'],
      emits: [HospitalPlatformEvents.lab.resultEntered],
      metering: ['lab.result_entered'],
      auditLevel: 'phi',
    },
    {
      from: 'awaiting_review',
      to: 'critical_review',
      action: 'flag_critical',
      roles: ['lab_technician', 'doctor'],
      validations: ['critical_values_present'],
      emits: [HospitalPlatformEvents.lab.resultCritical],
      notifications: ['critical_value_alert', 'doctor_notify'],
      metering: ['lab.critical_escalation'],
      auditLevel: 'critical',
    },
    {
      from: ['awaiting_review', 'critical_review'],
      to: 'approved',
      action: 'approve_results',
      roles: ['doctor', 'lab_technician'],
      validations: ['critical_acknowledged_if_required'],
      emits: [HospitalPlatformEvents.lab.reportApproved],
      notifications: ['doctor_approval'],
      metering: ['lab.report_approved'],
      auditLevel: 'phi',
    },
    {
      from: ['awaiting_review', 'critical_review'],
      to: 'approved',
      action: 'verify_results',
      roles: ['doctor', 'lab_technician'],
      validations: ['results_complete', 'critical_acknowledged_if_required'],
      emits: [HospitalPlatformEvents.lab.reportApproved],
      notifications: ['doctor_approval'],
      metering: ['lab.report_verified'],
      auditLevel: 'phi',
    },
    {
      from: 'approved',
      to: 'published',
      action: 'publish_report',
      roles: ['lab_technician'],
      emits: [HospitalPlatformEvents.lab.reportPublished],
      notifications: ['patient_report_ready'],
      metering: ['lab.report_published'],
      auditLevel: 'phi',
    },
    {
      from: 'published',
      to: 'completed',
      action: 'complete_order',
      roles: ['lab_technician', 'system'],
      emits: [HospitalPlatformEvents.lab.orderCompleted],
      auditLevel: 'standard',
    },
    {
      from: ['ordered', 'awaiting_collection', 'collected', 'labeled', 'in_transit', 'in_processing'],
      to: 'cancelled',
      action: 'cancel_order',
      roles: ['doctor', 'lab_technician', 'admin'],
      validations: ['cancel_reason_provided'],
      emits: [HospitalPlatformEvents.lab.orderCancelled],
      metering: ['lab.order_cancelled'],
      auditLevel: 'critical',
    },
    {
      from: ['collected', 'in_processing', 'awaiting_review'],
      to: 'recollect_required',
      action: 'request_recollect',
      roles: ['lab_technician', 'doctor'],
      validations: ['recollect_reason_provided'],
      emits: [HospitalPlatformEvents.lab.recollectRequired],
      notifications: ['recollect_patient'],
      auditLevel: 'phi',
    },
    {
      from: 'recollect_required',
      to: 'awaiting_collection',
      action: 'restart_collection',
      roles: ['nurse', 'lab_technician'],
      auditLevel: 'standard',
    },
  ],
};

/** @deprecated alias — use labSampleLifecycle */
export const labOrderLifecycle = labSampleLifecycle;
export type { LabOrderState as LabSampleState };
