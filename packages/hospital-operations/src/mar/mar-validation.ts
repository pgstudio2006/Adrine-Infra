export type MarValidationContext = {
  nurseAssigned?: boolean;
  missReasonDocumented?: boolean;
  refusalReasonDocumented?: boolean;
};

const VALIDATORS: Record<string, (c: MarValidationContext) => string | null> = {
  nurse_assigned: (c) => (c.nurseAssigned === false ? 'Nurse must be assigned' : null),
  miss_reason_documented: (c) =>
    c.missReasonDocumented === false ? 'Miss reason must be documented' : null,
  refusal_reason_documented: (c) =>
    c.refusalReasonDocumented === false ? 'Refusal reason must be documented' : null,
};

export function runMarValidations(
  validationIds: readonly string[] | undefined,
  ctx: MarValidationContext,
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
