import { HospitalPlatformEvents } from '../events.js';
import type { LifecycleDefinition } from '../types.js';

/** Central store stock move (issue, transfer, receive, adjustment). */
export type InventoryStockMoveState =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'issued'
  | 'in_transit'
  | 'received'
  | 'cancelled';

export const inventoryStockMoveLifecycle: LifecycleDefinition<InventoryStockMoveState> = {
  id: 'inventory_stock_move',
  label: 'Inventory stock move',
  initial: 'draft',
  states: ['draft', 'submitted', 'approved', 'issued', 'in_transit', 'received', 'cancelled'],
  transitions: [
    {
      from: 'draft',
      to: 'submitted',
      action: 'submit_move',
      roles: ['storekeeper', 'nurse', 'pharmacist', 'admin'],
      validations: ['quantity_positive', 'catalog_item_active'],
      emits: [HospitalPlatformEvents.inventory.moveSubmitted],
      metering: ['inventory.move.submitted'],
      auditLevel: 'standard',
    },
    {
      from: 'submitted',
      to: 'approved',
      action: 'approve_move',
      roles: ['storekeeper', 'admin', 'medical_superintendent'],
      validations: ['approval_within_policy'],
      emits: [HospitalPlatformEvents.inventory.moveApproved],
      metering: ['inventory.move.approved'],
      auditLevel: 'standard',
    },
    {
      from: 'approved',
      to: 'issued',
      action: 'issue_stock',
      roles: ['storekeeper', 'pharmacist'],
      validations: ['stock_available'],
      emits: [HospitalPlatformEvents.inventory.stockIssued],
      metering: ['inventory.stock.issued'],
      auditLevel: 'standard',
    },
    {
      from: 'issued',
      to: 'in_transit',
      action: 'dispatch_transfer',
      roles: ['storekeeper', 'logistics'],
      emits: [HospitalPlatformEvents.inventory.stockIssued],
      metering: ['inventory.transfer.dispatched'],
      auditLevel: 'standard',
    },
    {
      from: ['issued', 'in_transit'],
      to: 'received',
      action: 'receive_stock',
      roles: ['storekeeper', 'nurse', 'pharmacist'],
      validations: ['receipt_confirmed'],
      emits: [HospitalPlatformEvents.inventory.stockReceived],
      metering: ['inventory.stock.received'],
      auditLevel: 'standard',
    },
    {
      from: ['draft', 'submitted', 'approved'],
      to: 'cancelled',
      action: 'cancel_move',
      roles: ['storekeeper', 'admin'],
      validations: ['cancel_reason_provided'],
      emits: [HospitalPlatformEvents.inventory.moveCancelled],
      metering: ['inventory.move.cancelled'],
      auditLevel: 'standard',
    },
  ],
};
