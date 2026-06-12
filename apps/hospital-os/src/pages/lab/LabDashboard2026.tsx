/**
 * LabDashboard2026 — laboratory pipeline surface for the Adrine 2026
 * experience. Worklist, analyser fleet, and STAT pressure in one view.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCheck, Cpu, Droplets, FlaskConical, Zap } from 'lucide-react';
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
import { labInsights } from '@/lib/adrine/ai-insights';
import { useHospital } from '@/stores/hospitalStore';
import { Button } from '@/components/ui/button';

type WorklistRow = {
  id: string;
  patient: string;
  test: string;
  stage: string;
  priority: string;
};

const FALLBACK_WORKLIST: WorklistRow[] = [
  { id: 'LB-88231', patient: 'Rajesh Kumar', test: 'Lipid profile', stage: 'In Analysis', priority: 'Routine' },
  { id: 'LB-88232', patient: 'Priya Patel', test: 'CBC with ESR', stage: 'Awaiting Validation', priority: 'Urgent' },
  { id: 'LB-88233', patient: 'Mohammed Ali', test: 'Troponin-I', stage: 'Pending Analysis', priority: 'Emergency' },
  { id: 'LB-88234', patient: 'Sunita Devi', test: 'HbA1c', stage: 'In Analysis', priority: 'Routine' },
  { id: 'LB-88235', patient: 'Arjun Mehta', test: 'Liver function test', stage: 'Validated', priority: 'Routine' },
  { id: 'LB-88236', patient: 'Kavita Sharma', test: 'Thyroid panel', stage: 'Reported', priority: 'Urgent' },
];

const STAGE_TONE: Record<string, StatusTone> = {
  'Pending Analysis': 'neutral',
  'In Analysis': 'info',
  'Awaiting Validation': 'warning',
  Validated: 'success',
  Reported: 'success',
};

const PRIORITY_TONE: Record<string, StatusTone> = {
  Routine: 'neutral',
  Urgent: 'warning',
  Emergency: 'critical',
};

const ANALYSERS = [
  { id: 'sysmex', name: 'Sysmex XN-1000', detail: 'Haematology · 5-part differential' },
  { id: 'vidas', name: 'BioMérieux VIDAS', detail: 'Immunoassay · serology panel' },
  { id: 'biorad', name: 'BioRad D-10', detail: 'HbA1c · variant analysis' },
  { id: 'transasia', name: 'Transasia EM-200', detail: 'Clinical chemistry · 200 tests/hr' },
];

export default function LabDashboard2026() {
  const navigate = useNavigate();
  const { labOrders } = useHospital();

  const todayYmd = new Date().toISOString().slice(0, 10);

  const inPipeline = labOrders.filter((o) => o.stage !== 'Reported').length;
  const statCount = labOrders.filter((o) => o.priority === 'Emergency' && o.stage !== 'Reported').length;
  const awaitingVerification = labOrders.filter((o) => o.stage === 'Awaiting Validation').length;
  const reportedToday = labOrders.filter(
    (o) => o.stage === 'Reported' && (o.reportedAt ?? '').slice(0, 10) === todayYmd,
  ).length;

  const metrics: Metric[] = [
    {
      id: 'pipeline',
      label: 'In pipeline',
      value: labOrders.length > 0 ? inPipeline : 17,
      hint: 'Orders not yet reported',
      icon: FlaskConical,
      onClick: () => navigate('/lab/worklist'),
    },
    {
      id: 'stat',
      label: 'STAT orders',
      value: labOrders.length > 0 ? statCount : 2,
      hint: '60-minute TAT target',
      icon: Zap,
    },
    {
      id: 'verification',
      label: 'Awaiting verification',
      value: labOrders.length > 0 ? awaitingVerification : 5,
      hint: 'Results pending sign-off',
      icon: CheckCheck,
    },
    {
      id: 'reported',
      label: 'Reported today',
      value: labOrders.length > 0 ? reportedToday : 31,
      hint: 'Dispatched to clinicians',
      icon: Cpu,
    },
  ];

  const insights = useMemo(
    () =>
      labInsights({
        orders: labOrders.map((o) => ({
          stage: o.stage === 'Reported' ? 'reported' : o.stage === 'Pending Analysis' ? 'ordered' : 'in-process',
          status: o.stage === 'Reported' ? 'completed' : 'pending',
          priority: o.priority === 'Emergency' ? 'stat' : o.priority.toLowerCase(),
        })),
      }),
    [labOrders],
  );

  const worklistRows: WorklistRow[] =
    labOrders.length > 0
      ? labOrders.slice(0, 8).map((o) => ({
          id: o.orderId,
          patient: o.patientName,
          test: o.tests,
          stage: o.stage,
          priority: o.priority,
        }))
      : FALLBACK_WORKLIST;

  const worklistColumns: DenseColumn<WorklistRow>[] = [
    {
      key: 'id',
      header: 'Order',
      width: '100px',
      cell: (r) => <span className="tabular-nums font-medium">{r.id}</span>,
    },
    { key: 'patient', header: 'Patient', cell: (r) => <span className="font-medium">{r.patient}</span> },
    { key: 'test', header: 'Test', cell: (r) => <span className="text-muted-foreground">{r.test}</span> },
    {
      key: 'stage',
      header: 'Stage',
      width: '150px',
      cell: (r) => <StatusChip tone={STAGE_TONE[r.stage] ?? 'neutral'}>{r.stage}</StatusChip>,
    },
    {
      key: 'priority',
      header: 'Priority',
      width: '110px',
      cell: (r) => (
        <StatusChip tone={PRIORITY_TONE[r.priority] ?? 'neutral'}>
          {r.priority === 'Emergency' ? 'STAT' : r.priority}
        </StatusChip>
      ),
    },
  ];

  return (
    <PageScaffold
      eyebrow="Diagnostics"
      title="Laboratory pipeline"
      subtitle="Worklist, verification queue, and analyser fleet health."
    >
      <MetricGrid metrics={metrics} columns={4} />

      <AIInsightPanel insights={insights} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
        <SectionPanel title="Worklist" description="Tap a row to open the full worklist" flush>
          <DenseTable
            columns={worklistColumns}
            rows={worklistRows}
            rowKey={(r) => r.id}
            onRowClick={() => navigate('/lab/worklist')}
            searchable={false}
            maxHeight="max-h-[380px]"
            emptyTitle="Pipeline is clear"
          />
        </SectionPanel>

        <div className="space-y-5">
          <SectionPanel
            title="Analyser fleet"
            description="Interfaced instruments"
            actions={
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-[11px] text-muted-foreground"
                onClick={() => navigate('/lab/analyzers')}
              >
                Manage
                <ArrowRight className="h-3 w-3" />
              </Button>
            }
          >
            {ANALYSERS.map((a) => (
              <ListRow
                key={a.id}
                primary={a.name}
                secondary={a.detail}
                trailing={
                  <StatusChip tone="success" pulse>
                    Online
                  </StatusChip>
                }
              />
            ))}
          </SectionPanel>

          <SectionPanel title="Related services" description="Cross-department diagnostics">
            <ListRow
              primary={
                <span className="inline-flex items-center gap-2">
                  <Droplets className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                  Blood bank
                </span>
              }
              secondary="Stock, cross-match, and issue registry"
              onClick={() => navigate('/blood-bank')}
              trailing={<ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
            />
          </SectionPanel>
        </div>
      </div>
    </PageScaffold>
  );
}
