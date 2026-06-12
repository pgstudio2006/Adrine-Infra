import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { WorkspacePage, MetricStrip, WorkflowPanel } from '@/components/shell/workspace-primitives';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Activity,
  ArrowRight,
  Beaker,
  CheckCircle,
  Clock,
  Cpu,
  FileText,
  FlaskConical,
  PhoneCall,
  TestTube,
} from 'lucide-react';
import { useHospital } from '@/stores/hospitalStore';
import { useDepartmentWorklistSync } from '@/hooks/useDepartmentWorklistSync';
import { canUseLabRuntime } from '@/runtime/lab-runtime';
import { PlatformConnectivityStrip } from '@/components/PlatformConnectivityStrip';
import { PATHOLOGY_MACHINES } from '@/lib/lis/pathology-machines';
import { getMiddlewareSnapshot, type MachineConnectionState } from '@/lib/lis/lis-middleware-store';
import { LAB_SECTIONS, sectionForCategory } from './labReferenceData';

const statusDot: Record<MachineConnectionState['status'], string> = {
  connected: 'bg-emerald-500',
  connecting: 'bg-amber-400 animate-pulse',
  disconnected: 'bg-muted-foreground/40',
  error: 'bg-rose-500',
};

export default function LabDashboard2026() {
  const navigate = useNavigate();
  const { labOrders } = useHospital();
  useDepartmentWorklistSync('lab');

  const [connections, setConnections] = useState<MachineConnectionState[]>(() =>
    getMiddlewareSnapshot().connections,
  );

  const refreshMachines = useCallback(() => {
    setConnections(getMiddlewareSnapshot().connections);
  }, []);

  useEffect(() => {
    refreshMachines();
    const t = setInterval(refreshMachines, 15_000);
    return () => clearInterval(t);
  }, [refreshMachines]);

  const stats = useMemo(() => {
    const pendingSamples = labOrders.filter(
      (o) => o.sampleStatus === 'Ordered' || o.sampleStatus === 'Collected',
    ).length;
    const inProgress = labOrders.filter(
      (o) => o.stage === 'In Analysis' || o.sampleStatus === 'Processing',
    ).length;
    const awaitingValidation = labOrders.filter((o) => o.stage === 'Awaiting Validation').length;
    const reportedToday = labOrders.filter((o) => o.stage === 'Reported').length;
    const urgentPending = labOrders.filter(
      (o) => (o.priority === 'Urgent' || o.priority === 'Emergency') && o.stage !== 'Reported',
    ).length;
    const critical = labOrders.filter((o) => o.criticalAlert && o.stage !== 'Reported').length;
    const total = labOrders.length;
    const reported = labOrders.filter((o) => o.stage === 'Reported').length;
    const tatPct = total ? Math.round((reported / total) * 100) : 0;
    return {
      pendingSamples,
      inProgress,
      awaitingValidation,
      reportedToday,
      urgentPending,
      critical,
      tatPct,
      pending: total - reported,
    };
  }, [labOrders]);

  const connectedCount = connections.filter((c) => c.status === 'connected').length;
  const errorCount = connections.filter((c) => c.status === 'error').length;

  const pendingSamples = useMemo(
    () =>
      labOrders
        .filter((o) => o.sampleStatus === 'Ordered' || o.sampleStatus === 'Collected')
        .slice(0, 6),
    [labOrders],
  );

  const tatBySection = useMemo(() => {
    return LAB_SECTIONS.map((section) => {
      const orders = labOrders.filter((o) => sectionForCategory(o.category) === section);
      const total = orders.length;
      const reported = orders.filter((o) => o.stage === 'Reported').length;
      const pending = total - reported;
      const pct = total ? Math.round((reported / total) * 100) : 0;
      const onTrack = total > 0 && reported === total;
      return { section, total, reported, pending, pct, onTrack };
    }).filter((r) => r.total > 0);
  }, [labOrders]);

  const machineRows = useMemo(
    () =>
      PATHOLOGY_MACHINES.map((machine) => {
        const conn = connections.find((c) => c.machineId === machine.id);
        return { machine, status: conn?.status ?? 'disconnected' };
      }),
    [connections],
  );

  return (
    <WorkspacePage
      title="LIS command"
      subtitle="Pending samples, analyser middleware, and turnaround — Adrine 2026 laboratory operations."
      actions={
        <>
          {stats.critical > 0 && (
            <Button size="sm" variant="outline" className="gap-1.5" asChild>
              <Link to="/lab/critical">
                <PhoneCall className="h-3.5 w-3.5" />
                Critical ({stats.critical})
              </Link>
            </Button>
          )}
          <Button size="sm" className="gap-1.5" onClick={() => navigate('/lab/worklist')}>
            <Activity className="h-3.5 w-3.5" />
            Worklist
          </Button>
        </>
      }
    >
      {canUseLabRuntime() && (
        <PlatformConnectivityStrip
          label="Live lab worklist"
          detail={`${labOrders.length} order(s) in branch · ${stats.pendingSamples} pending collection`}
        />
      )}

      <MetricStrip
        columns={5}
        metrics={[
          {
            id: 'pending',
            label: 'Pending samples',
            value: stats.pendingSamples,
            hint: stats.urgentPending ? `${stats.urgentPending} urgent` : 'Awaiting collection',
            icon: TestTube,
          },
          {
            id: 'progress',
            label: 'In analysis',
            value: stats.inProgress,
            hint: 'Pipeline active',
            icon: FlaskConical,
          },
          {
            id: 'validation',
            label: 'Awaiting validation',
            value: stats.awaitingValidation,
            hint: stats.critical ? `${stats.critical} critical flags` : 'Pathologist queue',
            icon: Beaker,
          },
          {
            id: 'tat',
            label: 'TAT completion',
            value: `${stats.tatPct}%`,
            hint: `${stats.pending} in progress`,
            icon: Clock,
            trend: stats.tatPct >= 80 ? { value: 'On track', positive: true } : undefined,
          },
          {
            id: 'analysers',
            label: 'Analysers online',
            value: `${connectedCount}/8`,
            hint: errorCount ? `${errorCount} error` : 'HL7 middleware',
            icon: Cpu,
          },
        ]}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <WorkflowPanel title="Pending samples" className="lg:col-span-2">
          {pendingSamples.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No samples awaiting collection.</p>
          ) : (
            <ul className="divide-y divide-border/60 -mx-4 -my-4">
              {pendingSamples.map((o) => (
                <li key={o.orderId} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {o.patientName}{' '}
                      <span className="text-muted-foreground font-normal">· {o.uhid}</span>
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {o.orderId} · {o.tests}
                    </p>
                  </div>
                  <Badge
                    variant={o.priority === 'Emergency' ? 'destructive' : o.priority === 'Urgent' ? 'default' : 'outline'}
                    className="text-xs shrink-0"
                  >
                    {o.priority}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </WorkflowPanel>

        <WorkflowPanel title="Turnaround by section">
          {tatBySection.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No orders yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {tatBySection.map((t) => (
                <li key={t.section}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{t.section}</span>
                    <span className={t.onTrack ? 'text-emerald-600 text-xs font-medium' : 'text-muted-foreground text-xs'}>
                      {t.onTrack ? 'Complete' : `${t.pct}%`}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground/70 transition-all"
                      style={{ width: `${t.pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.reported}/{t.total} reported · {t.pending} pending
                  </p>
                </li>
              ))}
            </ul>
          )}
        </WorkflowPanel>
      </div>

      <WorkflowPanel title="Analyser status · 8 machines">
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {machineRows.map(({ machine, status }) => (
            <div
              key={machine.id}
              className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 flex items-start gap-2.5"
            >
              <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${statusDot[status]}`} />
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{machine.make}</p>
                <p className="text-[11px] text-muted-foreground truncate">{machine.model}</p>
                <p className="text-[10px] text-muted-foreground/80 mt-0.5 capitalize">{status}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {connectedCount} connected · {8 - connectedCount} offline · Sysmex, Transasia, Biomérieux, Dyses, BioRad
        </p>
      </WorkflowPanel>

      <div className="grid md:grid-cols-2 gap-4">
        <Card
          className="cursor-pointer group hover:border-foreground/30 hover:shadow-md transition-all"
          onClick={() => navigate('/lab/analyzers')}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <Cpu className="h-8 w-8 text-foreground/70" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold">Machine integration</p>
              <p className="text-xs text-muted-foreground">
                HL7 middleware · connect all 8 analysers · simulate inbound results
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer group hover:border-foreground/30 hover:shadow-md transition-all"
          onClick={() => navigate('/lab/reports')}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <FileText className="h-8 w-8 text-foreground/70" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold">Lab reports</p>
              <p className="text-xs text-muted-foreground">
                Auto-generated from middleware · validation & release to clinicians
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </CardContent>
        </Card>
      </div>

      <WorkflowPanel title="Today's throughput">
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <span>
              <span className="font-semibold">{stats.reportedToday}</span> reported
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
            <span>
              <span className="font-semibold">{stats.inProgress}</span> in analysis
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              Overall TAT <span className="font-semibold">{stats.tatPct}%</span> complete
            </span>
          </div>
        </div>
      </WorkflowPanel>
    </WorkspacePage>
  );
}
