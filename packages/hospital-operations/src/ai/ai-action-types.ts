import { AI_ACTION_CATALOG, type AIActionDefinition } from './ai-action-catalog.js';

/** Platform AI actions aligned with lifecycle transition aiHooks. */
export const AI_PLATFORM_ACTION_TYPES = [
  'summarize_opd',
  'explain_lab',
  'discharge_draft',
  'escalation_analysis',
  'summarize_note',
  'explain_report',
] as const;

export type AIPlatformActionType = (typeof AI_PLATFORM_ACTION_TYPES)[number];

export const LIFECYCLE_AI_HOOK_TO_ACTION: Record<string, AIPlatformActionType> = {
  duplicate_patient_check: 'summarize_opd',
  scribe_assist: 'summarize_opd',
  coding_suggestion: 'summarize_opd',
  order_set_suggestion: 'summarize_opd',
  vitals_anomaly_alert: 'escalation_analysis',
  analyzer_readiness_check: 'explain_lab',
  billing_anomaly_check: 'escalation_analysis',
};

export function resolveAIActionFromHook(hook: string): AIPlatformActionType | undefined {
  return LIFECYCLE_AI_HOOK_TO_ACTION[hook];
}

export function listAIActions(): readonly AIActionDefinition[] {
  return AI_ACTION_CATALOG;
}
