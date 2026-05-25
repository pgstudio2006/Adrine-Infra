import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, Clock, Pill, Search, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { MarValidationContext } from "@adrine/hospital-operations";
import { useHospital } from "@/stores/hospitalStore";
import { useClinicalPlatformListSync } from "@/hooks/useClinicalPlatformListSync";
import {
  ClinicalTableEmptyRow,
  ClinicalTableLoadingRow,
  NursePageHeader,
} from "@/components/clinical/ClinicalTableStates";
import {
  canUseMarRuntime,
  platformListMarSchedulesForAdmission,
  platformMarTransition,
  type PlatformMarSchedule,
} from "@/runtime/mar-runtime";
import { formatPlatformErrorBody, PlatformApiError } from "@/runtime/platform-client";

interface MedSchedule {
  id: string;
  uhid: string;
  patient: string;
  bed: string;
  drug: string;
  dosage: string;
  route: string;
  frequency: string;
  scheduledTime: string;
  status: "pending" | "administered" | "missed" | "delayed" | "refused";
  doctor: string;
  notes?: string;
  isPlatform?: boolean;
  version?: number;
}

const statusConfig: Record<string, { icon: React.ReactNode; color: "default" | "destructive" | "secondary" | "outline" }> = {
  pending: { icon: <Clock className="h-3.5 w-3.5" />, color: "outline" },
  administered: { icon: <CheckCircle className="h-3.5 w-3.5" />, color: "default" },
  missed: { icon: <XCircle className="h-3.5 w-3.5" />, color: "destructive" },
  delayed: { icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "secondary" },
  refused: { icon: <XCircle className="h-3.5 w-3.5" />, color: "destructive" },
};

function mapMarStateToUi(state: string): MedSchedule["status"] {
  if (state === "administered") return "administered";
  if (state === "missed") return "missed";
  if (state === "refused") return "refused";
  if (state === "held") return "delayed";
  return "pending";
}

