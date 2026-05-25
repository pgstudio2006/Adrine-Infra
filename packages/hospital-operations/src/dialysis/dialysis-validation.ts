export type DialysisValidationContext = {
  patientIdentified?: boolean;
  machineAssigned?: boolean;
  vitalsBaselineRecorded?: boolean;
  ipdAdmissionLinkedIfInpatient?: boolean;
  sessionNotesComplete?: boolean;
  consumablesLogged?: boolean;
  cancelReasonProvided?: boolean;
};

const VALIDATORS: Record<string, (c: DialysisValidationContext) => string | null> = {
  patient_identified: (c) => (c.patientIdentified === false ? 'Patient identity required' : null),
  machine_assigned: (c) => (c.machineAssigned === false ? 'Dialysis machine required' : null),
  vitals_baseline_recorded: (c) =>
    c.vitalsBaselineRecorded === false ? 'Baseline vitals required' : null,
  ipd_admission_linked_if_inpatient: (c) =>
    c.ipdAdmissionLinkedIfInpatient === false ? 'IPD admission link required' : null,
  session_notes_complete: (c) =>
    c.sessionNotesComplete === false ? 'Session notes incomplete' : null,
  consumables_logged: (c) =>
    c.consumablesLogged === false ? 'Consumables must be logged' : null,
  cancel_reason_provided: (c) =>
    c.cancelReasonProvided === false ? 'Cancellation reason required' : null,
};

export function runDialysisValidations(
  validationIds: readonly string[] | undefined,
  ctx: DialysisValidationContext,
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
