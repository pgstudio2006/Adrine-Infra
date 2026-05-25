import { HospitalPlatformEvents } from '../events.js';
import type { LifecycleDefinition } from '../types.js';

export type InsuranceAuthorizationState =
  | 'initiated'
  | 'documents_pending'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'partially_approved'
  | 'rejected'
  | 'settled';

export const insuranceTpaLifecycle: LifecycleDefinition<InsuranceAuthorizationState> = {
  id: 'tpa_claim',
  label: 'Insurance / TPA authorization',
  initial: 'initiated',
  states: [
    'initiated',
    'documents_pending',
    'submitted',
    'under_review',
    'approved',
    'partially_approved',
    'rejected',
    'settled',
  ],
  transitions: [
    {
      from: 'initiated',
      to: 'documents_pending',
      action: 'request_documents',
      roles: ['billing', 'insurance_desk', 'receptionist'],
      validations: ['policy_details_captured'],
      emits: [HospitalPlatformEvents.insurance.authorizationInitiated],
      auditLevel: 'standard',
    },
    {
      from: 'documents_pending',
      to: 'submitted',
      action: 'submit_to_tpa',
      roles: ['insurance_desk', 'billing'],
      validations: ['required_documents_uploaded'],
      emits: [HospitalPlatformEvents.insurance.submitted],
      metering: ['insurance.submitted'],
      auditLevel: 'standard',
    },
    {
      from: 'submitted',
      to: 'under_review',
      action: 'mark_under_review',
      roles: ['insurance_desk', 'admin'],
      emits: [HospitalPlatformEvents.insurance.underReview],
      auditLevel: 'standard',
    },
    {
      from: 'under_review',
      to: 'approved',
      action: 'approve_authorization',
      roles: ['insurance_desk', 'admin', 'billing'],
      validations: ['approved_amount_documented'],
      emits: [HospitalPlatformEvents.insurance.approved],
      auditLevel: 'phi',
    },
    {
      from: 'under_review',
      to: 'partially_approved',
      action: 'partially_approve',
      roles: ['insurance_desk', 'admin', 'billing'],
      validations: ['approved_amount_documented', 'partial_reason_documented'],
      emits: [HospitalPlatformEvents.insurance.partiallyApproved],
      auditLevel: 'phi',
    },
    {
      from: 'under_review',
      to: 'rejected',
      action: 'reject_authorization',
      roles: ['insurance_desk', 'admin'],
      validations: ['rejection_reason_provided'],
      emits: [HospitalPlatformEvents.insurance.rejected],
      auditLevel: 'standard',
    },
    {
      from: ['approved', 'partially_approved'],
      to: 'settled',
      action: 'settle_claim',
      roles: ['billing', 'insurance_desk'],
      validations: ['settlement_amount_matched'],
      emits: [HospitalPlatformEvents.insurance.settled],
      metering: ['insurance.settled'],
      auditLevel: 'standard',
    },
    {
      from: ['initiated', 'documents_pending', 'submitted'],
      to: 'rejected',
      action: 'withdraw_authorization',
      roles: ['billing', 'admin', 'patient_services'],
      validations: ['cancel_reason_provided'],
      emits: [HospitalPlatformEvents.insurance.withdrawn],
      auditLevel: 'standard',
    },
  ],
};
