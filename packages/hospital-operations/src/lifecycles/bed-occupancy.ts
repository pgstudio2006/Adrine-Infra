import { HospitalPlatformEvents } from '../events.js';
import type { LifecycleDefinition } from '../types.js';

export type BedOccupancyState =
  | 'available'
  | 'reserved'
  | 'occupied'
  | 'cleaning_pending'
  | 'maintenance'
  | 'blocked';

export const bedOccupancyLifecycle: LifecycleDefinition<BedOccupancyState> = {
  id: 'bed_allocation',
  label: 'Bed occupancy',
  initial: 'available',
  states: ['available', 'reserved', 'occupied', 'cleaning_pending', 'maintenance', 'blocked'],
  transitions: [
    {
      from: 'available',
      to: 'reserved',
      action: 'reserve_bed',
      roles: ['receptionist', 'nurse', 'ward_incharge', 'admin'],
      validations: ['bed_not_double_booked', 'admission_linked'],
      emits: [HospitalPlatformEvents.bed.reserved],
      metering: ['bed.reserved'],
      auditLevel: 'standard',
    },
    {
      from: 'reserved',
      to: 'occupied',
      action: 'occupy_bed',
      roles: ['receptionist', 'nurse', 'ward_incharge'],
      validations: ['admission_confirmed', 'patient_identified'],
      emits: [HospitalPlatformEvents.bed.occupied],
      auditLevel: 'phi',
    },
    {
      from: 'occupied',
      to: 'cleaning_pending',
      action: 'release_bed',
      roles: ['nurse', 'ward_incharge', 'housekeeping'],
      validations: ['admission_discharged_or_transferred'],
      emits: [HospitalPlatformEvents.bed.released],
      auditLevel: 'standard',
    },
    {
      from: 'cleaning_pending',
      to: 'available',
      action: 'mark_cleaned',
      roles: ['housekeeping', 'ward_incharge', 'nurse'],
      validations: ['cleaning_checklist_complete'],
      emits: [HospitalPlatformEvents.bed.available],
      auditLevel: 'standard',
    },
    {
      from: ['available', 'cleaning_pending'],
      to: 'maintenance',
      action: 'start_maintenance',
      roles: ['admin', 'facility', 'ward_incharge'],
      validations: ['maintenance_reason_provided'],
      emits: [HospitalPlatformEvents.bed.maintenanceStarted],
      auditLevel: 'standard',
    },
    {
      from: 'maintenance',
      to: 'available',
      action: 'complete_maintenance',
      roles: ['facility', 'admin', 'ward_incharge'],
      emits: [HospitalPlatformEvents.bed.available],
      auditLevel: 'standard',
    },
    {
      from: ['available', 'reserved', 'cleaning_pending'],
      to: 'blocked',
      action: 'block_bed',
      roles: ['admin', 'ward_incharge', 'medical_superintendent'],
      validations: ['block_reason_provided'],
      emits: [HospitalPlatformEvents.bed.blocked],
      auditLevel: 'standard',
    },
    {
      from: 'blocked',
      to: 'available',
      action: 'unblock_bed',
      roles: ['admin', 'ward_incharge'],
      emits: [HospitalPlatformEvents.bed.available],
      auditLevel: 'standard',
    },
    {
      from: 'reserved',
      to: 'available',
      action: 'cancel_reservation',
      roles: ['receptionist', 'admin', 'nurse'],
      validations: ['cancel_reason_provided'],
      emits: [HospitalPlatformEvents.bed.released],
      auditLevel: 'standard',
    },
  ],
};
