export type NursingValidationContext = {
  nurseAssigned?: boolean;
  taskDocumentationComplete?: boolean;
  escalationReasonProvided?: boolean;
  missReasonDocumented?: boolean;
};

const VALIDATORS: Record<string, (c: NursingValidationContext) => string | null> = {
  nurse_assigned: (c) => (c.nurseAssigned === false ? 'Nurse must be assigned' : null),
  task_documentation_complete: (c) =>
    c.taskDocumentationComplete === false ? 'Task documentation required' : null,
  escalation_reason_provided: (c) =>
    c.escalationReasonProvided === false ? 'Escalation reason required' : null,
  miss_reason_documented: (c) =>
    c.missReasonDocumented === false ? 'Miss reason must be documented' : null,
};

export function runNursingValidations(
  validationIds: readonly string[] | undefined,
  ctx: NursingValidationContext,
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
