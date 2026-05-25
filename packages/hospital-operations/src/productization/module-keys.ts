/** Canonical module entitlement keys (kernel ModuleCatalog codes, lowercase in effective API). */
export const PLATFORM_MODULE_KEYS = [
  'opd',
  'ipd',
  'lims',
  'pharmacy',
  'insurance',
  'telemedicine',
  'ai_copilot',
  'analytics',
  'corporate_billing',
] as const;

export type PlatformModuleKey = (typeof PLATFORM_MODULE_KEYS)[number];

export const MODULE_KEY_ALIASES: Record<string, PlatformModuleKey> = {
  OPD: 'opd',
  IPD: 'ipd',
  LIMS: 'lims',
  Pharmacy: 'pharmacy',
  Insurance: 'insurance',
  Telemedicine: 'telemedicine',
  AI_Copilot: 'ai_copilot',
  Analytics: 'analytics',
  Corporate_Billing: 'corporate_billing',
};
