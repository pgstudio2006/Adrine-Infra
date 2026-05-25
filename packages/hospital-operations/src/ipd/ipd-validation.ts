export type IpdValidationContext = {
  patientIdentified?: boolean;
  admissionReasonDocumented?: boolean;
  approvalGranted?: boolean;
  depositOrPreauth?: boolean;
  wardSelected?: boolean;
  bedAssigned?: boolean;
  consentSigned?: boolean;
  attendingDoctorAssigned?: boolean;
  carePlanDocumented?: boolean;
  transferDestinationValid?: boolean;
  bedAvailableAtDestination?: boolean;
  handoverDocumented?: boolean;
  dischargeOrchestrationStarted?: boolean;
  dischargeClearancesComplete?: boolean;
  finalBillSettled?: boolean;
  cancelReasonProvided?: boolean;
};

const VALIDATORS: Record<string, (c: IpdValidationContext) => string | null> = {
  patient_identified: (c) => (c.patientIdentified === false ? 'Patient must be identified' : null),
  admission_reason_documented: (c) =>
    c.admissionReasonDocumented === false ? 'Admission reason required' : null,
  approval_granted: (c) => (c.approvalGranted === false ? 'Admission approval required' : null),
  deposit_or_preauth: (c) =>
    c.depositOrPreauth === false ? 'Deposit or insurance pre-authorization required' : null,
  ward_selected: (c) => (c.wardSelected === false ? 'Ward must be selected' : null),
  bed_assigned: (c) => (c.bedAssigned === false ? 'Bed must be assigned' : null),
  consent_signed: (c) => (c.consentSigned === false ? 'Admission consent required' : null),
  attending_doctor_assigned: (c) =>
    c.attendingDoctorAssigned === false ? 'Attending doctor must be assigned' : null,
  care_plan_documented: (c) =>
    c.carePlanDocumented === false ? 'Care plan must be documented' : null,
  transfer_destination_valid: (c) =>
    c.transferDestinationValid === false ? 'Valid transfer destination required' : null,
  bed_available_at_destination: (c) =>
    c.bedAvailableAtDestination === false ? 'Destination bed not available' : null,
  handover_documented: (c) =>
    c.handoverDocumented === false ? 'Transfer handover documentation required' : null,
  discharge_orchestration_started: (c) =>
    c.dischargeOrchestrationStarted === false ? 'Discharge orchestration must be initiated' : null,
  discharge_clearances_complete: (c) =>
    c.dischargeClearancesComplete === false ? 'All discharge clearances must be complete' : null,
  final_bill_settled: (c) =>
    c.finalBillSettled === false ? 'Final IPD bill must be settled' : null,
  cancel_reason_provided: (c) =>
    c.cancelReasonProvided === false ? 'Cancellation reason required' : null,
};

export function runIpdValidations(
  validationIds: readonly string[] | undefined,
  ctx: IpdValidationContext,
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
