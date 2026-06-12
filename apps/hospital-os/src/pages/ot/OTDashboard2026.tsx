/**
 * OT Dashboard — Adrine 2026 experience.
 * Perioperative command: today's list, safety workflow, turnover intelligence.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, BedDouble, ClipboardCheck, HeartPulse } from 'lucide-react';
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
import { useOtPlatformData } from '@/hooks/useOtPlatformData';

type SurgeryRow = {
  id: string;
  time: string;
  patient: string;
  procedure: string;
  surgeon: string;
  room: string;
  status: string;
  tone: StatusTone;
};

const FALLBACK_LIST: SurgeryRow[] = [
  { id: 'OT-2613', time: '08:00', patient: 'Ananya Iyer', procedure: 'Laparoscopic cholecystectomy', surgeon: 'Dr. Imran Qureshi', room: 'OT-1', status: 'Completed', tone: 'success' },
  { id: 'OT-2614', time: '09:30', patient: 'Vikram Singh', procedure: 'Total knee replacement (R)', surgeon: 'Dr. Meera Krishnan', room: 'OT-2', status: 'In progress', tone: 'active' },
  { id: 'OT-2615', time: '11:00', patient: 'Fatima Sheikh', procedure: 'ORIF distal radius', surgeon: 'Dr. Imran Qureshi', room: 'OT-1', status: 'Pre-op', tone: 'info' },
  { id: 'OT-2616', time: '12:15', patient: 'Arjun Reddy', procedure: 'Inguinal hernia repair', surgeon: 'Dr. Sanjay Kulkarni', room: 'OT-3', status: 'Pre-op', tone: 'info' },
  { id: 'OT-2617', time: '14:30', patient: 'Rohini Patil', procedure: 'Total hip replacement (L)', surgeon: 'Dr. Meera Krishnan', room: 'OT-2', status: 'Implant hold', tone: 'warning' },
  { id: 'OT-2618', time: '16:00', patient: 'Kabir Malhotra', procedure: 'Septoplasty', surgeon: 'Dr. Nidhi Apte', room: 'OT-3', status: 'Scheduled', tone: 'neutral' },
];

const SAFETY_STEPS: WorkflowStep[] = [
  { id: 'preop', label: 'Pre-op checklist', status: 'done', meta: 'Consent, NPO, site marking verified' },
  { id: 'timeout', label: 'Time-out', status: 'done', meta: 'WHO checklist — full team confirmation' },
  { id: 'procedure', label: 'Procedure', status: 'active', meta: 'TKR in OT-2 · 42 min elapsed' },
  { id: 'counts', label: 'Counts verified', status: 'pending', meta: 'Instrument + sponge count at closure' },
  { id: 'pacu', label: 'PACU handoff', status: 'pending', meta: 'SBAR handoff to recovery nurse' },
];

const OT_INSIGHTS: AIInsight[] = [
  {
    id: 'turnover-optimization',
    severity: 'suggestion',
    title: 'OT-2 turnover gap can absorb an extra case',
    recommendation: 'Pull the 16:00 septoplasty forward to OT-2 at 13:10 to free the evening block.',
    reasoning: [
      'TKR in OT-2 is projected to close by 12:25 based on current intra-op pace (42 of ~95 min).',
      'Next OT-2 case (THR) is held for implant confirmation until at least 14:30 — a 2-hour idle window.',
      'Mean OT-2 turnover this month is 32 minutes; cleaning crew is free in that window.',
      'Septoplasty (45 min, no implant dependency) fits with 25 minutes of buffer.',
    ],
    confidence: 0.74,
    action: { label: 'Open OT board', to: '/ot/board' },
  },
  {
    id: 'implant-confirmation',
    severity: 'warning',
    title: 'Implant confirmation pending for 14:30 THR',
    recommendation: 'Chase vendor confirmation for Rohini Patil\'s hip implant before 10:30.',
    reasoning: [
      'Policy requires implant availability confirmed 4 hours before incision; 14:30 case → 10:30 cutoff.',
      'Vendor acknowledged the order but has not confirmed delivery of the size 52 acetabular cup.',
      'No in-house backup stock for this size in the implant register.',
      'Late cancellation would strand a 2.5-hour OT-2 block and an admitted patient.',
    ],
    confidence: 0.88,
    action: { label: 'View case', to: '/ot/board' },
  },
];

export default function OTDashboard2026() {
  const navigate = useNavigate();
  const { platformOn, cases, rooms } = useOtPlatformData();

  const list: SurgeryRow[] = useMemo(() => {
    if (!platformOn || cases.length === 0) return FALLBACK_LIST;
    return cases.map((c) => {
      const state = c.state.toLowerCase();
      const tone: StatusTone =
        state.includes('progress') || state.includes('intra') ? 'active'
          : state.includes('complete') || state.includes('closed') ? 'success'
          : state.includes('hold') || state.includes('block') ? 'warning'
          : 'info';
      return {
        id: c.id,
        time: c.scheduledAt ? new Date(c.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—',
        patient: c.patient?.fullName ?? 'Unknown patient',
        procedure: c.procedureName,
        surgeon: c.surgeonName ?? '—',
        room: c.otRoom?.label ?? '—',
        status: c.state,
        tone,
      };
    });
  }, [platformOn, cases]);

  const metrics: Metric[] = useMemo(() => {
    const todaysCases = platformOn && cases.length > 0 ? cases.length : 6;
    const roomsInUse = platformOn && rooms.length > 0
      ? rooms.filter((r) => r.state.toLowerCase() !== 'available').length
      : 2;
    return [
      { id: 'cases', label: "Today's cases", value: todaysCases, icon: Activity, hint: '1 emergency add-on' },
      { id: 'rooms', label: 'Rooms in use', value: `${roomsInUse}/3`, icon: BedDouble, hint: 'OT-1 turning over' },
      { id: 'preop', label: 'Pre-op pending', value: 2, icon: ClipboardCheck, hint: 'Anaesthesia review due' },
      { id: 'pacu', label: 'Post-op recovery', value: 1, icon: HeartPulse, hint: 'PACU bed 2 · stable' },
    ];
  }, [platformOn, cases, rooms]);

  const columns: DenseColumn<SurgeryRow>[] = [
    { key: 'time', header: 'Time', width: '64px', cell: (r) => <span className="tabular-nums font-medium">{r.time}</span> },
    { key: 'patient', header: 'Patient', cell: (r) => <span className="font-medium">{r.patient}</span>, searchText: (r) => r.patient },
    { key: 'procedure', header: 'Procedure', searchText: (r) => r.procedure },
    { key: 'surgeon', header: 'Surgeon', searchText: (r) => r.surgeon },
    { key: 'room', header: 'Room', width: '64px' },
    { key: 'status', header: 'Status', cell: (r) => <StatusChip tone={r.tone} pulse={r.tone === 'active'}>{r.status}</StatusChip> },
  ];

  return (
    <PageScaffold
      eyebrow="Perioperative"
      title="Operation theatre command"
      subtitle="Today's surgical list, safety workflow state, and room utilisation."
    >
      <MetricGrid metrics={metrics} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <SectionPanel
          title="Today's surgery list"
          description="All theatres · ordered by start time"
          flush
          className="xl:col-span-2"
        >
          <DenseTable
            columns={columns}
            rows={list}
            rowKey={(r) => r.id}
            searchable
            searchPlaceholder="Search cases…"
            onRowClick={() => navigate('/ot/board')}
            emptyTitle="No cases scheduled"
          />
        </SectionPanel>

        <SectionPanel title="Safety workflow" description="Active case · OT-2 TKR">
          <WorkflowStepper steps={SAFETY_STEPS} />
        </SectionPanel>
      </div>

      <AIInsightPanel insights={OT_INSIGHTS} />
    </PageScaffold>
  );
}
