export type OperationalTemplatePackDef = {
  code: string;
  label: string;
  description: string;
  modules: string[];
  workflowLifecycleIds: string[];
  policyKeys: string[];
};

export const OPERATIONAL_TEMPLATE_PACKS: readonly OperationalTemplatePackDef[] = [
  {
    code: 'small_clinic',
    label: 'Small Clinic',
    description: 'Lean OPD + pharmacy workflows.',
    modules: ['OPD', 'Pharmacy'],
    workflowLifecycleIds: ['opd_visit', 'pharmacy_fulfillment'],
    policyKeys: ['opd.queue_required'],
  },
  {
    code: 'multi_specialty',
    label: 'Multi-Specialty',
    description: 'Full acute care template set.',
    modules: ['OPD', 'IPD', 'LIMS', 'Pharmacy', 'Insurance'],
    workflowLifecycleIds: ['opd_visit', 'ipd_admission', 'lab_order', 'discharge_orchestration'],
    policyKeys: ['billing.require_encounter_close', 'discharge.unified_checklist'],
  },
  {
    code: 'emergency_focus',
    label: 'Emergency Focus',
    description: 'ED triage and critical lab paths.',
    modules: ['OPD', 'IPD', 'LIMS'],
    workflowLifecycleIds: ['opd_visit', 'lab_order', 'bed_allocation'],
    policyKeys: ['ed.triage_required', 'lab.critical_verify'],
  },
  {
    code: 'navayu_msk',
    label: 'Navayu MSK Clinic',
    description: 'MSK specialty OPD with pharmacy, CRM, and analytics.',
    modules: ['OPD', 'Pharmacy', 'Analytics', 'CRM'],
    workflowLifecycleIds: ['navayu_msk_visit', 'opd_visit', 'pharmacy_fulfillment'],
    policyKeys: [
      'billing.require_encounter_close',
      'opd.queue_required',
      'msk.intake_required',
      'msk.ai_summary_before_senior',
    ],
  },
] as const;
