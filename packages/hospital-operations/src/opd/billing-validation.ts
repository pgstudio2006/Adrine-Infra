export type InvoiceValidationContext = {
  lineItemsPresent?: boolean;
  amountMatches?: boolean;
  notAlreadySettled?: boolean;
  notVoid?: boolean;
  refundApproval?: boolean;
  approvalGranted?: boolean;
  opdVisitInBillingPending?: boolean;
  paymentRequired?: boolean;
  duplicateSettlementBlocked?: boolean;
  visitNotEscalatedOrSupervisor?: boolean;
  corporateCreditOk?: boolean;
  insurancePreauthOk?: boolean;
  partialPaymentAllowed?: boolean;
  paymentAmountValid?: boolean;
};

const VALIDATORS: Record<string, (c: InvoiceValidationContext) => string | null> = {
  line_items_present: (c) => (c.lineItemsPresent === false ? 'Invoice must have line items' : null),
  amount_matches: (c) => (c.amountMatches === false ? 'Payment does not match outstanding balance' : null),
  not_already_settled: (c) =>
    c.notAlreadySettled === false ? 'Invoice is already settled' : null,
  not_void: (c) => (c.notVoid === false ? 'Invoice is void and cannot be modified' : null),
  refund_approval: (c) => (c.refundApproval === false ? 'Refund requires approval' : null),
  approval_granted: (c) => (c.approvalGranted === false ? 'Billing approval pending' : null),
  opd_visit_billing_pending: (c) =>
    c.opdVisitInBillingPending === false ? 'OPD visit is not ready for billing exit' : null,
  payment_required: (c) =>
    c.paymentRequired === false ? 'Payment is required before visit completion' : null,
  duplicate_settlement_blocked: (c) =>
    c.duplicateSettlementBlocked === false ? 'Invoice already settled' : null,
  visit_escalation_clear: (c) =>
    c.visitNotEscalatedOrSupervisor === false ? 'Escalated visit requires supervisor for billing exit' : null,
  corporate_credit_ok: (c) =>
    c.corporateCreditOk === false ? 'Corporate credit limit or approval required' : null,
  insurance_preauth_ok: (c) =>
    c.insurancePreauthOk === false ? 'Insurance pre-authorization required' : null,
  partial_payment_allowed: (c) =>
    c.partialPaymentAllowed === false ? 'Partial payment not allowed by branch policy' : null,
  payment_amount_valid: (c) =>
    c.paymentAmountValid === false ? 'Invalid payment amount' : null,
};

export function runInvoiceValidations(
  validationIds: readonly string[] | undefined,
  ctx: InvoiceValidationContext,
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
