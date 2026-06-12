/**
 * Nurse Dashboard — Adrine 2026 experience.
 * Ward operations command view: census, vitals/meds pressure, shift workflow.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, BedDouble, ClipboardList, Pill } from 'lucide-react';
import { useHospital } from '@/stores/hospitalStore';
import type { AdmissionCase, AdmissionTask } from '@/stores/hospitalStore';
import {
  PageScaffold,
  MetricGrid,
  SectionPanel,
  StatusChip,
  WorkflowStepper,
  ListRow,
  type Metric,
  type StatusTone,
  type WorkflowStep,
} from '@/components/adrine/primitives';
import { DenseTable, type DenseColumn } from '@/components/adrine/dense-table';
import { AIInsightPanel } from '@/components/adrine/ai-panel';
import { nurseInsights } from '@/lib/adrine/ai-insights';

const VITALS_DUE_HOURS = 6;

type CensusRow = Pick<
  AdmissionCase,
  'id' | 'bed' | 'ward' | 'patientName' | 'status' | 'nursingPriority'
>;

type TaskRow = Pick<AdmissionTask, 'id' | 'patientName' | 'task' | 'assignedTo' | 'createdAt'>;

const FALLBACK_CENSUS: CensusRow[] = [
  { id: 'ADM-3101', bed: 'ICU-02', ward: 'ICU', patientName: 'Ramesh Iyer', status: 'icu', nursingPriority: 'high' },
  { id: 'ADM-3102', bed: 'ICU-04', ward: 'ICU', patientName: 'Kavita Bhosale', status: 'icu', nursingPriority: 'high' },
  { id: 'ADM-3103', bed: 'GW-08', ward: 'General Ward', patientName: 'Sunita Deshmukh', status: 'admitted', nursingPriority: 'medium' },
  { id: 'ADM-3104', bed: 'GW-11', ward: 'General Ward', patientName: 'Mohammed Ansari', status: 'admitted', nursingPriority: 'medium' },
  { id: 'ADM-3105', bed: 'PVT-03', ward: 'Private', patientName: 'Harpreet Sandhu', status: 'discharge-ready', nursingPriority: 'low' },
  { id: 'ADM-3106', bed: 'GW-14', ward: 'General Ward', patientName: 'Lakshmi Narayanan', status: 'admitted', nursingPriority: 'low' },
];

const FALLBACK_TASKS: TaskRow[] = [
  { id: 'TSK-501', patientName: 'Ramesh Iyer', task: 'Post-op dressing change — abdominal site', assignedTo: 'Nurse Priya Menon', createdAt: '' },
  { id: 'TSK-502', patientName: 'Kavita Bhosale', task: 'Hourly GCS monitoring per neuro orders', assignedTo: 'Nurse Anjali Verma', createdAt: '' },
  { id: 'TSK-503', patientName: 'Sunita Deshmukh', task: 'IV cannula re-site (day 3)', assignedTo: 'Nurse Priya Menon', createdAt: '' },
  { id: 'TSK-504', patientName: 'Mohammed Ansari', task: 'Pre-discharge diabetic counselling', assignedTo: 'Nurse Joseph Thomas', createdAt: '' },
  { id: 'TSK-505', patientName: 'Harpreet Sandhu', task: 'Discharge vitals + summary handover', assignedTo: 'Nurse Anjali Verma', createdAt: '' },
];

const STATUS_TONE: Record<string, StatusTone> = {
  icu: 'critical',
  ot: 'warning',
  admitted: 'info',
  'discharge-ready': 'success',
  stable: 'success',
};

const STATUS_LABEL: Record<string, string> = {
  icu: 'ICU',
  ot: 'In OT',
  admitted: 'Admitted',
  'discharge-ready': 'Discharge ready',
};

const PRIORITY_TONE: Record<string, StatusTone> = {
  high: 'warning',
  medium: 'info',
  low: 'neutral',
};

export default function NurseDashboard2026() {
  const navigate = useNavigate();
  const { admissions, nursingRounds, admissionTasks, wardMedicineIssues } = useHospital();

  const activeAdmissions = useMemo(
    () => admissions.filter((a) => a.status !== 'discharged'),
    [admissions],
  );

  const usingFallbackCensus = activeAdmissions.length === 0;
  const census: CensusRow[] = usingFallbackCensus ? FALLBACK_CENSUS : activeAdmissions;

  const vitalsDueCount = useMemo(() => {
    if (usingFallbackCensus) return 3;
    const cutoff = Date.now() - VITALS_DUE_HOURS * 60 * 60 * 1000;
    return activeAdmissions.filter((a) => {
      const latest = nursingRounds
        .filter((r) => r.admissionId === a.id)
        .reduce<number>((max, r) => {
          const t = Date.parse(r.recordedAt);
          return Number.isNaN(t) ? max : Math.max(max, t);
        }, 0);
      return latest === 0 || latest < cutoff;
    }).length;
  }, [usingFallbackCensus, activeAdmissions, nursingRounds]);

  const medsDueCount =
    wardMedicineIssues.length === 0
      ? 4
      : wardMedicineIssues.filter((w) => w.administrationStatus === 'issued').length;

  const pendingTasks: TaskRow[] =
    admissionTasks.length === 0
      ? FALLBACK_TASKS
      : admissionTasks.filter((t) => t.status === 'Pending');

  const insights = useMemo(
    () => nurseInsights({ admissions: census, vitalsDueCount, medsDueCount }),
    [census, vitalsDueCount, medsDueCount],
  );

  const metrics: Metric[] = [
    {
      id: 'census',
      label: 'Ward census',
      value: census.length,
      hint: `${census.filter((a) => a.status === 'icu').length} in ICU`,
      icon: BedDouble,
      onClick: () => navigate('/nurse/ward'),
    },
    {
      id: 'vitals',
      label: 'Vitals due',
      value: vitalsDueCount,
      hint: `> ${VITALS_DUE_HOURS}h since last round`,
      icon: Activity,
      onClick: () => navigate('/nurse/vitals'),
    },
    {
      id: 'meds',
      label: 'Meds due',
      value: medsDueCount,
      hint: 'Issued, not administered',
      icon: Pill,
      onClick: () => navigate('/nurse/medications'),
    },
    {
      id: 'tasks',
      label: 'Pending tasks',
      value: pendingTasks.length,
      hint: 'Across the ward this shift',
      icon: ClipboardList,
      onClick: () => navigate('/nurse/tasks'),
    },
  ];

  const censusColumns: DenseColumn<CensusRow>[] = [
    {
      key: 'bed',
      header: 'Bed',
      width: '90px',
      cell: (r) => <span className="font-medium tabular-nums">{r.bed}</span>,
    },
    {
      key: 'patient',
      header: 'Patient',
      cell: (r) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground truncate">{r.patientName}</p>
          <p className="text-[11px] text-muted-foreground truncate">{r.ward}</p>
        </div>
      ),
      searchText: (r) => `${r.patientName} ${r.ward}`,
    },
    {
      key: 'status',
      header: 'Status',
      width: '140px',
      cell: (r) => (
        <StatusChip tone={STATUS_TONE[r.status] ?? 'neutral'} pulse={r.status === 'icu'}>
          {STATUS_LABEL[r.status] ?? r.status}
        </StatusChip>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      width: '110px',
      cell: (r) => (
        <StatusChip tone={PRIORITY_TONE[r.nursingPriority] ?? 'neutral'}>
          {r.nursingPriority.charAt(0).toUpperCase() + r.nursingPriority.slice(1)}
        </StatusChip>
      ),
    },
  ];

  const shiftSteps: WorkflowStep[] = [
    { id: 'handoff', label: 'Handoff review', status: 'done', meta: 'Night shift report acknowledged' },
    {
      id: 'vitals',
      label: 'Vitals round',
      status: vitalsDueCount > 0 ? 'active' : 'done',
      meta: vitalsDueCount > 0 ? `${vitalsDueCount} patient${vitalsDueCount > 1 ? 's' : ''} due` : 'All observations recorded',
    },
    {
      id: 'meds',
      label: 'Medication pass',
      status: vitalsDueCount > 0 ? 'pending' : medsDueCount > 0 ? 'active' : 'done',
      meta: medsDueCount > 0 ? `${medsDueCount} dose${medsDueCount > 1 ? 's' : ''} pending on MAR` : 'MAR complete',
    },
    { id: 'orders', label: 'Order verification', status: 'pending', meta: 'New physician orders to acknowledge' },
    { id: 'docs', label: 'Documentation', status: 'pending', meta: 'Nursing notes before shift end' },
  ];

  return (
    <PageScaffold
      eyebrow="Inpatient"
      title="Ward operations"
      subtitle="Live census, observation windows, and shift workload for the nursing station."
    >
      <MetricGrid metrics={metrics} />

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <SectionPanel
            title="Ward census"
            description="Active admissions by bed — tap a row to open the ward board"
            flush
          >
            <DenseTable
              columns={censusColumns}
              rows={census}
              rowKey={(r) => r.id}
              onRowClick={() => navigate('/nurse/ward')}
              emptyTitle="No active admissions"
            />
          </SectionPanel>

          <SectionPanel title="Tasks due" description="Pending nursing tasks for this shift">
            {pendingTasks.slice(0, 6).map((t) => (
              <ListRow
                key={t.id}
                primary={t.task}
                secondary={`${t.patientName} · ${t.assignedTo}`}
                trailing={<StatusChip tone="warning">Pending</StatusChip>}
                onClick={() => navigate('/nurse/tasks')}
              />
            ))}
          </SectionPanel>
        </div>

        <div className="space-y-5">
          <AIInsightPanel insights={insights} />
          <SectionPanel title="Shift workflow" description="Standard ward sequence for this shift">
            <WorkflowStepper steps={shiftSteps} />
          </SectionPanel>
        </div>
      </div>
    </PageScaffold>
  );
}
