import { HospitalPlatformEvents } from '../events.js';
import type { LifecycleDefinition } from '../types.js';

export type InvoiceState =
  | 'draft'
  | 'pending_approval'
  | 'issued'
  | 'partial'
  | 'paid'
  | 'settled'
  | 'overdue'
  | 'refunded'
  | 'void';

export const invoiceLifecycle: LifecycleDefinition<InvoiceState> = {
  id: 'billing_invoice',
  label: 'Billing invoice',
  initial: 'draft',
  states: [
    'draft',
    'pending_approval',
    'issued',
    'partial',
    'paid',
    'settled',
    'overdue',
    'refunded',
    'void',
  ],
  transitions: [
    {
      from: 'draft',
      to: 'pending_approval',
      action: 'submit_for_approval',
      roles: ['billing', 'receptionist'],
      validations: ['line_items_present'],
      emits: [HospitalPlatformEvents.governance.approvalRequired],
      notifications: ['billing_approval_request'],
      metering: ['billing.approval_requested'],
      branchConfigKeys: ['billing.require_discount_approval'],
      auditLevel: 'standard',
    },
    {
      from: ['draft', 'pending_approval'],
      to: 'issued',
      action: 'issue_invoice',
      roles: ['billing', 'receptionist', 'admin'],
      validations: ['line_items_present', 'not_void'],
      emits: [HospitalPlatformEvents.billing.invoiceGenerated],
      notifications: ['invoice_issued_sms'],
      metering: ['billing.invoice_issued'],
      aiHooks: ['billing_anomaly_check'],
      auditLevel: 'standard',
    },
    {
      from: 'issued',
      to: 'partial',
      action: 'record_partial_payment',
      roles: ['billing', 'receptionist'],
      validations: ['payment_amount_valid', 'partial_payment_allowed', 'not_already_settled'],
      emits: [HospitalPlatformEvents.billing.paymentCollected],
      notifications: ['partial_payment_receipt'],
      metering: ['billing.partial_payment'],
      branchConfigKeys: ['billing.allow_partial_payment'],
      auditLevel: 'standard',
    },
    {
      from: ['issued', 'partial', 'overdue'],
      to: 'paid',
      action: 'record_full_payment',
      roles: ['billing', 'receptionist'],
      validations: ['payment_amount_valid', 'amount_matches', 'not_already_settled'],
      emits: [HospitalPlatformEvents.billing.paymentCollected],
      notifications: ['payment_receipt_sms'],
      metering: ['billing.payment_collected'],
      auditLevel: 'standard',
    },
    {
      from: ['paid', 'partial'],
      to: 'settled',
      action: 'settle_invoice',
      roles: ['billing', 'receptionist', 'admin'],
      validations: ['amount_matches', 'duplicate_settlement_blocked', 'not_void'],
      emits: [
        HospitalPlatformEvents.billing.invoiceSettled,
        HospitalPlatformEvents.billing.receiptGenerated,
      ],
      notifications: ['receipt_ready'],
      metering: ['billing.invoice_settled'],
      auditLevel: 'critical',
    },
    {
      from: 'issued',
      to: 'overdue',
      action: 'mark_overdue',
      roles: ['system', 'billing'],
      metering: ['billing.invoice_overdue'],
      auditLevel: 'standard',
    },
    {
      from: ['paid', 'settled', 'issued'],
      to: 'refunded',
      action: 'issue_refund',
      roles: ['billing', 'admin'],
      validations: ['refund_approval', 'not_void'],
      emits: [HospitalPlatformEvents.billing.refundIssued],
      metering: ['billing.refund_issued'],
      auditLevel: 'critical',
    },
    {
      from: ['draft', 'issued', 'partial'],
      to: 'void',
      action: 'void_invoice',
      roles: ['admin', 'billing'],
      validations: ['not_already_settled'],
      emits: [HospitalPlatformEvents.billing.invoiceVoided],
      metering: ['billing.invoice_voided'],
      auditLevel: 'critical',
    },
    {
      from: 'issued',
      to: 'draft',
      action: 'reverse_issue',
      roles: ['admin'],
      validations: ['not_already_settled'],
      emits: [HospitalPlatformEvents.workflow.automationRan],
      auditLevel: 'critical',
    },
  ],
};

export type InsurancePreauthState = 'not_required' | 'pending' | 'approved' | 'rejected' | 'expired';

export const insurancePreauthLifecycle: LifecycleDefinition<InsurancePreauthState> = {
  id: 'insurance_preauth',
  label: 'Insurance pre-authorization',
  initial: 'not_required',
  states: ['not_required', 'pending', 'approved', 'rejected', 'expired'],
  transitions: [
    {
      from: 'not_required',
      to: 'pending',
      action: 'request_preauth',
      roles: ['receptionist', 'billing'],
      emits: [HospitalPlatformEvents.insurance.preauthRequested],
      auditLevel: 'standard',
    },
    {
      from: 'pending',
      to: 'approved',
      action: 'approve_preauth',
      roles: ['billing', 'admin'],
      emits: [HospitalPlatformEvents.insurance.preauthApproved],
      auditLevel: 'standard',
    },
    {
      from: 'pending',
      to: 'rejected',
      action: 'reject_preauth',
      roles: ['billing', 'admin'],
      auditLevel: 'standard',
    },
  ],
};
