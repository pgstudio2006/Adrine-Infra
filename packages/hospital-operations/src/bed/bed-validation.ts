export type BedValidationContext = {
  bedNotDoubleBooked?: boolean;
  admissionLinked?: boolean;
  admissionConfirmed?: boolean;
  patientIdentified?: boolean;
  admissionDischargedOrTransferred?: boolean;
  cleaningChecklistComplete?: boolean;
  maintenanceReasonProvided?: boolean;
  blockReasonProvided?: boolean;
  cancelReasonProvided?: boolean;
};

const VALIDATORS: Record<string, (c: BedValidationContext) => string | null> = {
  bed_not_double_booked: (c) =>
    c.bedNotDoubleBooked === false ? 'Bed is already reserved or occupied' : null,
  admission_linked: (c) => (c.admissionLinked === false ? 'Admission must be linked' : null),
  admission_confirmed: (c) =>
    c.admissionConfirmed === false ? 'Admission must be confirmed' : null,
  patient_identified: (c) => (c.patientIdentified === false ? 'Patient identity required' : null),
  admission_discharged_or_transferred: (c) =>
    c.admissionDischargedOrTransferred === false
      ? 'Admission must be discharged or transferred before bed release'
      : null,
  cleaning_checklist_complete: (c) =>
    c.cleaningChecklistComplete === false ? 'Housekeeping checklist incomplete' : null,
  maintenance_reason_provided: (c) =>
    c.maintenanceReasonProvided === false ? 'Maintenance reason required' : null,
  block_reason_provided: (c) => (c.blockReasonProvided === false ? 'Block reason required' : null),
  cancel_reason_provided: (c) =>
    c.cancelReasonProvided === false ? 'Cancellation reason required' : null,
};

export function runBedValidations(
  validationIds: readonly string[] | undefined,
  ctx: BedValidationContext,
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
