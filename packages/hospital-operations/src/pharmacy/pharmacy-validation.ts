export type PharmacyValidationContext = {
  patientIdentified?: boolean;
  medicationsDefined?: boolean;
  stockAvailable?: boolean;
  batchNotExpired?: boolean;
  controlledSubstanceApproved?: boolean;
  pharmacistSignOff?: boolean;
  dispenseQuantitiesValid?: boolean;
  partialDispenseAllowed?: boolean;
  substituteAuthorized?: boolean;
  cancelReasonProvided?: boolean;
  returnReasonProvided?: boolean;
  inventoryReserved?: boolean;
};

const VALIDATORS: Record<string, (c: PharmacyValidationContext) => string | null> = {
  patient_identified: (c) =>
    c.patientIdentified === false ? 'Patient identity required' : null,
  medications_defined: (c) =>
    c.medicationsDefined === false ? 'Prescription must include medications' : null,
  stock_available: (c) =>
    c.stockAvailable === false ? 'Insufficient stock to reserve for dispense' : null,
  batch_not_expired: (c) =>
    c.batchNotExpired === false ? 'Expired batch cannot be dispensed' : null,
  controlled_substance_approved: (c) =>
    c.controlledSubstanceApproved === false
      ? 'Controlled substance requires pharmacist/doctor approval'
      : null,
  pharmacist_sign_off: (c) =>
    c.pharmacistSignOff === false ? 'Pharmacist approval required before dispense' : null,
  dispense_quantities_valid: (c) =>
    c.dispenseQuantitiesValid === false ? 'Dispense quantities are invalid' : null,
  partial_dispense_allowed: (c) =>
    c.partialDispenseAllowed === false ? 'Partial dispense not allowed for this prescription' : null,
  substitute_authorized: (c) =>
    c.substituteAuthorized === false ? 'Medication substitute requires authorization' : null,
  cancel_reason_provided: (c) =>
    c.cancelReasonProvided === false ? 'Cancellation reason required' : null,
  return_reason_provided: (c) =>
    c.returnReasonProvided === false ? 'Return reason required' : null,
};

export function runPharmacyValidations(
  validationIds: readonly string[] | undefined,
  ctx: PharmacyValidationContext,
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
