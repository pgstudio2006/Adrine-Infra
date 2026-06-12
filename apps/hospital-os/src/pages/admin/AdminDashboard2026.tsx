/**
 * AdminDashboard2026 — hospital command surface for the Adrine 2026 experience.
 * Composes design-system primitives over live hospitalStore data with
 * realistic fallbacks so the demo never renders empty.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Bed,
  FlaskConical,
  HeartPulse,
  IndianRupee,
  Pill,
  Scissors,
  Siren,
  Users,
} from 'lucide-react';
import {
  PageScaffold,
  MetricGrid,
  SectionPanel,
  StatusChip,
  ListRow,
  type Metric,
  type StatusTone,
} from '@/components/adrine/primitives';
import { DenseTable, type DenseColumn } from '@/components/adrine/dense-table';
import { AIInsightPanel } from '@/components/adrine/ai-panel';
import { adminInsights } from '@/lib/adrine/ai-insights';
import { useHospital } from '@/stores/hospitalStore';
import { Button } from '@/components/ui/button';

const TOTAL_BEDS = 200;

type ActivityRow = {
  id: string;
  time: string;
  module: string;
  action: string;
  patient: string;
  details: string;
};

const FALLBACK_ACTIVITY: ActivityRow[] = [
  { id: 'wf-fb-1', time: '09:42', module: 'reception', action: 'Patient registered', patient: 'Rajesh Kumar', details: 'UHID ADR-2026-0412 · General Medicine walk-in' },
  { id: 'wf-fb-2', time: '09:51', module: 'doctor', action: 'Consultation closed', patient: 'Priya Patel', details: 'OPD token 14 · Rx and CBC ordered' },
  { id: 'wf-fb-3', time: '10:05', module: 'lab', action: 'Sample collected', patient: 'Mohammed Ali', details: 'Lipid profile · barcode LB-88231' },
  { id: 'wf-fb-4', time: '10:18', module: 'billing', action: 'Invoice settled', patient: 'Sunita Devi', details: '₹2,450 · UPI · OPD package' },
  { id: 'wf-fb-5', time: '10:31', module: 'emergency', action: 'Triage completed', patient: 'Arjun Mehta', details: 'Urgent · chest pain pathway opened' },
  { id: 'wf-fb-6', time: '10:44', module: 'pharmacy', action: 'Rx dispensed', patient: 'Kavita Sharma', details: '4 items · counter 2' },
];

const MODULE_TONE: Record<string, StatusTone> = {
  emergency: 'critical',
  lab: 'info',
  pharmacy: 'success',
  billing: 'neutral',
  reception: 'info',
  doctor: 'active',
};

function formatINR(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function formatEventTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

const QUICK_LINKS: { label: string; to: string }[] = [
  { label: 'Command Center', to: '/admin/command-center' },
  { label: 'Disease Mapping', to: '/admin/disease-mapping' },
  { label: 'Geo Intelligence', to: '/admin/geo-intelligence' },
  { label: 'MIS Reports', to: '/admin/mis' },
  { label: 'Lab Analyzers', to: '/lab/analyzers' },
  { label: 'Blood Bank', to: '/blood-bank' },
];

export default function AdminDashboard2026() {
  const navigate = useNavigate();
  const {
    patients,
    queue,
    admissions,
    emergencyCases,
    invoices,
    labOrders,
    prescriptions,
    workflowEvents,
  } = useHospital();

  const todayYmd = new Date().toISOString().slice(0, 10);

  const activeAdmissions = admissions.filter((a) => a.status !== 'discharged');
  const icuCensus = admissions.filter((a) => a.status === 'icu').length;
  const occupiedBeds = activeAdmissions.length > 0 ? activeAdmissions.length : 156;
  const occupancyPct = Math.min(100, Math.round((occupiedBeds / TOTAL_BEDS) * 100));

  const revenueToday = invoices
    .filter((i) => i.date?.slice(0, 10) === todayYmd)
    .reduce((sum, i) => sum + (i.paid ?? 0), 0);

  const metrics: Metric[] = [
    {
      id: 'active-patients',
      label: 'Active patients',
      value: patients.length > 0 ? patients.length : 1248,
      hint: 'Registered on this branch',
      icon: Users,
    },
    {
      id: 'opd-today',
      label: "Today's OPD",
      value: queue.length > 0 ? queue.length : 42,
      hint: 'Tokens issued',
      icon: Activity,
      onClick: () => navigate('/admin/command-center'),
    },
    {
      id: 'bed-occupancy',
      label: 'Bed occupancy',
      value: `${occupancyPct}%`,
      hint: `${occupiedBeds} of ${TOTAL_BEDS} beds`,
      icon: Bed,
    },
    {
      id: 'revenue-today',
      label: 'Revenue today',
      value: revenueToday > 0 ? formatINR(revenueToday) : '₹4,20,000',
      hint: 'Collections across all desks',
      icon: IndianRupee,
    },
    {
      id: 'icu-census',
      label: 'ICU census',
      value: icuCensus > 0 ? icuCensus : 6,
      hint: 'Critical care beds in use',
      icon: HeartPulse,
    },
  ];

  const insights = useMemo(
    () => adminInsights({ queue, admissions, emergencyCases, invoices }),
    [queue, admissions, emergencyCases, invoices],
  );

  const erActive = emergencyCases.filter((e) => e.status !== 'discharged').length;
  const labPipeline = labOrders.filter((o) => o.stage !== 'Reported').length;
  const pharmacyPending = prescriptions.filter((p) => p.status === 'Pending').length;
  const otToday = admissions.filter((a) => a.status === 'ot').length;

  const pulse = [
    {
      id: 'er',
      icon: Siren,
      label: 'Emergency',
      detail: 'Active cases on the ER board',
      count: erActive > 0 ? erActive : 3,
      tone: (erActive > 4 ? 'critical' : 'warning') as StatusTone,
    },
    {
      id: 'lab',
      icon: FlaskConical,
      label: 'Laboratory',
      detail: 'Orders in pipeline',
      count: labPipeline > 0 ? labPipeline : 17,
      tone: 'info' as StatusTone,
    },
    {
      id: 'pharmacy',
      icon: Pill,
      label: 'Pharmacy',
      detail: 'Prescriptions awaiting dispense',
      count: pharmacyPending > 0 ? pharmacyPending : 5,
      tone: 'neutral' as StatusTone,
    },
    {
      id: 'ot',
      icon: Scissors,
      label: 'Operation theatre',
      detail: 'Patients in OT today',
      count: otToday > 0 ? otToday : 2,
      tone: 'active' as StatusTone,
    },
  ];

  const activityRows: ActivityRow[] =
    workflowEvents.length > 0
      ? [...workflowEvents]
          .slice(-8)
          .reverse()
          .map((e) => ({
            id: e.id,
            time: formatEventTime(e.timestamp),
            module: e.module,
            action: e.action,
            patient: e.patientName ?? '—',
            details: e.details,
          }))
      : FALLBACK_ACTIVITY;

  const activityColumns: DenseColumn<ActivityRow>[] = [
    { key: 'time', header: 'Time', width: '64px', cell: (r) => <span className="tabular-nums text-muted-foreground">{r.time}</span> },
    {
      key: 'module',
      header: 'Module',
      width: '110px',
      cell: (r) => <StatusChip tone={MODULE_TONE[r.module] ?? 'neutral'}>{r.module}</StatusChip>,
    },
    { key: 'action', header: 'Action', cell: (r) => <span className="font-medium">{r.action}</span> },
    { key: 'patient', header: 'Patient' },
    { key: 'details', header: 'Details', cell: (r) => <span className="text-muted-foreground">{r.details}</span> },
  ];

  return (
    <PageScaffold
      eyebrow="Administration"
      title="Hospital command"
      subtitle="Live operational picture across OPD, IPD, diagnostics, and revenue."
    >
      <MetricGrid metrics={metrics} columns={5} />

      <AIInsightPanel insights={insights} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionPanel title="Department pulse" description="Workload signal per service line">
          {pulse.map((p) => (
            <ListRow
              key={p.id}
              primary={
                <span className="inline-flex items-center gap-2">
                  <p.icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                  {p.label}
                </span>
              }
              secondary={p.detail}
              trailing={
                <StatusChip tone={p.tone}>
                  <span className="tabular-nums">{p.count}</span>
                </StatusChip>
              }
            />
          ))}
        </SectionPanel>

        <SectionPanel title="Quick navigation" description="Jump to operational consoles">
          <div className="grid grid-cols-2 gap-2">
            {QUICK_LINKS.map((link) => (
              <Button
                key={link.to}
                variant="outline"
                className="h-9 justify-start text-[12.5px] font-medium"
                onClick={() => navigate(link.to)}
              >
                {link.label}
              </Button>
            ))}
          </div>
        </SectionPanel>
      </div>

      <SectionPanel title="Recent activity" description="Latest workflow events across modules" flush>
        <DenseTable
          columns={activityColumns}
          rows={activityRows}
          rowKey={(r) => r.id}
          searchable={false}
          maxHeight="max-h-[340px]"
          emptyTitle="No recent activity"
        />
      </SectionPanel>
    </PageScaffold>
  );
}