function mapPlatformMarSchedule(
  row: PlatformMarSchedule,
  admission: { uhid: string; patientName: string; bed: string; attendingDoctor: string },
): MedSchedule {
  return {
    id: row.id,
    uhid: admission.uhid,
    patient: admission.patientName,
    bed: admission.bed,
    drug: row.drug,
    dosage: row.dosage || "—",
    route: row.route,
    frequency: row.frequency || "—",
    scheduledTime: row.scheduledAt
      ? new Date(row.scheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
      : "—",
    status: mapMarStateToUi(row.state),
    doctor: row.orderedBy ?? admission.attendingDoctor ?? "—",
    notes: row.notes ?? undefined,
    isPlatform: true,
    version: row.version,
  };
}

export default function NurseMedications() {
  const { admissions } = useHospital();
  useClinicalPlatformListSync({ ipd: true, departmentWorklists: false });
  const platformOk = canUseMarRuntime();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformMeds, setPlatformMeds] = useState<MedSchedule[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const ipdPlatformAdmissions = useMemo(
    () =>
      admissions.filter((a) => a.status !== "discharged" && !!a.platformAdmissionId),
    [admissions],
  );

  const refreshPlatformMeds = useCallback(async () => {
    if (!platformOk || ipdPlatformAdmissions.length === 0) {
      setPlatformMeds([]);
      setLoadError(null);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const bundles = await Promise.all(
        ipdPlatformAdmissions.map(async (adm) => {
          const rows = await platformListMarSchedulesForAdmission(adm.platformAdmissionId!);
          return rows.map((row) =>
            mapPlatformMarSchedule(row, {
              uhid: adm.uhid,
              patientName: adm.patientName,
              bed: adm.bed,
              attendingDoctor: adm.attendingDoctor,
            }),
          );
        }),
      );
      setPlatformMeds(bundles.flat());
    } catch (err) {
      const body = err instanceof PlatformApiError ? err.body : undefined;
      const msg =
        formatPlatformErrorBody(body)
        ?? (err instanceof Error ? err.message : "Could not load medication schedules");
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, [platformOk, ipdPlatformAdmissions]);

  useEffect(() => {
    void refreshPlatformMeds();
  }, [refreshPlatformMeds]);

  useEffect(() => {
    if (!platformOk) return;
    const timer = setInterval(() => void refreshPlatformMeds(), 22_000);
    return () => clearInterval(timer);
  }, [platformOk, refreshPlatformMeds]);

  const usePlatformData = platformOk && ipdPlatformAdmissions.length > 0;
  const schedule = platformMeds;

  const filtered = schedule.filter((m) => {
    const matchSearch =
      m.patient.toLowerCase().includes(search.toLowerCase())
      || m.uhid.includes(search)
      || m.drug.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = schedule.filter((m) => m.status === "pending").length;
  const administeredCount = schedule.filter((m) => m.status === "administered").length;
  const issueCount = schedule.filter((m) => m.status === "missed" || m.status === "delayed" || m.status === "refused").length;

  const marCtx: MarValidationContext = { nurseAssigned: true };

  const runMarAction = async (
    row: MedSchedule,
    action: string,
    reason?: string,
    ctxOverride?: MarValidationContext,
  ) => {
    if (!row.isPlatform || row.version === undefined) return;
    setActingId(row.id);
    try {
      await platformMarTransition(
        row.id,
        action,
        { ...marCtx, ...ctxOverride },
        row.version,
        reason,
      );
      toast.success(
        action === "administer" ? "Medication administered" : action === "hold" ? "Dose held" : "MAR updated",
      );
      await refreshPlatformMeds();
    } catch (err) {
      const body = err instanceof PlatformApiError ? err.body : undefined;
      const msg =
        formatPlatformErrorBody(body)
        ?? (err instanceof Error ? err.message : "MAR action failed");
      toast.error("Could not update medication record", { description: msg });
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <NursePageHeader
        title="Medications (MAR)"
        description={
          platformOk
            ? "Medication administration records from domain-api for platform-linked admissions."
            : "Enable platform runtime to load governed MAR schedules."
        }
      />

      {!platformOk ? (
        <Alert>
          <AlertTitle>Platform required</AlertTitle>
          <AlertDescription>
            MAR administer, hold, and missed actions require domain-api. Sync IPD admissions from Ward or Admissions first.
          </AlertDescription>
        </Alert>
      ) : null}

      {loadError ? (
        <Alert variant="destructive">
          <AlertTitle>Platform</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border"><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
        </CardContent></Card>
        <Card className="border-border"><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Administered</p>
          <p className="text-2xl font-bold text-foreground">{administeredCount}</p>
        </CardContent></Card>
        <Card className="border-border"><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Issues</p>
          <p className="text-2xl font-bold text-foreground">{issueCount}</p>
        </CardContent></Card>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search patient, UHID or drug..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="administered">Administered</SelectItem>
            <SelectItem value="delayed">Delayed / Held</SelectItem>
            <SelectItem value="missed">Missed</SelectItem>
            <SelectItem value="refused">Refused</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Drug</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <ClinicalTableLoadingRow colSpan={9} />
              ) : filtered.length === 0 ? (
                <ClinicalTableEmptyRow
                  colSpan={9}
                  title="No MAR schedules"
                  description={
                    usePlatformData
                      ? "No medication rows for active admissions. Orders may still be pending pharmacy sync."
                      : "Admit platform-linked inpatients to load MAR from domain-api."
                  }
                />
              ) : null}
              {!loading && filtered.map((m) => {
                const sc = statusConfig[m.status];
                const busy = actingId === m.id;
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <p className="font-medium text-sm text-foreground">{m.patient}</p>
                      <p className="text-xs text-muted-foreground">{m.uhid} · {m.bed}</p>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{m.drug}</TableCell>
                    <TableCell className="text-sm">{m.dosage}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{m.route}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.frequency}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.scheduledTime}</TableCell>
                    <TableCell>
                      <Badge variant={sc.color} className="text-xs gap-1">
                        {sc.icon} {m.status}
                      </Badge>
                      {m.notes && <p className="text-[10px] text-muted-foreground mt-1 max-w-[150px] truncate">{m.notes}</p>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.doctor}</TableCell>
                    <TableCell>
                      {m.isPlatform && m.status === "pending" && (
                        <div className="flex flex-wrap gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            disabled={busy}
                            onClick={() => void runMarAction(m, "hold")}
                          >
                            Hold
                          </Button>
                          <Button
                            size="sm"
                            className="text-xs h-7"
                            disabled={busy}
                            onClick={() => void runMarAction(m, "administer")}
                          >
                            <Pill className="h-3 w-3 mr-1" />
                            Administer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            disabled={busy}
                            onClick={() => {
                              const reason = window.prompt("Reason for missed dose:");
                              if (!reason?.trim()) return;
                              void runMarAction(m, "mark_missed", reason.trim(), {
                                missReasonDocumented: true,
                              });
                            }}
                          >
                            Missed
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            disabled={busy}
                            onClick={() => {
                              const reason = window.prompt("Reason patient refused:");
                              if (!reason?.trim()) return;
                              void runMarAction(m, "mark_refused", reason.trim(), {
                                refusalReasonDocumented: true,
                              });
                            }}
                          >
                            Refused
                          </Button>
                        </div>
                      )}
                      {m.isPlatform && m.status === "delayed" && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            disabled={busy}
                            onClick={() => void runMarAction(m, "release_hold")}
                          >
                            Release
                          </Button>
                          <Button
                            size="sm"
                            className="text-xs h-7"
                            disabled={busy}
                            onClick={() => void runMarAction(m, "administer")}
                          >
                            Administer
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
