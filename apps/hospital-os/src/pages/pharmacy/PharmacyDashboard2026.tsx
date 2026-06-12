/**
 * Pharmacy Dashboard — Adrine 2026 experience.
 * Dispensary operations: Rx queue, stock pressure, dispensing workflow.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Boxes, PackageMinus, Receipt, Timer } from 'lucide-react';
import { useHospital } from '@/stores/hospitalStore';
import type { PharmacyInventoryItem, PrescriptionOrder } from '@/stores/hospitalStore';
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
import { pharmacyInsights } from '@/lib/adrine/ai-insights';

type RxRow = {
  id: string;
  patientName: string;
  doctor: string;
  itemCount: number;
  status: PrescriptionOrder['status'];
};

type StockRow = Pick<PharmacyInventoryItem, 'id' | 'drug' | 'generic' | 'qty' | 'reorder'>;

const FALLBACK_RX: RxRow[] = [
  { id: 'RX-7841', patientName: 'Sunita Deshmukh', doctor: 'Dr. Arvind Kulkarni', itemCount: 4, status: 'Verified' },
  { id: 'RX-7842', patientName: 'Mohammed Ansari', doctor: 'Dr. Neha Sharma', itemCount: 2, status: 'Pending' },
  { id: 'RX-7843', patientName: 'Ramesh Iyer', doctor: 'Dr. Vikram Rathod', itemCount: 6, status: 'Verified' },
  { id: 'RX-7844', patientName: 'Lakshmi Narayanan', doctor: 'Dr. Neha Sharma', itemCount: 3, status: 'Pending' },
  { id: 'RX-7845', patientName: 'Harpreet Sandhu', doctor: 'Dr. Arvind Kulkarni', itemCount: 1, status: 'Verified' },
];

const FALLBACK_LOW_STOCK: StockRow[] = [
  { id: 'INV-201', drug: 'Inj. Ceftriaxone 1g', generic: 'Ceftriaxone', qty: 8, reorder: 40 },
  { id: 'INV-202', drug: 'Tab. Metformin 500mg', generic: 'Metformin', qty: 35, reorder: 100 },
  { id: 'INV-203', drug: 'Inj. Insulin Glargine', generic: 'Insulin glargine', qty: 4, reorder: 20 },
  { id: 'INV-204', drug: 'Syp. Paracetamol 250mg', generic: 'Paracetamol', qty: 12, reorder: 30 },
];

const RX_STATUS_TONE: Record<string, StatusTone> = {
  Pending: 'warning',
  Verified: 'info',
  Dispensed: 'success',
  'Partially dispensed': 'warning',
  Cancelled: 'neutral',
};

function isToday(dateStr: string): boolean {
  const t = Date.parse(dateStr);
  if (Number.isNaN(t)) return false;
  const d = new Date(t);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function PharmacyDashboard2026() {
  const navigate = useNavigate();
  const { prescriptions, pharmacyInventory } = useHospital();

  const pendingRx = useMemo(
    () => prescriptions.filter((p) => p.status === 'Pending' || p.status === 'Verified'),
    [prescriptions],
  );

  const rxRows: RxRow[] =
    pendingRx.length > 0
      ? pendingRx.map((p) => ({
          id: p.id,
          patientName: p.patientName,
          doctor: p.doctor,
          itemCount: p.meds.length,
          status: p.status,
        }))
      : FALLBACK_RX;

  const dispensedToday =
    prescriptions.length === 0
      ? 18
      : prescriptions.filter(
          (p) =>
            (p.status === 'Dispensed' || p.status === 'Partially dispensed') && isToday(p.date),
        ).length;

  const lowStock: StockRow[] =
    pharmacyInventory.length === 0
      ? FALLBACK_LOW_STOCK
      : pharmacyInventory.filter((i) => i.qty <= i.reorder);

  const totalSkus = pharmacyInventory.length === 0 ? 248 : pharmacyInventory.length;

  const insights = useMemo(
    () =>
      pharmacyInsights({
        pendingRx: rxRows.length,
        lowStock: lowStock.map((i) => ({ quantity: i.qty, reorderLevel: i.reorder })),
      }),
    [rxRows.length, lowStock],
  );

  const metrics: Metric[] = [
    {
      id: 'queue',
      label: 'Rx queue',
      value: rxRows.length,
      hint: 'Awaiting verification or dispense',
      icon: Receipt,
      onClick: () => navigate('/pharmacy/prescriptions'),
    },
    {
      id: 'dispensed',
      label: 'Dispensed today',
      value: dispensedToday,
      hint: 'Completed since midnight',
      icon: Timer,
    },
    {
      id: 'low-stock',
      label: 'Low stock',
      value: lowStock.length,
      hint: 'At or below reorder level',
      icon: PackageMinus,
      onClick: () => navigate('/pharmacy/inventory'),
    },
    {
      id: 'skus',
      label: 'Total SKUs',
      value: totalSkus,
      hint: 'Active formulary items',
      icon: Boxes,
      onClick: () => navigate('/pharmacy/inventory'),
    },
  ];

  const rxColumns: DenseColumn<RxRow>[] = [
    {
      key: 'id',
      header: 'Rx ID',
      width: '100px',
      cell: (r) => <span className="font-medium tabular-nums">{r.id}</span>,
    },
    {
      key: 'patientName',
      header: 'Patient',
      cell: (r) => <span className="font-medium">{r.patientName}</span>,
      searchText: (r) => r.patientName,
    },
    { key: 'doctor', header: 'Doctor', cell: (r) => r.doctor },
    {
      key: 'itemCount',
      header: 'Items',
      width: '70px',
      align: 'right',
      cell: (r) => <span className="tabular-nums">{r.itemCount}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '130px',
      cell: (r) => <StatusChip tone={RX_STATUS_TONE[r.status] ?? 'neutral'}>{r.status}</StatusChip>,
    },
  ];

  const dispenseSteps: WorkflowStep[] = [
    { id: 'verify', label: 'Verify Rx', status: 'done', meta: 'Pharmacist check against order' },
    {
      id: 'pick',
      label: 'Pick & label',
      status: rxRows.length > 0 ? 'active' : 'done',
      meta: rxRows.length > 0 ? `${rxRows.length} prescription${rxRows.length > 1 ? 's' : ''} in queue` : 'Queue clear',
    },
    { id: 'counsel', label: 'Counsel', status: 'pending', meta: 'Dosage and interaction guidance' },
    { id: 'dispense', label: 'Dispense', status: 'pending', meta: 'Hand over with receipt' },
    { id: 'stock', label: 'Stock decrement', status: 'pending', meta: 'Auto-posted to inventory ledger' },
  ];

  return (
    <PageScaffold
      eyebrow="Pharmacy"
      title="Dispensary operations"
      subtitle="Prescription queue, stock alerts, and the dispensing workflow at a glance."
    >
      <MetricGrid metrics={metrics} />

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <SectionPanel
            title="Prescription queue"
            description="Pending and verified prescriptions awaiting dispense"
            flush
          >
            <DenseTable
              columns={rxColumns}
              rows={rxRows}
              rowKey={(r) => r.id}
              onRowClick={() => navigate('/pharmacy/prescriptions')}
              emptyTitle="Queue clear"
            />
          </SectionPanel>

          <SectionPanel title="Low stock alerts" description="Quantity at or below reorder threshold">
            {lowStock.slice(0, 6).map((item) => {
              const veryLow = item.qty <= Math.max(1, Math.round(item.reorder * 0.4));
              return (
                <ListRow
                  key={item.id}
                  primary={item.drug}
                  secondary={`${item.generic} · reorder at ${item.reorder}`}
                  trailing={
                    <StatusChip tone={veryLow ? 'critical' : 'warning'} pulse={veryLow}>
                      {item.qty} / {item.reorder}
                    </StatusChip>
                  }
                  onClick={() => navigate('/pharmacy/inventory')}
                />
              );
            })}
          </SectionPanel>
        </div>

        <div className="space-y-5">
          <AIInsightPanel insights={insights} />
          <SectionPanel title="Dispensing workflow" description="Closed-loop dispensing sequence">
            <WorkflowStepper steps={dispenseSteps} />
          </SectionPanel>
        </div>
      </div>
    </PageScaffold>
  );
}
