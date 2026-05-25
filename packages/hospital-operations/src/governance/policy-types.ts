/**
 * Organization / branch governance policy keys and value shapes.
 */

export const GovernancePolicyKeys = {
  billing: 'billing',
  discharge: 'discharge',
  nursingEscalation: 'nursing_escalation',
  controlledDrug: 'controlled_drug',
  insuranceApproval: 'insurance_approval',
} as const;

export type GovernancePolicyKey = (typeof GovernancePolicyKeys)[keyof typeof GovernancePolicyKeys];

export type BillingPolicyValue = {
  paymentRequired: boolean;
  allowPartialPayment: boolean;
  maxOutstandingCents?: number;
};

export type DischargePolicyValue = {
  requireClinicalClearance: boolean;
  requireBillingClearance: boolean;
  blockWithoutInsuranceAuth: boolean;
};

export type NursingEscalationPolicyValue = {
  missedTaskThresholdMinutes: number;
  autoEscalate: boolean;
};

export type ControlledDrugPolicyValue = {
  dualSignOff: boolean;
  pharmacistApproval: boolean;
};

export type InsuranceApprovalPolicyValue = {
  requirePreAuthForIpd: boolean;
  requirePreAuthAboveCents: number;
};

export type PolicyDefinitionPayload = {
  key: GovernancePolicyKey;
  label: string;
  defaultValue: Record<string, unknown>;
  schemaVersion: number;
};

export type EffectivePolicyMap = Partial<
  Record<
    GovernancePolicyKey,
    BillingPolicyValue | DischargePolicyValue | NursingEscalationPolicyValue | ControlledDrugPolicyValue | InsuranceApprovalPolicyValue
  >
>;

export const DEFAULT_POLICIES: PolicyDefinitionPayload[] = [
  {
    key: GovernancePolicyKeys.billing,
    label: 'Billing',
    defaultValue: { paymentRequired: true, allowPartialPayment: true },
    schemaVersion: 1,
  },
  {
    key: GovernancePolicyKeys.discharge,
    label: 'Discharge',
    defaultValue: {
      requireClinicalClearance: true,
      requireBillingClearance: true,
      blockWithoutInsuranceAuth: false,
    },
    schemaVersion: 1,
  },
  {
    key: GovernancePolicyKeys.nursingEscalation,
    label: 'Nursing escalation',
    defaultValue: { missedTaskThresholdMinutes: 30, autoEscalate: true },
    schemaVersion: 1,
  },
  {
    key: GovernancePolicyKeys.controlledDrug,
    label: 'Controlled drug',
    defaultValue: { dualSignOff: true, pharmacistApproval: true },
    schemaVersion: 1,
  },
  {
    key: GovernancePolicyKeys.insuranceApproval,
    label: 'Insurance approval',
    defaultValue: { requirePreAuthForIpd: true, requirePreAuthAboveCents: 500000 },
    schemaVersion: 1,
  },
];
