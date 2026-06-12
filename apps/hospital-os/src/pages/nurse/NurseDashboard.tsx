import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { isAdrine2026Experience } from "@/lib/adrine/experience";
import NurseDashboard2026 from "@/pages/nurse/NurseDashboard2026";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHospital } from "@/stores/hospitalStore";
import { useClinicalPlatformListSync } from "@/hooks/useClinicalPlatformListSync";
import {
  canUseIpdRuntime,
  platformListActiveIpdCensus,
} from "@/runtime/ipd-runtime";
import { PlatformConnectivityStrip } from "@/components/PlatformConnectivityStrip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  AlertTriangle,
  Bed,
  CheckCircle,
  ClipboardList,
  Clock,
  HeartPulse,
  Users,
} from "lucide-react";
import { InlinePlatformError } from "@/components/shared/InlinePlatformError";
import {
  ClinicalTableEmptyRow,
  NursePageHeader,
} from "@/components/clinical/ClinicalTableStates";

/** Hours after which a patient is considered "vitals overdue" without a fresh round. */
const VITALS_DUE_HOURS = 6;

const conditionColor = (status: string) => {
  if (status === "icu") return "destructive" as const;
  if (status === "discharge-ready") return "secondary" as const;
  return "outline" as const;
};

function parseRecordedAt(value: string): number {
  const t = Date.parse(value);
  return Number.isNaN(t) ? 0 : t;
}

