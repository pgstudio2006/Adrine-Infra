import { HospitalPlatformEvents } from '../events.js';
import type { LifecycleDefinition } from '../types.js';

/** Authoritative pharmacy prescription fulfillment lifecycle. */
export type PharmacyFulfillmentState =
  | 'prescribed'
  | 'awaiting_review'
  | 'inventory_reserved'
  | 'preparing'
  | 'ready_to_dispense'
  | 'partially_dispensed'
  | 'dispensed'
  | 'completed'
  | 'cancelled'
  | 'returned'
  | 'refill_pending';

export const pharmacyFulfillmentLifecycle: LifecycleDefinition<PharmacyFulfillmentState> = {
  id: 'pharmacy_dispense',
  label: 'Pharmacy prescription fulfillment',
  initial: 'prescribed',
  states: [
    'prescribed',
    'awaiting_review',
    'inventory_reserved',
    'preparing',
    'ready_to_dispense',
    'partially_dispensed',
    'dispensed',
    'completed',
    'cancelled',
    'returned',
    'refill_pending',
  ],
  transitions: [
    {
      from: 'prescribed',
      to: 'awaiting_review',
      action: 'validate_prescription',
      roles: ['doctor', 'pharmacist', 'nurse'],
      validations: ['medications_defined', 'patient_identified'],
      emits: [HospitalPlatformEvents.pharmacy.prescriptionCreated],
      metering: ['pharmacy.prescription_validated'],
      auditLevel: 'phi',
    },
    {
      from: 'awaiting_review',
      to: 'awaiting_review',
      action: 'approve_controlled',
      roles: ['pharmacist', 'doctor', 'admin'],
      validations: ['controlled_substance_approved'],
      emits: [HospitalPlatformEvents.governance.approvalGranted],
      metering: ['pharmacy.controlled_approved'],
      auditLevel: 'critical',
    },
    {
      from: 'awaiting_review',
      to: 'inventory_reserved',
      action: 'reserve_inventory',
      roles: ['pharmacist'],
      validations: [
        'stock_available',
        'batch_not_expired',
        'controlled_substance_approved',
      ],
      emits: [HospitalPlatformEvents.pharmacy.inventoryReserved],
      metering: ['pharmacy.inventory_reserved'],
      notifications: ['inventory_reserved'],
      auditLevel: 'standard',
    },
    {
      from: 'inventory_reserved',
      to: 'preparing',
      action: 'start_preparation',
      roles: ['pharmacist'],
      emits: [HospitalPlatformEvents.pharmacy.dispensePreparing],
      metering: ['pharmacy.preparation_started'],
      auditLevel: 'standard',
    },
    {
      from: 'preparing',
      to: 'preparing',
      action: 'substitute_medication',
      roles: ['pharmacist', 'doctor'],
      validations: ['substitute_authorized'],
      metering: ['pharmacy.substitute_applied'],
      auditLevel: 'phi',
    },
    {
      from: 'preparing',
      to: 'ready_to_dispense',
      action: 'approve_dispense',
      roles: ['pharmacist'],
      validations: ['pharmacist_sign_off'],
      metering: ['pharmacy.dispense_approved'],
      auditLevel: 'phi',
    },
    {
      from: 'ready_to_dispense',
      to: 'dispensed',
      action: 'dispense_full',
      roles: ['pharmacist'],
      validations: ['dispense_quantities_valid'],
      emits: [HospitalPlatformEvents.pharmacy.dispenseCompleted],
      metering: ['pharmacy.dispense_completed'],
      notifications: ['medication_dispensed'],
      auditLevel: 'phi',
    },
    {
      from: 'ready_to_dispense',
      to: 'partially_dispensed',
      action: 'dispense_partial',
      roles: ['pharmacist'],
      validations: ['dispense_quantities_valid', 'partial_dispense_allowed'],
      emits: [HospitalPlatformEvents.pharmacy.dispensePartial],
      metering: ['pharmacy.dispense_partial'],
      auditLevel: 'phi',
    },
    {
      from: 'partially_dispensed',
      to: 'partially_dispensed',
      action: 'dispense_partial',
      roles: ['pharmacist'],
      validations: ['dispense_quantities_valid', 'partial_dispense_allowed'],
      emits: [HospitalPlatformEvents.pharmacy.dispensePartial],
      metering: ['pharmacy.dispense_partial'],
      auditLevel: 'phi',
    },
    {
      from: 'partially_dispensed',
      to: 'dispensed',
      action: 'complete_dispense',
      roles: ['pharmacist'],
      validations: ['dispense_quantities_valid'],
      emits: [HospitalPlatformEvents.pharmacy.dispenseCompleted],
      metering: ['pharmacy.dispense_completed'],
      auditLevel: 'phi',
    },
    {
      from: 'dispensed',
      to: 'completed',
      action: 'complete_fulfillment',
      roles: ['pharmacist', 'system'],
      metering: ['pharmacy.fulfillment_completed'],
      auditLevel: 'standard',
    },
    {
      from: ['prescribed', 'awaiting_review', 'inventory_reserved', 'preparing', 'ready_to_dispense'],
      to: 'cancelled',
      action: 'cancel_prescription',
      roles: ['doctor', 'pharmacist', 'admin'],
      validations: ['cancel_reason_provided'],
      emits: [
        HospitalPlatformEvents.pharmacy.prescriptionCancelled,
        HospitalPlatformEvents.pharmacy.inventoryReleased,
      ],
      metering: ['pharmacy.prescription_cancelled'],
      auditLevel: 'critical',
    },
    {
      from: ['dispensed', 'partially_dispensed', 'completed'],
      to: 'returned',
      action: 'process_return',
      roles: ['pharmacist'],
      validations: ['return_reason_provided'],
      emits: [
        HospitalPlatformEvents.pharmacy.returnProcessed,
        HospitalPlatformEvents.pharmacy.inventoryReleased,
      ],
      metering: ['pharmacy.return_processed'],
      auditLevel: 'phi',
    },
    {
      from: 'completed',
      to: 'refill_pending',
      action: 'request_refill',
      roles: ['doctor', 'pharmacist', 'receptionist'],
      metering: ['pharmacy.refill_requested'],
      auditLevel: 'standard',
    },
    {
      from: 'refill_pending',
      to: 'prescribed',
      action: 'restart_refill',
      roles: ['pharmacist', 'doctor'],
      emits: [HospitalPlatformEvents.pharmacy.prescriptionCreated],
      auditLevel: 'standard',
    },
  ],
};
