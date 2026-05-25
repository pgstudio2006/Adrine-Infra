import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  UserPlus,
  BedDouble,
  Clock,
  Activity,
  X,
  FileText,
  AlertTriangle,
  ArrowRight,
  User,
  Phone,
  Stethoscope,
  CheckCircle2,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import { useHospital } from "@/stores/hospitalStore";
import { useClinicalPlatformListSync } from "@/hooks/useClinicalPlatformListSync";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppSelect } from "@/components/ui/app-select";
import { toast } from "sonner";
import { OperationalDischargePanel } from "@/components/operations/OperationalDischargePanel";
import { canUseDischargeRuntime } from "@/runtime/discharge-runtime";

const conditionStyles: Record<string, string> = {
  stable: "bg-success/10 text-success",
  critical: "bg-destructive/10 text-destructive",
  improving: "bg-info/10 text-info",
  observation: "bg-warning/10 text-warning",
};

const statusStyles: Record<string, string> = {
  admitted: "bg-success/10 text-success",
  icu: "bg-destructive/10 text-destructive",
  ot: "bg-warning/10 text-warning",
  "discharge-ready": "bg-warning/10 text-warning",
  discharged: "bg-muted text-muted-foreground",
};

const journeyLabels: Record<string, string> = {
  IPD: "Planned IPD",
  ICU: "ICU",
  Surgery: "Surgical",
  Maternity: "Maternity",
  Newborn: "Newborn",
  Dialysis: "Dialysis",
  Trauma: "Trauma",
};

const BED_COST_ESTIMATES: Record<string, number> = {
  General: 1500,
  "Semi-Private": 3500,
  Private: 6500,
  ICU: 15000,
};

function preAuthStatus(category: string): "pending" | "approved" | null {
  if (category === "insurance") return "pending";
  if (category === "corporate") return "approved";
  return null;
}

interface AttendantInfo {
  name: string;
  relation: string;
  phone: string;
}

const departmentOptions = [
  "General Medicine",
  "Cardiology",
  "Orthopedics",
  "Gynecology",
  "Pediatrics",
  "ENT",
  "Neurology",
  "Urology",
  "Surgery",
  "Emergency",
];

