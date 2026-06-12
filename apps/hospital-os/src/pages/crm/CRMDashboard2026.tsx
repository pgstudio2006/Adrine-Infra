/**
 * CRM Dashboard — Adrine 2026 experience.
 * Growth operations: lead pipeline, funnel velocity, retention intelligence.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Percent, SmilePlus, UsersRound } from 'lucide-react';
import {
  PageScaffold,
  MetricGrid,
  SectionPanel,
  ListRow,
  StatusChip,
  type Metric,
  type StatusTone,
} from '@/components/adrine/primitives';
import { DenseTable, type DenseColumn } from '@/components/adrine/dense-table';
import { AIInsightPanel } from '@/components/adrine/ai-panel';
import type { AIInsight } from '@/lib/adrine/ai-insights';
import { useCrmPlatform } from '@/hooks/useCrmPlatform';

type LeadRow = {
  id: string;
  name: string;
  stage: string;
  stageTone: StatusTone;
  owner: string;
  source: string;
};

const FALLBACK_LEADS: LeadRow[] = [
  { id: 'LD-3401', name: 'Ananya Iyer', stage: 'Plan shared', stageTone: 'info', owner: 'Kavya Menon', source: 'Website inquiry' },
  { id: 'LD-3402', name: 'Vikram Singh', stage: 'Counseling', stageTone: 'active', owner: 'Rahul Joshi', source: 'Google Ads' },
  { id: 'LD-3403', name: 'Fatima Sheikh', stage: 'Converted', stageTone: 'success', owner: 'Kavya Menon', source: 'Doctor referral' },
  { id: 'LD-3404', name: 'Arjun Reddy', stage: 'New inquiry', stageTone: 'neutral', owner: 'Sneha Kulkarni', source: 'Health camp' },
  { id: 'LD-3405', name: 'Rohini Patil', stage: 'Counseling', stageTone: 'active', owner: 'Rahul Joshi', source: 'Walk-in' },
  { id: 'LD-3406', name: 'Kabir Malhotra', stage: 'Plan shared', stageTone: 'info', owner: 'Sneha Kulkarni', source: 'Insurance partner' },
];

const FUNNEL = [
  { stage: 'New inquiry', count: 124, note: 'Last 30 days', tone: 'neutral' as StatusTone },
  { stage: 'Counseling', count: 82, note: '66% progressed', tone: 'active' as StatusTone },
  { stage: 'Plan shared', count: 45, note: '55% progressed', tone: 'info' as StatusTone },
  { stage: 'Converted', count: 28, note: '62% close rate', tone: 'success' as StatusTone },
];

const STAGE_TONES: Record<string, StatusTone> = {
  new: 'neutral',
  inquiry: 'neutral',
  counseling: 'active',
  qualified: 'active',
  plan: 'info',
  proposal: 'info',
  converted: 'success',
  won: 'success',
  lost: 'critical',
};

const CRM_INSIGHTS: AIInsight[] = [
  {
    id: 'sla-breach-risk',
    severity: 'warning',
    title: 'Follow-up SLA breach risk on 3 high-value leads',
    recommendation: 'Call the 3 cardiac-package leads idle beyond 48 hours before 6 PM today.',
    reasoning: [
      '3 leads with package value above ₹1.8L have had no touch-point for 48+ hours against a 24-hour follow-up SLA.',
      'Two are in the plan-shared stage — the highest-intent point in the funnel.',
      'Historic data: conversion probability drops ~35% once follow-up slips past 72 hours.',
      'All three owners have open capacity in today\'s call block.',
    ],
    confidence: 0.84,
    action: { label: 'Open leads', to: '/crm/leads' },
  },
  {
    id: 'campaign-roi',
    severity: 'suggestion',
    title: 'Health camp channel converting above paid media',
    recommendation: 'Shift 20% of next month\'s Google Ads budget to community health camps.',
    reasoning: [
      'Health camp leads convert at 31% vs 14% for paid search this quarter.',
      'Cost per converted patient: ₹2,100 (camps) vs ₹5,800 (paid search).',
      'Two camps are already scheduled — incremental budget extends reach without new fixed cost.',
    ],
    confidence: 0.72,
    action: { label: 'View campaigns', to: '/crm/campaigns' },
  },
];

export default function CRMDashboard2026() {
  const navigate = useNavigate();
  const { platformOn, summary, leads, campaigns } = useCrmPlatform();

  const leadRows: LeadRow[] = useMemo(() => {
    if (!platformOn || leads.length === 0) return FALLBACK_LEADS;
    return leads.map((l) => {
      const stageKey = l.stage.toLowerCase();
      const tone = Object.entries(STAGE_TONES).find(([k]) => stageKey.includes(k))?.[1] ?? 'neutral';
      return {
        id: l.id,
        name: l.fullName,
        stage: l.stage,
        stageTone: tone,
        owner: l.ownerLabel ?? '—',
        source: l.channel ?? '—',
      };
    });
  }, [platformOn, leads]);

  const metrics: Metric[] = useMemo(() => {
    const activeLeads = platformOn && summary ? summary.openLeads : 124;
    const liveCampaigns = platformOn && campaigns.length > 0
      ? campaigns.filter((c) => c.status.toLowerCase() === 'active' || c.status.toLowerCase() === 'live').length
      : 3;
    return [
      { id: 'leads', label: 'Active leads', value: activeLeads, icon: UsersRound, hint: 'Open in pipeline' },
      { id: 'conversion', label: 'Conversion', value: '22.6%', icon: Percent, hint: '30-day rolling', delta: { value: '+1.8%', direction: 'up', positive: true } },
      { id: 'campaigns', label: 'Live campaigns', value: liveCampaigns, icon: Megaphone, hint: 'Monsoon health check leading' },
      { id: 'nps', label: 'NPS', value: 68, icon: SmilePlus, hint: '412 responses this quarter', delta: { value: '+4', direction: 'up', positive: true } },
    ];
  }, [platformOn, summary, campaigns]);

  const columns: DenseColumn<LeadRow>[] = [
    { key: 'name', header: 'Lead', cell: (r) => <span className="font-medium">{r.name}</span>, searchText: (r) => r.name },
    { key: 'stage', header: 'Stage', cell: (r) => <StatusChip tone={r.stageTone}>{r.stage}</StatusChip>, searchText: (r) => r.stage },
    { key: 'owner', header: 'Owner', searchText: (r) => r.owner },
    { key: 'source', header: 'Source', searchText: (r) => r.source },
  ];

  return (
    <PageScaffold
      eyebrow="Growth"
      title="Patient growth & relationships"
      subtitle="Lead pipeline, funnel velocity, campaign performance, and patient sentiment."
    >
      <MetricGrid metrics={metrics} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <SectionPanel
          title="Lead pipeline"
          description="Open leads by recency"
          flush
          className="xl:col-span-2"
        >
          <DenseTable
            columns={columns}
            rows={leadRows}
            rowKey={(r) => r.id}
            searchable
            searchPlaceholder="Search leads…"
            onRowClick={() => navigate('/crm/leads')}
            emptyTitle="No open leads"
          />
        </SectionPanel>

        <SectionPanel title="Conversion funnel" description="Last 30 days">
          {FUNNEL.map((row) => (
            <ListRow
              key={row.stage}
              primary={row.stage}
              secondary={row.note}
              trailing={<StatusChip tone={row.tone} className="tabular-nums">{row.count}</StatusChip>}
              onClick={() => navigate('/crm/leads')}
            />
          ))}
        </SectionPanel>
      </div>

      <AIInsightPanel insights={CRM_INSIGHTS} />
    </PageScaffold>
  );
}
