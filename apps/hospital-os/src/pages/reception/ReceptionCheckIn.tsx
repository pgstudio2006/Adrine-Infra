import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Hash,
  Phone,
  Search,
  UserCheck,
} from "lucide-react";
import { useHospital } from "@/stores/hospitalStore";
import { AppSelect } from "@/components/ui/app-select";
import { useOperationalEventStream } from "@/runtime/realtime-runtime";
import { getPlatformSession, isPlatformRuntimeEnabled } from "@/runtime/platform-session";
import { InlinePlatformError } from "@/components/opd/InlinePlatformError";
import { useClinicalPlatformListSync } from "@/hooks/useClinicalPlatformListSync";
import { Button } from "@/components/ui/button";
import { PlatformConnectivityStrip } from "@/components/PlatformConnectivityStrip";
import { isPlatformAuthoritative } from "@/runtime/platform-store-bridge";
import { isNavayuTenant, NAVAYU_CLINICAL_DEPARTMENTS } from "@/lib/navayu/navayu-forms";
import {
  getClinicalDepartments,
  getClinicalDoctorsForDepartment,
  getDefaultAssignedDoctor,
} from "@/lib/opd/branch-clinical-roster";
import { queueEntryKey } from "@/lib/opd/queue-presenters";

const DEPARTMENTS = isNavayuTenant()
  ? [...NAVAYU_CLINICAL_DEPARTMENTS]
  : getClinicalDepartments();

function toYmd(date: Date) {
  return date.toISOString().split("T")[0];
}

