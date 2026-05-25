export type RadiologyValidationContext = {
  studyDefined?: boolean;
  patientIdentified?: boolean;
  slotConfirmed?: boolean;
  imagesAcquired?: boolean;
  reportComplete?: boolean;
  criticalFindingDocumented?: boolean;
  criticalAcknowledgedIfRequired?: boolean;
  cancelReasonProvided?: boolean;
};

const VALIDATORS: Record<string, (c: RadiologyValidationContext) => string | null> = {
  study_defined: (c) => (c.studyDefined === false ? 'Imaging study must be specified' : null),
  patient_identified: (c) => (c.patientIdentified === false ? 'Patient identity required' : null),
  slot_confirmed: (c) => (c.slotConfirmed === false ? 'Schedule slot must be confirmed' : null),
  images_acquired: (c) => (c.imagesAcquired === false ? 'Imaging acquisition must be confirmed' : null),
  report_complete: (c) => (c.reportComplete === false ? 'Radiology report must be complete' : null),
  critical_finding_documented: (c) =>
    c.criticalFindingDocumented === false ? 'Critical finding must be documented' : null,
  critical_acknowledged_if_required: (c) =>
    c.criticalAcknowledgedIfRequired === false
      ? 'Critical findings must be acknowledged by clinician'
      : null,
  cancel_reason_provided: (c) =>
    c.cancelReasonProvided === false ? 'Cancellation reason required' : null,
};

export function runRadiologyValidations(
  validationIds: readonly string[] | undefined,
  ctx: RadiologyValidationContext,
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
