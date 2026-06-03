export {
  OPERATIONAL_TEMPLATE_PACKS,
  type OperationalTemplatePackDef,
} from './operational-packs.js';

import { OPERATIONAL_TEMPLATE_PACKS } from './operational-packs.js';

/** JSON-serializable operational template definitions for provisioning + domain-api seed. */
export const OPERATIONAL_TEMPLATES = [
  ...OPERATIONAL_TEMPLATE_PACKS,
  {
    code: 'pharmacy_pack',
    label: 'Pharmacy Retail Pack',
    description: 'OPD + pharmacy dispensing and inventory workflows.',
    modules: ['OPD', 'Pharmacy'],
    workflowLifecycleIds: ['opd_visit', 'pharmacy_fulfillment'],
    policyKeys: ['pharmacy.dispense_verify', 'opd.queue_required'],
  },
  {
    code: 'opd_clinic',
    label: 'OPD Clinic',
    description: 'Single-branch outpatient with lab.',
    modules: ['OPD', 'LIMS', 'Pharmacy', 'Analytics'],
    workflowLifecycleIds: ['opd_visit', 'lab_order'],
    policyKeys: ['billing.require_encounter_close', 'opd.queue_required'],
  },
  {
    code: 'emergency',
    label: 'Emergency Department',
    description: 'ED triage, rapid lab, bed orchestration.',
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
