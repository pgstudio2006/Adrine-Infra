/**
 * Dialysis Dashboard — Adrine 2026 experience.
 * Renal care: session schedule, chair utilisation, machine and fluid intelligence.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Armchair, Droplet, Siren, Stethoscope } from 'lucide-react';
import {
  PageScaffold,
  MetricGrid,
  SectionPanel,
  StatusChip,
  WorkflowStepper,
  type Metric,
  type StatusTone,
  type WorkflowStep,
} from '@/components/adrine/primitives';
import { DenseTable, type DenseColumn } from '@/components/adrine/dense-table';
import { AIInsightPanel } from '@/components/adrine/ai-panel';
import type { AIInsight } from '@/lib/adrine/ai-insights';
import { useDialysisPlatformData } from '@/hooks/useDialysisPlatformData';

type SessionRow = {
  id: string;
  slot: string;
  patient: string;
  chair: string;
  machine: string;
  status: string;
  tone: StatusTone;
};

const FALLBACK_SESSIONS: SessionRow[] = [
  { id: 'DS-8801', slot: '07:00', patient: 'Vikram Singh', chair: 'Chair 1', machine: 'DM-01', status: 'Completed', tone: 'success' },
  { id: 'DS-8802', slot: '07:00', patient: 'Ananya Iyer', chair: 'Chair 2', machine: 'DM-02', status: 'Completed', tone: 'success' },
  { id: 'DS-8803', slot: '11:30', patient: 'Fatima Sheikh', chair: 'Chair 3', machine: 'DM-03', status: 'On machine', tone: 'active' },
  { id: 'DS-8804', slot: '11:30', patient: 'Arjun Reddy', chair: 'Chair 4', machine: 'DM-04', status: 'On machine', tone: 'active' },
  { id: 'DS-8805', slot: '16:00', patient: 'Rohini Patil', chair: 'Chair 1', machine: 'DM-01', status: 'Pre-dialysis', tone: 'info' },
  { id: 'DS-8806', slot: '16:00', patient: 'Kabir Malhotra', chair: 'Chair 2', machine: 'DM-02', status: 'Scheduled', tone: 'neutral' },
];

const SESSION_STEPS: WorkflowStep[] = [
  { id: 'pre-vitals', label: 'Pre-vitals & weights', status: 'done', meta: 'Fatima Sheikh · 62.4 kg · BP 142/88' },
  { id: 'prime', label: 'Machine prime', status: 'done', meta: 'DM-03 · F8 dialyser · lines primed' },
  { id: 'session', label: 'Session', status: 'active', meta: 'Hour 2 of 4 · UF goal 2.1 L · stable' },
  { id: 'post-vitals', label: 'Post-vitals', status: 'pending', meta: 'Weight, BP, access-site check' },
  { id: 'documentation', label: 'Documentation', status: 'pending', meta: 'Session record + nephrologist sign-off' },
];

const DIALYSIS_INSIGHTS: AIInsight[] = [
  {
    id: 'chair4-maintenance',
    severity: 'warning',
    title: 'Chair 4 machine (DM-04) is due for preventive maintenance',
    recommendation: 'Schedule DM-04 service in tonight\'s idle window and shift tomorrow\'s 07:00 session to DM-05.',
    reasoning: [
      'DM-04 has logged 412 running hours since its last service against a 400-hour preventive threshold.',
      'Conductivity drift on the last 3 sessions trended +0.3 mS/cm — within limits but worsening.',
      'Tonight 20:00–06:00 is the only window this week with no booked session on the machine.',
      'DM-05 is serviced and idle for tomorrow\'s first slot, so no patient session is displaced.',
    ],
    confidence: 0.87,
    action: { label: 'Open machines', to: '/dialysis/machines' },
  },
  {
    id: 'fluid-overload-watch',
    severity: 'critical',
    title: 'Fluid-overload watch: interdialytic weight gain above 5%',
    recommendation: 'Flag Arjun Reddy for cautious UF profiling and 30-minute BP checks this session.',
    reasoning: [
      'Pre-session weight is 4.2 kg above dry weight of 78 kg — a 5.4% interdialytic gain vs the 4% caution line.',
      'Removing the full excess in one 4-hour session exceeds the 10 ml/kg/hr safe UF rate.',
      'His last high-gain session recorded an intradialytic hypotension episode at hour 3.',
      'Stepped UF profile plus mid-session reassessment reduces hypotension risk while protecting target weight.',
    ],
    confidence: 0.9,
    action: { label: 'Open schedule', to: '/dialysis/schedule' },
  },
];

export default function DialysisDashboard2026() {
  const navigate = useNavigate();
  const { platformOn, sessions, machines } = useDialysisPlatformData();

  const sessionRows: SessionRow[] = useMemo(() => {
    if (!platformOn || sessions.length === 0) return FALLBACK_SESSIONS;
    return sessions.map((s) => {
      const state = s.state.toLowerCase();
      const tone: StatusTone =
        state.includes('progress') || state.includes('running') || state.includes('machine') ? 'active'
          : state.includes('complete') ? 'success'
          : state.includes('pre') ? 'info'
          : 'neutral';
      return {
        id: s.id,
        slot: s.scheduledAt
          ? new Date(s.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
          : '—',
        patient: s.patient?.fullName ?? 'Unknown patient',
        chair: s.machine?.code ? `Chair ${s.machine.code.replace(/\D/g, '') || '—'}` : '—',
        machine: s.machine?.code ?? '—',
        status: s.state,
        tone,
      };
    });
  }, [platformOn, sessions]);

  const metrics: Metric[] = useMemo(() => {
    const sessionsToday = platformOn && sessions.length > 0 ? sessions.length : 6;
    const machineAlerts = platformOn && machines.length > 0
      ? machines.filter((m) => m.state.toLowerCase() !== 'available' && m.state.toLowerCase() !== 'in_use').length
      : 1;
    return [
      { id: 'sessions', label: 'Sessions today', value: sessionsToday, icon: Droplet, hint: '3 shifts · 2 completed' },
      { id: 'chairs', label: 'Chair utilisation', value: '83%', icon: Armchair, hint: '5 of 6 chairs active', delta: { value: '+6%', direction: 'up', positive: true } },
      { id: 'pre-dialysis', label: 'Pre-dialysis pending', value: 1, icon: Stethoscope, hint: 'Vitals + weight due 15:30' },
      { id: 'alerts', label: 'Machine alerts', value: machineAlerts, icon: Siren, hint: 'DM-04 service due' },
    ];
  }, [platformOn, sessions, machines]);

  const columns: DenseColumn<SessionRow>[] = [
    { key: 'slot', header: 'Slot', width: '64px', cell: (r) => <span className="tabular-nums font-medium">{r.slot}</span> },
    { key: 'patient', header: 'Patient', cell: (r) => <span className="font-medium">{r.patient}</span>, searchText: (r) => r.patient },
    { key: 'chair', header: 'Chair', width: '80px' },
    { key: 'machine', header: 'Machine', width: '88px', cell: (r) => <span className="tabular-nums">{r.machine}</span> },
    { key: 'status', header: 'Status', cell: (r) => <StatusChip tone={r.tone} pulse={r.tone === 'active'}>{r.status}</StatusChip> },
  ];

  return (
    <PageScaffold
      eyebrow="Renal care"
      title="Dialysis unit operations"
      subtitle="Session flow, chair and machine availability, and patient safety watch."
    >
      <MetricGrid metrics={metrics} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <SectionPanel
          title="Session schedule"
          description="Today · all shifts"
          flush
          className="xl:col-span-2"
        >
          <DenseTable
            columns={columns}
            rows={sessionRows}
            rowKey={(r) => r.id}
            searchable
            searchPlaceholder="Search sessions…"
            onRowClick={() => navigate('/dialysis/schedule')}
            emptyTitle="No sessions scheduled"
          />
        </SectionPanel>

        <SectionPanel title="Session workflow" description="Active · Chair 3">
          <WorkflowStepper steps={SESSION_STEPS} />
        </SectionPanel>
      </div>

      <AIInsightPanel insights={DIALYSIS_INSIGHTS} />
    </PageScaffold>
  );
}