export default function ReceptionIPD() {
  const {
    admissions,
    patients,
    queue,
    nursingRounds,
    pharmacyInventory,
    transferOpdToIPD,
    assignConsultantDoctor,
    transferAdmissionDepartment,
    addDailyServiceCharge,
    issueWardMedicine,
    addInvestigationOrder,
    upsertOTRecord,
    assignAdmissionBed,
  } = useHospital();
  useClinicalPlatformListSync({ ipd: true, departmentWorklists: false });

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedAdmissionId, setSelectedAdmissionId] = useState<string | null>(
    null,
  );

  // ── OPD patient picker state ──
  const [opdSearch, setOpdSearch] = useState("");
  const [selectedOpdPatient, setSelectedOpdPatient] = useState<null | {
    uhid: string;
    name: string;
    phone?: string;
    department?: string;
    assignedDoctor?: string;
    category: string;
    bloodGroup?: string;
  }>(null);

  const [convertForm, setConvertForm] = useState({
    uhid: "",
    attendingDoctor: "",
    reason: "",
    bedType: "General" as "General" | "Semi-Private" | "Private" | "ICU",
    priority: "Routine" as "Routine" | "Urgent" | "Emergency",
    requestedBy: "Reception Desk",
  });

  const [attendants, setAttendants] = useState<Record<string, AttendantInfo>>(
    {},
  );
  const [attendantForm, setAttendantForm] = useState({
    name: "",
    relation: "",
    phone: "",
  });

  const [consultantDoctor, setConsultantDoctor] = useState("");
  const [transferForm, setTransferForm] = useState({
    toDepartment: "",
    reason: "",
    transferredBy: "Reception Desk",
    newAttendingDoctor: "",
  });
  const [shiftForm, setShiftForm] = useState({
    ward: "",
    bed: "",
    assignedNurse: "",
    nextDoctorRoundAt: "",
    reason: "",
    shiftedBy: "Reception Desk",
  });
  const [chargeForm, setChargeForm] = useState({
    description: "",
    amount: "",
    chargedBy: "Reception Desk",
  });
  const [medicineForm, setMedicineForm] = useState({
    inventoryId: "",
    qty: "",
    issuedBy: "Ward Nurse",
  });
  const [investigationForm, setInvestigationForm] = useState({
    tests: "",
    category: "Biochemistry",
    priority: "Routine" as "Routine" | "Urgent" | "Emergency",
    doctor: "",
  });
  const [otForm, setOtForm] = useState({
    procedureName: "",
    surgeon: "",
    anesthetist: "",
    preOperativeNotes: "",
    postOperativeNotes: "",
    status: "scheduled" as "scheduled" | "in-progress" | "completed",
    scheduledAt: "",
  });

  const latestRoundByAdmission = useMemo(() => {
    const map = new Map<string, (typeof nursingRounds)[number]>();
    nursingRounds.forEach((round) => {
      if (!map.has(round.admissionId)) {
        map.set(round.admissionId, round);
      }
    });
    return map;
  }, [nursingRounds]);

  // ── OPD-eligible patients: registered patients without an active IPD admission ──
  const activeAdmissionUhids = useMemo(
    () =>
      new Set(
        admissions.filter((a) => a.status !== "discharged").map((a) => a.uhid),
      ),
    [admissions],
  );

  const inQueueUhids = useMemo(
    () =>
      new Set(
        queue
          .filter(
            (q) =>
              q.status === "waiting" ||
              q.status === "called" ||
              q.status === "in-consultation",
          )
          .map((q) => q.uhid),
      ),
    [queue],
  );

  const opdEligiblePatients = useMemo(() => {
    const q = opdSearch.toLowerCase().trim();
    return patients.filter((p) => {
      if (activeAdmissionUhids.has(p.uhid)) return false; // already admitted
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.uhid.toLowerCase().includes(q) ||
        p.phone?.includes(q) ||
        p.department?.toLowerCase().includes(q) ||
        p.assignedDoctor?.toLowerCase().includes(q)
      );
    });
  }, [patients, activeAdmissionUhids, opdSearch]);

  const rows = useMemo(() => {
    return admissions
      .map((admission) => {
        const latestRound = latestRoundByAdmission.get(admission.id);
        const condition =
          latestRound?.spo2 !== undefined && latestRound.spo2 < 94
            ? "critical"
            : admission.status === "icu"
              ? "critical"
              : admission.nursingPriority === "high"
                ? "observation"
                : admission.status === "discharge-ready"
                  ? "improving"
                  : "stable";

        const admissionType = admission.linkedEmergencyId
          ? "emergency"
          : admission.journeyType === "Surgery"
            ? "transfer"
            : "planned";

        return {
          admission,
          condition,
          admissionType,
          latestRound,
        };
      })
      .filter((row) => {
        const query = search.toLowerCase();
        const matchSearch =
          row.admission.patientName.toLowerCase().includes(query) ||
          row.admission.id.toLowerCase().includes(query) ||
          row.admission.bed.toLowerCase().includes(query) ||
          row.admission.uhid.toLowerCase().includes(query) ||
          row.admission.assignedNurse?.toLowerCase().includes(query) ||
          row.admission.attendingDoctor.toLowerCase().includes(query);
        const matchFilter =
          filter === "all" ||
          row.admission.status === filter ||
          row.condition === filter ||
          row.admissionType === filter;
        return matchSearch && matchFilter;
      });
  }, [admissions, latestRoundByAdmission, search, filter]);

  const activeCount = admissions.filter(
    (admission) =>
      admission.status === "admitted" ||
      admission.status === "icu" ||
      admission.status === "ot",
  ).length;
  const criticalCount = admissions.filter((admission) => {
    const latestRound = latestRoundByAdmission.get(admission.id);
    return (
      admission.status === "icu" ||
      (latestRound?.spo2 !== undefined && latestRound.spo2 < 94)
    );
  }).length;
  const dischargePending = admissions.filter(
    (admission) => admission.status === "discharge-ready",
  ).length;
  const emergencyAdmissions = admissions.filter(
    (admission) => admission.linkedEmergencyId,
  ).length;

  const selectedRow =
    rows.find((row) => row.admission.id === selectedAdmissionId) ?? null;

  useEffect(() => {
    if (!selectedRow) {
      return;
    }

    setTransferForm({
      toDepartment: selectedRow.admission.department || "General Medicine",
      reason: "",
      transferredBy: "Reception Desk",
      newAttendingDoctor: selectedRow.admission.attendingDoctor,
    });
    setShiftForm({
      ward: selectedRow.admission.ward,
      bed: selectedRow.admission.bed,
      assignedNurse: selectedRow.admission.assignedNurse || "",
      nextDoctorRoundAt: selectedRow.admission.nextDoctorRoundAt || "",
      reason: "",
      shiftedBy: "Reception Desk",
    });
    setChargeForm({
      description: "",
      amount: "",
      chargedBy: "Reception Desk",
    });
    setMedicineForm({
      inventoryId: pharmacyInventory[0]?.id || "",
      qty: "",
      issuedBy: selectedRow.admission.assignedNurse || "Ward Nurse",
    });
    setInvestigationForm({
      tests: "",
      category: "Biochemistry",
      priority: "Routine",
      doctor: selectedRow.admission.attendingDoctor,
    });
    setOtForm({
      procedureName: "",
      surgeon: selectedRow.admission.attendingDoctor,
      anesthetist: "",
      preOperativeNotes: "",
      postOperativeNotes: "",
      status: "scheduled",
      scheduledAt: "",
    });
    setConsultantDoctor("");
  }, [selectedRow, pharmacyInventory]);

  const handleConvertByUhid = () => {
    const uhid = selectedOpdPatient?.uhid || convertForm.uhid.trim();
    if (!uhid) {
      toast.error("Select or search a patient first.");
      return;
    }

    try {
      transferOpdToIPD({
        uhid,
        patientName: selectedOpdPatient?.name || uhid,
        attendingDoctor:
          convertForm.attendingDoctor ||
          selectedOpdPatient?.assignedDoctor ||
          "Doctor On Call",
        department: selectedOpdPatient?.department,
        reason: convertForm.reason || undefined,
        bedType: convertForm.bedType,
        priority: convertForm.priority,
        requestedBy: convertForm.requestedBy || "Reception Desk",
      });
      // reset after successful conversion (store shows its own toast)
      setSelectedOpdPatient(null);
      setOpdSearch("");
      setConvertForm((prev) => ({
        ...prev,
        uhid: "",
        reason: "",
        attendingDoctor: "",
      }));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to convert OPD to IPD.",
      );
    }
  };

  const handleAssignConsultant = () => {
    if (!selectedRow || !consultantDoctor.trim()) {
      toast.error("Enter consultant doctor name.");
      return;
    }

    try {
      assignConsultantDoctor(selectedRow.admission.id, consultantDoctor.trim());
      toast.success("Consultant assigned.");
      setConsultantDoctor("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to assign consultant.",
      );
    }
  };

  const handleDepartmentTransfer = () => {
    if (
      !selectedRow ||
      !transferForm.toDepartment.trim() ||
      !transferForm.reason.trim()
    ) {
      toast.error("Department and reason are required.");
      return;
    }

    try {
      transferAdmissionDepartment({
        admissionId: selectedRow.admission.id,
        toDepartment: transferForm.toDepartment,
        reason: transferForm.reason,
        transferredBy: transferForm.transferredBy || "Reception Desk",
        newAttendingDoctor: transferForm.newAttendingDoctor || undefined,
      });
      toast.success("Department transfer logged.");
      setTransferForm((prev) => ({ ...prev, reason: "" }));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Department transfer failed.",
      );
    }
  };

  const handleRoomShift = () => {
    if (
      !selectedRow ||
      !shiftForm.ward.trim() ||
      !shiftForm.bed.trim() ||
      !shiftForm.reason.trim()
    ) {
      toast.error("Ward, bed, and shift reason are required.");
      return;
    }

    try {
      assignAdmissionBed(
        selectedRow.admission.id,
        shiftForm.ward,
        shiftForm.bed,
        shiftForm.assignedNurse || undefined,
        shiftForm.nextDoctorRoundAt || undefined,
        shiftForm.reason,
        shiftForm.shiftedBy || "Reception Desk",
      );
      toast.success("Room shift recorded with reason.");
      setShiftForm((prev) => ({ ...prev, reason: "" }));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Room shift failed.",
      );
    }
  };

  const handleDailyCharge = () => {
    if (!selectedRow || !chargeForm.description.trim()) {
      toast.error("Charge description is required.");
      return;
    }

    const amount = Number(chargeForm.amount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid charge amount.");
      return;
    }

    try {
      addDailyServiceCharge({
        admissionId: selectedRow.admission.id,
        description: chargeForm.description,
        amount,
        chargedBy: chargeForm.chargedBy || "Reception Desk",
      });
      toast.success("Daily service charge posted.");
      setChargeForm((prev) => ({ ...prev, description: "", amount: "" }));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to post service charge.",
      );
    }
  };

  const handleIssueWardMedicine = () => {
    if (!selectedRow || !medicineForm.inventoryId) {
      toast.error("Select medicine inventory item.");
      return;
    }

    const qty = Number(medicineForm.qty);
    if (!qty || qty <= 0) {
      toast.error("Enter valid quantity.");
      return;
    }

    try {
      issueWardMedicine({
        admissionId: selectedRow.admission.id,
        inventoryId: medicineForm.inventoryId,
        qty,
        issuedBy: medicineForm.issuedBy || "Ward Nurse",
      });
      toast.success("Ward medicine issued.");
      setMedicineForm((prev) => ({ ...prev, qty: "" }));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Ward medicine issue failed.",
      );
    }
  };

  const handleAddInvestigation = () => {
    if (
      !selectedRow ||
      !investigationForm.tests.trim() ||
      !investigationForm.doctor.trim()
    ) {
      toast.error("Investigation tests and doctor are required.");
      return;
    }

    try {
      addInvestigationOrder({
        admissionId: selectedRow.admission.id,
        tests: investigationForm.tests,
        category: investigationForm.category,
        priority: investigationForm.priority,
        doctor: investigationForm.doctor,
      });
      toast.success("Investigation order sent to lab.");
      setInvestigationForm((prev) => ({ ...prev, tests: "" }));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add investigation.",
      );
    }
  };

  const handleUpsertOt = () => {
    if (
      !selectedRow ||
      !otForm.procedureName.trim() ||
      !otForm.surgeon.trim()
    ) {
      toast.error("Procedure and surgeon are required.");
      return;
    }

    try {
      upsertOTRecord({
        admissionId: selectedRow.admission.id,
        procedureName: otForm.procedureName,
        surgeon: otForm.surgeon,
        anesthetist: otForm.anesthetist || undefined,
        preOperativeNotes: otForm.preOperativeNotes || undefined,
        postOperativeNotes: otForm.postOperativeNotes || undefined,
        status: otForm.status,
        scheduledAt: otForm.scheduledAt || undefined,
      });
      toast.success("OT record saved.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update OT record.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">IPD Admissions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live inpatient admissions, ward allocation, and doctor round
            planning
          </p>
        </div>
        <Button className="gap-2">
          <UserPlus className="w-4 h-4" /> New Admission
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-xl font-bold">{activeCount}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="text-xl font-bold">{criticalCount}</p>
            <p className="text-xs text-muted-foreground">Critical</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="text-xl font-bold">{dischargePending}</p>
            <p className="text-xs text-muted-foreground">Discharge Pending</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-info" />
          </div>
          <div>
            <p className="text-xl font-bold">{emergencyAdmissions}</p>
            <p className="text-xs text-muted-foreground">Emergency Handoffs</p>
          </div>
        </div>
      </div>

      {/* ── OPD → IPD Conversion ── */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">OPD → IPD Conversion</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select an OPD patient directly and admit them to inpatient care
              </p>
            </div>
            <Badge variant="secondary" className="ml-auto text-xs">
              {opdEligiblePatients.length} eligible
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x">
            {/* ── LEFT: Patient picker ── */}
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9 text-sm"
                  placeholder="Search by name, UHID, phone, doctor…"
                  value={opdSearch}
                  onChange={(e) => setOpdSearch(e.target.value)}
                />
              </div>

              <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                {opdEligiblePatients.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    {opdSearch
                      ? "No patients match your search."
                      : "All patients already have an active admission."}
                  </div>
                ) : (
                  opdEligiblePatients.map((p) => {
                    const isSelected = selectedOpdPatient?.uhid === p.uhid;
                    const isInQueue = inQueueUhids.has(p.uhid);
                    return (
                      <motion.button
                        key={p.uhid}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => {
                          setSelectedOpdPatient({
                            uhid: p.uhid,
                            name: p.name,
                            phone: p.phone,
                            department: p.department,
                            assignedDoctor: p.assignedDoctor,
                            category: p.category,
                            bloodGroup: p.bloodGroup,
                          });
                          setConvertForm((prev) => ({
                            ...prev,
                            uhid: p.uhid,
                            attendingDoctor:
                              p.assignedDoctor || prev.attendingDoctor,
                          }));
                        }}
                        className={`w-full text-left rounded-lg border p-3 transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-card hover:border-primary/40 hover:bg-accent/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {p.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">
                                {p.name}
                              </span>
                              {isInQueue && (
                                <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">
                                  In Queue
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                              <span className="font-mono">{p.uhid}</span>
                              {p.department && (
                                <>
                                  <span>·</span>
                                  <span>{p.department}</span>
                                </>
                              )}
                              {p.assignedDoctor && (
                                <>
                                  <span>·</span>
                                  <span className="truncate">
                                    {p.assignedDoctor}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-1">
                            <Badge
                              variant="outline"
                              className={`text-[10px] capitalize ${
                                p.category === "vip"
                                  ? "border-amber-400 text-amber-600"
                                  : p.category === "insurance"
                                    ? "border-blue-400 text-blue-600"
                                    : p.category === "corporate"
                                      ? "border-purple-400 text-purple-600"
                                      : ""
                              }`}
                            >
                              {p.category}
                            </Badge>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-primary" />
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>
            </div>

            {/* ── RIGHT: Conversion form ── */}
            <div className="p-4 space-y-4">
              {/* Selected patient preview */}
              <AnimatePresence mode="wait">
                {selectedOpdPatient ? (
                  <motion.div
                    key="selected"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">
                          {selectedOpdPatient.name}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {selectedOpdPatient.uhid}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedOpdPatient(null);
                          setConvertForm((prev) => ({
                            ...prev,
                            uhid: "",
                            attendingDoctor: "",
                          }));
                        }}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      {selectedOpdPatient.phone && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          <span>{selectedOpdPatient.phone}</span>
                        </div>
                      )}
                      {selectedOpdPatient.department && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Stethoscope className="w-3 h-3" />
                          <span>{selectedOpdPatient.department}</span>
                        </div>
                      )}
                      {selectedOpdPatient.bloodGroup && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <span className="font-medium text-red-500">
                            Blood:
                          </span>
                          <span>{selectedOpdPatient.bloodGroup}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 p-4 text-center text-sm text-muted-foreground"
                  >
                    <User className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                    Select a patient from the left panel
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <Label className="text-xs">Attending Doctor</Label>
                  <Input
                    className="mt-1 text-sm"
                    value={convertForm.attendingDoctor}
                    onChange={(e) =>
                      setConvertForm((prev) => ({
                        ...prev,
                        attendingDoctor: e.target.value,
                      }))
                    }
                    placeholder={
                      selectedOpdPatient?.assignedDoctor || "Dr. A. Shah"
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Bed Type</Label>
                  <AppSelect
                    value={convertForm.bedType}
                    onValueChange={(v) =>
                      setConvertForm((prev) => ({
                        ...prev,
                        bedType: v as typeof convertForm.bedType,
                      }))
                    }
                    options={[
                      { value: "General", label: "General" },
                      { value: "Semi-Private", label: "Semi-Private" },
                      { value: "Private", label: "Private" },
                      { value: "ICU", label: "ICU" },
                    ]}
                    className="mt-1 w-full h-9 px-3 text-sm"
                  />
                  {convertForm.bedType &&
                    BED_COST_ESTIMATES[convertForm.bedType] !== undefined && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Estimated: Rs{" "}
                        {BED_COST_ESTIMATES[convertForm.bedType].toLocaleString(
                          "en-IN",
                        )}{" "}
                        / day
                      </p>
                    )}
                </div>
                <div>
                  <Label className="text-xs">Priority</Label>
                  <AppSelect
                    value={convertForm.priority}
                    onValueChange={(v) =>
                      setConvertForm((prev) => ({
                        ...prev,
                        priority: v as typeof convertForm.priority,
                      }))
                    }
                    options={[
                      { value: "Routine", label: "🟢 Routine" },
                      { value: "Urgent", label: "🟡 Urgent" },
                      { value: "Emergency", label: "🔴 Emergency" },
                    ]}
                    className="mt-1 w-full h-9 px-3 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">Transfer Reason / Diagnosis</Label>
                  <Input
                    className="mt-1 text-sm"
                    value={convertForm.reason}
                    onChange={(e) =>
                      setConvertForm((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                    placeholder="e.g. Observation and inpatient monitoring required"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">Requested By</Label>
                  <Input
                    className="mt-1 text-sm"
                    value={convertForm.requestedBy}
                    onChange={(e) =>
                      setConvertForm((prev) => ({
                        ...prev,
                        requestedBy: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <Button
                onClick={handleConvertByUhid}
                disabled={!selectedOpdPatient && !convertForm.uhid.trim()}
                className="w-full gap-2 mt-1"
                size="lg"
              >
                <ArrowRight className="w-4 h-4" />
                Convert to IPD
                {selectedOpdPatient && (
                  <span className="opacity-70 font-normal text-sm">
                    — {selectedOpdPatient.name}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-10"
            placeholder="Search by name, UHID, admission ID, or bed..."
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {[
            ["all", "All"],
            ["admitted", "Admitted"],
            ["icu", "ICU"],
            ["ot", "OT"],
            ["discharge-ready", "Discharge Ready"],
            ["critical", "Critical"],
            ["emergency", "Emergency"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${filter === value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                Patient
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">
                Bed / Ward
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">
                Doctor
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">
                Nurse
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                Condition
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  No admissions match the current filter.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <motion.tr
                  key={row.admission.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedAdmissionId(row.admission.id)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${row.condition === "critical" ? "bg-destructive/20 text-destructive" : "bg-muted"}`}
                      >
                        {row.admission.patientName
                          .split(" ")
                          .map((part) => part[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {row.admission.patientName}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <p className="text-xs text-muted-foreground">
                            {row.admission.id} · {row.admission.uhid} ·{" "}
                            {journeyLabels[row.admission.journeyType] ??
                              row.admission.journeyType}
                          </p>
                          {(() => {
                            const pt = patients.find(
                              (p) => p.uhid === row.admission.uhid,
                            );
                            const auth = pt ? preAuthStatus(pt.category) : null;
                            if (!auth) return null;
                            return (
                              <Badge
                                variant={
                                  auth === "approved" ? "secondary" : "outline"
                                }
                                className="text-[10px] px-1.5 py-0"
                              >
                                {auth === "pending"
                                  ? "Pre-auth pending"
                                  : "Pre-auth approved"}
                              </Badge>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex items-center gap-1.5">
                      <BedDouble className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm">{row.admission.bed}</span>
                      <span className="text-xs text-muted-foreground">
                        · {row.admission.ward}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                    {row.admission.roundingDoctor ||
                      row.admission.attendingDoctor}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                    {row.admission.assignedNurse || "Nurse Priya"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${conditionStyles[row.condition]}`}
                    >
                      {row.condition}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${statusStyles[row.admission.status]}`}
                    >
                      {row.admission.status}
                    </span>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedRow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setSelectedAdmissionId(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-card border rounded-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">
                    {selectedRow.admission.patientName}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedRow.admission.id} · {selectedRow.admission.uhid}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAdmissionId(null)}
                  className="p-1 rounded hover:bg-accent"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  {journeyLabels[selectedRow.admission.journeyType] ??
                    selectedRow.admission.journeyType}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {selectedRow.admission.ward} · {selectedRow.admission.bed}
                </Badge>
                <Badge
                  variant={
                    selectedRow.condition === "critical"
                      ? "destructive"
                      : "secondary"
                  }
                  className="text-xs"
                >
                  {selectedRow.condition}
                </Badge>
                <Badge
                  variant={
                    selectedRow.admission.status === "discharged"
                      ? "outline"
                      : "default"
                  }
                  className="text-xs"
                >
                  {selectedRow.admission.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Doctor:</span>{" "}
                  {selectedRow.admission.roundingDoctor ||
                    selectedRow.admission.attendingDoctor}
                </div>
                <div>
                  <span className="text-muted-foreground">Nurse:</span>{" "}
                  {selectedRow.admission.assignedNurse || "Nurse Priya"}
                </div>
                <div>
                  <span className="text-muted-foreground">Diagnosis:</span>{" "}
                  {selectedRow.admission.primaryDiagnosis}
                </div>
                <div>
                  <span className="text-muted-foreground">Admitted:</span>{" "}
                  {selectedRow.admission.admittedAt}
                </div>
                <div>
                  <span className="text-muted-foreground">Next Round:</span>{" "}
                  {selectedRow.admission.nextDoctorRoundAt || "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Source:</span>{" "}
                  {selectedRow.admission.admissionSource}
                </div>
                {selectedRow.latestRound && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">
                      Latest vitals:
                    </span>{" "}
                    BP {selectedRow.latestRound.bp} · Pulse{" "}
                    {selectedRow.latestRound.pulse} · Temp{" "}
                    {selectedRow.latestRound.temp}°F · SpO2{" "}
                    {selectedRow.latestRound.spo2}%
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 border-t pt-3">
                <div className="space-y-2 rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground font-semibold uppercase">
                    Consultants
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(selectedRow.admission.consultantDoctors || []).map(
                      (doctor) => (
                        <Badge
                          key={doctor}
                          variant="secondary"
                          className="text-xs"
                        >
                          {doctor}
                        </Badge>
                      ),
                    )}
                    {(selectedRow.admission.consultantDoctors || []).length ===
                      0 && (
                      <span className="text-xs text-muted-foreground">
                        No consultants assigned yet.
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={consultantDoctor}
                      onChange={(event) =>
                        setConsultantDoctor(event.target.value)
                      }
                      placeholder="Add consultant doctor"
                    />
                    <Button onClick={handleAssignConsultant}>Assign</Button>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground font-semibold uppercase">
                    Department Transfer
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <AppSelect
                      value={transferForm.toDepartment || undefined}
                      onValueChange={(value) =>
                        setTransferForm((prev) => ({
                          ...prev,
                          toDepartment: value,
                        }))
                      }
                      placeholder="Select department"
                      options={departmentOptions.map((department) => ({
                        value: department,
                        label: department,
                      }))}
                      className="w-full h-10 px-3 text-sm"
                    />
                    <Input
                      value={transferForm.newAttendingDoctor}
                      onChange={(event) =>
                        setTransferForm((prev) => ({
                          ...prev,
                          newAttendingDoctor: event.target.value,
                        }))
                      }
                      placeholder="New attending doctor"
                    />
                    <Input
                      value={transferForm.transferredBy}
                      onChange={(event) =>
                        setTransferForm((prev) => ({
                          ...prev,
                          transferredBy: event.target.value,
                        }))
                      }
                      placeholder="Transferred by"
                    />
                    <Input
                      value={transferForm.reason}
                      onChange={(event) =>
                        setTransferForm((prev) => ({
                          ...prev,
                          reason: event.target.value,
                        }))
                      }
                      placeholder="Transfer reason"
                    />
                  </div>
                  <Button variant="outline" onClick={handleDepartmentTransfer}>
                    Transfer Department
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 border-t pt-3">
                <div className="space-y-2 rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground font-semibold uppercase">
                    Room Shift with Reason
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={shiftForm.ward}
                      onChange={(event) =>
                        setShiftForm((prev) => ({
                          ...prev,
                          ward: event.target.value,
                        }))
                      }
                      placeholder="Ward"
                    />
                    <Input
                      value={shiftForm.bed}
                      onChange={(event) =>
                        setShiftForm((prev) => ({
                          ...prev,
                          bed: event.target.value,
                        }))
                      }
                      placeholder="Bed"
                    />
                    <Input
                      value={shiftForm.assignedNurse}
                      onChange={(event) =>
                        setShiftForm((prev) => ({
                          ...prev,
                          assignedNurse: event.target.value,
                        }))
                      }
                      placeholder="Assigned nurse"
                    />
                    <Input
                      value={shiftForm.nextDoctorRoundAt}
                      onChange={(event) =>
                        setShiftForm((prev) => ({
                          ...prev,
                          nextDoctorRoundAt: event.target.value,
                        }))
                      }
                      placeholder="Next doctor round"
                    />
                    <Input
                      value={shiftForm.shiftedBy}
                      onChange={(event) =>
                        setShiftForm((prev) => ({
                          ...prev,
                          shiftedBy: event.target.value,
                        }))
                      }
                      placeholder="Shifted by"
                    />
                    <Input
                      value={shiftForm.reason}
                      onChange={(event) =>
                        setShiftForm((prev) => ({
                          ...prev,
                          reason: event.target.value,
                        }))
                      }
                      placeholder="Shift reason"
                    />
                  </div>
                  <Button variant="outline" onClick={handleRoomShift}>
                    Apply Room Shift
                  </Button>
                </div>

                <div className="space-y-2 rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground font-semibold uppercase">
                    Daily Service Charge
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={chargeForm.description}
                      onChange={(event) =>
                        setChargeForm((prev) => ({
                          ...prev,
                          description: event.target.value,
                        }))
                      }
                      placeholder="Charge description"
                    />
                    <Input
                      type="number"
                      value={chargeForm.amount}
                      onChange={(event) =>
                        setChargeForm((prev) => ({
                          ...prev,
                          amount: event.target.value,
                        }))
                      }
                      placeholder="Amount"
                    />
                    <Input
                      value={chargeForm.chargedBy}
                      onChange={(event) =>
                        setChargeForm((prev) => ({
                          ...prev,
                          chargedBy: event.target.value,
                        }))
                      }
                      placeholder="Charged by"
                    />
                  </div>
                  <Button variant="outline" onClick={handleDailyCharge}>
                    Post Daily Charge
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 border-t pt-3">
                <div className="space-y-2 rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground font-semibold uppercase">
                    Ward Medicine Issue
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <AppSelect
                      value={medicineForm.inventoryId || undefined}
                      onValueChange={(value) =>
                        setMedicineForm((prev) => ({
                          ...prev,
                          inventoryId: value,
                        }))
                      }
                      placeholder="Select medicine inventory"
                      options={pharmacyInventory
                        .filter((item) => item.qty > 0)
                        .map((item) => ({
                          value: item.id,
                          label: `${item.drug} · Batch ${item.batch} · Exp ${item.expiry} · Stock ${item.qty}`,
                        }))}
                      className="w-full h-10 px-3 text-sm col-span-2"
                    />
                    <Input
                      type="number"
                      value={medicineForm.qty}
                      onChange={(event) =>
                        setMedicineForm((prev) => ({
                          ...prev,
                          qty: event.target.value,
                        }))
                      }
                      placeholder="Issue qty"
                    />
                    <Input
                      value={medicineForm.issuedBy}
                      onChange={(event) =>
                        setMedicineForm((prev) => ({
                          ...prev,
                          issuedBy: event.target.value,
                        }))
                      }
                      placeholder="Issued by"
                    />
                  </div>
                  <Button variant="outline" onClick={handleIssueWardMedicine}>
                    Issue Ward Medicine
                  </Button>
                </div>

                <div className="space-y-2 rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground font-semibold uppercase">
                    Lab Investigations
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={investigationForm.tests}
                      onChange={(event) =>
                        setInvestigationForm((prev) => ({
                          ...prev,
                          tests: event.target.value,
                        }))
                      }
                      placeholder="Tests (CBC, LFT, etc.)"
                      className="col-span-2"
                    />
                    <Input
                      value={investigationForm.category}
                      onChange={(event) =>
                        setInvestigationForm((prev) => ({
                          ...prev,
                          category: event.target.value,
                        }))
                      }
                      placeholder="Category"
                    />
                    <AppSelect
                      value={investigationForm.priority}
                      onValueChange={(value) =>
                        setInvestigationForm((prev) => ({
                          ...prev,
                          priority: value as "Routine" | "Urgent" | "Emergency",
                        }))
                      }
                      options={[
                        { value: "Routine", label: "Routine" },
                        { value: "Urgent", label: "Urgent" },
                        { value: "Emergency", label: "Emergency" },
                      ]}
                      className="w-full h-10 px-3 text-sm"
                    />
                    <Input
                      value={investigationForm.doctor}
                      onChange={(event) =>
                        setInvestigationForm((prev) => ({
                          ...prev,
                          doctor: event.target.value,
                        }))
                      }
                      placeholder="Ordering doctor"
                    />
                  </div>
                  <Button variant="outline" onClick={handleAddInvestigation}>
                    Add Investigation Order
                  </Button>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border p-3 border-t pt-3">
                <p className="text-xs text-muted-foreground font-semibold uppercase">
                  OT Notes (Pre / Post)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    value={otForm.procedureName}
                    onChange={(event) =>
                      setOtForm((prev) => ({
                        ...prev,
                        procedureName: event.target.value,
                      }))
                    }
                    placeholder="Procedure"
                  />
                  <Input
                    value={otForm.surgeon}
                    onChange={(event) =>
                      setOtForm((prev) => ({
                        ...prev,
                        surgeon: event.target.value,
                      }))
                    }
                    placeholder="Surgeon"
                  />
                  <Input
                    value={otForm.anesthetist}
                    onChange={(event) =>
                      setOtForm((prev) => ({
                        ...prev,
                        anesthetist: event.target.value,
                      }))
                    }
                    placeholder="Anesthetist"
                  />
                  <AppSelect
                    value={otForm.status}
                    onValueChange={(value) =>
                      setOtForm((prev) => ({
                        ...prev,
                        status: value as
                          | "scheduled"
                          | "in-progress"
                          | "completed",
                      }))
                    }
                    options={[
                      { value: "scheduled", label: "Scheduled" },
                      { value: "in-progress", label: "In Progress" },
                      { value: "completed", label: "Completed" },
                    ]}
                    className="w-full h-10 px-3 text-sm"
                  />
                  <Input
                    value={otForm.scheduledAt}
                    onChange={(event) =>
                      setOtForm((prev) => ({
                        ...prev,
                        scheduledAt: event.target.value,
                      }))
                    }
                    placeholder="Schedule (e.g. 10 Mar 09:30 AM)"
                    className="md:col-span-2"
                  />
                  <textarea
                    value={otForm.preOperativeNotes}
                    onChange={(event) =>
                      setOtForm((prev) => ({
                        ...prev,
                        preOperativeNotes: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm md:col-span-3"
                    rows={2}
                    placeholder="Pre-operative notes"
                  />
                  <textarea
                    value={otForm.postOperativeNotes}
                    onChange={(event) =>
                      setOtForm((prev) => ({
                        ...prev,
                        postOperativeNotes: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm md:col-span-3"
                    rows={2}
                    placeholder="Post-operative notes"
                  />
                </div>
                <Button variant="outline" onClick={handleUpsertOt}>
                  Save OT Notes
                </Button>
              </div>

              {/* ── Attendant on duty ── */}
              <div className="space-y-3 rounded-lg border p-3 border-t pt-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground font-semibold uppercase">
                    Attendant on duty
                  </p>
                </div>
                {attendants[selectedRow.admission.id] ? (
                  <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm space-y-1">
                    <p className="font-medium">
                      {attendants[selectedRow.admission.id].name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {attendants[selectedRow.admission.id].relation} &middot;{" "}
                      {attendants[selectedRow.admission.id].phone}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No attendant registered yet.
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input
                    value={attendantForm.name}
                    onChange={(e) =>
                      setAttendantForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Attendant name"
                  />
                  <AppSelect
                    value={attendantForm.relation}
                    onValueChange={(v) =>
                      setAttendantForm((prev) => ({ ...prev, relation: v }))
                    }
                    placeholder="Relation"
                    options={[
                      { value: "Spouse", label: "Spouse" },
                      { value: "Parent", label: "Parent" },
                      { value: "Sibling", label: "Sibling" },
                      { value: "Child", label: "Child" },
                      { value: "Friend", label: "Friend" },
                      { value: "Other", label: "Other" },
                    ]}
                    className="w-full h-10 px-3 text-sm"
                  />
                  <Input
                    value={attendantForm.phone}
                    onChange={(e) =>
                      setAttendantForm((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="Phone number"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!attendantForm.name.trim() || !attendantForm.relation) {
                      toast.error("Attendant name and relation are required.");
                      return;
                    }
                    setAttendants((prev) => ({
                      ...prev,
                      [selectedRow.admission.id]: {
                        name: attendantForm.name.trim(),
                        relation: attendantForm.relation,
                        phone: attendantForm.phone.trim(),
                      },
                    }));
                    setAttendantForm({ name: "", relation: "", phone: "" });
                    toast.success("Attendant registered");
                  }}
                >
                  Register Attendant
                </Button>
              </div>

              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground font-semibold uppercase mb-2">
                  Care Handoff
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Ward</p>
                    <p className="font-medium">{selectedRow.admission.ward}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Bed</p>
                    <p className="font-medium">{selectedRow.admission.bed}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      Assigned Nurse
                    </p>
                    <p className="font-medium">
                      {selectedRow.admission.assignedNurse || "Nurse Priya"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      Round Doctor
                    </p>
                    <p className="font-medium">
                      {selectedRow.admission.roundingDoctor ||
                        selectedRow.admission.attendingDoctor}
                    </p>
                  </div>
                </div>
              </div>

              {canUseDischargeRuntime() &&
                selectedRow.admission.platformAdmissionId && (
                  <OperationalDischargePanel
                    admissionId={selectedRow.admission.platformAdmissionId}
                    patientName={selectedRow.admission.patientName}
                    insuranceClearanceContext={
                      selectedRow.admission.status === "discharge-ready"
                        ? {
                            insuranceSettledOrSelfPay: true,
                            noDischargeBlockers: true,
                          }
                        : undefined
                    }
                    completeDischargeContext={
                      selectedRow.admission.status === "discharge-ready"
                        ? { finalBillSettled: true, bedReleaseScheduled: true }
                        : undefined
                    }
                  />
                )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 gap-1">
                  <FileText className="w-4 h-4" /> View Records
                </Button>
                {selectedRow.admission.status === "admitted" && (
                  <Button
                    variant="outline"
                    className="flex-1 gap-1 border-warning/30 text-warning hover:bg-warning/10"
                  >
                    <Clock className="w-4 h-4" /> Initiate Discharge
                  </Button>
                )}
                {(selectedRow.admission.status === "icu" ||
                  selectedRow.admission.linkedEmergencyId) && (
                  <Button className="flex-1 gap-1">
                    <Activity className="w-4 h-4" /> ICU Handoff
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
