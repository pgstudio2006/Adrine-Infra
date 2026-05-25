export type InsuranceValidationContext = {
  policyDetailsCaptured?: boolean;
  requiredDocumentsUploaded?: boolean;
  approvedAmountDocumented?: boolean;
  partialReasonDocumented?: boolean;
  rejectionReasonProvided?: boolean;
  settlementAmountMatched?: boolean;
  cancelReasonProvided?: boolean;
};

const VALIDATORS: Record<string, (c: InsuranceValidationContext) => string | null> = {
  policy_details_captured: (c) =>
    c.policyDetailsCaptured === false ? 'Insurance policy details required' : null,
  required_documents_uploaded: (c) =>
    c.requiredDocumentsUploaded === false ? 'Required documents must be uploaded' : null,
  approved_amount_documented: (c) =>
    c.approvedAmountDocumented === false ? 'Approved amount must be documented' : null,
  partial_reason_documented: (c) =>
    c.partialReasonDocumented === false ? 'Partial approval reason required' : null,
  rejection_reason_provided: (c) =>
    c.rejectionReasonProvided === false ? 'Rejection reason required' : null,
  settlement_amount_matched: (c) =>
    c.settlementAmountMatched === false ? 'Settlement amount must match authorization' : null,
  cancel_reason_provided: (c) =>
    c.cancelReasonProvided === false ? 'Cancellation reason required' : null,
};

export function runInsuranceValidations(
  validationIds: readonly string[] | undefined,
  ctx: InsuranceValidationContext,
): string | null {
  if (!validationIds?.length) return null;
  for (const id of validationIds) {
    const fn = VALIDATORS[id];
    if (!fn) continue;
    const err = fn(ctx);
    if (err) return err;
  }
  return null;
}
