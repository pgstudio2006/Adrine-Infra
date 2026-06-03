import type { LifecycleDefinition } from '../types.js';

export type NavayuMskVisitState =
  | 'registered'
  | 'intake_pending'
  | 'intake_complete'
  | 'associate_eval'
  | 'msk_exam_complete'
  | 'ai_summary_ready'
  | 'senior_consult'
  | 'navayu_classified'
  | 'protocol_mapped'
  | 'counselling'
  | 'package_planned'
  | 'closed';

export const navayuMskVisitLifecycle: LifecycleDefinition<NavayuMskVisitState> = {
  id: 'navayu_msk_visit',
  label: 'Navayu MSK Visit',
  initial: 'registered',
  states: [
    'registered',
    'intake_pending',
    'intake_complete',
    'associate_eval',
    'msk_exam_complete',
    'ai_summary_ready',
    'senior_consult',
    'navayu_classified',
    'protocol_mapped',
    'counselling',
    'package_planned',
    'closed',
  ],
  transitions: [
    {
      from: 'registered',
      to: 'intake_pending',
      action: 'send_intake_link',
      roles: ['receptionist', 'admin'],
      branchConfigKeys: ['msk.intake_required'],
      auditLevel: 'standard',
    },
    {
      from: 'intake_pending',
      to: 'intake_complete',
      action: 'complete_intake',
      roles: ['receptionist', 'admin', 'doctor'],
      auditLevel: 'phi',
    },
    {
      from: 'intake_complete',
      to: 'associate_eval',
      action: 'start_associate_eval',
      roles: ['doctor'],
      validations: ['intake_submitted'],
      auditLevel: 'standard',
    },
    {
      from: 'associate_eval',
      to: 'msk_exam_complete',
      action: 'complete_msk_exam',
      roles: ['doctor'],
      validations: ['msk_exam_form_complete'],
      auditLevel: 'phi',
    },
    {
      from: 'msk_exam_complete',
      to: 'ai_summary_ready',
      action: 'generate_ai_summary',
      roles: ['admin', 'doctor'],
      branchConfigKeys: ['msk.ai_summary_before_senior'],
      auditLevel: 'standard',
    },
    {
      from: 'ai_summary_ready',
      to: 'senior_consult',
      action: 'start_senior_consult',
      roles: ['doctor'],
      validations: ['ai_summary_ready'],
      auditLevel: 'standard',
    },
    {
      from: 'senior_consult',
      to: 'navayu_classified',
      action: 'classify_diagnosis',
      roles: ['doctor'],
      auditLevel: 'phi',
    },
    {
      from: 'navayu_classified',
      to: 'protocol_mapped',
      action: 'map_protocol',
      roles: ['doctor'],
      auditLevel: 'standard',
    },
    {
      from: 'protocol_mapped',
      to: 'counselling',
      action: 'start_counselling',
      roles: ['billing', 'crm_manager', 'receptionist'],
      auditLevel: 'standard',
    },
    {
      from: 'counselling',
      to: 'package_planned',
      action: 'plan_package',
      roles: ['billing', 'crm_manager'],
      auditLevel: 'standard',
    },
    {
      from: 'package_planned',
      to: 'closed',
      action: 'close_visit',
      roles: ['doctor', 'receptionist', 'admin', 'billing', 'crm_manager'],
      branchConfigKeys: ['billing.require_encounter_close'],
      auditLevel: 'standard',
    },
  ],
};
