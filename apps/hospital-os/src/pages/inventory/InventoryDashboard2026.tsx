import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  IndianRupee,
  Package,
  Truck,
  TrendingDown,
} from 'lucide-react';
import { WorkspacePage, MetricStrip, WorkflowPanel } from '@/components/shell/workspace-primitives';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useInventoryPlatformData } from '@/hooks/useInventoryPlatformData';
import { mapMoveToRecentRow } from '@/lib/inventory/inventory-presenters';
import { allowDemoFallback, pickPlatformRows } from '@/lib/platform/demo-fallback';

const PENDING_REQUISITIONS_DEMO = [
  { id: 'REQ-045', dept: 'OT Department', items: 8, priority: 'high' as const },
  { id: 'REQ-044', dept: 'ICU', items: 5, priority: 'high' as const },
  { id: 'REQ-043', dept: 'Pharmacy', items: 12, priority: 'medium' as const },
];

export default function InventoryDashboard2026() {
  const navigate = useNavigate();
  const { catalog, moves } = useInventoryPlatformData();

  const recentMoves = useMemo(() => {
    const rows = pickPlatformRows(moves, allowDemoFallback() ? 5 : 0);
    return rows.map(mapMoveToRecentRow);
  }, [moves]);

  const totalItems = catalog.length || 2847;
  const lowStockCount = 18;
  const expiringCount = 12;

  return (
    <WorkspacePage
      title="Supply chain command"
      subtitle="Real-time stock visibility, department consumption, and procurement workflows across the hospital."
      actions={
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate('/inventory/requisitions')}>
          <Truck className="h-3.5 w-3.5" />
          Requisitions
        </Button>
      }
    >
      <MetricStrip
        columns={5}
        metrics={[
          { id: 'items', label: 'SKU catalog', value: totalItems.toLocaleString('en-IN'), hint: '+34 this month', icon: Package },
          { id: 'value', label: 'Stock value', value: '₹48.2L', hint: '+₹3.1L', icon: IndianRupee, trend: { value: '+6.9%', positive: true } },
          { id: 'low', label: 'Low stock alerts', value: lowStockCount, hint: '6 critical', icon: TrendingDown },
          { id: 'exp', label: 'Expiring ≤30d', value: expiringCount, icon: AlertTriangle },
          { id: 'orders', label: 'Pending POs', value: 7, hint: '₹5.8L', icon: Truck },
        ]}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <WorkflowPanel title="Recent movements" className="lg:col-span-2">
          <ul className="space-y-2 text-sm">
            {recentMoves.length === 0 ? (
              <li className="text-muted-foreground">No recent stock movements.</li>
            ) : (
              recentMoves.map((m, i) => (
                <li key={i} className="flex items-center justify-between gap-2 py-1.5 border-b border-border/50 last:border-0">
                  <div>
                    <p className="font-medium">{m.item}</p>
                    <p className="text-xs text-muted-foreground">{m.dept} · {m.time}</p>
                  </div>
                  <span className={m.type === 'in' ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}>{m.qty}</span>
                </li>
              ))
            )}
          </ul>
        </WorkflowPanel>

        <WorkflowPanel title="Pending requisitions">
          <ul className="space-y-2 text-sm">
            {PENDING_REQUISITIONS_DEMO.map((r) => (
              <li key={r.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{r.dept}</p>
                  <p className="text-xs text-muted-foreground">{r.id} · {r.items} items</p>
                </div>
                <Badge variant="outline" className="text-[10px]">{r.priority}</Badge>
              </li>
            ))}
          </ul>
        </WorkflowPanel>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:border-foreground/30 transition-colors" onClick={() => navigate('/inventory/stock')}>
          <CardContent className="p-5 flex items-center gap-4">
            <Boxes className="h-7 w-7 text-foreground/70" />
            <div className="flex-1">
              <p className="font-semibold">Stock ledger</p>
              <p className="text-xs text-muted-foreground">Batch, expiry, and location tracking</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-foreground/30 transition-colors" onClick={() => navigate('/inventory/procurement')}>
          <CardContent className="p-5 flex items-center gap-4">
            <Truck className="h-7 w-7 text-foreground/70" />
            <div className="flex-1">
              <p className="font-semibold">Procurement</p>
              <p className="text-xs text-muted-foreground">PO workflow & vendor management</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    </WorkspacePage>
  );
}
