/** Runtime validation context for OPD transitions (server + client). */
export type OpdValidationContext = {
  demographicsComplete?: boolean;
  consentCaptured?: boolean;
  departmentSelected?: boolean;
  doctorOrPoolAssigned?: boolean;
  appointmentExistsOrWalkinAllowed?: boolean;
  patientBalanceOk?: boolean;
  tokenNotDuplicateToday?: boolean;
  noActiveConsultation?: boolean;
  clinicalNotePresent?: boolean;
  diagnosisCoded?: boolean;
  vitalsWithinRangeOrEscalated?: boolean;
  encounterOpen?: boolean;
  criticalResultsAcknowledged?: boolean;
  pendingOrdersDeferredOrComplete?: boolean;
  pendingMandatoryLabsComplete?: boolean;
  criticalLabsAcknowledged?: boolean;
  pendingPharmacyFulfilledOrDeferred?: boolean;
  controlledMedsApproved?: boolean;
  encounterClosed?: boolean;
  invoiceExists?: boolean;
  invoiceSettledOrCreditApproved?: boolean;
  followUpDateValid?: boolean;
  escalationReasonProvided?: boolean;
  cancelReasonProvided?: boolean;
  visitEscalated?: boolean;
  actorIsSupervisor?: boolean;
};

const VALIDATORS: Record<
  string,
  (ctx: OpdValidationContext) => string | null
> = {
  demographics_complete: (c) =>
    c.demographicsComplete === false ? 'Patient demographics are incomplete' : null,
  consent_captured: (c) =>
    c.consentCaptured === false ? 'Consent must be captured before registration' : null,
  department_selected: (c) =>
    c.departmentSelected === false ? 'Department must be selected' : null,
  doctor_or_pool_assigned: (c) =>
    c.doctorOrPoolAssigned === false ? 'Doctor or physician pool must be assigned' : null,
  appointment_exists_or_walkin_allowed: (c) =>
    c.appointmentExistsOrWalkinAllowed === false
      ? 'Valid appointment or walk-in policy required'
      : null,
  patient_balance_ok: (c) =>
    c.patientBalanceOk === false ? 'Outstanding balance blocks check-in' : null,
  token_not_duplicate_today: (c) =>
    c.tokenNotDuplicateToday === false ? 'Patient already has an active token today' : null,
  no_active_consultation: (c) =>
    c.noActiveConsultation === false ? 'Cannot reverse check-in during active consultation' : null,
  clinical_note_present: (c) =>
    c.clinicalNotePresent === false ? 'Clinical note required' : null,
  diagnosis_coded: (c) =>
    c.diagnosisCoded === false ? 'Diagnosis coding required before closing consultation' : null,
  vitals_within_range_or_escalated: (c) =>
    c.vitalsWithinRangeOrEscalated === false ? 'Abnormal vitals require nurse review or escalation' : null,
  encounter_open: (c) => (c.encounterOpen === false ? 'Open encounter required for orders' : null),
  critical_results_acknowledged: (c) =>
    c.criticalResultsAcknowledged === false
      ? 'Critical lab/radiology results must be acknowledged'
      : null,
  pending_orders_deferred_or_complete: (c) =>
    c.pendingOrdersDeferredOrComplete === false
      ? 'Pending orders must be fulfilled or explicitly deferred'
      : null,
  pending_mandatory_labs_complete: (c) =>
    c.pendingMandatoryLabsComplete === false
      ? 'Mandatory lab orders must complete or be cancelled'
      : null,
  critical_labs_acknowledged: (c) =>
    c.criticalLabsAcknowledged === false
      ? 'Critical lab results must be acknowledged'
      : null,
  pending_pharmacy_fulfilled_or_deferred: (c) =>
    c.pendingPharmacyFulfilledOrDeferred === false
      ? 'Pharmacy prescriptions must be fulfilled or deferred'
      : null,
  controlled_meds_approved: (c) =>
    c.controlledMedsApproved === false
      ? 'Controlled medications require pharmacist approval'
      : null,
  encounter_closed: (c) => (c.encounterClosed === false ? 'Encounter must be closed before billing' : null),
  invoice_exists: (c) =>
    c.invoiceExists === false ? 'Live invoice draft required before billing actions' : null,
  invoice_settled_or_credit_approved: (c) =>
    c.invoiceSettledOrCreditApproved === false
      ? 'Invoice must be paid or credit-approved'
      : null,
  follow_up_date_valid: (c) =>
    c.followUpDateValid === false ? 'Follow-up date must be in the future' : null,
  escalation_reason_provided: (c) =>
    c.escalationReasonProvided === false ? 'Escalation reason is required' : null,
  cancel_reason_provided: (c) =>
    c.cancelReasonProvided === false ? 'Cancellation reason is required' : null,
};

export function runOpdValidations(
  validationIds: readonly string[] | undefined,
  ctx: OpdValidationContext,
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
