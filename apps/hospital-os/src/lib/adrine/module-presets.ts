/**
 * Module presets — realistic operational content for extended/planned routes
 * rendered through ModuleWorkspace until their dedicated screens ship.
 * Content reflects real 20–100 bed Indian hospital sequencing, not CRUD.
 */
import type { Metric, WorkflowStep } from '@/components/adrine/primitives';
import type { AIInsight } from '@/lib/adrine/ai-insights';

export type ModulePreset = {
  eyebrow: string;
  subtitle: string;
  metrics: Metric[];
  workflow: WorkflowStep[];
  insights: AIInsight[];
};

const DEFAULT_PRESET: Omit<ModulePreset, 'insights'> & { insightTitle?: string } = {
  eyebrow: 'Operations',
  subtitle: 'Operational workspace — Adrine Hospital OS 2026.',
  metrics: [
    { id: 'queue', label: 'In queue', value: 12 },
    { id: 'today', label: 'Completed today', value: 48 },
    { id: 'sla', label: 'SLA compliance', value: '96%', delta: { value: '+2%', direction: 'up', positive: true } },
    { id: 'alerts', label: 'Open alerts', value: 2 },
  ],
  workflow: [
    { id: '1', label: 'Capture & validate intake', status: 'done' },
    { id: '2', label: 'Process & route to department', status: 'active' },
    { id: '3', label: 'Complete & audit trail', status: 'pending' },
  ],
};

const PRESETS: Record<string, Partial<ModulePreset>> = {
  Scheduling: {
    eyebrow: 'Access',
    subtitle: 'OPD slots, OR blocks, and resource allocation with conflict detection.',
    metrics: [
      { id: 'open', label: 'Open slots today', value: 47 },
      { id: 'booked', label: 'Booked', value: 128 },
      { id: 'wait', label: 'Waitlist', value: 9 },
      { id: 'conflicts', label: 'Conflicts', value: 2 },
    ],
    workflow: [
      { id: '1', label: 'Review capacity & blocks', status: 'done' },
      { id: '2', label: 'Resolve scheduling conflicts', status: 'active', meta: '2 double-bookings in Ortho' },
      { id: '3', label: 'Publish daily roster', status: 'pending' },
    ],
    insights: [
      {
        id: 'sched-peak',
        severity: 'suggestion',
        title: 'Peak load 10:30–12:00 expected',
        recommendation: 'Open 2 additional General Medicine slots in the peak window.',
        reasoning: [
          'Booking curve matches last 4 Saturdays — 92nd percentile demand.',
          'Two GM consultants have unblocked calendar capacity in that window.',
        ],
        confidence: 0.78,
        action: { label: 'Open calendar', to: '/scheduling/calendar' },
      },
    ],
  },
  Dialysis: {
    eyebrow: 'Renal care',
    subtitle: 'Session planning, machine allocation, and fluid-balance monitoring.',
    metrics: [
      { id: 'sessions', label: 'Sessions today', value: 24 },
      { id: 'chairs', label: 'Chair utilization', value: '86%' },
      { id: 'pre', label: 'Pre-dialysis pending', value: 3 },
      { id: 'alerts', label: 'Clinical alerts', value: 1 },
    ],
    workflow: [
      { id: '1', label: 'Pre-dialysis vitals & weights', status: 'done' },
      { id: '2', label: 'Machine prime & vascular access', status: 'active' },
      { id: '3', label: 'Intra-session monitoring', status: 'pending' },
      { id: '4', label: 'Post-session documentation', status: 'pending' },
    ],
    insights: [
      {
        id: 'dial-maint',
        severity: 'warning',
        title: 'Chair 4 maintenance window due',
        recommendation: 'Schedule maintenance after session 3 today to avoid tomorrow conflict.',
        reasoning: [
          'Machine M-04 crossed 480 service-hours yesterday.',
          'Tomorrow morning block is fully booked — no slack for downtime.',
        ],
        confidence: 0.84,
      },
    ],
  },
  Finance: {
    eyebrow: 'Enterprise finance',
    subtitle: 'Revenue cycle, cost centers, and payer-mix analytics.',
    metrics: [
      { id: 'rev', label: 'Revenue MTD', value: '₹1.2Cr' },
      { id: 'ar', label: 'Accounts receivable', value: '₹18.4L' },
      { id: 'denial', label: 'Denial rate', value: '4.2%' },
      { id: 'margin', label: 'EBITDA margin', value: '22%' },
    ],
    workflow: [
      { id: '1', label: 'Daily cash reconciliation', status: 'done' },
      { id: '2', label: 'TPA settlement review', status: 'active', meta: '₹6.8L across 14 claims' },
      { id: '3', label: 'Month-end close preparation', status: 'pending' },
    ],
    insights: [
      {
        id: 'fin-tpa',
        severity: 'suggestion',
        title: 'TPA claims above ₹50K aging',
        recommendation: 'Escalate 5 high-value claims to payer relationship manager today.',
        reasoning: [
          '5 claims above ₹50K are past 14-day follow-up window.',
          'Cardiology revenue up 14% WoW — payer mix shifting toward insured.',
        ],
        confidence: 0.73,
      },
    ],
  },
  Kaizen: {
    eyebrow: 'Quality',
    subtitle: 'Continuous improvement boards, RCA tracking, and quality initiatives.',
    metrics: [
      { id: 'open', label: 'Open initiatives', value: 14 },
      { id: 'done', label: 'Closed this month', value: 8 },
      { id: 'savings', label: 'Estimated savings', value: '₹2.1L' },
      { id: 'track', label: 'On-track', value: '92%' },
    ],
    workflow: [
      { id: '1', label: 'Log incident / suggestion', status: 'done' },
      { id: '2', label: 'Root cause analysis', status: 'active', meta: 'OT turnover RCA 2 weeks overdue' },
      { id: '3', label: 'Countermeasure & verify', status: 'pending' },
    ],
    insights: [
      {
        id: 'kaizen-tat',
        severity: 'info',
        title: 'Lab TAT initiative trending +18%',
        recommendation: 'Promote the batching countermeasure to standard work.',
        reasoning: [
          'Verification batching cut average TAT by 18% over 3 weeks.',
          'No quality regressions logged against the change.',
        ],
        confidence: 0.81,
      },
    ],
  },
};

export function getModulePreset(title: string): ModulePreset {
  const preset = PRESETS[title];
  const base: ModulePreset = {
    eyebrow: DEFAULT_PRESET.eyebrow,
    subtitle: `Operational workspace for ${title.toLowerCase()} — Adrine Hospital OS 2026.`,
    metrics: DEFAULT_PRESET.metrics,
    workflow: DEFAULT_PRESET.workflow,
    insights: [
      {
        id: 'generic',
        severity: 'info',
        title: `${title} monitored`,
        recommendation: 'No anomalies detected in this module today.',
        reasoning: [
          'Dedicated heuristic engine for this module ships in the next intelligence wave.',
          'Module is connected to the same advisory contract as all primary workspaces.',
        ],
        confidence: 0.6,
      },
    ],
  };
  return preset ? { ...base, ...preset } : base;
}
