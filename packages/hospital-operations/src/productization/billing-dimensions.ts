/** Metered SaaS dimensions recorded via kernel PlatformBillingService. */
export const PLATFORM_BILLING_DIMENSIONS = [
  'patients',
  'admissions',
  'workflows',
  'ai_tokens',
  'notifications',
  'storage_mb',
  'branches',
  'staff',
  'api_calls',
] as const;

export type PlatformBillingDimension = (typeof PLATFORM_BILLING_DIMENSIONS)[number];

export const DEFAULT_PLAN_CODES = ['free_trial', 'standard', 'enterprise'] as const;
