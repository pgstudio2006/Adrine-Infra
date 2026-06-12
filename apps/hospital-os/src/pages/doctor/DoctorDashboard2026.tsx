/**
 * DoctorDashboard2026 — clinical cockpit for the Adrine 2026 experience.
 * Scopes queue / IPD data to the signed-in doctor when possible,
 * falling back to facility totals and realistic demo rows.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BedDouble, FlaskConical, Stethoscope, Users } from 'lucide-react';
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
import { doctorInsights } from '@/lib/adrine/ai-insights';
import { useHospital } from '@/stores/hospitalStore';
import { useAuth } from '@/contexts/AuthContext';

type QueueRow = {
  id: string;
  token: number;
  patient: string;
  status: string;
  time: string;
};

const FALLBACK_QUEUE: QueueRow[] = [
  { id: 'q-fb-1', token: 12, patient: 'Rajesh Kumar', status: 'waiting', time: '10:05' },
  { id: 'q-fb-2', token: 13, patient: 'Priya Patel', status: 'waiting', time: '10:12' },
  { id: 'q-fb-3', token: 14, patient: 'Mohammed Ali', status: 'in-consultation', time: '10:20' },
  { id: 'q-fb-4', token: 15, patient: 'Sunita Devi', status: 'called', time: '10:28' },
  { id: 'q-fb-5', token: 16, patient: 'Arjun Mehta', status: 'waiting', time: '10:34' },
];

const QUEUE_TONE: Record<string, StatusTone> = {
  waiting: 'warning',
  called: 'info',
  'in-consultation': 'active',
  completed: 'success',
  skipped: 'neutral',
};

function formatCheckIn(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function DoctorDashboard2026() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { queue, labOrders, admissions } = useHospital();

  const doctorName = user?.name ?? '';

  // Scope to this doctor where assignments exist; otherwise show facility totals.
  const myQueue = useMemo(() => {
    const scoped = doctorName ? queue.filter((q) => q.doctor === doctorName) : [];
    return scoped.length > 0 ? scoped : queue;
  }, [queue, doctorName]);

  const myLabOrders = useMemo(() => {
    const scoped = doctorName ? labOrders.filter((o) => o.doctor === doctorName) : [];
    return scoped.length > 0 ? scoped : labOrders;
  }, [labOrders, doctorName]);

  const myAdmissions = useMemo(() => {
    const active = admissions.filter((a) => a.status !== 'discharged');
    const scoped = doctorName ? active.filter((a) => a.attendingDoctor === doctorName) : [];
    return scoped.length > 0 ? scoped : active;
  }, [admissions, doctorName]);

  const waitingCount = myQueue.filter((q) => q.status === 'waiting').length;
  const inConsultCount = myQueue.filter((q) => q.status === 'in-consultation').length;
  const labsPending = myLabOrders.filter((o) => o.stage !== 'Reported').length;

  const metrics: Metric[] = [
    {
      id: 'waiting',
      label: 'Queue waiting',
      value: myQueue.length > 0 ? waitingCount : 5,
      hint: 'Patients holding tokens',
      icon: Users,
      onClick: () => navigate('/doctor/queue'),
    },
    {
      id: 'in-consult',
      label: 'In consultation',
      value: myQueue.length > 0 ? inConsultCount : 1,
      hint: 'Currently in your room',
      icon: Stethoscope,
    },
    {
      id: 'labs-pending',
      label: 'Lab results pending',
      value: myLabOrders.length > 0 ? labsPending : 4,
      hint: 'Orders not yet reported',
      icon: FlaskConical,
      onClick: () => navigate('/doctor/labs'),
    },
    {
      id: 'ipd',
      label: 'IPD patients',
      value: myAdmissions.length > 0 ? myAdmissions.length : 3,
      hint: 'Under your care',
      icon: BedDouble,
    },
  ];

  const insights = useMemo(
    () =>
      doctorInsights({
        queue: myQueue,
        labOrders: myLabOrders.map((o) => ({
          stage: o.stage === 'Reported' ? 'reported' : 'in-process',
          status: o.stage === 'Reported' ? 'completed' : 'pending',
          priority: o.priority === 'Emergency' ? 'stat' : o.priority.toLowerCase(),
        })),
      }),
    [myQueue, myLabOrders],
  );

  const queueRows: QueueRow[] =
    myQueue.length > 0
      ? myQueue.slice(0, 8).map((q) => ({
          id: `${q.tokenNo}-${q.uhid}`,
          token: q.tokenNo,
          patient: q.patientName,
          status: q.status,
          time: formatCheckIn(q.checkedInAt),
        }))
      : FALLBACK_QUEUE;

  const queueColumns: DenseColumn<QueueRow>[] = [
    {
      key: 'token',
      header: 'Token',
      width: '64px',
      cell: (r) => <span className="tabular-nums font-semibold">#{r.token}</span>,
    },
    { key: 'patient', header: 'Patient', cell: (r) => <span className="font-medium">{r.patient}</span> },
    {
      key: 'status',
      header: 'Status',
      width: '140px',
      cell: (r) => <StatusChip tone={QUEUE_TONE[r.status] ?? 'neutral'}>{r.status}</StatusChip>,
    },
    {
      key: 'time',
      header: 'Checked in',
      width: '90px',
      align: 'right',
      cell: (r) => <span className="tabular-nums text-muted-foreground">{r.time}</span>,
    },
  ];

  const consultActive = inConsultCount > 0 || (myQueue.length === 0 && FALLBACK_QUEUE.some((q) => q.status === 'in-consultation'));
  const workflowSteps: WorkflowStep[] = [
    {
      id: 'call',
      label: 'Call patient',
      status: consultActive ? 'done' : 'active',
      meta: 'Announce next token from the queue board',
    },
    {
      id: 'consult',
      label: 'Consult & document',
      status: consultActive ? 'active' : 'pending',
      meta: 'History, examination, and clinical notes',
    },
    {
      id: 'orders',
      label: 'Orders & Rx',
      status: 'pending',
      meta: 'Lab, radiology, and prescription orders',
    },
    {
      id: 'close',
      label: 'Close visit',
      status: 'pending',
      meta: 'Sign off and release the token',
    },
  ];

  const greeting = doctorName ? `Good day, ${doctorName}` : 'Good day, Doctor';

  return (
    <PageScaffold
      eyebrow="Clinical"
      title={greeting}
      subtitle="Your OPD session, pending diagnostics, and inpatients at a glance."
    >
      <MetricGrid metrics={metrics} columns={4} />

      <AIInsightPanel insights={insights} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
        <SectionPanel title="OPD queue" description="Tap a row to open the full queue" flush>
          <DenseTable
            columns={queueColumns}
            rows={queueRows}
            rowKey={(r) => r.id}
            onRowClick={() => navigate('/doctor/queue')}
            searchable={false}
            maxHeight="max-h-[360px]"
            emptyTitle="Queue is clear"
          />
        </SectionPanel>

        <SectionPanel title="Workflow" description="Standard consultation sequence">
          <WorkflowStepper steps={workflowSteps} />
        </SectionPanel>
      </div>
    </PageScaffold>
  );
}
