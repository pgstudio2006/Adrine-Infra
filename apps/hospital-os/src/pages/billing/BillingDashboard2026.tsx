/**
 * Billing Dashboard — Adrine 2026 experience.
 * Revenue cycle: today's collections, pending invoices, TPA queue, payments.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileStack, IndianRupee, ReceiptText, ShieldCheck } from 'lucide-react';
import { useHospital } from '@/stores/hospitalStore';
import type { BillingInvoice } from '@/stores/hospitalStore';
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
import { billingInsights } from '@/lib/adrine/ai-insights';

type InvoiceRow = Pick<
  BillingInvoice,
  'id' | 'patientName' | 'date' | 'category' | 'total' | 'paid' | 'status' | 'paymentMode'
>;

/** Static realistic TPA queue size — store has no TPA field yet. */
const TPA_QUEUE = 12;

const DAY_MS = 24 * 60 * 60 * 1000;

const daysAgoIso = (days: number) => new Date(Date.now() - days * DAY_MS).toISOString();

const FALLBACK_INVOICES: InvoiceRow[] = [
  { id: 'INV-9201', patientName: 'Ramesh Iyer', date: daysAgoIso(0), category: 'IPD', total: 84500, paid: 84500, status: 'paid', paymentMode: undefined },
  { id: 'INV-9202', patientName: 'Sunita Deshmukh', date: daysAgoIso(0), category: 'OPD', total: 1850, paid: 1850, status: 'paid', paymentMode: undefined },
  { id: 'INV-9203', patientName: 'Mohammed Ansari', date: daysAgoIso(1), category: 'Lab', total: 4200, paid: 0, status: 'pending', paymentMode: undefined },
  { id: 'INV-9204', patientName: 'Harpreet Sandhu', date: daysAgoIso(3), category: 'IPD', total: 132000, paid: 60000, status: 'partial', paymentMode: undefined },
  { id: 'INV-9205', patientName: 'Lakshmi Narayanan', date: daysAgoIso(6), category: 'Radiology', total: 7800, paid: 0, status: 'pending', paymentMode: undefined },
  { id: 'INV-9206', patientName: 'Kavita Bhosale', date: daysAgoIso(9), category: 'Emergency', total: 23600, paid: 0, status: 'overdue', paymentMode: undefined },
  { id: 'INV-9207', patientName: 'Arjun Nair', date: daysAgoIso(0), category: 'Pharmacy', total: 2350, paid: 2350, status: 'paid', paymentMode: undefined },
];

const INVOICE_STATUS_TONE: Record<string, StatusTone> = {
  paid: 'success',
  partial: 'info',
  pending: 'warning',
  overdue: 'critical',
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

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

function ageInDays(dateStr: string): number {
  const t = Date.parse(dateStr);
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / DAY_MS));
}

