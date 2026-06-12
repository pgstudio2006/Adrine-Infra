import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  ScanLine,
  Timer,
} from 'lucide-react';
import { WorkspacePage, MetricStrip, WorkflowPanel } from '@/components/shell/workspace-primitives';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useHospital } from '@/stores/hospitalStore';
import { useDepartmentWorklistSync } from '@/hooks/useDepartmentWorklistSync';
import { cn } from '@/lib/utils';

const STATUS_STYLE: Record<string, string> = {
  Ordered: 'bg-amber-500/10 text-amber-700',
  Scheduled: 'bg-blue-500/10 text-blue-700',
  'In Progress': 'bg-purple-500/10 text-purple-700',
  Completed: 'bg-orange-500/10 text-orange-700',
  Reported: 'bg-emerald-500/10 text-emerald-700',
};

export default function RadiologyDashboard2026() {
  const navigate = useNavigate();
  const { radiologyOrders } = useHospital();
  useDepartmentWorklistSync('radiology');

  const stats = useMemo(() => {
    const pending = radiologyOrders.filter(
      (o) => o.status === 'Ordered' || o.status === 'Scheduled',
    );
    const inProgress = radiologyOrders.filter((o) => o.status === 'In Progress');
    const critical = radiologyOrders.filter((o) => o.critical && o.status !== 'Reported');
    const total = radiologyOrders.length;
    const reported = radiologyOrders.filter((o) => o.status === 'Reported').length;
    const tatPct = total ? Math.round((reported / total) * 100) : 0;
    return {
      pendingCount: pending.length,
      inProgressCount: inProgress.length,
      criticalCount: critical.length,
      tatPct,
      pending,
      inProgress,
      critical,
    };
  }, [radiologyOrders]);

  const modalityQueue = useMemo(() => {
    const map = new Map<string, typeof radiologyOrders>();
    for (const o of radiologyOrders) {
      if (o.status === 'Reported') continue;
      const list = map.get(o.modality) ?? [];
      list.push(o);
      map.set(o.modality, list);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [radiologyOrders]);

  const pendingStudies = useMemo(
    () =>
      radiologyOrders
        .filter((o) => o.status !== 'Reported')
        .slice(0, 8),
    [radiologyOrders],
  );

  return (
    <WorkspacePage
      title="Radiology command"
      subtitle="Pending studies, modality queue, critical findings, and turnaround — Adrine 2026 imaging operations."
      actions={
        <>
          {stats.criticalCount > 0 && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate('/radiology/critical')}>
              <AlertTriangle className="h-3.5 w-3.5" />
              Critical ({stats.criticalCount})
            </Button>
          )}
          <Button size="sm" className="gap-1.5" onClick={() => navigate('/radiology/worklist')}>
            <ScanLine className="h-3.5 w-3.5" />
            Worklist
          </Button>
        </>
      }
    >
      <MetricStrip
        columns={4}
        metrics={[
          {
            id: 'pending',
            label: 'Pending studies',
            value: stats.pendingCount,
            hint: 'Ordered or scheduled',
            icon: Clock,
          },
          {
            id: 'progress',
            label: 'In progress',
            value: stats.inProgressCount,
            hint: 'Acquisition active',
            icon: ScanLine,
          },
          {
            id: 'critical',
            label: 'Critical findings',
            value: stats.criticalCount,
            hint: stats.criticalCount ? 'Callback required' : 'None active',
            icon: AlertTriangle,
          },
          {
            id: 'tat',
            label: 'TAT completion',
            value: `${stats.tatPct}%`,
            hint: `${radiologyOrders.length - radiologyOrders.filter((o) => o.status === 'Reported').length} in pipeline`,
            icon: Timer,
            trend: stats.tatPct >= 80 ? { value: 'On track', positive: true } : undefined,
          },
        ]}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <WorkflowPanel title="Pending studies" className="lg:col-span-2">
          {pendingStudies.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No active radiology orders.</p>
          ) : (
            <ul className="divide-y divide-border/60 -mx-4 -mb-4">
              {pendingStudies.map((o) => (
                <li
                  key={o.orderId}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() => navigate('/radiology/worklist')}
                >
                  <ScanLine className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {o.patientName}{' '}
                      <span className="text-muted-foreground font-normal">· {o.study}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {o.orderId} · {o.modality} · {o.doctor}
                    </p>
                  </div>
                  <Badge
                    variant={o.critical ? 'destructive' : 'outline'}
                    className={cn('text-[10px] shrink-0', !o.critical && STATUS_STYLE[o.status])}
                  >
                    {o.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 gap-1 text-xs"
            onClick={() => navigate('/radiology/orders')}
          >
            All orders <ArrowRight className="h-3 w-3" />
          </Button>
        </WorkflowPanel>

        <WorkflowPanel title="Modality queue">
          {modalityQueue.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No orders in queue.</p>
          ) : (
            <ul className="space-y-3">
              {modalityQueue.map(([modality, orders]) => (
                <li key={modality}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{modality}</span>
                    <span className="text-muted-foreground text-xs">{orders.length} active</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground/60 transition-all"
                      style={{
                        width: `${Math.min(100, (orders.length / Math.max(pendingStudies.length, 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </WorkflowPanel>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <WorkflowPanel title="Critical findings">
          {stats.critical.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active critical findings.</p>
          ) : (
            <ul className="space-y-3">
              {stats.critical.slice(0, 6).map((o) => (
                <li
                  key={o.orderId}
                  className="flex items-start gap-3 text-sm cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate('/radiology/critical')}
                >
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{o.patientName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {o.study} · {o.modality}
                    </p>
                  </div>
                  <Badge variant="destructive" className="text-[10px] shrink-0">
                    {o.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </WorkflowPanel>

        <WorkflowPanel title="Turnaround (TAT)">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Overall completion</span>
                <span className={stats.tatPct >= 80 ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}>
                  {stats.tatPct}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-foreground/70 transition-all"
                  style={{ width: `${stats.tatPct}%` }}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>
                  <span className="font-semibold">
                    {radiologyOrders.filter((o) => o.status === 'Reported').length}
                  </span>{' '}
                  reported
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ScanLine className="h-4 w-4 text-muted-foreground" />
                <span>
                  <span className="font-semibold">{stats.inProgressCount}</span> in progress
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  <span className="font-semibold">{stats.pendingCount}</span> awaiting scan
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 gap-1 text-xs"
            onClick={() => navigate('/radiology/tat')}
          >
            TAT analytics <ArrowRight className="h-3 w-3" />
          </Button>
        </WorkflowPanel>
      </div>

      <WorkflowPanel title="Quick actions">
        <div className="grid sm:grid-cols-3 gap-3">
          <Card
            className="cursor-pointer border-foreground/10 hover:border-foreground/25 hover:shadow-sm transition-all"
            onClick={() => navigate('/radiology/worklist')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <ScanLine className="h-5 w-5 text-foreground/70" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Worklist</p>
                <p className="text-xs text-muted-foreground">{pendingStudies.length} active</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer border-foreground/10 hover:border-foreground/25 hover:shadow-sm transition-all"
            onClick={() => navigate('/radiology/modality-worklist')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <Timer className="h-5 w-5 text-foreground/70" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Modality board</p>
                <p className="text-xs text-muted-foreground">{modalityQueue.length} modalities</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer border-foreground/10 hover:border-foreground/25 hover:shadow-sm transition-all"
            onClick={() => navigate('/radiology/reports')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-foreground/70" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Reports</p>
                <p className="text-xs text-muted-foreground">{stats.tatPct}% TAT</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      </WorkflowPanel>
    </WorkspacePage>
  );
}
