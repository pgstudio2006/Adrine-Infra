export type DischargeValidationContext = {
  dischargeSummaryDraft?: boolean;
  clinicalNoteSigned?: boolean;
  dischargeMedicationsReconciled?: boolean;
  interimBillReviewed?: boolean;
  noBillingBlockers?: boolean;
  ipPharmacyFulfilledOrDeferred?: boolean;
  nursingTasksComplete?: boolean;
  patientEducationDocumented?: boolean;
  insuranceSettledOrSelfPay?: boolean;
  noDischargeBlockers?: boolean;
  finalBillSettled?: boolean;
  bedReleaseScheduled?: boolean;
  cancelReasonProvided?: boolean;
};

const VALIDATORS: Record<string, (c: DischargeValidationContext) => string | null> = {
  discharge_summary_draft: (c) =>
    c.dischargeSummaryDraft === false ? 'Discharge summary draft required' : null,
  clinical_note_signed: (c) =>
    c.clinicalNoteSigned === false ? 'Discharge clinical note must be signed' : null,
  discharge_medications_reconciled: (c) =>
    c.dischargeMedicationsReconciled === false ? 'Discharge medications must be reconciled' : null,
  interim_bill_reviewed: (c) =>
    c.interimBillReviewed === false ? 'Interim bill must be reviewed' : null,
  no_billing_blockers: (c) =>
    c.noBillingBlockers === false ? 'Billing blockers must be resolved' : null,
  ip_pharmacy_fulfilled_or_deferred: (c) =>
    c.ipPharmacyFulfilledOrDeferred === false
      ? 'IP pharmacy orders must be fulfilled or deferred'
      : null,
  nursing_tasks_complete: (c) =>
    c.nursingTasksComplete === false ? 'Outstanding nursing tasks must be completed' : null,
  patient_education_documented: (c) =>
    c.patientEducationDocumented === false ? 'Patient education must be documented' : null,
  insurance_settled_or_self_pay: (c) =>
    c.insuranceSettledOrSelfPay === false
      ? 'Insurance authorization must be settled or marked self-pay'
      : null,
  no_discharge_blockers: (c) =>
    c.noDischargeBlockers === false ? 'Cross-runtime discharge blockers must be cleared' : null,
  final_bill_settled: (c) =>
    c.finalBillSettled === false ? 'Final bill must be settled' : null,
  bed_release_scheduled: (c) =>
    c.bedReleaseScheduled === false ? 'Bed release must be scheduled' : null,
  cancel_reason_provided: (c) =>
    c.cancelReasonProvided === false ? 'Cancellation reason required' : null,
};

export function runDischargeValidations(
  validationIds: readonly string[] | undefined,
  ctx: DischargeValidationContext,
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
