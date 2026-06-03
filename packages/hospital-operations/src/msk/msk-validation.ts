/** Runtime validation context for Navayu MSK workflow transitions. */
export type MskValidationContext = {
  intakeSubmitted?: boolean;
  mskExamFormComplete?: boolean;
  aiSummaryReady?: boolean;
  registrationComplete?: boolean;
};

const VALIDATORS: Record<string, (ctx: MskValidationContext) => string | null> = {
  intake_submitted: (c) =>
    c.intakeSubmitted === false ? 'Patient intake must be submitted first' : null,
  msk_exam_form_complete: (c) =>
    c.mskExamFormComplete === false ? 'MSK exam form must be complete' : null,
  ai_summary_ready: (c) =>
    c.aiSummaryReady === false ? 'AI summary must be ready before senior consult' : null,
};

export function runMskValidations(
  keys: readonly string[] | undefined,
  ctx: MskValidationContext,
): string | null {
  if (!keys?.length) return null;
  for (const key of keys) {
    const validator = VALIDATORS[key];
    if (validator) {
      const err = validator(ctx);
      if (err) return err;
    }
  }
  return null;
}
