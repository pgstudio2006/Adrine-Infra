import { useMemo } from 'react';
import { isAdrine2026Experience } from '@/lib/adrine/experience';
import InventoryDashboard2026 from './InventoryDashboard2026';
import { Card, CardContent } from '@/components/ui/card';
import { OperationsModulePage } from '@/components/operations/OperationsModulePage';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useInventoryPlatformData } from '@/hooks/useInventoryPlatformData';
import { mapMoveToRecentRow } from '@/lib/inventory/inventory-presenters';
import { Badge } from '@/components/ui/badge';
import { 
  Package, TrendingDown, AlertTriangle, CheckCircle2, ArrowRight,
  Truck, ClipboardList, BarChart3, Clock, IndianRupee, Boxes, ShieldAlert
} from 'lucide-react';
import { motion } from 'framer-motion';
import { pickPlatformRows, allowDemoFallback } from '@/lib/platform/demo-fallback';

const STATS = [
  { label: 'Total Items', value: '2,847', sub: '+34 this month', icon: Package, color: 'text-foreground' },
  { label: 'Stock Value', value: '₹48.2L', sub: '+₹3.1L this month', icon: IndianRupee, color: 'text-success' },
  { label: 'Low Stock Alerts', value: '18', sub: '6 critical', icon: TrendingDown, color: 'text-destructive' },
  { label: 'Expiring Soon', value: '12', sub: 'Within 30 days', icon: AlertTriangle, color: 'text-warning' },
  { label: 'Pending Orders', value: '7', sub: '₹5.8L value', icon: Truck, color: 'text-info' },
];

const RECENT_MOVEMENTS_DEMO = [
  { type: 'in' as const, item: 'Surgical Gloves (7.5)', qty: '+500 pairs', dept: 'Supplier: Ansell', time: '2 hrs ago' },
  { type: 'out' as const, item: 'IV Cannula 20G', qty: '-50 pcs', dept: 'To: Emergency Ward', time: '3 hrs ago' },
  { type: 'out' as const, item: 'Gauze Rolls (Sterile)', qty: '-100 pcs', dept: 'To: OT Department', time: '4 hrs ago' },
  { type: 'in' as const, item: 'Lab Reagent Kit (CBC)', qty: '+20 kits', dept: 'Supplier: Roche', time: '5 hrs ago' },
  { type: 'out' as const, item: 'Propofol 200mg', qty: '-10 vials', dept: 'To: Pharmacy', time: '6 hrs ago' },
];

const DEPT_CONSUMPTION = [
  { dept: 'OT Department', items: 156, value: '₹4.2L', trend: '+12%' },
  { dept: 'Emergency', items: 124, value: '₹2.8L', trend: '+8%' },
  { dept: 'ICU', items: 98, value: '₹3.1L', trend: '+5%' },
  { dept: 'General Ward', items: 87, value: '₹1.4L', trend: '-3%' },
  { dept: 'Laboratory', items: 64, value: '₹2.2L', trend: '+15%' },
];

const PENDING_REQUISITIONS = [
  { id: 'REQ-045', dept: 'OT Department', items: 8, priority: 'high' as const, age: '2 hrs' },
  { id: 'REQ-044', dept: 'ICU', items: 5, priority: 'high' as const, age: '4 hrs' },
  { id: 'REQ-043', dept: 'Pharmacy', items: 12, priority: 'medium' as const, age: '6 hrs' },
  { id: 'REQ-042', dept: 'Laboratory', items: 3, priority: 'low' as const, age: '1 day' },
];

const PRIORITY_CONFIG = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-muted text-muted-foreground',
};

