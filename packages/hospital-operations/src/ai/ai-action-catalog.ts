export type AIActionDefinition = {
  actionType: string;
  label: string;
  requiredPermissions: string[];
  estimatedTokens: number;
};

export const AI_ACTION_CATALOG: readonly AIActionDefinition[] = [
  {
    actionType: 'summarize_note',
    label: 'Summarize clinical note',
    requiredPermissions: ['clinical.notes.read'],
    estimatedTokens: 800,
  },
  {
    actionType: 'explain_report',
    label: 'Explain lab report',
    requiredPermissions: ['lab.results.read'],
    estimatedTokens: 600,
  },
  {
    actionType: 'discharge_draft',
    label: 'Draft discharge summary',
    requiredPermissions: ['ipd.discharge.write'],
    estimatedTokens: 1200,
  },
  {
    actionType: 'escalation_analysis',
    label: 'Analyze escalation context',
    requiredPermissions: ['operations.escalations.read'],
    estimatedTokens: 500,
  },
  {
    actionType: 'summarize_patient_ops',
    label: 'Summarize patient operational context',
    requiredPermissions: ['operations.command.read'],
    estimatedTokens: 900,
  },
  {
    actionType: 'explain_discharge_blockers',
    label: 'Explain discharge blockers',
    requiredPermissions: ['ipd.discharge.read'],
    estimatedTokens: 700,
  },
  {
    actionType: 'summarize_billing_anomalies',
    label: 'Summarize billing anomalies',
    requiredPermissions: ['billing.invoices.read'],
    estimatedTokens: 600,
  },
  {
    actionType: 'stuck_workflows',
    label: 'List stuck workflows',
    requiredPermissions: ['operations.command.read'],
    estimatedTokens: 500,
  },
  {
    actionType: 'nursing_handover_summary',
    label: 'Nursing handover summary',
    requiredPermissions: ['nursing.tasks.read'],
    estimatedTokens: 800,
  },
  {
    actionType: 'admin_morning_briefing',
    label: 'Admin morning operational briefing',
    requiredPermissions: ['operations.command.read'],
    estimatedTokens: 1100,
  },
  {
    actionType: 'admin_clinical_query',
    label: 'Admin clinical workflow query (policy-gated)',
    requiredPermissions: ['clinical.notes.read', 'operations.command.read'],
    estimatedTokens: 900,
  },
] as const;

export function getAIAction(actionType: string): AIActionDefinition | undefined {
  return AI_ACTION_CATALOG.find((a) => a.actionType === actionType);
}
