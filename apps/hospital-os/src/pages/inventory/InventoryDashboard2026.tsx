/**
 * Inventory Dashboard — Adrine 2026 experience.
 * Supply chain: stock posture, recent movements, reorder intelligence.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Boxes, CalendarX2, FileText, IndianRupee, PackageMinus } from 'lucide-react';
import {
  PageScaffold,
  MetricGrid,
  SectionPanel,
  ListRow,
  StatusChip,
  type Metric,
} from '@/components/adrine/primitives';
import { DenseTable, type DenseColumn } from '@/components/adrine/dense-table';
import { AIInsightPanel } from '@/components/adrine/ai-panel';
import type { AIInsight } from '@/lib/adrine/ai-insights';
import { useInventoryPlatformData } from '@/hooks/useInventoryPlatformData';
import { mapMoveToRecentRow } from '@/lib/inventory/inventory-presenters';

type MoveRow = {
  id: string;
  type: 'in' | 'out';
  item: string;
  qty: string;
  dept: string;
  time: string;
};

const FALLBACK_MOVES: MoveRow[] = [
  { id: 'MV-9012', type: 'out', item: 'IV Cannula 20G', qty: '-48 pcs', dept: 'Emergency', time: '12 min ago' },
  { id: 'MV-9011', type: 'in', item: 'Surgical Gloves 7.5 (sterile)', qty: '+500 pairs', dept: 'Central Store', time: '40 min ago' },
  { id: 'MV-9010', type: 'out', item: 'Inj. Ceftriaxone 1g', qty: '-30 vials', dept: 'ICU', time: '1 hr ago' },
  { id: 'MV-9009', type: 'out', item: 'Foley Catheter 16Fr', qty: '-12 pcs', dept: 'Surgical Ward', time: '2 hrs ago' },
  { id: 'MV-9008', type: 'in', item: 'NS 0.9% 500ml', qty: '+240 bottles', dept: 'Central Store', time: '3 hrs ago' },
  { id: 'MV-9007', type: 'out', item: 'Suture Vicryl 2-0', qty: '-24 pcs', dept: 'OT', time: '4 hrs ago' },
];

const LOW_STOCK_WATCH = [
  { item: 'IV Cannula 20G', onHand: '240 pcs', cover: '2.5 days', tone: 'critical' as const },
  { item: 'Inj. Ceftriaxone 1g', onHand: '85 vials', cover: '4 days', tone: 'warning' as const },
  { item: 'Surgical Mask (3-ply)', onHand: '1,100 pcs', cover: '5 days', tone: 'warning' as const },
];

const INVENTORY_INSIGHTS: AIInsight[] = [
  {
    id: 'reorder-cannula',
    severity: 'critical',
    title: 'IV Cannula 20G projected stock-out in ~72 hours',
    recommendation: 'Raise an emergency purchase order for 2,000 units today.',
    reasoning: [
      'On-hand stock is 240 units against a reorder level of 500.',
      'Trailing 14-day consumption averages 95 units/day — current stock covers ~2.5 days.',
      'Primary supplier lead time is 2–3 working days; ordering after today risks a gap.',
      'No open purchase order exists for this SKU; Emergency and ICU are the heaviest consumers.',
    ],
    confidence: 0.89,
    action: { label: 'Create PO', to: '/inventory/purchase-orders' },
  },
  {
    id: 'expiry-batch',
    severity: 'warning',
    title: '18 SKUs carry batches expiring within 30 days',
    recommendation: 'Push near-expiry antibiotic batches to high-consumption wards under FEFO.',
    reasoning: [
      '18 catalog items have at least one batch expiring on or before 13 Jul 2026.',
      'Combined value at risk is ₹1.4L, concentrated in injectable antibiotics.',
      'FEFO issue from Central Store can absorb ~80% through normal ward demand.',
    ],
    confidence: 0.81,
    action: { label: 'Review stock', to: '/inventory/catalog' },
  },
];

const formatInr = (value: number) =>
  `₹${Math.round(value).toLocaleString('en-IN')}`;

export default function InventoryDashboard2026() {
  const navigate = useNavigate();
  const { platformOn, catalog, moves } = useInventoryPlatformData();

  const moveRows: MoveRow[] = useMemo(() => {
    if (!platformOn || moves.length === 0) return FALLBACK_MOVES;
    return moves.slice(0, 8).map((m) => ({ id: m.id, ...mapMoveToRecentRow(m) }));
  }, [platformOn, moves]);

  const metrics: Metric[] = useMemo(() => {
    const hasCatalog = platformOn && catalog.length > 0;
    const skuCount = hasCatalog ? catalog.length : 1248;
    const stockValue = hasCatalog
      ? catalog.reduce((sum, item) => sum + (item.qtyOnHand * item.unitCostCents) / 100, 0)
      : 4860000;
    const lowStock = hasCatalog
      ? catalog.filter((item) => item.qtyOnHand <= item.reorderLevel).length
      : 23;
    return [
      { id: 'skus', label: 'SKU catalog', value: skuCount.toLocaleString('en-IN'), icon: Boxes, hint: 'Active items' },
      { id: 'value', label: 'Stock value', value: formatInr(stockValue), icon: IndianRupee, hint: 'At weighted cost' },
      { id: 'low', label: 'Low stock', value: lowStock, icon: PackageMinus, hint: 'At/below reorder level' },
      { id: 'expiring', label: 'Expiring ≤30d', value: 18, icon: CalendarX2, hint: '₹1.4L value at risk' },
      { id: 'pos', label: 'Pending POs', value: 7, icon: FileText, hint: '2 overdue for GRN' },
    ];
  }, [platformOn, catalog]);

  const columns: DenseColumn<MoveRow>[] = [
    {
      key: 'item',
      header: 'Item',
      cell: (r) => (
        <span className="flex items-center gap-2">
          {r.type === 'in'
            ? <ArrowDownLeft className="h-3.5 w-3.5 text-success shrink-0" />
            : <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
          <span className="font-medium">{r.item}</span>
        </span>
      ),
      searchText: (r) => r.item,
    },
    {
      key: 'qty',
      header: 'Qty',
      align: 'right',
      cell: (r) => (
        <span className={r.type === 'in' ? 'tabular-nums text-success font-medium' : 'tabular-nums font-medium'}>
          {r.qty}
        </span>
      ),
    },
    { key: 'dept', header: 'Department', searchText: (r) => r.dept },
    { key: 'time', header: 'Time', cell: (r) => <span className="text-muted-foreground">{r.time}</span> },
  ];

  return (
    <PageScaffold
      eyebrow="Supply chain"
      title="Inventory control"
      subtitle="Stock posture, movement velocity, and procurement signals across stores."
    >
      <MetricGrid metrics={metrics} columns={5} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <SectionPanel
          title="Recent stock moves"
          description="Receipts and issues across locations"
          flush
          className="xl:col-span-2"
        >
          <DenseTable
            columns={columns}
            rows={moveRows}
            rowKey={(r) => r.id}
            searchable
            searchPlaceholder="Filter moves…"
            onRowClick={() => navigate('/inventory/stock-entry')}
            emptyTitle="No stock movements"
          />
        </SectionPanel>

        <SectionPanel title="Low-stock watch" description="Cover at current burn rate">
          {LOW_STOCK_WATCH.map((row) => (
            <ListRow
              key={row.item}
              primary={row.item}
              secondary={`On hand ${row.onHand}`}
              trailing={<StatusChip tone={row.tone}>{row.cover}</StatusChip>}
              onClick={() => navigate('/inventory/catalog')}
            />
          ))}
        </SectionPanel>
      </div>

      <AIInsightPanel insights={INVENTORY_INSIGHTS} />
    </PageScaffold>
  );
}
