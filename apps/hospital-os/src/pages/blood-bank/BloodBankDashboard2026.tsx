/**
 * Blood Bank Dashboard — Adrine 2026 experience.
 * Transfusion medicine: stock posture, requisition queue, safety workflow.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, FlaskConical, ShieldAlert, UserCheck } from 'lucide-react';
import {
  PageScaffold,
  MetricGrid,
  SectionPanel,
  ListRow,
  StatusChip,
  WorkflowStepper,
  type Metric,
  type StatusTone,
  type WorkflowStep,
} from '@/components/adrine/primitives';
import { DenseTable, type DenseColumn } from '@/components/adrine/dense-table';
import { AIInsightPanel } from '@/components/adrine/ai-panel';
import type { AIInsight } from '@/lib/adrine/ai-insights';
import {
  BLOOD_UNITS,
  DONORS,
  REQUISITIONS,
  type BloodGroup,
  type BloodRequisition,
} from './bloodBankReferenceData';

type RequisitionRow = {
  id: string;
  patient: string;
  group: string;
  component: string;
  urgency: BloodRequisition['urgency'];
  status: string;
};

const CRITICAL_GROUPS: Array<{ group: BloodGroup; minUnits: number }> = [
  { group: 'O-', minUnits: 3 },
  { group: 'AB-', minUnits: 2 },
  { group: 'B-', minUnits: 2 },
];

const TRANSFUSION_STEPS: WorkflowStep[] = [
  { id: 'requisition', label: 'Requisition', status: 'done', meta: 'BR-501 · ICU-2 · 2 units PRBC' },
  { id: 'crossmatch', label: 'Cross-match', status: 'active', meta: 'Major cross-match in progress' },
  { id: 'issue', label: 'Issue', status: 'pending', meta: 'Cold-chain transport to ICU-2' },
  { id: 'transfuse', label: 'Transfuse', status: 'pending', meta: 'Bedside two-person verification' },
  { id: 'reaction-watch', label: 'Reaction watch', status: 'pending', meta: 'Vitals at 15 min and 1 hr post-start' },
];

const BLOOD_BANK_INSIGHTS: AIInsight[] = [
  {
    id: 'o-neg-critical',
    severity: 'critical',
    title: 'O-negative stock below the 3-unit emergency floor',
    recommendation: 'Activate O- replacement donor calls and request 4 units from the regional exchange today.',
    reasoning: [
      'Zero O- units are in Available status — the only O- unit on shelf is in quarantine with a reactive HBsAg screen and is headed for discard.',
      'Policy holds a minimum 3-unit O- buffer because it is the universal-donor red-cell group for unmatched emergencies.',
      'Trauma and obstetric protocols both assume immediate uncrossmatched O- availability.',
      'Donor registry lists 2 eligible O- voluntary donors within callable distance; regional exchange runs a 6-hour fulfilment window.',
    ],
    confidence: 0.93,
    action: { label: 'Open donor registry', to: '/blood-bank/donors' },
  },
  {
    id: 'platelet-expiry',
    severity: 'warning',
    title: 'Platelet unit expires within 24 hours',
    recommendation: 'Offer unit BB-U-24003 (A+ platelets) to haematology/oncology before tomorrow morning.',
    reasoning: [
      'Platelets carry a 5-day shelf life; this unit expires 08 Jun cycle equivalent — under 24 hours remain.',
      'No pending requisition currently requests A+ platelets.',
      'Oncology day-care routinely consumes platelets and can absorb the unit clinically.',
    ],
    confidence: 0.86,
    action: { label: 'View inventory', to: '/blood-bank/inventory' },
  },
];

export default function BloodBankDashboard2026() {
  const navigate = useNavigate();

  const { availableUnits, quarantineUnits, eligibleDonors, pendingReqs, criticalStock } = useMemo(() => {
    const available = BLOOD_UNITS.filter((u) => u.status === 'Available');
    return {
      availableUnits: available.length,
      quarantineUnits: BLOOD_UNITS.filter((u) => u.status === 'Quarantine').length,
      eligibleDonors: DONORS.filter((d) => d.eligible).length,
      pendingReqs: REQUISITIONS.filter((r) => r.status === 'Pending').length,
      criticalStock: CRITICAL_GROUPS.map(({ group, minUnits }) => {
        const onShelf = available.filter((u) => u.bloodGroup === group).length;
        return {
          group,
          onShelf,
          minUnits,
          tone: (onShelf === 0 ? 'critical' : onShelf < minUnits ? 'warning' : 'success') as StatusTone,
        };
      }),
    };
  }, []);

  const metrics: Metric[] = [
    { id: 'available', label: 'Available units', value: availableUnits, icon: Droplets, hint: 'Released after TTI screen' },
    { id: 'donors', label: 'Eligible donors', value: eligibleDonors, icon: UserCheck, hint: 'In active registry' },
    { id: 'requisitions', label: 'Pending requisitions', value: pendingReqs, icon: FlaskConical, hint: '1 emergency priority' },
    { id: 'quarantine', label: 'Quarantine', value: quarantineUnits, icon: ShieldAlert, hint: 'Awaiting TTI disposition' },
  ];

  const reqRows: RequisitionRow[] = REQUISITIONS.map((r) => ({
    id: r.reqId,
    patient: r.patientName,
    group: r.bloodGroup,
    component: r.component,
    urgency: r.urgency,
    status: r.status,
  }));

  const columns: DenseColumn<RequisitionRow>[] = [
    { key: 'id', header: 'Req ID', width: '88px', cell: (r) => <span className="tabular-nums font-medium">{r.id}</span> },
    { key: 'patient', header: 'Patient', cell: (r) => <span className="font-medium">{r.patient}</span>, searchText: (r) => r.patient },
    { key: 'group', header: 'Group', width: '72px', cell: (r) => <span className="tabular-nums">{r.group}</span> },
    { key: 'component', header: 'Component' },
    {
      key: 'urgency',
      header: 'Urgency',
      cell: (r) => (
        <StatusChip tone={r.urgency === 'Emergency' ? 'critical' : 'neutral'} pulse={r.urgency === 'Emergency'}>
          {r.urgency}
        </StatusChip>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => (
        <StatusChip tone={r.status === 'Issued' ? 'success' : r.status === 'Cross-matched' ? 'info' : 'warning'}>
          {r.status}
        </StatusChip>
      ),
    },
  ];

  return (
    <PageScaffold
      eyebrow="Transfusion medicine"
      title="Blood bank operations"
      subtitle="Component stock, requisition flow, and haemovigilance state."
    >
      <MetricGrid metrics={metrics} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <SectionPanel
          title="Requisition queue"
          description="Cross-match and issue pipeline"
          flush
          className="xl:col-span-2"
        >
          <DenseTable
            columns={columns}
            rows={reqRows}
            rowKey={(r) => r.id}
            searchable
            searchPlaceholder="Search requisitions…"
            onRowClick={() => navigate('/blood-bank/issue')}
            emptyTitle="No pending requisitions"
          />
        </SectionPanel>

        <div className="space-y-5">
          <SectionPanel title="Critical stock" description="Rare-group buffer vs policy floor">
            {criticalStock.map((row) => (
              <ListRow
                key={row.group}
                primary={`Group ${row.group}`}
                secondary={`Policy floor ${row.minUnits} units`}
                trailing={
                  <StatusChip tone={row.tone} className="tabular-nums">
                    {row.onShelf} on shelf
                  </StatusChip>
                }
                onClick={() => navigate('/blood-bank/inventory')}
              />
            ))}
          </SectionPanel>

          <SectionPanel title="Transfusion workflow" description="Active emergency requisition">
            <WorkflowStepper steps={TRANSFUSION_STEPS} />
          </SectionPanel>
        </div>
      </div>

      <AIInsightPanel insights={BLOOD_BANK_INSIGHTS} />
    </PageScaffold>
  );
}
