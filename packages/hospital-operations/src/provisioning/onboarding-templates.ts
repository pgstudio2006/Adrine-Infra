export type OnboardingTemplatePack = {
  code: string;
  label: string;
  description: string;
  defaultModules: string[];
  workflowTemplateCodes: string[];
  policyTemplateKeys: string[];
};

export const ONBOARDING_TEMPLATE_PACKS: readonly OnboardingTemplatePack[] = [
  {
    code: 'opd_clinic',
    label: 'OPD Clinic',
    description: 'Single-branch outpatient clinic with lab and pharmacy.',
    defaultModules: ['OPD', 'LIMS', 'Pharmacy', 'Analytics'],
    workflowTemplateCodes: ['opd_standard', 'lab_standard'],
    policyTemplateKeys: ['billing.require_encounter_close', 'opd.queue_required'],
  },
  {
    code: 'multi_specialty',
    label: 'Multi-Specialty Hospital',
    description: 'OPD + IPD + nursing + insurance for mid-size hospitals.',
    defaultModules: ['OPD', 'IPD', 'LIMS', 'Pharmacy', 'Insurance', 'Analytics', 'Corporate_Billing'],
    workflowTemplateCodes: ['opd_standard', 'ipd_standard', 'discharge_checklist'],
    policyTemplateKeys: ['billing.require_encounter_close', 'insurance.preauth_ipd', 'discharge.unified_checklist'],
  },
  {
    code: 'emergency_pack',
    label: 'Emergency Focus',
    description: 'ED-first with rapid lab and bed orchestration.',
    defaultModules: ['OPD', 'IPD', 'LIMS', 'Pharmacy', 'Analytics'],
    workflowTemplateCodes: ['ed_triage', 'lab_critical', 'bed_rapid'],
    policyTemplateKeys: ['ed.triage_required', 'lab.critical_verify', 'bed.conflict_guard'],
  },
] as const;

export function getOnboardingTemplate(code: string): OnboardingTemplatePack | undefined {
  return ONBOARDING_TEMPLATE_PACKS.find((p) => p.code === code);
}
