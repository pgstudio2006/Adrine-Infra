import { HospitalPlatformEvents } from '../events.js';
import type { LifecycleDefinition } from '../types.js';

/** Authoritative radiology study order lifecycle (RIS-aligned). */
export type RadiologyOrderState =
  | 'ordered'
  | 'scheduled'
  | 'imaging_in_progress'
  | 'awaiting_review'
  | 'critical_review'
  | 'approved'
  | 'published'
  | 'completed'
  | 'cancelled';

export const radiologyOrderLifecycle: LifecycleDefinition<RadiologyOrderState> = {
  id: 'radiology_order',
  label: 'Radiology study order',
  initial: 'ordered',
  states: [
    'ordered',
    'scheduled',
    'imaging_in_progress',
    'awaiting_review',
    'critical_review',
    'approved',
    'published',
    'completed',
    'cancelled',
  ],
  transitions: [
    {
      from: 'ordered',
      to: 'scheduled',
      action: 'schedule_study',
      roles: ['receptionist', 'radiology_technician', 'doctor', 'nurse'],
      validations: ['study_defined', 'patient_identified'],
      emits: [HospitalPlatformEvents.radiology.ordered],
      metering: ['radiology.order_scheduled'],
      auditLevel: 'standard',
    },
    {
      from: 'scheduled',
      to: 'imaging_in_progress',
      action: 'start_imaging',
      roles: ['radiology_technician', 'nurse'],
      validations: ['slot_confirmed'],
      emits: [HospitalPlatformEvents.radiology.imagingStarted],
      metering: ['radiology.imaging_started'],
      auditLevel: 'phi',
    },
    {
      from: 'imaging_in_progress',
      to: 'awaiting_review',
      action: 'complete_imaging',
      roles: ['radiology_technician'],
      validations: ['images_acquired'],
      emits: [HospitalPlatformEvents.radiology.imagesAcquired],
      auditLevel: 'phi',
    },
    {
      from: 'awaiting_review',
      to: 'critical_review',
      action: 'flag_critical',
      roles: ['radiologist', 'doctor'],
      validations: ['critical_finding_documented'],
      emits: [HospitalPlatformEvents.radiology.criticalFlagged],
      notifications: ['critical_imaging_alert'],
      metering: ['radiology.critical_escalation'],
      auditLevel: 'critical',
    },
    {
      from: ['awaiting_review', 'critical_review'],
      to: 'approved',
      action: 'approve_report',
      roles: ['radiologist', 'doctor'],
      validations: ['report_complete', 'critical_acknowledged_if_required'],
      emits: [HospitalPlatformEvents.radiology.reportApproved],
      auditLevel: 'phi',
    },
    {
      from: 'approved',
      to: 'published',
      action: 'publish_report',
      roles: ['radiologist'],
      emits: [HospitalPlatformEvents.radiology.reportPublished],
      notifications: ['patient_report_ready'],
      metering: ['radiology.report_published'],
      auditLevel: 'phi',
    },
    {
      from: 'published',
      to: 'completed',
      action: 'complete_order',
      roles: ['radiologist', 'system'],
      emits: [HospitalPlatformEvents.radiology.orderCompleted, HospitalPlatformEvents.radiology.reported],
      auditLevel: 'standard',
    },
    {
      from: ['ordered', 'scheduled', 'imaging_in_progress', 'awaiting_review'],
      to: 'cancelled',
      action: 'cancel_order',
      roles: ['doctor', 'radiologist', 'admin'],
      validations: ['cancel_reason_provided'],
      emits: [HospitalPlatformEvents.radiology.orderCancelled],
      metering: ['radiology.order_cancelled'],
      auditLevel: 'critical',
    },
  ],
};
