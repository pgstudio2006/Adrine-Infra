import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  ClipboardList,
  Package,
  Pill,
} from 'lucide-react';
import { WorkspacePage, MetricStrip, WorkflowPanel } from '@/components/shell/workspace-primitives';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useHospital } from '@/stores/hospitalStore';
import { useDepartmentWorklistSync } from '@/hooks/useDepartmentWorklistSync';
import { cn } from '@/lib/utils';

const STATUS_STYLE: Record<string, string> = {
  Pending: 'bg-amber-500/10 text-amber-700',
  Verified: 'bg-blue-500/10 text-blue-700',
  Dispensed: 'bg-emerald-500/10 text-emerald-700',
  'Partially dispensed': 'bg-orange-500/10 text-orange-700',
  Cancelled: 'bg-muted text-muted-foreground',
};

export default function PharmacyDashboard2026() {
  const navigate = useNavigate();
  const { prescriptions, pharmacyInventory } = useHospital();
  useDepartmentWorklistSync('pharmacy');

  const todayKey = new Date().toISOString().slice(0, 10);

  const queue = useMemo(
    () =>
      prescriptions
        .filter((rx) => rx.status === 'Pending' || rx.status === 'Verified')
        .sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [prescriptions],
  );

  const dispensedToday = useMemo(
    () =>
      prescriptions.filter(
        (rx) => rx.status === 'Dispensed' && rx.date.startsWith(todayKey),
      ).length,
    [prescriptions, todayKey],
  );

  const lowStock = useMemo(
    () => pharmacyInventory.filter((item) => item.qty <= item.reorder),
    [pharmacyInventory],
  );

  const verifiedReady = queue.filter((rx) => rx.status === 'Verified');
  const pendingVerify = queue.filter((rx) => rx.status === 'Pending');

  const dateLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <WorkspacePage
      title="Pharmacy command"
      subtitle={`${dateLabel} · Prescription queue, stock alerts, and dispense workflow.`}
      actions={
        <Button size="sm" className="gap-1.5" onClick={() => navigate('/pharmacy/prescriptions')}>
          <ClipboardList className="h-3.5 w-3.5" />
          Process Rx
          {queue.length > 0 ? ` (${queue.length})` : ''}
        </Button>
      }
    >
      <MetricStrip
        columns={4}
        metrics={[
          {
            id: 'queue',
            label: 'Rx queue',
            value: queue.length,
            hint: `${pendingVerify.length} pending · ${verifiedReady.length} verified`,
            icon: ClipboardList,
          },
          {
            id: 'dispensed',
            label: 'Dispensed today',
            value: dispensedToday,
            hint: 'Completed fulfillments',
            icon: Pill,
          },
          {
            id: 'stock',
            label: 'Low stock',
            value: lowStock.length,
            hint: lowStock.length ? 'At or below reorder' : 'Stock OK',
            icon: AlertTriangle,
          },
          {
            id: 'inventory',
            label: 'SKUs tracked',
            value: pharmacyInventory.length,
            hint: 'Active inventory lines',
            icon: Package,
          },
        ]}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <WorkflowPanel title="Prescriptions queue" className="lg:col-span-2">
          {queue.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No prescriptions awaiting fulfillment.</p>
          ) : (
            <ul className="divide-y divide-border/60 -mx-4 -mb-4">
              {queue.slice(0, 8).map((rx) => (
                <li
                  key={rx.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() => navigate('/pharmacy/prescriptions')}
                >
                  <span className="text-xs font-mono font-semibold text-foreground/80 w-16 shrink-0 truncate">
                    {rx.id}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{rx.patientName}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {rx.doctor} · {rx.meds.length} item{rx.meds.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <Badge
                    variant={rx.priority === 'Emergency' ? 'destructive' : rx.priority === 'Urgent' ? 'default' : 'outline'}
                    className="text-[10px] shrink-0"
                  >
                    {rx.priority}
                  </Badge>
                  <span
                    className={cn(
                      'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0',
                      STATUS_STYLE[rx.status] ?? STATUS_STYLE.Pending,
                    )}
                  >
                    {rx.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 gap-1 text-xs"
            onClick={() => navigate('/pharmacy/prescriptions')}
          >
            Open prescription desk <ArrowRight className="h-3 w-3" />
          </Button>
        </WorkflowPanel>

        <WorkflowPanel title="Low stock alerts">
          {lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">All items above reorder level.</p>
          ) : (
            <ul className="space-y-3">
              {lowStock.slice(0, 6).map((item) => (
                <li key={item.id} className="flex items-start gap-3 text-sm">
                  <AlertTriangle
                    className={cn(
                      'h-4 w-4 shrink-0 mt-0.5',
                      item.qty === 0 ? 'text-rose-600' : 'text-amber-600',
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.drug}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.qty} left · reorder at {item.reorder}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 gap-1 text-xs w-full"
            onClick={() => navigate('/pharmacy/inventory')}
          >
            Inventory <ArrowRight className="h-3 w-3" />
          </Button>
        </WorkflowPanel>
      </div>

      <WorkflowPanel title="Dispense workflow">
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">1 · Verify</p>
            <p className="text-2xl font-semibold">{pendingVerify.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Pending pharmacist review</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">2 · Pick & pack</p>
            <p className="text-2xl font-semibold">{verifiedReady.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Verified, ready to dispense</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">3 · Complete</p>
            <p className="text-2xl font-semibold flex items-center gap-1.5">
              {dispensedToday}
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </p>
            <p className="text-xs text-muted-foreground mt-1">Dispensed today</p>
          </div>
        </div>
      </WorkflowPanel>

      <WorkflowPanel title="Quick actions">
        <div className="grid sm:grid-cols-3 gap-3">
          <Card
            className="cursor-pointer border-foreground/10 hover:border-foreground/25 hover:shadow-sm transition-all"
            onClick={() => navigate('/pharmacy/prescriptions')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-foreground/70" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Rx queue</p>
                <p className="text-xs text-muted-foreground">{queue.length} pending</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer border-foreground/10 hover:border-foreground/25 hover:shadow-sm transition-all"
            onClick={() => navigate('/pharmacy/inventory')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <Package className="h-5 w-5 text-foreground/70" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Inventory</p>
                <p className="text-xs text-muted-foreground">{lowStock.length} low stock</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer border-foreground/10 hover:border-foreground/25 hover:shadow-sm transition-all"
            onClick={() => navigate('/pharmacy/prescriptions')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <Pill className="h-5 w-5 text-foreground/70" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Dispense</p>
                <p className="text-xs text-muted-foreground">{verifiedReady.length} ready</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      </WorkflowPanel>
    </WorkspacePage>
  );
}
