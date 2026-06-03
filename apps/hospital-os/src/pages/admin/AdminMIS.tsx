import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useHospital } from "@/stores/hospitalStore";
import { downloadCsv, downloadJson, ExportRow } from "@/lib/export";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Download, FileText, TrendingUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlatformConnectivityStrip } from "@/components/PlatformConnectivityStrip";
import { useAdminOperationalData } from "@/hooks/useAdminOperationalData";
import { DashboardKpiGrid } from "@/components/dashboard/DashboardKpiGrid";
import { buildMisHeaderKpis } from "@/lib/dashboard/dashboard-engine";

interface ReportEntry {
  name: string;
  description: string;
  frequency: "Daily" | "Weekly" | "Monthly";
  lastGenerated: string;
  rows: ExportRow[];
}

interface ReportCategory {
  category: string;
  reports: ReportEntry[];
}

function formatDate(value = new Date()) {
  return value.toISOString().slice(0, 10);
}

function parseDate(value: string): Date | null {
  if (!value) {
    return null;
  }

  const direct = Date.parse(value);
  if (!Number.isNaN(direct)) {
    return new Date(direct);
  }

  const today = new Date().toDateString();
  const fallback = Date.parse(`${today} ${value}`);
  if (!Number.isNaN(fallback)) {
    return new Date(fallback);
  }

  return null;
}

function toSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function AdminMIS() {
  const {
    patients,
    admissions,
    nursingRounds,
    admissionTasks,
    doctorProgressNotes,
    invoices,
    billingTransactions,
    labOrders,
    radiologyOrders,
    prescriptions,
    workflowEvents,
  } = useHospital();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const { analytics, snapshot, platformOn, error } = useAdminOperationalData("7d");

  const headerKpis = useMemo(
    () => buildMisHeaderKpis(snapshot?.counts, analytics),
    [snapshot?.counts, analytics],
  );

  const reportCategories = useMemo<ReportCategory[]>(() => {
    const today = formatDate();

    const opdByDepartmentMap = new Map<string, number>();
    patients
      .filter((patient) => patient.patientType === "OPD")
      .forEach((patient) => {
        const department = patient.department || "Unassigned";
        opdByDepartmentMap.set(department, (opdByDepartmentMap.get(department) || 0) + 1);
      });

    const opdSummaryRows: ExportRow[] = Array.from(opdByDepartmentMap.entries()).map(([department, count]) => ({
      department,
      patients: count,
    }));

    if (snapshot?.counts && analytics) {
      opdSummaryRows.unshift({
        department: "_branch_live",
        patients: snapshot.counts.opdActiveVisits,
        queue: snapshot.counts.opdWaitingQueue,
        visitsPeriod: analytics.metrics.opdVisitsCreated ?? 0,
        branchId: snapshot.branchId,
      });
    }

    const bedsTotal =
      snapshot?.counts
        ? snapshot.counts.bedsOccupied + snapshot.counts.bedsAvailable
        : 120;
    const totalAdmissions =
      snapshot?.counts?.ipdActiveAdmissions ??
      admissions.filter((admission) => admission.status !== "discharged").length;
    const occupancyRate = Number(((totalAdmissions / Math.max(bedsTotal, 1)) * 100).toFixed(1));
    const dischargeReady = admissions.filter((admission) => admission.status === "discharge-ready").length;

    const ipdCensusRows: ExportRow[] = [
      {
        date: today,
        activeAdmissions: totalAdmissions,
        dischargeReady,
        occupancyRatePct: occupancyRate,
      },
    ];

    const nursingTaskRows: ExportRow[] = admissions
      .filter((admission) => admission.status !== "discharged")
      .map((admission) => {
        const rounds = nursingRounds.filter((round) => round.admissionId === admission.id);
        const pendingTasks = admissionTasks.filter((task) => task.admissionId === admission.id && task.status === "Pending").length;
        const latestRound = rounds[0];

        return {
          admissionId: admission.id,
          uhid: admission.uhid,
          patient: admission.patientName,
          ward: admission.ward,
          bed: admission.bed,
          nursingPriority: admission.nursingPriority,
          pendingTasks,
          latestSpO2: latestRound?.spo2 ?? "NA",
          latestTempF: latestRound?.temp ?? "NA",
          latestPainScore: latestRound?.painScore ?? "NA",
        };
      });

    const revenueByCategory = invoices.reduce<Record<string, { total: number; collected: number; balance: number }>>((acc, invoice) => {
      const key = invoice.category;
      if (!acc[key]) {
        acc[key] = { total: 0, collected: 0, balance: 0 };
      }
      acc[key].total += invoice.total;
      acc[key].collected += invoice.paid;
      acc[key].balance += Math.max(0, invoice.total - invoice.paid);
      return acc;
    }, {});

    const revenueRows: ExportRow[] = Object.entries(revenueByCategory).map(([category, values]) => ({
      category,
      billed: values.total,
      collected: values.collected,
      outstanding: values.balance,
      collectionPct: values.total > 0 ? Number(((values.collected / values.total) * 100).toFixed(1)) : 0,
    }));

    const packageRows: ExportRow[] = invoices
      .flatMap((invoice) => invoice.items.map((item) => ({ invoiceId: invoice.id, uhid: invoice.uhid, item })))
      .filter(({ item }) => /package/i.test(item.description))
      .map(({ invoiceId, uhid, item }) => ({
        invoiceId,
        uhid,
        packageName: item.description,
        amount: item.amount,
      }));

    const paymentsByMode = billingTransactions
      .filter((transaction) => transaction.kind === "payment")
      .reduce<Record<string, { count: number; amount: number }>>((acc, transaction) => {
        if (!acc[transaction.mode]) {
          acc[transaction.mode] = { count: 0, amount: 0 };
        }
        acc[transaction.mode].count += 1;
        acc[transaction.mode].amount += transaction.amount;
        return acc;
      }, {});

    const collectionRows: ExportRow[] = Object.entries(paymentsByMode).map(([mode, values]) => ({
      mode,
      transactions: values.count,
      collectedAmount: values.amount,
    }));

    const labRows: ExportRow[] = labOrders.map((order) => ({
      orderId: order.orderId,
      uhid: order.uhid,
      patient: order.patientName,
      category: order.category,
      priority: order.priority,
      stage: order.stage,
      sampleStatus: order.sampleStatus,
      criticalAlert: !!order.criticalAlert,
      authorizedBy: order.authorizedBy || "Pending",
    }));

    const radiologyRows: ExportRow[] = radiologyOrders.map((order) => ({
      orderId: order.orderId,
      uhid: order.uhid,
      patient: order.patientName,
      study: order.study,
      modality: order.modality,
      status: order.status,
      scheduledDate: order.scheduledDate || "Pending",
      critical: !!order.critical,
      reportedAt: order.reportedAt || "Pending",
    }));

    const pharmacyRows: ExportRow[] = prescriptions.map((rx) => {
      const pendingLines = rx.meds.filter((line) => line.dispensed < line.qty && line.status !== "stopped").length;
      const dispensed = rx.meds.reduce((sum, line) => sum + line.dispensed, 0);
      const ordered = rx.meds.reduce((sum, line) => sum + line.qty, 0);

      return {
        rxId: rx.id,
        uhid: rx.uhid,
        patient: rx.patientName,
        doctor: rx.doctor,
        status: rx.status,
        pendingLines,
        dispensed,
        ordered,
      };
    });

    const doctorProductivityMap = new Map<string, { rounds: number; notes: number; activeCases: number }>();
    admissions.forEach((admission) => {
      const doctor = admission.attendingDoctor || "Doctor On Call";
      const current = doctorProductivityMap.get(doctor) || { rounds: 0, notes: 0, activeCases: 0 };
      current.activeCases += admission.status !== "discharged" ? 1 : 0;
      doctorProductivityMap.set(doctor, current);
    });

    doctorProgressNotes.forEach((note) => {
      const current = doctorProductivityMap.get(note.doctor) || { rounds: 0, notes: 0, activeCases: 0 };
      current.notes += 1;
      current.rounds += 1;
      doctorProductivityMap.set(note.doctor, current);
    });

    const doctorRows: ExportRow[] = Array.from(doctorProductivityMap.entries()).map(([doctor, stats]) => ({
      doctor,
      activeCases: stats.activeCases,
      roundsLogged: stats.rounds,
      notesLogged: stats.notes,
    }));

    const admittedDays = admissions
      .filter((admission) => admission.status !== "discharged")
      .map((admission) => {
        const parsed = parseDate(admission.admittedAt);
        if (!parsed) {
          return null;
        }
        return Math.max(1, Math.ceil((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24)));
      })
      .filter((value): value is number => value !== null);

    const alos = admittedDays.length ? Number((admittedDays.reduce((sum, days) => sum + days, 0) / admittedDays.length).toFixed(1)) : 0;
    const mortalityRate = 0;

    const readmissionCount = admissions.reduce<Record<string, number>>((acc, admission) => {
      acc[admission.uhid] = (acc[admission.uhid] || 0) + 1;
      return acc;
    }, {});

    const repeatPatients = Object.values(readmissionCount).filter((count) => count > 1).length;
    const readmissionRate = admissions.length > 0 ? Number(((repeatPatients / admissions.length) * 100).toFixed(1)) : 0;

    const kpiRows: ExportRow[] = [
      {
        activeAdmissions: totalAdmissions,
        occupancyRatePct: occupancyRate,
        alosDays: alos,
        mortalityRatePct: mortalityRate,
        readmissionRatePct: readmissionRate,
      },
    ];

    const fileReadinessRows: ExportRow[] = admissions.map((admission) => {
      const hasNursingChart = nursingRounds.some((round) => round.admissionId === admission.id);
      const hasDoctorOrderSheet = admissionTasks.some((task) => task.admissionId === admission.id);
      const hasDoctorSummary = doctorProgressNotes.some((note) => note.admissionId === admission.id);
      const hasInvestigations = labOrders.some((order) => order.uhid === admission.uhid) || radiologyOrders.some((order) => order.uhid === admission.uhid);
      const hasBilling = invoices.some((invoice) => invoice.uhid === admission.uhid);

      const completeness = [hasNursingChart, hasDoctorOrderSheet, hasDoctorSummary, hasInvestigations, hasBilling]
        .filter(Boolean)
        .length;

      return {
        admissionId: admission.id,
        uhid: admission.uhid,
        patient: admission.patientName,
        ward: admission.ward,
        hasNursingChart,
        hasDoctorOrderSheet,
        hasDoctorSummary,
        hasInvestigations,
        hasBilling,
        fileCompletenessPct: completeness * 20,
      };
    });

    const auditRows: ExportRow[] = workflowEvents.slice(0, 250).map((event) => ({
      eventId: event.id,
      timestamp: event.timestamp,
      module: event.module,
      action: event.action,
      uhid: event.uhid || "",
      patientName: event.patientName || "",
      reference: event.refId || "",
      details: event.details,
    }));

    return [
      {
        category: "Operational Reports",
        reports: [
          { name: "Daily OPD Summary", description: "Patient footfall by department", frequency: "Daily", lastGenerated: today, rows: opdSummaryRows },
          { name: "IPD Census", description: "Admissions, discharge-ready load, occupancy", frequency: "Daily", lastGenerated: today, rows: ipdCensusRows },
          { name: "Nursing Task Board Compliance", description: "Pending tasks and bedside abnormal flags", frequency: "Daily", lastGenerated: today, rows: nursingTaskRows },
        ],
      },
      {
        category: "Financial Reports",
        reports: [
          { name: "Department Revenue", description: "Billed, collected, and outstanding by category", frequency: "Weekly", lastGenerated: today, rows: revenueRows },
          { name: "Package Utilization", description: "Package line-items and amount utilization", frequency: "Weekly", lastGenerated: today, rows: packageRows },
          { name: "Daily Revenue Collection", description: "Collection by payment mode", frequency: "Daily", lastGenerated: today, rows: collectionRows },
        ],
      },
      {
        category: "Clinical Reports",
        reports: [
          { name: "Clinical KPI Snapshot", description: "ALOS, occupancy, readmission, and mortality", frequency: "Weekly", lastGenerated: today, rows: kpiRows },
          { name: "Doctor Performance", description: "Rounds and progress notes by doctor", frequency: "Weekly", lastGenerated: today, rows: doctorRows },
          { name: "Lab TAT and Critical Alerts", description: "Lab order stage tracking and critical values", frequency: "Daily", lastGenerated: today, rows: labRows },
          { name: "Radiology Workflow", description: "Order-to-report status and critical findings", frequency: "Daily", lastGenerated: today, rows: radiologyRows },
          { name: "Pharmacy Dispensing", description: "Prescription status and dispensing progress", frequency: "Daily", lastGenerated: today, rows: pharmacyRows },
        ],
      },
      {
        category: "Compliance Reports",
        reports: [
          { name: "IPD File Completeness", description: "Admission file readiness across core forms", frequency: "Weekly", lastGenerated: today, rows: fileReadinessRows },
          { name: "Audit Trail Report", description: "System-wide workflow and action log", frequency: "Daily", lastGenerated: today, rows: auditRows },
        ],
      },
    ];
  }, [
    admissionTasks,
    admissions,
    billingTransactions,
    doctorProgressNotes,
    invoices,
    labOrders,
    nursingRounds,
    patients,
    prescriptions,
    radiologyOrders,
    workflowEvents,
    snapshot,
    analytics,
  ]);

  const filteredCategories = selectedCategory === "all"
    ? reportCategories
    : reportCategories.filter((category) => category.category === selectedCategory);

  const reportCount = reportCategories.reduce((sum, category) => sum + category.reports.length, 0);
  const dailyCount = reportCategories
    .flatMap((category) => category.reports)
    .filter((report) => report.frequency === "Daily")
    .length;

  const exportReportCsv = (category: string, report: ReportEntry) => {
    downloadCsv(report.rows, `mis-${toSlug(category)}-${toSlug(report.name)}-${formatDate()}.csv`);
    toast.success(`${report.name} exported as CSV`);
  };

  const exportReportJson = (category: string, report: ReportEntry) => {
    downloadJson(
      {
        category,
        report: report.name,
        description: report.description,
        generatedAt: new Date().toISOString(),
        rows: report.rows,
      },
      `mis-${toSlug(category)}-${toSlug(report.name)}-${formatDate()}.json`,
    );
    toast.success(`${report.name} exported as JSON`);
  };

  const exportAllManifest = () => {
    const manifestRows: ExportRow[] = reportCategories.flatMap((category) =>
      category.reports.map((report) => ({
        category: category.category,
        report: report.name,
        frequency: report.frequency,
        records: report.rows.length,
        lastGenerated: report.lastGenerated,
      })),
    );

    downloadCsv(manifestRows, `mis-report-manifest-${formatDate()}.csv`);
    toast.success("MIS report manifest exported");
  };

  return (
    <div className="space-y-6">
      {platformOn && (
        <PlatformConnectivityStrip
          label="MIS exports + platform analytics"
          detail={`Branch ${snapshot?.branchId ?? "—"} · 7d OPD ${analytics?.metrics.opdVisitsCreated ?? 0} · queue ${snapshot?.counts.opdWaitingQueue ?? 0} · IPD ${snapshot?.counts.ipdActiveAdmissions ?? 0}`}
          error={error}
        />
      )}
      {platformOn && headerKpis.length > 0 && (
        <DashboardKpiGrid kpis={headerKpis} live loading={!snapshot} columns={4} />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">MIS Reports</h1>
          <p className="text-sm text-muted-foreground">
            {platformOn
              ? "Export rows from hospitalStore; KPI header from domain command + analytics (branch-scoped)"
              : "Exports from hospitalStore — enable platform runtime for live branch KPIs"}
          </p>
        </div>
        <Button variant="outline" onClick={exportAllManifest}><Download className="h-4 w-4 mr-1" /> Export All</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><FileText className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{reportCount}</p><p className="text-xs text-muted-foreground">Total Reports</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><BarChart3 className="h-5 w-5 text-blue-500" /><div><p className="text-2xl font-bold">{reportCategories.length}</p><p className="text-xs text-muted-foreground">Categories</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><TrendingUp className="h-5 w-5 text-emerald-500" /><div><p className="text-2xl font-bold">{dailyCount}</p><p className="text-xs text-muted-foreground">Daily Reports</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><FileText className="h-5 w-5 text-amber-500" /><div><p className="text-2xl font-bold">{workflowEvents.length}</p><p className="text-xs text-muted-foreground">Audit Events</p></div></CardContent></Card>
      </div>

      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
        <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {reportCategories.map((category) => <SelectItem key={category.category} value={category.category}>{category.category}</SelectItem>)}
        </SelectContent>
      </Select>

      {filteredCategories.map((category) => (
        <Card key={category.category}>
          <CardHeader><CardTitle className="text-base">{category.category}</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Report</TableHead>
                  <TableHead className="w-[100px]">Frequency</TableHead>
                  <TableHead className="w-[72px]">Rows</TableHead>
                  <TableHead className="w-[110px]">Generated</TableHead>
                  <TableHead className="w-[160px] text-right">Export</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {category.reports.map((report) => (
                  <TableRow key={report.name}>
                    <TableCell>
                      <p className="text-sm font-medium">{report.name}</p>
                      <p className="text-xs text-muted-foreground">{report.description}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{report.frequency}</Badge>
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">{report.rows.length}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{report.lastGenerated}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => exportReportCsv(category.category, report)}>
                          <Download className="h-3 w-3 mr-1" /> CSV
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => exportReportJson(category.category, report)}>
                          JSON
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