const LOW_STOCK_CRITICAL = [
  { item: 'Succinylcholine 100mg', current: 8, minimum: 10, unit: 'vials' },
  { item: 'Blood Collection Tubes (EDTA)', current: 45, minimum: 100, unit: 'pcs' },
  { item: 'Chromic Catgut 3-0', current: 5, minimum: 15, unit: 'pcs' },
  { item: 'Oxygen Flowmeter', current: 1, minimum: 3, unit: 'pcs' },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function InventoryDashboard() {
  if (isAdrine2026Experience()) return <InventoryDashboard2026 />;
  const { platformOn, catalog, moves, loading } = useInventoryPlatformData();
  const recentMovements = useMemo(
    () => pickPlatformRows(platformOn && moves.length > 0, moves.slice(0, 5).map(mapMoveToRecentRow), RECENT_MOVEMENTS_DEMO),
    [platformOn, moves],
  );
  const stats = useMemo(() => {
    if (platformOn && catalog.length > 0) {
      const lowStock = catalog.filter((i) => i.qtyOnHand <= i.reorderLevel).length;
      const totalValue = catalog.reduce((sum, i) => sum + i.qtyOnHand * i.unitCostCents, 0);
      return [
        { label: 'Total Items', value: String(catalog.length), sub: 'Platform catalog', icon: Package, color: 'text-foreground' },
        { label: 'Stock Value', value: `₹${(totalValue / 100).toLocaleString('en-IN')}`, sub: 'Authoritative', icon: IndianRupee, color: 'text-success' },
        { label: 'Low Stock Alerts', value: String(lowStock), sub: lowStock ? 'Below reorder' : 'OK', icon: TrendingDown, color: 'text-destructive' },
        { label: 'Expiring Soon', value: '—', sub: 'Not tracked', icon: AlertTriangle, color: 'text-warning' },
        { label: 'Pending Moves', value: String(moves.filter((m) => !['received', 'cancelled'].includes(m.state)).length), sub: 'Open moves', icon: Truck, color: 'text-info' },
      ];
    }
    if (allowDemoFallback()) return STATS;
    return STATS.map((s) => ({ ...s, value: '—', sub: 'No platform data' }));
  }, [platformOn, catalog, moves]);

  const deptConsumption = allowDemoFallback() ? DEPT_CONSUMPTION : [];
  const pendingRequisitions = allowDemoFallback() ? PENDING_REQUISITIONS : [];
  const lowStockCritical = allowDemoFallback() ? LOW_STOCK_CRITICAL : [];

  return (
    <OperationsModulePage
      module="inventory"
      layout="dashboard"
      title="Central store"
      subtitle="Inventory management and supply chain overview"
      actions={
        <>
          <Button variant="outline" size="sm" asChild><Link to="/inventory/issue">Issue</Link></Button>
          <Button variant="outline" size="sm" asChild><Link to="/inventory/grn">GRN</Link></Button>
        </>
      }
    >
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map(s => (
          <motion.div key={s.label} variants={item}>
            <Card className="border-border/60 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <s.icon className={`h-5 w-5 mb-3 ${s.color}`} strokeWidth={1.5} />
                <p className="text-2xl font-bold tracking-tight">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                <p className={`text-xs mt-1 ${s.color}`}>{s.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Critical Low Stock Banner */}
      <motion.div variants={item}>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              <span className="text-xs font-medium tracking-[0.1em] uppercase text-destructive">Critical Low Stock</span>
            </div>
            <div className="grid md:grid-cols-4 gap-3">
              {lowStockCritical.map((i, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-background border border-border/60">
                  <p className="text-sm font-semibold">{i.item}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-lg font-bold text-destructive">{i.current}</span>
                    <span className="text-[10px] text-muted-foreground">/ {i.minimum} min • {i.unit}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted mt-2">
                    <div className="h-full rounded-full bg-destructive" style={{ width: `${Math.min((i.current / i.minimum) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Recent Movements */}
        <motion.div variants={item} className="md:col-span-2">
          <Card className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                  <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">Recent Stock Movements</span>
                </div>
                <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                  View All <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              <div className="space-y-3">
                {recentMovements.map((m, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${m.type === 'in' ? 'bg-success/10 text-success' : 'bg-info/10 text-info'}`}>
                        {m.type === 'in' ? '↓' : '↑'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{m.item}</p>
                        <p className="text-[11px] text-muted-foreground">{m.dept}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-mono font-semibold ${m.type === 'in' ? 'text-success' : 'text-info'}`}>{m.qty}</p>
                      <p className="text-[10px] text-muted-foreground">{m.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Requisitions */}
        <motion.div variants={item}>
          <Card className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">Pending Requisitions</span>
              </div>
              <div className="space-y-3">
                {pendingRequisitions.map(r => (
                  <div key={r.id} className="p-3 rounded-lg border border-border/60 hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-semibold">{r.id}</span>
                      <Badge className={`${PRIORITY_CONFIG[r.priority]} text-[10px]`}>{r.priority}</Badge>
                    </div>
                    <p className="text-sm font-semibold">{r.dept}</p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
                      <span>{r.items} items</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {r.age}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Department Consumption */}
      <motion.div variants={item}>
        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">Department Consumption (This Month)</span>
            </div>
            <div className="space-y-3">
              {deptConsumption.map(d => (
                <div key={d.dept} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                  <div>
                    <p className="text-sm font-semibold">{d.dept}</p>
                    <p className="text-[10px] text-muted-foreground">{d.items} items consumed</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold">{d.value}</span>
                    <span className={`text-xs font-medium ${d.trend.startsWith('+') ? 'text-warning' : 'text-success'}`}>{d.trend}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
      </motion.div>
    </OperationsModulePage>
  );
}
