import type { MetricCard } from '@/components/shell/workspace-primitives';

type WorkflowStep = { id: string; label: string; status: 'done' | 'active' | 'pending' };

export type ModulePreset = {
  subtitle: string;
  metrics: MetricCard[];
  workflow: WorkflowStep[];
  aiInsight: string;
};

const DEFAULT_WORKFLOW: WorkflowStep[] = [
  { id: '1', label: 'Capture & validate intake', status: 'done' },
  { id: '2', label: 'Process & route to department', status: 'active' },
  { id: '3', label: 'Complete & audit trail', status: 'pending' },
];

const PRESETS: Record<string, ModulePreset> = {
  Scheduling: {
    subtitle: 'OR blocks, clinic slots, and resource allocation with conflict detection.',
    metrics: [
      { id: 'slots', label: 'Open slots today', value: 47 },
      { id: 'booked', label: 'Booked', value: 128 },
      { id: 'wait', label: 'Waitlist', value: 9 },
      { id: 'conflicts', label: 'Conflicts', value: 2 },
    ],
    workflow: [
      { id: '1', label: 'Review capacity & blocks', status: 'done' },
      { id: '2', label: 'Resolve scheduling conflicts', status: 'active' },
      { id: '3', label: 'Publish daily roster', status: 'pending' },
    ],
    aiInsight: 'Peak OPD load expected 10:30–12:00. Consider opening 2 additional slots in General Medicine.',
  },
  Dialysis: {
    subtitle: 'Session planning, machine allocation, and fluid balance monitoring.',
    metrics: [
      { id: 'sessions', label: 'Sessions today', value: 24 },
      { id: 'chairs', label: 'Chair utilization', value: '86%' },
      { id: 'pre', label: 'Pre-dialysis pending', value: 3 },
      { id: 'alerts', label: 'Clinical alerts', value: 1 },
    ],
    workflow: [
      { id: '1', label: 'Pre-dialysis vitals & labs', status: 'done' },
      { id: '2', label: 'Machine priming & access', status: 'active' },
      { id: '3', label: 'Post-session documentation', status: 'pending' },
    ],
    aiInsight: 'Chair 4 due for maintenance after session 3. No fluid overload alerts in current cohort.',
  },
  Finance: {
    subtitle: 'Revenue cycle, cost centers, and payer mix analytics.',
    metrics: [
      { id: 'rev', label: 'Revenue MTD', value: '₹1.2Cr' },
      { id: 'ar', label: 'Accounts receivable', value: '₹18.4L' },
      { id: 'denial', label: 'Denial rate', value: '4.2%' },
      { id: 'margin', label: 'EBITDA margin', value: '22%' },
    ],
    workflow: [
      { id: '1', label: 'Daily cash reconciliation', status: 'done' },
      { id: '2', label: 'TPA settlement review', status: 'active' },
      { id: '3', label: 'Month-end close prep', status: 'pending' },
    ],
    aiInsight: 'Cardiology revenue up 14% WoW. Review pending TPA claims above ₹50K for faster collection.',
  },
  Kaizen: {
    subtitle: 'Continuous improvement boards, RCA tracking, and quality initiatives.',
    metrics: [
      { id: 'open', label: 'Open initiatives', value: 14 },
      { id: 'done', label: 'Closed this month', value: 8 },
      { id: 'savings', label: 'Est. savings', value: '₹2.1L' },
      { id: 'sla', label: 'On-track', value: '92%' },
    ],
    workflow: [
      { id: '1', label: 'Log incident / suggestion', status: 'done' },
      { id: '2', label: 'Root cause analysis', status: 'active' },
      { id: '3', label: 'Verify & close loop', status: 'pending' },
    ],
    aiInsight: 'Lab TAT initiative showing 18% improvement. Escalate OT turnover RCA — 2 weeks overdue.',
  },
};

export function getModulePreset(title: string): ModulePreset {
  return (
    PRESETS[title] ?? {
      subtitle: `Operational workspace for ${title.toLowerCase()} — Adrine Hospital OS 2026.`,
      metrics: [
        { id: 'queue', label: 'In queue', value: 12 },
        { id: 'today', label: 'Completed today', value: 48 },
        { id: 'sla', label: 'SLA compliance', value: '96%', trend: { value: '+2%', positive: true } },
        { id: 'alerts', label: 'Open alerts', value: 2 },
      ],
      workflow: DEFAULT_WORKFLOW,
      aiInsight: `AI recommends reviewing pending items in ${title} before end of shift. No critical blockers detected.`,
    }
  );
}
