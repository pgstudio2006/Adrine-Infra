/**
 * Emergency Dashboard — Adrine 2026 experience.
 * ER command board: live triage acuity, trauma bay occupancy, ER workflow.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ambulance, HeartPulse, Siren, Users } from 'lucide-react';
import { useHospital } from '@/stores/hospitalStore';
import type { EmergencyCase } from '@/stores/hospitalStore';
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
import { emergencyInsights } from '@/lib/adrine/ai-insights';

type CaseRow = Pick<
  EmergencyCase,
  'id' | 'patientName' | 'triage' | 'status' | 'arrivalMode' | 'createdAt' | 'complaint'
>;

const minutesAgoIso = (mins: number) => new Date(Date.now() - mins * 60 * 1000).toISOString();

const FALLBACK_CASES: CaseRow[] = [
  { id: 'ER-1101', patientName: 'Vijay Pawar', triage: 'critical', status: 'in-treatment', arrivalMode: 'Ambulance', createdAt: minutesAgoIso(22), complaint: 'Polytrauma — RTA, GCS 11' },
  { id: 'ER-1102', patientName: 'Meena Krishnan', triage: 'critical', status: 'in-treatment', arrivalMode: 'Ambulance', createdAt: minutesAgoIso(40), complaint: 'Acute chest pain, ST elevation' },
  { id: 'ER-1103', patientName: 'Imran Shaikh', triage: 'urgent', status: 'triaged', arrivalMode: 'Walk-in', createdAt: minutesAgoIso(15), complaint: 'Breathlessness, SpO2 91%' },
  { id: 'ER-1104', patientName: 'Rekha Choudhary', triage: 'urgent', status: 'under-observation', arrivalMode: 'Referral', createdAt: minutesAgoIso(75), complaint: 'High-grade fever with rigors' },
  { id: 'ER-1105', patientName: 'Suresh Babu', triage: 'semi-urgent', status: 'triaged', arrivalMode: 'Walk-in', createdAt: minutesAgoIso(30), complaint: 'Laceration left forearm' },
  { id: 'ER-1106', patientName: 'Anita Gaikwad', triage: 'non-urgent', status: 'triage-pending', arrivalMode: 'Walk-in', createdAt: minutesAgoIso(8), complaint: 'Ankle sprain after fall' },
];

const TRIAGE_TONE: Record<string, StatusTone> = {
  critical: 'critical',
  urgent: 'warning',
  'semi-urgent': 'info',
  'non-urgent': 'success',
  stable: 'success',
};

const STATUS_LABEL: Record<string, string> = {
  'triage-pending': 'Triage pending',
  triaged: 'Triaged',
  'in-treatment': 'In treatment',
  'under-observation': 'Observation',
  'transferred-ipd': 'Transferred IPD',
  discharged: 'Discharged',
};

const arrivalTime = (iso: string) => {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '—';
  return new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const TRAUMA_BAYS = ['Bay 1', 'Bay 2', 'Bay 3', 'Bay 4'];

export default function EmergencyDashboard2026() {
  const navigate = useNavigate();
  const { emergencyCases } = useHospital();

  const source: CaseRow[] = emergencyCases.length > 0 ? emergencyCases : FALLBACK_CASES;

  const activeCases = useMemo(
    () => source.filter((c) => c.status !== 'discharged' && c.status !== 'transferred-ipd'),
    [source],
  );

  const criticalCount = activeCases.filter((c) => c.triage === 'critical').length;
  const urgentCount = activeCases.filter((c) => c.triage === 'urgent').length;
  const ambulanceCount = activeCases.filter((c) => c.arrivalMode === 'Ambulance').length;

  const insights = useMemo(
    () =>
      emergencyInsights({
        cases: source.map((c) => ({ triage: c.triage ?? undefined, status: c.status })),
      }),
    [source],
  );

  /** First N critical/urgent active cases occupy trauma bays in acuity order. */
  const bayOccupants = useMemo(() => {
    const acute = [
      ...activeCases.filter((c) => c.triage === 'critical'),
      ...activeCases.filter((c) => c.triage === 'urgent'),
    ];
    return TRAUMA_BAYS.map((_, i) => acute[i] ?? null);
  }, [activeCases]);

  const metrics: Metric[] = [
    {
      id: 'active',
      label: 'Active cases',
      value: activeCases.length,
      hint: 'On the ER floor now',
      icon: Users,
      onClick: () => navigate('/emergency/cases'),
    },
    {
      id: 'critical',
      label: 'Critical',
      value: criticalCount,
      hint: 'Red triage — senior presence required',
      icon: HeartPulse,
      onClick: () => navigate('/emergency/treatment'),
    },
    {
      id: 'urgent',
      label: 'Urgent',
      value: urgentCount,
      hint: 'Yellow triage — reassess 30 min',
      icon: Siren,
      onClick: () => navigate('/emergency/triage'),
    },
    {
      id: 'ambulance',
      label: 'Ambulance arrivals',
      value: ambulanceCount,
      hint: 'Of active cases',
      icon: Ambulance,
      onClick: () => navigate('/emergency/ambulance'),
    },
  ];

  const caseColumns: DenseColumn<CaseRow>[] = [
    {
      key: 'id',
      header: 'Case',
      width: '90px',
      cell: (r) => <span className="font-medium tabular-nums">{r.id}</span>,
    },
    {
      key: 'patientName',
      header: 'Patient',
      cell: (r) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground truncate">{r.patientName}</p>
          <p className="text-[11px] text-muted-foreground truncate">{r.complaint}</p>
        </div>
      ),
      searchText: (r) => `${r.patientName} ${r.complaint}`,
    },
    {
      key: 'triage',
      header: 'Triage',
      width: '120px',
      cell: (r) =>
        r.triage ? (
          <StatusChip tone={TRIAGE_TONE[r.triage] ?? 'neutral'} pulse={r.triage === 'critical'}>
            {r.triage.charAt(0).toUpperCase() + r.triage.slice(1)}
          </StatusChip>
        ) : (
          <StatusChip tone="neutral">Pending</StatusChip>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '130px',
      cell: (r) => <span className="text-muted-foreground">{STATUS_LABEL[r.status] ?? r.status}</span>,
    },
    {
      key: 'arrival',
      header: 'Arrival',
      width: '130px',
      cell: (r) => (
        <div>
          <p className="text-foreground">{r.arrivalMode}</p>
          <p className="text-[11px] text-muted-foreground tabular-nums">{arrivalTime(r.createdAt)}</p>
        </div>
      ),
    },
  ];

  const triagePending = activeCases.some((c) => c.status === 'triage-pending');

  const erSteps: WorkflowStep[] = [
    { id: 'arrival', label: 'Arrival', status: 'done', meta: 'Registered at ER desk' },
    {
      id: 'triage',
      label: 'Triage',
      status: triagePending ? 'active' : 'done',
      meta: triagePending ? 'New arrivals awaiting triage' : 'All arrivals triaged',
    },
    { id: 'registration', label: 'Registration', status: 'pending', meta: 'UHID + consent capture' },
    { id: 'treatment', label: 'Treatment', status: 'pending', meta: 'Orders, observation, procedures' },
    { id: 'disposition', label: 'Disposition', status: 'pending', meta: 'Admit / discharge / transfer' },
  ];

  return (
    <PageScaffold
      eyebrow="Emergency"
      title="ER command board"
      subtitle="Live triage acuity, trauma bay status, and patient flow through the ER."
    >
      <MetricGrid metrics={metrics} />

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <SectionPanel
            title="Triage board"
            description="Active cases by acuity — tap a row to open the case list"
            flush
          >
            <DenseTable
              columns={caseColumns}
              rows={activeCases}
              rowKey={(r) => r.id}
              onRowClick={() => navigate('/emergency/cases')}
              emptyTitle="No active cases"
            />
          </SectionPanel>

          <SectionPanel title="Trauma bays" description="Resuscitation bay occupancy">
            {TRAUMA_BAYS.map((bay, i) => {
              const occupant = bayOccupants[i];
              return (
                <ListRow
                  key={bay}
                  primary={bay}
                  secondary={
                    occupant ? `${occupant.patientName} · ${occupant.complaint}` : 'Ready for next arrival'
                  }
                  trailing={
                    occupant ? (
                      <StatusChip
                        tone={occupant.triage === 'critical' ? 'critical' : 'warning'}
                        pulse={occupant.triage === 'critical'}
                      >
                        Occupied
                      </StatusChip>
                    ) : (
                      <StatusChip tone="success">Free</StatusChip>
                    )
                  }
                />
              );
            })}
          </SectionPanel>
        </div>

        <div className="space-y-5">
          <AIInsightPanel insights={insights} />
          <SectionPanel title="ER workflow" description="Door-to-disposition pathway">
            <WorkflowStepper steps={erSteps} />
          </SectionPanel>
        </div>
      </div>
    </PageScaffold>
  );
}
