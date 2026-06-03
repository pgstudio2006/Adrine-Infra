import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, Pill, Shield } from "lucide-react";
import { useHospital } from "@/stores/hospitalStore";
import {
  canUseNursingRuntime,
  platformGetNurseReport,
} from "@/runtime/nursing-runtime";
import {
  canUseMarRuntime,
  platformListMarAuditForAdmission,
} from "@/runtime/mar-runtime";
import { pickPlatformRows, allowDemoFallback } from "@/lib/platform/demo-fallback";
import { PlatformEmptyState } from "@/components/platform/PlatformEmptyState";
import { formatPlatformErrorBody, PlatformApiError } from "@/runtime/platform-client";

const MAR_RECORDS_DEMO = [
  { id: "MAR001", uhid: "UH-2024-0012", patient: "Ramesh Kumar", drug: "Ceftriaxone 1g IV", scheduled: "08:00 AM", actual: "08:10 AM", status: "Administered", nurse: "Nurse Priya" },
  { id: "MAR002", uhid: "UH-2024-0012", patient: "Ramesh Kumar", drug: "Paracetamol 500mg PO", scheduled: "08:00 AM", actual: "08:05 AM", status: "Administered", nurse: "Nurse Priya" },
];

const AUDIT_DEMO = [
  { time: "09:30 AM", nurse: "Nurse Priya", action: "Recorded vitals", patient: "Ramesh Kumar", uhid: "UH-2024-0012" },
  { time: "09:15 AM", nurse: "Nurse Priya", action: "Administered Meropenem 1g IV", patient: "Vikram Singh", uhid: "UH-2024-0103" },
];

const statusColor = (s: string) => {
  if (s === "Administered" || s === "administered" || s === "Reported" || s === "Received") return "default";
  if (s === "Held" || s === "held" || s === "In Progress") return "secondary";
  if (s === "missed" || s === "refused") return "destructive";
  return "outline";
};

export default function NurseReports() {
  const { admissions } = useHospital();
  const platformOk = canUseNursingRuntime() && canUseMarRuntime();
  const [marRows, setMarRows] = useState<typeof MAR_RECORDS_DEMO>([]);
  const [auditRows, setAuditRows] = useState<typeof AUDIT_DEMO>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const platformAdmissions = useMemo(
    () => admissions.filter((a) => a.status !== "discharged" && a.platformAdmissionId),
    [admissions],
  );

  const refresh = useCallback(async () => {
    if (!platformOk || platformAdmissions.length === 0) return;
    setLoading(true);
    setLoadError(null);
    try {
      const reports = await Promise.all(
        platformAdmissions.map((adm) =>
          Promise.all([
            platformListMarAuditForAdmission(adm.platformAdmissionId!),
            platformGetNurseReport(adm.platformAdmissionId!),
          ]).then(([marAudit, nurseReport]) => ({ adm, marAudit, nurseReport })),
        ),
      );

      const mar = reports.flatMap(({ adm, marAudit }) =>
        marAudit.schedules.map((s) => ({
          id: s.id,
          uhid: adm.uhid,
          patient: adm.patientName,
          drug: `${s.drug} ${s.dosage} ${s.route}`.trim(),
          scheduled: s.scheduledAt
            ? new Date(s.scheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
            : "—",
          actual: s.administeredAt
            ? new Date(s.administeredAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
            : "—",
          status: s.state.charAt(0).toUpperCase() + s.state.slice(1),
          nurse: s.orderedBy ?? "—",
        })),
      );

      const audit = reports
        .flatMap(({ adm, nurseReport }) =>
          nurseReport.auditTrail.map((e) => ({
            time: new Date(e.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
            nurse: e.nurse,
            action: e.action,
            patient: adm.patientName,
            uhid: adm.uhid,
            detail: e.detail,
          })),
        )
        .sort((a, b) => b.time.localeCompare(a.time));

      setMarRows(mar.length ? mar : (allowDemoFallback() ? MAR_RECORDS_DEMO : []));
      setAuditRows(audit.length ? audit : (allowDemoFallback() ? AUDIT_DEMO : []));
    } catch (err) {
      const body = err instanceof PlatformApiError ? err.body : undefined;
      setLoadError(
        formatPlatformErrorBody(body)
          ?? (err instanceof Error ? err.message : "Could not load nurse reports"),
      );
    } finally {
      setLoading(false);
    }
  }, [platformOk, platformAdmissions]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const usePlatformData = platformOk && platformAdmissions.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {usePlatformData
              ? "MAR audit trail and nursing activity from domain-api"
              : "MAR, procedures, sample collections & audit trail"}
          </p>
        </div>
        <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1" /> Export Report</Button>
      </div>

      {loadError ? (
        <Alert variant="destructive">
          <AlertTitle>Platform</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : null}
      {loading && usePlatformData ? (
        <p className="text-xs text-muted-foreground">Loading platform nurse reports…</p>
      ) : null}

      <Tabs defaultValue="mar">
        <TabsList>
          <TabsTrigger value="mar"><Pill className="h-3.5 w-3.5 mr-1" /> MAR</TabsTrigger>
          <TabsTrigger value="audit"><Shield className="h-3.5 w-3.5 mr-1" /> Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="mar" className="mt-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Medication Administration Record</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Drug</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Actual</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Nurse</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marRows.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <p className="font-medium text-sm text-foreground">{m.patient}</p>
                        <p className="text-xs text-muted-foreground">{m.uhid}</p>
                      </TableCell>
                      <TableCell className="text-sm">{m.drug}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.scheduled}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.actual}</TableCell>
                      <TableCell><Badge variant={statusColor(m.status)} className="text-xs">{m.status}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.nurse}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Card className="border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Nurse</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditRows.map((row, idx) => (
                    <TableRow key={`${row.uhid}-${idx}`}>
                      <TableCell className="text-xs text-muted-foreground">{row.time}</TableCell>
                      <TableCell className="text-sm">{row.nurse}</TableCell>
                      <TableCell className="text-sm">{row.action}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{row.patient}</p>
                        <p className="text-xs text-muted-foreground">{row.uhid}</p>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[240px] truncate">
                        {"detail" in row ? (row as { detail?: string }).detail : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
