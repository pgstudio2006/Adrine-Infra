import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useHospital } from "@/stores/hospitalStore";
import { canUseIpdRuntime } from "@/runtime/ipd-runtime";
import {
  canUseNursingRuntime,
  platformListNursingTasksForAdmission,
} from "@/runtime/nursing-runtime";
import { downloadCsv } from "@/lib/export";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, AlertTriangle, ClipboardList, Download, HeartPulse, Pill, Search, UserRound } from "lucide-react";

function parseRecordedAt(value: string): number | null {
  if (!value) {
    return null;
  }

  const direct = Date.parse(value);
  if (!Number.isNaN(direct)) {
    return direct;
  }

  const today = new Date().toDateString();
  const withToday = Date.parse(`${today} ${value}`);
  if (!Number.isNaN(withToday)) {
    return withToday;
  }

  return null;
}

function hasAbnormalVitals(round?: { spo2: number; temp: number; pulse: number; painScore: number }) {
  if (!round) {
    return true;
  }

  return round.spo2 < 94 || round.temp >= 100.4 || round.pulse >= 110 || round.painScore >= 7;
}

export default function NurseTaskBoard() {
  const { admissions, nursingRounds, admissionTasks, prescriptions, refreshPlatformIpdSnapshots } = useHospital();
  const [search, setSearch] = useState("");
  const [wardFilter, setWardFilter] = useState("all");
  const [platformPendingByAdmission, setPlatformPendingByAdmission] = useState<Map<string, number>>(new Map());

  const refreshPlatformTaskCounts = useCallback(async () => {
    if (!canUseNursingRuntime()) {
      setPlatformPendingByAdmission(new Map());
      return;
    }
    const linked = admissions.filter((a) => a.status !== "discharged" && a.platformAdmissionId);
    const counts = new Map<string, number>();
    await Promise.all(
      linked.map(async (adm) => {
        try {
          const tasks = await platformListNursingTasksForAdmission(adm.platformAdmissionId!);
          const pending = tasks.filter((t) => t.state !== "completed" && t.state !== "missed").length;
          if (pending > 0) {
            counts.set(adm.id, pending);
          }
        } catch {
          /* keep local-only counts for this admission */
        }
      }),
    );
    setPlatformPendingByAdmission(counts);
  }, [admissions]);

  useEffect(() => {
    if (!canUseIpdRuntime()) return;
    void refreshPlatformIpdSnapshots();
    const censusTimer = setInterval(() => void refreshPlatformIpdSnapshots(), 25_000);
    return () => clearInterval(censusTimer);
  }, [refreshPlatformIpdSnapshots]);

  useEffect(() => {
    void refreshPlatformTaskCounts();
    if (!canUseNursingRuntime()) return;
    const timer = setInterval(() => void refreshPlatformTaskCounts(), 22_000);
    return () => clearInterval(timer);
  }, [refreshPlatformTaskCounts]);

  const activeAdmissions = useMemo(
    () => admissions.filter((admission) => admission.status !== "discharged"),
    [admissions],
  );

  const latestRoundByAdmission = useMemo(() => {
    const map = new Map<string, (typeof nursingRounds)[number]>();
    nursingRounds.forEach((round) => {
      if (!map.has(round.admissionId)) {
        map.set(round.admissionId, round);
      }
    });
    return map;
  }, [nursingRounds]);

  const pendingTasksByAdmission = useMemo(() => {
    const map = new Map<string, number>();
    admissionTasks
      .filter((task) => task.status === "Pending")
      .forEach((task) => {
        map.set(task.admissionId, (map.get(task.admissionId) || 0) + 1);
      });
    platformPendingByAdmission.forEach((count, admissionId) => {
      map.set(admissionId, (map.get(admissionId) || 0) + count);
    });
    return map;
  }, [admissionTasks, platformPendingByAdmission]);

  const medicationQueue = useMemo(() => {
    const rows = prescriptions.flatMap((rx) => {
      const encounterType = activeAdmissions.some((admission) => admission.uhid === rx.uhid) ? "IPD" : "OPD";
      return rx.meds
        .filter((line) => line.status !== "stopped" && line.dispensed < line.qty)
        .map((line, index) => ({
          id: `${rx.id}-${index}`,
          rxId: rx.id,
          uhid: rx.uhid,
          patientName: rx.patientName,
          doctor: rx.doctor,
          encounterType,
          drug: line.drug,
          dosage: line.dosage,
          route: line.route,
          frequency: line.frequency,
          pendingQty: line.qty - line.dispensed,
          priority: rx.priority,
        }));
    });

    return rows.sort((left, right) => {
      const priorityRank: Record<string, number> = { Emergency: 0, Urgent: 1, Routine: 2 };
      return (priorityRank[left.priority] ?? 3) - (priorityRank[right.priority] ?? 3);
    });
  }, [activeAdmissions, prescriptions]);

  const boardRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return activeAdmissions
      .map((admission) => {
        const latestRound = latestRoundByAdmission.get(admission.id);
        const lastRecordedAt = latestRound ? parseRecordedAt(latestRound.recordedAt) : null;
        const hoursSinceRound = lastRecordedAt ? Math.max(0, (Date.now() - lastRecordedAt) / (1000 * 60 * 60)) : Number.POSITIVE_INFINITY;
        const vitalsOverdue = !latestRound || hoursSinceRound >= 4;
        const abnormal = hasAbnormalVitals(latestRound);
        const pendingTasks = pendingTasksByAdmission.get(admission.id) || 0;
        const medsDue = medicationQueue.filter((row) => row.uhid === admission.uhid).length;

        return {
          admission,
          latestRound,
          vitalsOverdue,
          abnormal,
          pendingTasks,
          medsDue,
          urgencyScore:
            (abnormal ? 4 : 0)
            + (vitalsOverdue ? 3 : 0)
            + (admission.nursingPriority === "high" ? 2 : admission.nursingPriority === "medium" ? 1 : 0)
            + (pendingTasks > 0 ? 1 : 0),
        };
      })
      .filter((row) => {
        const matchesWard = wardFilter === "all" || row.admission.ward === wardFilter;
        const matchesSearch =
          query === ""
          || row.admission.patientName.toLowerCase().includes(query)
          || row.admission.uhid.toLowerCase().includes(query)
          || row.admission.attendingDoctor.toLowerCase().includes(query)
          || row.admission.bed.toLowerCase().includes(query);

        return matchesWard && matchesSearch;
      })
      .sort((left, right) => right.urgencyScore - left.urgencyScore);
  }, [activeAdmissions, latestRoundByAdmission, medicationQueue, pendingTasksByAdmission, search, wardFilter]);

  const urgentNow = boardRows.filter((row) => row.abnormal || row.vitalsOverdue || row.admission.nursingPriority === "high");
  const taskDriven = boardRows.filter((row) => row.pendingTasks > 0 || row.medsDue > 0);
  const dischargeReady = boardRows.filter((row) => row.admission.status === "discharge-ready");
  const uniqueWards = Array.from(new Set(activeAdmissions.map((admission) => admission.ward))).sort();

  const exportBoard = () => {
    downloadCsv(
      boardRows.map((row) => ({
        uhid: row.admission.uhid,
        patient: row.admission.patientName,
        ward: row.admission.ward,
        bed: row.admission.bed,
        nursingPriority: row.admission.nursingPriority,
        pendingTasks: row.pendingTasks,
        medsDue: row.medsDue,
        doctorRoundStatus: row.admission.doctorRoundStatus,
        latestSpO2: row.latestRound?.spo2 ?? "NA",
        latestTempF: row.latestRound?.temp ?? "NA",
        latestPulse: row.latestRound?.pulse ?? "NA",
        latestPainScore: row.latestRound?.painScore ?? "NA",
        vitalsOverdue: row.vitalsOverdue,
        abnormalVitals: row.abnormal,
      })),
      `nurse-task-board-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    toast.success("Task board exported");
  };

  const exportMar = () => {
    downloadCsv(
      medicationQueue.map((row) => ({
        rxId: row.rxId,
        uhid: row.uhid,
        patient: row.patientName,
        encounter: row.encounterType,
        doctor: row.doctor,
        priority: row.priority,
        drug: row.drug,
        dosage: row.dosage,
        route: row.route,
        frequency: row.frequency,
        pendingQty: row.pendingQty,
      })),
      `mar-due-list-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    toast.success("MAR due list exported");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Nursing Task Board</h1>
          <p className="text-sm text-muted-foreground mt-1">Bedside monitoring, nursing tasks, MAR reminders, and discharge handoff in one screen</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={exportMar}><Download className="h-4 w-4 mr-1" /> Export MAR</Button>
          <Button size="sm" onClick={exportBoard}><Download className="h-4 w-4 mr-1" /> Export Board</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Assigned Patients</p>
            <p className="text-2xl font-bold text-foreground">{boardRows.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Urgent Attention</p>
            <p className="text-2xl font-bold text-destructive">{urgentNow.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending Tasks</p>
            <p className="text-2xl font-bold text-foreground">{taskDriven.reduce((sum, row) => sum + row.pendingTasks, 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">MAR Due Lines</p>
            <p className="text-2xl font-bold text-foreground">{medicationQueue.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search patient, UHID, doctor, or bed"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select value={wardFilter} onValueChange={setWardFilter}>
          <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Wards</SelectItem>
            {uniqueWards.map((ward) => <SelectItem key={ward} value={ward}>{ward}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><HeartPulse className="h-4 w-4" /> Bedside Monitoring</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Ward / Bed</TableHead>
                <TableHead>Doctor Round</TableHead>
                <TableHead>Vitals</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Alerts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {boardRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No patients match current filters.</TableCell>
                </TableRow>
              ) : boardRows.map((row) => (
                <TableRow key={row.admission.id}>
                  <TableCell>
                    <p className="font-medium text-sm text-foreground">{row.admission.patientName}</p>
                    <p className="text-xs text-muted-foreground">{row.admission.uhid}</p>
                  </TableCell>
                  <TableCell className="text-sm">{row.admission.ward} · {row.admission.bed}</TableCell>
                  <TableCell>
                    <Badge variant={row.admission.doctorRoundStatus === "pending" ? "secondary" : "outline"} className="text-xs">
                      {row.admission.doctorRoundStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {row.latestRound ? (
                      <div className="space-y-1">
                        <p>SpO2 {row.latestRound.spo2}% · Temp {row.latestRound.temp}F</p>
                        <p className="text-muted-foreground">Pulse {row.latestRound.pulse} · Pain {row.latestRound.painScore}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No vitals captured</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs">{row.pendingTasks} Tasks</Badge>
                      <Badge variant="outline" className="text-xs">{row.medsDue} Meds</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {row.vitalsOverdue && <Badge variant="destructive" className="text-xs">Vitals overdue</Badge>}
                      {row.abnormal && <Badge variant="destructive" className="text-xs">Abnormal</Badge>}
                      {!row.vitalsOverdue && !row.abnormal && <Badge variant="outline" className="text-xs">Stable</Badge>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Urgent Now</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {urgentNow.length === 0 ? (
              <p className="text-xs text-muted-foreground">No urgent cards.</p>
            ) : urgentNow.slice(0, 6).map((row) => (
              <div key={row.admission.id} className="rounded-md border p-2">
                <p className="text-sm font-medium text-foreground">{row.admission.patientName}</p>
                <p className="text-xs text-muted-foreground">{row.admission.ward} · {row.admission.bed}</p>
                <p className="text-xs mt-1">Priority: {row.admission.nursingPriority.toUpperCase()}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Task Queue</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {taskDriven.length === 0 ? (
              <p className="text-xs text-muted-foreground">No task-driven cards.</p>
            ) : taskDriven.slice(0, 6).map((row) => (
              <div key={row.admission.id} className="rounded-md border p-2">
                <p className="text-sm font-medium text-foreground">{row.admission.patientName}</p>
                <p className="text-xs text-muted-foreground">{row.pendingTasks} pending tasks · {row.medsDue} meds due</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><UserRound className="h-4 w-4" /> Discharge Handoff</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {dischargeReady.length === 0 ? (
              <p className="text-xs text-muted-foreground">No discharge-ready patients.</p>
            ) : dischargeReady.map((row) => (
              <div key={row.admission.id} className="rounded-md border p-2">
                <p className="text-sm font-medium text-foreground">{row.admission.patientName}</p>
                <p className="text-xs text-muted-foreground">{row.admission.ward} · {row.admission.bed}</p>
                <Badge variant="secondary" className="mt-2 text-xs">Ready for transfer/home</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Pill className="h-4 w-4" /> Medication Administration Record (MAR) Reminders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rx ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Drug</TableHead>
                <TableHead>Dosage / Route</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Pending Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicationQueue.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No pending MAR lines.</TableCell>
                </TableRow>
              ) : medicationQueue.slice(0, 16).map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">{row.rxId}</TableCell>
                  <TableCell>
                    <p className="text-sm font-medium text-foreground">{row.patientName}</p>
                    <p className="text-xs text-muted-foreground">{row.uhid} · {row.encounterType}</p>
                  </TableCell>
                  <TableCell className="text-sm">{row.drug}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{row.dosage} · {row.route} · {row.frequency}</TableCell>
                  <TableCell>
                    <Badge variant={row.priority === "Emergency" ? "destructive" : row.priority === "Urgent" ? "secondary" : "outline"} className="text-xs">
                      {row.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-semibold">{row.pendingQty}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
