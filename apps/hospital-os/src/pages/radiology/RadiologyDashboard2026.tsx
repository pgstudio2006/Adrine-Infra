/**
 * Radiology Dashboard — Adrine 2026 experience.
 * Imaging operations: worklist, closed-loop reporting workflow, queue intelligence.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Gauge, ScanLine, Timer } from 'lucide-react';
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
import { useHospital, type RadiologyOrder } from '@/stores/hospitalStore';

type StudyRow = {
  id: string;
  study: string;
  patient: string;
  modality: string;
  priority: string;
  priorityTone: StatusTone;
  status: string;
  statusTone: StatusTone;
};

const FALLBACK_WORKLIST: StudyRow[] = [
  { id: 'RAD-7741', study: 'CECT Abdomen & Pelvis', patient: 'Fatima Sheikh', modality: 'CT', priority: 'STAT', priorityTone: 'critical', status: 'Scheduled', statusTone: 'info' },
  { id: 'RAD-7742', study: 'CT Brain (plain)', patient: 'Vikram Singh', modality: 'CT', priority: 'Urgent', priorityTone: 'warning', status: 'In Progress', statusTone: 'active' },
  { id: 'RAD-7743', study: 'X-Ray Chest PA', patient: 'Ananya Iyer', modality: 'XR', priority: 'Routine', priorityTone: 'neutral', status: 'Ordered', statusTone: 'neutral' },
  { id: 'RAD-7744', study: 'MRI Lumbar Spine', patient: 'Arjun Reddy', modality: 'MRI', priority: 'Routine', priorityTone: 'neutral', status: 'Scheduled', statusTone: 'info' },
  { id: 'RAD-7745', study: 'USG Whole Abdomen', patient: 'Rohini Patil', modality: 'USG', priority: 'Urgent', priorityTone: 'warning', status: 'Completed', statusTone: 'success' },
  { id: 'RAD-7746', study: 'CT Pulmonary Angiogram', patient: 'Kabir Malhotra', modality: 'CT', priority: 'Emergency', priorityTone: 'critical', status: 'Reported', statusTone: 'success' },
];

const REPORTING_STEPS: WorkflowStep[] = [
  { id: 'order', label: 'Order', status: 'done', meta: 'CPA for Kabir Malhotra · Dr. Sanjay Kulkarni' },
  { id: 'schedule', label: 'Schedule', status: 'done', meta: 'CT-1 slot confirmed within 20 min' },
  { id: 'acquire', label: 'Acquire', status: 'done', meta: 'Contrast study · 320 mAs protocol' },
  { id: 'report', label: 'Report', status: 'active', meta: 'Radiologist drafting — segmental PE noted' },
  { id: 'critical-notify', label: 'Critical notification', status: 'pending', meta: 'Closed-loop call to ordering physician' },
];

const PRIORITY_TONES: Record<RadiologyOrder['priority'], StatusTone> = {
  Routine: 'neutral',
  Urgent: 'warning',
  Emergency: 'critical',
  STAT: 'critical',
};

const STATUS_TONES: Record<RadiologyOrder['status'], StatusTone> = {
  Ordered: 'neutral',
  Scheduled: 'info',
  'In Progress': 'active',
  Completed: 'success',
  Reported: 'success',
};

const RADIOLOGY_INSIGHTS: AIInsight[] = [
  {
    id: 'ct-queue-depth',
    severity: 'warning',
    title: 'CT queue depth exceeds shift capacity',
    recommendation: 'Defer 2 routine CT studies to the 07:00 slot tomorrow and protect the STAT lane.',
    reasoning: [
      '6 CT studies are queued against a single scanner with ~4.5 hours left in the shift.',
      'Mean CT acquisition incl. positioning is 18 minutes — projected completion runs 70 minutes past shift end.',
      '2 of the queued studies are routine outpatient follow-ups with no same-day clinical dependency.',
      'Deferring those two keeps the STAT/Emergency lane clear without breaching any TAT commitment.',
    ],
    confidence: 0.83,
    action: { label: 'Open worklist', to: '/radiology/worklist' },
  },
  {
    id: 'contrast-allergy',
    severity: 'critical',
    title: 'Contrast allergy flag on scheduled CECT',
    recommendation: 'Verify premedication protocol for Fatima Sheikh before the 15:30 CECT.',
    reasoning: [
      'Allergy record documents a prior moderate iodinated-contrast reaction (urticaria, 2024).',
      'The scheduled study is contrast-enhanced; no premedication order is on file yet.',
      'Protocol requires 13-hour or accelerated steroid prep plus radiologist sign-off before injection.',
      'Unprepped administration risks a repeat hypersensitivity event and study abortion.',
    ],
    confidence: 0.94,
    action: { label: 'Review order', to: '/radiology/worklist' },
  },
];

export default function RadiologyDashboard2026() {
  const navigate = useNavigate();
  const { radiologyOrders } = useHospital();

  const worklist: StudyRow[] = useMemo(() => {
    if (radiologyOrders.length === 0) return FALLBACK_WORKLIST;
    return radiologyOrders.map((o) => ({
      id: o.orderId,
      study: o.study,
      patient: o.patientName,
      modality: o.modality,
      priority: o.priority,
      priorityTone: PRIORITY_TONES[o.priority] ?? 'neutral',
      status: o.status,
      statusTone: STATUS_TONES[o.status] ?? 'neutral',
    }));
  }, [radiologyOrders]);

  const metrics: Metric[] = useMemo(() => {
    if (radiologyOrders.length === 0) {
      return [
        { id: 'pending', label: 'Pending studies', value: 3, icon: ScanLine, hint: 'Ordered + scheduled' },
        { id: 'inprogress', label: 'In progress', value: 1, icon: Timer, hint: 'CT Brain on scanner' },
        { id: 'critical', label: 'Critical findings', value: 1, icon: AlertTriangle, hint: 'Awaiting physician ack' },
        { id: 'tat', label: 'TAT on target', value: '92%', icon: Gauge, hint: 'Report within SLA', delta: { value: '+3%', direction: 'up', positive: true } },
      ];
    }
    const pending = radiologyOrders.filter((o) => o.status === 'Ordered' || o.status === 'Scheduled').length;
    const inProgress = radiologyOrders.filter((o) => o.status === 'In Progress').length;
    const critical = radiologyOrders.filter((o) => o.critical).length;
    const reported = radiologyOrders.filter((o) => o.status === 'Reported').length;
    const tat = Math.round((reported / radiologyOrders.length) * 100);
    return [
      { id: 'pending', label: 'Pending studies', value: pending, icon: ScanLine, hint: 'Ordered + scheduled' },
      { id: 'inprogress', label: 'In progress', value: inProgress, icon: Timer, hint: 'On scanner now' },
      { id: 'critical', label: 'Critical findings', value: critical, icon: AlertTriangle, hint: critical > 0 ? 'Needs physician ack' : 'None open' },
      { id: 'tat', label: 'Reported', value: `${tat}%`, icon: Gauge, hint: 'Of total orders' },
    ];
  }, [radiologyOrders]);

  const columns: DenseColumn<StudyRow>[] = [
    { key: 'study', header: 'Study', cell: (r) => <span className="font-medium">{r.study}</span>, searchText: (r) => r.study },
    { key: 'patient', header: 'Patient', searchText: (r) => r.patient },
    { key: 'modality', header: 'Modality', width: '80px' },
    { key: 'priority', header: 'Priority', cell: (r) => <StatusChip tone={r.priorityTone}>{r.priority}</StatusChip> },
    { key: 'status', header: 'Status', cell: (r) => <StatusChip tone={r.statusTone} pulse={r.statusTone === 'active'}>{r.status}</StatusChip> },
  ];

  return (
    <PageScaffold
      eyebrow="Imaging"
      title="Radiology operations"
      subtitle="Modality worklist, reporting pipeline, and critical-result closure."
    >
      <MetricGrid metrics={metrics} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <SectionPanel
          title="Modality worklist"
          description="All modalities · priority ordered"
          flush
          className="xl:col-span-2"
        >
          <DenseTable
            columns={columns}
            rows={worklist}
            rowKey={(r) => r.id}
            searchable
            searchPlaceholder="Search studies…"
            onRowClick={() => navigate('/radiology/worklist')}
            emptyTitle="No studies in worklist"
          />
        </SectionPanel>

        <SectionPanel title="Reporting workflow" description="Active critical study">
          <WorkflowStepper steps={REPORTING_STEPS} />
        </SectionPanel>
      </div>

      <AIInsightPanel insights={RADIOLOGY_INSIGHTS} />
    </PageScaffold>
  );
}
