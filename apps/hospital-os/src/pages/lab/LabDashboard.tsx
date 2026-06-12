import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, AlertTriangle, Beaker, CheckCircle, Clock, FlaskConical, PhoneCall, TestTube } from "lucide-react";
import { useHospital } from "@/stores/hospitalStore";
import { useDepartmentWorklistSync } from "@/hooks/useDepartmentWorklistSync";
import { canUseLabRuntime, platformListLabBranchWorklist } from "@/runtime/lab-runtime";
import { PlatformConnectivityStrip } from "@/components/PlatformConnectivityStrip";
import { InlinePlatformError } from "@/components/shared/InlinePlatformError";

const priorityColor = (p: string) => {
  if (p === "Emergency") return "destructive";
  if (p === "Urgent") return "default";
  return "outline";
};

const statusColor = (stage: string, sampleStatus: string) => {
  if (stage === "Reported" || stage === "Validated") return "default";
  if (stage === "In Analysis" || sampleStatus === "Processing") return "secondary";
  return "outline";
};

export default function LabDashboard() {
  const { labOrders } = useHospital();
  useDepartmentWorklistSync("lab");

  const [worklistCount, setWorklistCount] = useState<number | null>(null);
  const [platformError, setPlatformError] = useState<string | null>(null);

  const probeWorklist = useCallback(async () => {
    if (!canUseLabRuntime()) {
      setWorklistCount(null);
      setPlatformError(null);
      return;
    }
    try {
      const rows = await platformListLabBranchWorklist();
      setWorklistCount(Array.isArray(rows) ? rows.length : 0);
      setPlatformError(null);
    } catch (e) {
      setPlatformError(e instanceof Error ? e.message : "Branch worklist unavailable");
      setWorklistCount(null);
    }
  }, []);

  useEffect(() => {
    void probeWorklist();
    if (!canUseLabRuntime()) return;
    const t = setInterval(() => void probeWorklist(), 30_000);
    return () => clearInterval(t);
  }, [probeWorklist]);

  const stats = useMemo(() => {
    const pendingSamples = labOrders.filter(
      (o) => o.sampleStatus === "Ordered" || o.sampleStatus === "Collected",
    ).length;
    const inProgress = labOrders.filter(
      (o) => o.stage === "In Analysis" || o.sampleStatus === "Processing",
    ).length;
    const awaitingValidation = labOrders.filter((o) => o.stage === "Awaiting Validation").length;
    const reportedToday = labOrders.filter((o) => o.stage === "Reported").length;
    const urgentPending = labOrders.filter(
      (o) =>
        (o.priority === "Urgent" || o.priority === "Emergency") &&
        o.stage !== "Reported",
    ).length;
    const critical = labOrders.filter((o) => o.criticalAlert && o.stage !== "Reported").length;
    return { pendingSamples, inProgress, awaitingValidation, reportedToday, urgentPending, critical };
  }, [labOrders]);

  const criticalAlerts = useMemo(
    () =>
      labOrders
        .filter((o) => o.criticalAlert && o.stage !== "Reported")
        .slice(0, 6)
        .map((o, idx) => ({
          id: o.orderId,
          patient: o.patientName,
          uhid: o.uhid,
          test: o.tests.split(",")[0]?.trim() || o.tests,
          value: o.results?.slice(0, 48) || "Critical flag",
          doctor: o.doctor,
          time: o.orderTime || `${idx + 1}`,
        })),
    [labOrders],
  );

  const recentOrders = useMemo(
    () =>
      [...labOrders]
        .filter((o) => o.stage !== "Reported")
        .slice(0, 8),
    [labOrders],
  );

  const tatByCategory = useMemo(() => {
    const map = new Map<string, { count: number; reported: number }>();
    for (const o of labOrders) {
      const cat = o.category || "General";
      const row = map.get(cat) ?? { count: 0, reported: 0 };
      row.count += 1;
      if (o.stage === "Reported") row.reported += 1;
      map.set(cat, row);
    }
    return [...map.entries()].map(([category, row]) => ({
      category,
      avg: row.count ? `${Math.round((row.reported / row.count) * 100)}% done` : "—",
      target: "Per SLA",
      status: row.reported === row.count && row.count > 0 ? "On Track" : "In progress",
    }));
  }, [labOrders]);

  const statCards = [
    {
      label: "Pending Samples",
      value: stats.pendingSamples,
      icon: TestTube,
      change: stats.urgentPending ? `${stats.urgentPending} urgent` : "From branch worklist",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: FlaskConical,
      change: "Analysis pipeline",
    },
    {
      label: "Awaiting Validation",
      value: stats.awaitingValidation,
      icon: Beaker,
      change: stats.critical ? `${stats.critical} critical` : "Pathologist queue",
    },
    {
      label: "Reported",
      value: stats.reportedToday,
      icon: CheckCircle,
      change: "Released to clinicians",
    },
  ];

  return (
    <div className="space-y-6">
      {canUseLabRuntime() && (
        <PlatformConnectivityStrip
          label="Live lab worklist"
          detail={
            worklistCount != null
              ? `Branch worklist: ${worklistCount} order(s) · local store: ${labOrders.length}`
              : "Loading branch worklist…"
          }
          error={platformError}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Laboratory Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Supervisor view from branch worklist ·{" "}
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {stats.critical > 0 && (
            <Button size="sm" variant="outline" asChild>
              <Link to="/lab/critical">
                <PhoneCall className="mr-1 h-4 w-4" />
                Critical callbacks ({stats.critical})
              </Link>
            </Button>
          )}
          <Button size="sm" asChild>
            <Link to="/lab/worklist">Open worklist</Link>
          </Button>
        </div>
      </div>

      <InlinePlatformError error={platformError} onRetry={() => void probeWorklist()} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Critical Value Alerts
            {criticalAlerts.length > 0 && (
              <Button size="sm" variant="ghost" className="ml-auto h-7 text-xs" asChild>
                <Link to="/lab/critical">Callback log</Link>
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border">
          {criticalAlerts.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">No critical flags in active orders.</p>
          ) : (
            criticalAlerts.map((a) => (
              <div key={a.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="destructive" className="text-xs">
                    CRITICAL
                  </Badge>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {a.patient}{" "}
                      <span className="text-muted-foreground font-normal">· {a.uhid}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.test}: <span className="font-mono font-bold text-foreground">{a.value}</span> · {a.doctor}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                  <Link to="/lab/critical">Log callback</Link>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" /> Active Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Tests</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-sm">
                      No active lab orders.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentOrders.map((o) => (
                    <TableRow key={o.orderId}>
                      <TableCell>
                        <p className="text-sm font-mono text-foreground">{o.orderId}</p>
                        <p className="text-xs text-muted-foreground">{o.orderTime}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-foreground">{o.patientName}</p>
                        <p className="text-xs text-muted-foreground">{o.uhid}</p>
                      </TableCell>
                      <TableCell className="text-sm max-w-[180px] truncate">{o.tests}</TableCell>
                      <TableCell>
                        <Badge variant={priorityColor(o.priority)} className="text-xs">
                          {o.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColor(o.stage, o.sampleStatus)} className="text-xs">
                          {o.stage} · {o.sampleStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> Category throughput
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border">
            {tatByCategory.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              tatByCategory.map((t) => (
                <div key={t.category} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground">{t.category}</p>
                    <Badge variant={t.status === "On Track" ? "outline" : "secondary"} className="text-xs">
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Progress: {t.avg} · Target: {t.target}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
