/** CRM lead stages — aligned with domain-api `CrmLead.stage` defaults. */
export const CRM_LEAD_STAGES = [
  { id: 'new_inquiry', label: 'New Inquiry', color: '#6366f1' },
  { id: 'counseling', label: 'Counseling', color: '#0ea5e9' },
  { id: 'financial_plan', label: 'Financial Plan', color: '#f59e0b' },
  { id: 'decision_phase', label: 'Decision Phase', color: '#10b981' },
  { id: 'booked', label: 'Booked', color: '#22c55e' },
  { id: 'lost', label: 'Lost', color: '#94a3b8' },
] as const;

export type CrmLeadStageId = (typeof CRM_LEAD_STAGES)[number]['id'];

export function crmStageLabel(stage: string): string {
  const hit = CRM_LEAD_STAGES.find((s) => s.id === stage);
  if (hit) return hit.label;
  return stage
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function crmStageColor(stage: string): string {
  return CRM_LEAD_STAGES.find((s) => s.id === stage)?.color ?? '#64748b';
}