export default function NurseDashboard() {
  if (isAdrine2026Experience()) {
    return <NurseDashboard2026 />;
  }

  const {
    admissions,
    nursingRounds,
    admissionTasks,
    inpatientCareOrders,
    refreshPlatformIpdSnapshots,
  } = useHospital();
  useClinicalPlatformListSync({ ipd: true, departmentWorklists: false });

  const [platformCensus, setPlatformCensus] = useState<number | null>(null);
  const [platformError, setPlatformError] = useState<string | null>(null);

  const refreshCensus = useCallback(async () => {
    if (!canUseIpdRuntime()) {
      setPlatformCensus(null);
      setPlatformError(null);
      return;
    }
    try {
      await refreshPlatformIpdSnapshots();
      const rows = await platformListActiveIpdCensus();
      setPlatformCensus(rows.length);
      setPlatformError(null);
    } catch (e) {
      setPlatformError(e instanceof Error ? e.message : "Census unavailable");
      setPlatformCensus(null);
    }
  }, [refreshPlatformIpdSnapshots]);

  useEffect(() => {
    void refreshCensus();
    if (!canUseIpdRuntime()) return;
    const t = setInterval(() => void refreshCensus(), 25_000);
    return () => clearInterval(t);
  }, [refreshCensus]);

  const activeAdmissions = useMemo(
    () => admissions.filter((a) => a.status !== "discharged"),
    [admissions],
  );

  /** Most recent nursing round per admission, for acuity + vitals-due derivation. */
  const latestRoundByAdmission = useMemo(() => {
    const map = new Map<string, (typeof nursingRounds)[number]>();
    for (const round of nursingRounds) {
      const existing = map.get(round.admissionId);
      if (!existing || parseRecordedAt(round.recordedAt) > parseRecordedAt(existing.recordedAt)) {
        map.set(round.admissionId, round);
      }
    }
    return map;
  }, [nursingRounds]);

  const pendingTasks = useMemo(
    () => admissionTasks.filter((t) => t.status === "Pending"),
    [admissionTasks],
  );

  const pendingCareOrders = useMemo(
    () => inpatientCareOrders.filter((o) => o.status === "Pending"),
    [inpatientCareOrders],
  );

  const vitalsDue = useMemo(() => {
    const cutoff = Date.now() - VITALS_DUE_HOURS * 60 * 60 * 1000;
    return activeAdmissions.filter((a) => {
      const round = latestRoundByAdmission.get(a.id);
      return !round || parseRecordedAt(round.recordedAt) < cutoff;
    });
  }, [activeAdmissions, latestRoundByAdmission]);

  /** Derived clinical alerts — not demo data. */
  const alerts = useMemo(() => {
    return activeAdmissions
      .map((a) => {
        const round = latestRoundByAdmission.get(a.id);
        let type: string | null = null;
        let severity: "critical" | "high" | "medium" = "medium";
        if (round && round.spo2 < 90) {
          type = `Low SpO₂ ${round.spo2}%`;
          severity = "critical";
        } else if (round && round.spo2 < 94) {
          type = `SpO₂ watch ${round.spo2}%`;
          severity = "high";
        } else if (round && round.temp >= 101) {
          type = `Febrile ${round.temp}°F`;
          severity = "high";
        } else if (a.nursingPriority === "high") {
          type = "High nursing acuity";
          severity = "high";
        } else if (a.status === "icu") {
          type = "ICU monitoring";
          severity = "medium";
        }
        if (!type) return null;
        return {
          id: a.id,
          patient: a.patientName,
          uhid: a.uhid,
          bed: `${a.ward} · ${a.bed}`,
          type,
          severity,
          detail: round
            ? `BP ${round.bp} · Pulse ${round.pulse} · SpO₂ ${round.spo2}% · ${round.recordedAt}`
            : "No vitals round recorded yet",
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => {
        const rank = { critical: 0, high: 1, medium: 2 } as const;
        return rank[a.severity] - rank[b.severity];
      });
  }, [activeAdmissions, latestRoundByAdmission]);

  const stats = useMemo(
    () => [
      {
        label: "Active patients",
        value: activeAdmissions.length,
        icon: Users,
        hint: platformCensus != null ? `Platform IPD: ${platformCensus}` : "Local census",
        to: "/nurse/ward",
      },
      {
        label: "Open tasks",
        value: pendingTasks.length,
        icon: Clock,
        hint: pendingTasks.length ? "Acknowledge & complete" : "All caught up",
        to: "/nurse/tasks",
      },
      {
        label: "Care orders due",
        value: pendingCareOrders.length,
        icon: ClipboardList,
        hint: pendingCareOrders.length ? "Procedures & diet" : "None pending",
        to: "/nurse/orders",
      },
      {
        label: "Vitals due",
        value: vitalsDue.length,
        icon: Activity,
        hint: `No round in ${VITALS_DUE_HOURS}h`,
        to: "/nurse/vitals",
      },
    ],
    [activeAdmissions.length, platformCensus, pendingTasks.length, pendingCareOrders.length, vitalsDue.length],
  );

  const myPatients = useMemo(() => activeAdmissions.slice(0, 8), [activeAdmissions]);
  const taskPreview = useMemo(() => pendingTasks.slice(0, 8), [pendingTasks]);

  return (
    <div className="space-y-6">
      {canUseIpdRuntime() && (
        <PlatformConnectivityStrip
          label="Live ward census"
          detail={
            platformCensus != null
              ? `Platform IPD: ${platformCensus} · local admissions: ${activeAdmissions.length}`
              : "Loading census…"
          }
          error={platformError}
        />
      )}

      <NursePageHeader
        title="Nursing dashboard"
        description="Live shift overview from ward census, tasks, care orders, and vitals rounds."
        actions={
          <>
            <Button size="sm" variant="outline" asChild>
              <Link to="/nurse/shift">Shift handoff</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/nurse/ward">Open ward board</Link>
            </Button>
          </>
        }
      />

      <InlinePlatformError error={platformError} onRetry={() => void refreshCensus()} />

      {/* KPI tiles — derived from real store/platform data, each links to its workspace */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="block">
            <Card className="border-border transition-colors hover:bg-muted/40">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Derived alerts */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" /> Active alerts &amp; acuity
            <Badge variant="outline" className="ml-1 text-xs">{alerts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {alerts.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No acuity flags. Alerts derive from latest vitals (SpO₂/temperature) and nursing priority.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {alerts.slice(0, 6).map((a) => (
                <div key={a.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={a.severity === "medium" ? "secondary" : "destructive"}
                      className="w-16 justify-center text-xs uppercase"
                    >
                      {a.severity}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {a.patient}{" "}
                        <span className="font-normal text-muted-foreground">· {a.uhid} · {a.bed}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.type}: {a.detail}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                    <Link to={`/nurse/vitals/chart/${a.id}`}>
                      <HeartPulse className="mr-1 h-3.5 w-3.5" />
                      Vitals
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Assigned patients */}
        <Card className="border-border lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bed className="h-4 w-4" /> Active patients
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Ward / bed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acuity</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {myPatients.length === 0 ? (
                  <ClinicalTableEmptyRow
                    colSpan={5}
                    title="No active admissions"
                    description="Admitted inpatients appear here once reception/ER hands over an admission."
                  />
                ) : (
                  myPatients.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <p className="text-sm font-medium text-foreground">{p.patientName}</p>
                        <p className="text-xs text-muted-foreground">{p.uhid}</p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {p.ward} · {p.bed}
                      </TableCell>
                      <TableCell>
                        <Badge variant={conditionColor(p.status)} className="text-xs capitalize">
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {p.nursingPriority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
                          <Link to={`/nurse/notes/${p.id}`}>Notes</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pending tasks */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-4 w-4" /> Pending tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {taskPreview.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                No pending nursing tasks.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {taskPreview.map((t) => (
                  <div key={t.id} className="px-4 py-3">
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{t.task}</p>
                      <Badge variant="outline" className="text-xs">{t.status}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-xs text-muted-foreground">{t.patientName}</p>
                      <p className="text-xs text-muted-foreground">{t.assignedTo || "Unassigned"}</p>
                    </div>
                  </div>
                ))}
                <div className="px-4 py-3">
                  <Button size="sm" variant="outline" className="w-full text-xs" asChild>
                    <Link to="/nurse/tasks">Open task workspace</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
