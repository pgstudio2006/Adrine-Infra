import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Clock, TrendingUp } from "lucide-react";
import { useHospital } from "@/stores/hospitalStore";
import { useDepartmentWorklistSync } from "@/hooks/useDepartmentWorklistSync";
import { canUseLabRuntime } from "@/runtime/lab-runtime";
import { PlatformConnectivityStrip } from "@/components/PlatformConnectivityStrip";
import { LAB_SECTIONS, TEST_CATALOG, sectionForCategory, type LabSection } from "./labReferenceData";

function slaHoursForSection(section: LabSection): number {
  const tests = TEST_CATALOG.filter((t) => t.section === section);
  if (tests.length === 0) return 24;
  return Math.round(tests.reduce((s, t) => s + t.tatHours, 0) / tests.length);
}

export default function LabTat() {
  const { labOrders } = useHospital();
  useDepartmentWorklistSync("lab");
  const platformOn = canUseLabRuntime();

  const rows = useMemo(() => {
    return LAB_SECTIONS.map((section) => {
      const orders = labOrders.filter((o) => sectionForCategory(o.category) === section);
      const total = orders.length;
      const reported = orders.filter((o) => o.stage === "Reported").length;
      const pending = total - reported;
      const critical = orders.filter((o) => o.criticalAlert && o.stage !== "Reported").length;
      const pct = total ? Math.round((reported / total) * 100) : 0;
      return { section, total, reported, pending, critical, pct, sla: slaHoursForSection(section) };
    }).filter((r) => r.total > 0);
  }, [labOrders]);

  const overall = useMemo(() => {
    const total = labOrders.length;
    const reported = labOrders.filter((o) => o.stage === "Reported").length;
    const critical = labOrders.filter((o) => o.criticalAlert && o.stage !== "Reported").length;
    return { total, reported, pending: total - reported, critical, pct: total ? Math.round((reported / total) * 100) : 0 };
  }, [labOrders]);

  return (
    <div className="space-y-6">
      {platformOn && (
        <PlatformConnectivityStrip
          label="Turnaround analytics"
          detail={`${overall.reported}/${overall.total} reported · ${overall.pending} in progress`}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Turnaround &amp; SLA</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Throughput and backlog by section against target turnaround.
          </p>
        </div>
      </div>

      <Alert>
        <AlertTitle className="text-sm">TAT measurement</AlertTitle>
        <AlertDescription className="text-xs">
          Throughput uses completion ratio and section SLA targets. Minute-level clock TAT (collected→reported)
          requires order timestamps from the domain service rather than display times (lab W6).
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Reported</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground">{overall.reported}</p>
            <p className="mt-1 text-xs text-muted-foreground">{overall.pct}% of {overall.total}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">In progress</span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground">{overall.pending}</p>
            <p className="mt-1 text-xs text-muted-foreground">Awaiting report</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Critical open</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{overall.critical}</p>
            <p className="mt-1 text-xs text-muted-foreground">Need callback</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sections active</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{rows.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">With live orders</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">By section</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Section</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Reported</TableHead>
                <TableHead className="text-right">Pending</TableHead>
                <TableHead className="text-right">SLA target</TableHead>
                <TableHead className="text-right">Throughput</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No orders yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.section}>
                    <TableCell className="text-sm font-medium">{r.section}</TableCell>
                    <TableCell className="text-right text-sm">{r.total}</TableCell>
                    <TableCell className="text-right text-sm">{r.reported}</TableCell>
                    <TableCell className="text-right text-sm">{r.pending}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{r.sla}h</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={r.pct >= 80 ? "outline" : r.pct >= 50 ? "secondary" : "destructive"} className="text-xs">
                        {r.pct}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
