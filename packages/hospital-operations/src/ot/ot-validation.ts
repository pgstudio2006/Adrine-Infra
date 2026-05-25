export type OtValidationContext = {
  patientIdentified?: boolean;
  procedureDocumented?: boolean;
  otRoomAssigned?: boolean;
  preopChecklistComplete?: boolean;
  consentOnFile?: boolean;
  teamAssigned?: boolean;
  ipdAdmissionLinkedIfRequired?: boolean;
  intraopDocumented?: boolean;
  postopHandoverComplete?: boolean;
  cancelReasonProvided?: boolean;
};

const VALIDATORS: Record<string, (c: OtValidationContext) => string | null> = {
  patient_identified: (c) => (c.patientIdentified === false ? 'Patient identity required' : null),
  procedure_documented: (c) =>
    c.procedureDocumented === false ? 'Procedure must be documented' : null,
  ot_room_assigned: (c) => (c.otRoomAssigned === false ? 'OT room must be assigned' : null),
  preop_checklist_complete: (c) =>
    c.preopChecklistComplete === false ? 'Pre-op checklist incomplete' : null,
  consent_on_file: (c) => (c.consentOnFile === false ? 'Surgical consent required' : null),
  team_assigned: (c) => (c.teamAssigned === false ? 'Surgical team must be assigned' : null),
  ipd_admission_linked_if_required: (c) =>
    c.ipdAdmissionLinkedIfRequired === false ? 'IPD admission link required' : null,
  intraop_documented: (c) =>
    c.intraopDocumented === false ? 'Intraoperative documentation required' : null,
  postop_handover_complete: (c) =>
    c.postopHandoverComplete === false ? 'Post-op handover incomplete' : null,
  cancel_reason_provided: (c) =>
    c.cancelReasonProvided === false ? 'Cancellation reason required' : null,
};

export function runOtValidations(
  validationIds: readonly string[] | undefined,
  ctx: OtValidationContext,
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