export default function BillingDashboard2026() {
  const navigate = useNavigate();
  const { invoices } = useHospital();

  const data: InvoiceRow[] = invoices.length > 0 ? invoices : FALLBACK_INVOICES;

  const collectionsToday = useMemo(
    () => data.filter((i) => i.paid > 0 && isToday(i.date)).reduce((sum, i) => sum + i.paid, 0),
    [data],
  );

  const pendingInvoices = useMemo(
    () => data.filter((i) => i.status !== 'paid'),
    [data],
  );
  const pendingValue = pendingInvoices.reduce((sum, i) => sum + (i.total - i.paid), 0);

  const paymentsToday = useMemo(
    () => data.filter((i) => i.paid > 0 && isToday(i.date)),
    [data],
  );

  const insights = useMemo(() => billingInsights({ invoices: data }), [data]);

  const metrics: Metric[] = [
    {
      id: 'collections',
      label: 'Collections today',
      value: inr(collectionsToday),
      hint: `${paymentsToday.length} payment${paymentsToday.length === 1 ? '' : 's'} received`,
      icon: IndianRupee,
      onClick: () => navigate('/billing-dept/payments'),
    },
    {
      id: 'pending',
      label: 'Pending invoices',
      value: pendingInvoices.length,
      hint: `${inr(pendingValue)} outstanding`,
      icon: ReceiptText,
      onClick: () => navigate('/billing-dept/invoices'),
    },
    {
      id: 'tpa',
      label: 'TPA queue',
      value: TPA_QUEUE,
      hint: 'Pre-auth & claim follow-ups',
      icon: ShieldCheck,
      onClick: () => navigate('/billing-dept/insurance'),
    },
    {
      id: 'total',
      label: 'Total invoices',
      value: data.length,
      hint: 'Across all categories',
      icon: FileStack,
      onClick: () => navigate('/billing-dept/invoices'),
    },
  ];

  const invoiceColumns: DenseColumn<InvoiceRow>[] = [
    {
      key: 'id',
      header: 'Invoice',
      width: '110px',
      cell: (r) => <span className="font-medium tabular-nums">{r.id}</span>,
    },
    {
      key: 'patientName',
      header: 'Patient',
      cell: (r) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground truncate">{r.patientName}</p>
          <p className="text-[11px] text-muted-foreground">{r.category}</p>
        </div>
      ),
      searchText: (r) => `${r.patientName} ${r.category}`,
    },
    {
      key: 'amount',
      header: 'Amount',
      width: '120px',
      align: 'right',
      cell: (r) => <span className="font-medium tabular-nums">{inr(r.total - r.paid)}</span>,
    },
    {
      key: 'age',
      header: 'Age',
      width: '80px',
      align: 'right',
      cell: (r) => {
        const age = ageInDays(r.date);
        return <span className="tabular-nums">{age === 0 ? 'Today' : `${age}d`}</span>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      cell: (r) => (
        <StatusChip tone={INVOICE_STATUS_TONE[r.status] ?? 'neutral'} pulse={r.status === 'overdue'}>
          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
        </StatusChip>
      ),
    },
  ];

  const revenueSteps: WorkflowStep[] = [
    { id: 'charges', label: 'Charges captured', status: 'done', meta: 'Orders posted from clinical modules' },
    { id: 'invoice', label: 'Invoice raised', status: 'done', meta: 'Charge master rates applied' },
    {
      id: 'payment',
      label: 'Payment',
      status: pendingInvoices.length > 0 ? 'active' : 'done',
      meta: pendingInvoices.length > 0 ? `${pendingInvoices.length} invoice${pendingInvoices.length > 1 ? 's' : ''} awaiting collection` : 'No dues outstanding',
    },
    { id: 'receipt', label: 'Receipt', status: 'pending', meta: 'Issued on settlement' },
    { id: 'recon', label: 'Reconciliation', status: 'pending', meta: 'EOD cash & digital tally' },
  ];

  return (
    <PageScaffold
      eyebrow="Revenue"
      title="Billing & collections"
      subtitle="Cash position, outstanding receivables, and the revenue-cycle pipeline."
    >
      <MetricGrid metrics={metrics} />

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <SectionPanel
            title="Pending invoices"
            description="Outstanding balances by age — tap a row to open invoices"
            flush
          >
            <DenseTable
              columns={invoiceColumns}
              rows={pendingInvoices}
              rowKey={(r) => r.id}
              onRowClick={() => navigate('/billing-dept/invoices')}
              emptyTitle="No pending invoices"
            />
          </SectionPanel>

          <SectionPanel title="Today's payments" description="Settlements received since midnight">
            {paymentsToday.length === 0 ? (
              <p className="text-[12px] text-muted-foreground py-2">No payments recorded yet today.</p>
            ) : (
              paymentsToday.slice(0, 6).map((p) => (
                <ListRow
                  key={p.id}
                  primary={p.patientName}
                  secondary={`${p.id} · ${p.category}${p.paymentMode ? ` · ${p.paymentMode}` : ''}`}
                  trailing={
                    <span className="text-[13px] font-medium tabular-nums text-foreground">{inr(p.paid)}</span>
                  }
                  onClick={() => navigate('/billing-dept/payments')}
                />
              ))
            )}
          </SectionPanel>
        </div>

        <div className="space-y-5">
          <AIInsightPanel insights={insights} />
          <SectionPanel title="Revenue cycle" description="Charge-to-cash pipeline">
            <WorkflowStepper steps={revenueSteps} />
          </SectionPanel>
        </div>
      </div>
    </PageScaffold>
  );
}
