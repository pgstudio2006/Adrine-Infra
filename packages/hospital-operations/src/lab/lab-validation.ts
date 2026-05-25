export type LabValidationContext = {
  testsDefined?: boolean;
  patientIdentified?: boolean;
  barcodeLinked?: boolean;
  consentForSample?: boolean;
  resultsComplete?: boolean;
  criticalValuesPresent?: boolean;
  criticalAcknowledgedIfRequired?: boolean;
  cancelReasonProvided?: boolean;
  recollectReasonProvided?: boolean;
  billingChargeSynced?: boolean;
  opdVisitOpen?: boolean;
};

const VALIDATORS: Record<string, (c: LabValidationContext) => string | null> = {
  tests_defined: (c) => (c.testsDefined === false ? 'Lab tests must be specified' : null),
  patient_identified: (c) => (c.patientIdentified === false ? 'Patient identity required' : null),
  barcode_linked: (c) => (c.barcodeLinked === false ? 'Sample barcode must be linked' : null),
  consent_for_sample: (c) => (c.consentForSample === false ? 'Sample collection consent required' : null),
  results_complete: (c) => (c.resultsComplete === false ? 'Results must be entered' : null),
  critical_values_present: (c) =>
    c.criticalValuesPresent === false ? 'Critical flag requires abnormal values' : null,
  critical_acknowledged_if_required: (c) =>
    c.criticalAcknowledgedIfRequired === false
      ? 'Critical results must be acknowledged by clinician'
      : null,
  cancel_reason_provided: (c) =>
    c.cancelReasonProvided === false ? 'Cancellation reason required' : null,
  recollect_reason_provided: (c) =>
    c.recollectReasonProvided === false ? 'Recollection reason required' : null,
};

export function runLabValidations(
  validationIds: readonly string[] | undefined,
  ctx: LabValidationContext,
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
