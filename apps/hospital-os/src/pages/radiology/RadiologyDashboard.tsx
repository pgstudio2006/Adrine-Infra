import { useMemo, useState } from "react";
import { isAdrine2026Experience } from "@/lib/adrine/experience";
import RadiologyDashboard2026 from "@/pages/radiology/RadiologyDashboard2026";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScanLine, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { useHospital } from "@/stores/hospitalStore";
import { useDepartmentWorklistSync } from "@/hooks/useDepartmentWorklistSync";
import { InlinePlatformError } from "@/components/shared/InlinePlatformError";

const statusColor: Record<string, string> = {
  Ordered: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "In Progress": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  Completed: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  Reported: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export default function RadiologyDashboard() {
  if (isAdrine2026Experience()) {
    return <RadiologyDashboard2026 />;
  }

  const { radiologyOrders } = useHospital();
  const [platformError, setPlatformError] = useState<string | null>(null);
  useDepartmentWorklistSync("radiology");

  const retry = () => {
    setPlatformError(null);
    window.location.reload();
  };

  const stats = useMemo(() => {
    const waiting = radiologyOrders.filter(
      (o) => o.status === "Ordered" || o.status === "Scheduled",
    ).length;
    const inProgress = radiologyOrders.filter((o) => o.status === "In Progress").length;
    const reported = radiologyOrders.filter((o) => o.status === "Reported").length;
    const critical = radiologyOrders.filter((o) => o.critical && o.status !== "Reported").length;
    return { waiting, inProgress, reported, critical };
  }, [radiologyOrders]);

  const recentStudies = useMemo(
    () =>
      [...radiologyOrders]
        .filter((o) => o.status !== "Reported")
        .slice(0, 8),
    [radiologyOrders],
  );

  const criticalAlerts = useMemo(
    () =>
      radiologyOrders
        .filter((o) => o.critical && o.status !== "Reported")
        .slice(0, 5),
    [radiologyOrders],
  );

  const modalityBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of radiologyOrders) {
      map.set(o.modality, (map.get(o.modality) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [radiologyOrders]);

  const statCards = [
    { label: "Waiting / Scheduled", value: stats.waiting, icon: Clock },
    { label: "In Progress", value: stats.inProgress, icon: ScanLine },
    { label: "Reported", value: stats.reported, icon: CheckCircle },
    { label: "Critical (active)", value: stats.critical, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Radiology Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Imaging overview from branch worklist — scheduling and status via governed radiology transitions
        </p>
      </div>

      {platformError && (
        <InlinePlatformError error={platformError} onRetry={retry} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6 flex items-center gap-3">
              <s.icon className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {criticalAlerts.length > 0 && (
        <Card className="border-destructive/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Critical findings (active)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {criticalAlerts.map((o) => (
              <div key={o.orderId} className="text-sm flex justify-between gap-2">
                <span>
                  <span className="font-medium">{o.patientName}</span> · {o.study} · {o.modality}
                </span>
                <Badge className={statusColor[o.status]}>{o.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Active studies</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Study</TableHead>
                  <TableHead>Modality</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentStudies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-sm">
                      No active radiology orders.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentStudies.map((o) => (
                    <TableRow key={o.orderId}>
                      <TableCell className="font-mono text-xs">{o.orderId}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{o.patientName}</p>
                        <p className="text-xs text-muted-foreground">{o.uhid}</p>
                      </TableCell>
                      <TableCell className="text-sm">{o.study}</TableCell>
                      <TableCell className="text-sm">{o.modality}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[o.status]}`}>
                          {o.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Modality mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {modalityBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders.</p>
            ) : (
              modalityBreakdown.map(([modality, count]) => (
                <div key={modality} className="flex justify-between text-sm">
                  <span>{modality}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
