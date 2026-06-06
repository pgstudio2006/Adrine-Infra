/** Runtime validation context for Navayu MSK workflow transitions. */
export type MskValidationContext = {
  intakeSubmitted?: boolean;
  mskExamFormComplete?: boolean;
  aiSummaryReady?: boolean;
  registrationComplete?: boolean;
};

const VALIDATORS: Record<string, (ctx: MskValidationContext) => string | null> = {
  intake_submitted: (c) =>
    c.intakeSubmitted === true ? null : 'Patient intake must be submitted first',
  msk_exam_form_complete: (c) =>
    c.mskExamFormComplete === true ? null : 'MSK exam form must be complete',
  ai_summary_ready: (c) =>
    c.aiSummaryReady === true ? null : 'AI summary must be ready before senior consult',
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