export default function ReceptionCheckIn() {
  const {
    appointments,
    queue,
    checkInPatient,
    updateQueueStatus,
    updateAppointmentStatus,
    startFrontDeskVisit,
    refreshAppointmentsFromPlatform,
    refreshQueueFromPlatform,
  } = useHospital();

  const branchId = getPlatformSession()?.branchId;
  const syncPlatformLists = async () => {
    try {
      await Promise.all([refreshAppointmentsFromPlatform(), refreshQueueFromPlatform()]);
      setPlatformError(null);
    } catch (e) {
      setPlatformError(e instanceof Error ? e.message : "Check-in sync failed");
    }
  };

  useOperationalEventStream(branchId, {
    onSnapshot: () => {
      void syncPlatformLists();
    },
    onDelta: () => {
      void syncPlatformLists();
    },
  });

  useEffect(() => {
    if (isPlatformRuntimeEnabled()) {
      void syncPlatformLists();
    }
  }, [refreshAppointmentsFromPlatform, refreshQueueFromPlatform]);

  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(toYmd(new Date()));
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [walkInResult, setWalkInResult] = useState<null | { name: string; tokenNo: number | null; uhid: string }>(null);
  const [walkInForm, setWalkInForm] = useState({
    name: "",
    age: "",
    gender: "M",
    phone: "",
    department: DEPARTMENTS[0] ?? "General Medicine",
    doctor: getDefaultAssignedDoctor(DEPARTMENTS[0] ?? "General Medicine"),
    notes: "",
  });
  const [platformError, setPlatformError] = useState<string | null>(null);
  useClinicalPlatformListSync({
    queue: true,
    appointments: true,
    departmentWorklists: false,
    ipd: false,
  });

  const queueByAppointment = useMemo(() => {
    const map = new Map<string, (typeof queue)[number]>();
    queue.forEach((entry) => {
      if (entry.appointmentId) {
        map.set(entry.appointmentId, entry);
      }
    });
    return map;
  }, [queue]);

  const rows = useMemo(() => {
    const query = search.toLowerCase();

    return appointments
      .filter((appointment) => appointment.date === selectedDate)
      .filter((appointment) => {
        const queueEntry = queueByAppointment.get(appointment.id);
        const token = queueEntry?.tokenNo ? String(queueEntry.tokenNo) : "";
        return (
          appointment.patientName.toLowerCase().includes(query)
          || appointment.id.toLowerCase().includes(query)
          || appointment.uhid.toLowerCase().includes(query)
          || appointment.phone.includes(search)
          || appointment.doctor.toLowerCase().includes(query)
          || token.includes(search)
        );
      })
      .map((appointment) => {
        const queueEntry = queueByAppointment.get(appointment.id);
        return {
          appointment,
          queueEntry,
          tokenNo: queueEntry?.tokenNo ?? null,
          stage: queueEntry?.status || appointment.status,
        };
      })
      .sort((left, right) => left.appointment.time.localeCompare(right.appointment.time));
  }, [appointments, queueByAppointment, search, selectedDate]);

  const stats = {
    scheduled: rows.filter((row) => row.appointment.status === "scheduled" || row.appointment.status === "confirmed").length,
    checkedIn: rows.filter((row) => row.stage === "waiting" || row.stage === "called" || row.stage === "checked-in").length,
    withDoctor: rows.filter((row) => row.stage === "in-consultation").length,
    completed: rows.filter((row) => row.stage === "completed" || row.appointment.status === "completed").length,
  };

  const handleWalkInToken = () => {
    if (!walkInForm.name.trim() || !walkInForm.phone.trim()) {
      return;
    }

    const result = startFrontDeskVisit({
      patient: {
        name: walkInForm.name.trim(),
        age: Number(walkInForm.age) || 30,
        gender: walkInForm.gender,
        phone: walkInForm.phone,
        category: "general",
        patientType: "OPD",
        department: walkInForm.department,
        assignedDoctor: walkInForm.doctor,
        branch: "Main Hospital",
      },
      appointmentDate: selectedDate,
      appointmentTime: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
      appointmentType: "new",
      notes: walkInForm.notes || "Walk-in token generated at reception",
      initialBillingItems: [{ description: "OPD walk-in registration", amount: 250 }],
    });

    setWalkInResult({
      name: walkInForm.name,
      tokenNo: result.tokenNo,
      uhid: result.uhid,
    });

    setWalkInForm({
      name: "",
      age: "",
      gender: "M",
      phone: "",
      department: DEPARTMENTS[0] ?? "General Medicine",
      doctor: getDefaultAssignedDoctor(DEPARTMENTS[0] ?? "General Medicine"),
      notes: "",
    });
  };

  const handleCheckInAppointment = (appointmentId: string, notes?: string) => {
    checkInPatient(appointmentId, notes);
  };

  return (
    <div className="space-y-6">
      {isPlatformAuthoritative() ? (
        <PlatformConnectivityStrip detail="Appointments and queue board hydrate on check-in and SSE deltas." />
      ) : null}

      <InlinePlatformError message={platformError} onDismiss={() => setPlatformError(null)} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Patient Check-In</h1>
          <p className="text-sm text-muted-foreground mt-1">Check in scheduled visits or issue a walk-in token — one primary action per row</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="px-3 py-2 rounded-lg border bg-card text-sm"
          />
          <Button
            type="button"
            variant={showWalkIn ? "secondary" : "default"}
            onClick={() => setShowWalkIn((prev) => !prev)}
          >
            Walk-in token
          </Button>
        </div>
      </div>

      {showWalkIn && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <p className="text-sm font-semibold">Quick Walk-in Registration</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              value={walkInForm.name}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, name: event.target.value }))}
              className="px-3 py-2 rounded-lg border bg-background text-sm"
              placeholder="Patient name"
            />
            <input
              type="number"
              value={walkInForm.age}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, age: event.target.value }))}
              className="px-3 py-2 rounded-lg border bg-background text-sm"
              placeholder="Age"
            />
            <input
              value={walkInForm.phone}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, phone: event.target.value }))}
              className="px-3 py-2 rounded-lg border bg-background text-sm"
              placeholder="Phone"
            />
            <AppSelect
              value={walkInForm.gender}
              onValueChange={(value) => setWalkInForm((prev) => ({ ...prev, gender: value }))}
              options={[
                { value: "M", label: "Male" },
                { value: "F", label: "Female" },
                { value: "O", label: "Other" },
              ]}
              className="px-3 py-2 rounded-lg border bg-background text-sm"
            />
            <AppSelect
              value={walkInForm.department}
              onValueChange={(value) => setWalkInForm((prev) => ({ ...prev, department: value, doctor: getDefaultAssignedDoctor(value) }))}
              options={DEPARTMENTS.map((department) => ({ value: department, label: department }))}
              className="px-3 py-2 rounded-lg border bg-background text-sm"
            />
            <AppSelect
              value={walkInForm.doctor}
              onValueChange={(value) => setWalkInForm((prev) => ({ ...prev, doctor: value }))}
              options={getClinicalDoctorsForDepartment(walkInForm.department).map((doctor) => ({ value: doctor, label: doctor }))}
              className="px-3 py-2 rounded-lg border bg-background text-sm"
            />
            <input
              value={walkInForm.notes}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, notes: event.target.value }))}
              className="px-3 py-2 rounded-lg border bg-background text-sm lg:col-span-2"
              placeholder="Complaint / notes"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowWalkIn(false)}>
              Close
            </Button>
            <Button type="button" onClick={handleWalkInToken}>
              Generate walk-in token
            </Button>
          </div>

          {walkInResult && (
            <div className="rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-sm">
              Token generated for <strong>{walkInResult.name}</strong> · UHID {walkInResult.uhid}
              {walkInResult.tokenNo ? ` · Token #${walkInResult.tokenNo}` : ""}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-xl font-bold">{stats.scheduled}</p>
          <p className="text-xs text-muted-foreground">Scheduled</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-xl font-bold">{stats.checkedIn}</p>
          <p className="text-xs text-muted-foreground">Checked In</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-xl font-bold">{stats.withDoctor}</p>
          <p className="text-xs text-muted-foreground">With Doctor</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-xl font-bold">{stats.completed}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl border bg-card text-sm"
          placeholder="Search by patient, UHID, doctor, phone, or token"
        />
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.appointment.id} className="rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{row.appointment.patientName}</p>
                  {row.tokenNo && <span className="text-xs px-1.5 py-0.5 rounded bg-muted font-mono">#{row.tokenNo}</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {row.appointment.id} · {row.appointment.uhid} · {row.appointment.phone}
                </p>
                <p className="text-xs text-muted-foreground">
                  {row.appointment.time} · {row.appointment.department} · {row.appointment.doctor}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{row.stage}</span>

                {!row.queueEntry && (row.appointment.status === "scheduled" || row.appointment.status === "confirmed") ? (
                  <Button
                    size="sm"
                    onClick={() => handleCheckInAppointment(row.appointment.id, row.appointment.notes)}
                    className="gap-1"
                  >
                    <Hash className="w-3 h-3" /> Check in & issue token
                  </Button>
                ) : null}

                {row.queueEntry?.status === "waiting" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateQueueStatus(queueEntryKey(row.queueEntry!), "called")}
                    className="gap-1"
                  >
                    <Phone className="w-3 h-3" /> Call
                  </Button>
                ) : null}

                {row.queueEntry?.status === "called" ? (
                  <Button
                    size="sm"
                    onClick={() => updateQueueStatus(queueEntryKey(row.queueEntry!), "in-consultation")}
                    className="gap-1"
                  >
                    <UserCheck className="w-3 h-3" /> Hand off to doctor
                  </Button>
                ) : null}

                {row.queueEntry?.status === "in-consultation" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      updateQueueStatus(queueEntryKey(row.queueEntry!), "completed");
                      updateAppointmentStatus(row.appointment.id, "completed");
                    }}
                    className="gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Complete visit
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
            No appointments available for selected date and search.
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card p-4 text-xs text-muted-foreground flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Check-in updates queue in real time. Walk-in token generation creates patient, appointment, queue token, and initial billing in one flow.
      </div>
    </div>
  );
}
