import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  UserCheck,
  X,
} from "lucide-react";
import { useHospital, type HospitalAppointment } from "@/stores/hospitalStore";
import { AppSelect } from "@/components/ui/app-select";
import { useOperationalEventStream } from "@/runtime/realtime-runtime";
import {
  getPlatformSession,
  isPlatformRuntimeEnabled,
} from "@/runtime/platform-session";
import { InlinePlatformError } from "@/components/shared/InlinePlatformError";
import { PlatformConnectivityStrip } from "@/components/PlatformConnectivityStrip";
import { isPlatformAuthoritative } from "@/runtime/platform-store-bridge";

const DEPARTMENTS = [
  "General Medicine",
  "Cardiology",
  "Orthopedics",
  "Gynecology",
  "Pediatrics",
  "Dermatology",
  "ENT",
  "Neurology",
];

const DOCTORS: Record<string, string[]> = {
  "General Medicine": ["Dr. A. Shah", "Dr. V. Reddy"],
  Cardiology: ["Dr. R. Mehta"],
  Orthopedics: ["Dr. K. Rao"],
  Gynecology: ["Dr. S. Iyer"],
  Pediatrics: ["Dr. P. Nair"],
  Dermatology: ["Dr. D. Kapoor"],
  ENT: ["Dr. L. Mohan"],
  Neurology: ["Dr. N. Joshi"],
};

const STATUS_STYLES: Record<HospitalAppointment["status"], string> = {
  scheduled: "bg-info/10 text-info",
  confirmed: "bg-success/10 text-success",
  "checked-in": "bg-primary/10 text-primary",
  "in-consultation": "bg-warning/10 text-warning",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
  "no-show": "bg-warning/10 text-warning",
};

const statusOptions: Array<"all" | HospitalAppointment["status"]> = [
  "all",
  "scheduled",
  "confirmed",
  "checked-in",
  "completed",
  "cancelled",
  "no-show",
];

function toYmd(date: Date) {
  return date.toISOString().split("T")[0];
}

function formatDateLabel(dateYmd: string) {
  const parsed = new Date(`${dateYmd}T00:00:00`);
  return parsed.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function buildTimeSlots() {
  const slots: string[] = [];
  for (let hour = 7; hour <= 20; hour++) {
    for (const minute of ["00", "15", "30", "45"]) {
      slots.push(`${String(hour).padStart(2, "0")}:${minute}`);
    }
  }
  return slots;
}

const TIME_SLOTS = buildTimeSlots();

function compareByDateTime(
  left: HospitalAppointment,
  right: HospitalAppointment,
) {
  const leftKey = `${left.date} ${left.time}`;
  const rightKey = `${right.date} ${right.time}`;
  if (leftKey < rightKey) return -1;
  if (leftKey > rightKey) return 1;
  return 0;
}

export default function ReceptionAppointments() {
  const {
    appointments,
    patients,
    bookAppointment,
    checkInPatient,
    updateAppointmentStatus,
    refreshAppointmentsFromPlatform,
    refreshQueueFromPlatform,
  } = useHospital();
  const [view, setView] = useState<"day" | "week" | "list">("day");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | HospitalAppointment["status"]
  >("all");
  const [selectedDate, setSelectedDate] = useState<string>(toYmd(new Date()));
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);
  const [showBooking, setShowBooking] = useState(false);
  const [platformError, setPlatformError] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState({
    patientUhid: "",
    patientName: "",
    phone: "",
    department: "",
    doctor: "",
    date: toYmd(new Date()),
    time: "09:00",
    duration: "30",
    type: "new" as HospitalAppointment["type"],
    notes: "",
    checkInNow: false,
  });

  const syncPlatformAppointments = useCallback(async () => {
    try {
      await Promise.all([
        refreshAppointmentsFromPlatform(),
        refreshQueueFromPlatform(),
      ]);
      setPlatformError(null);
    } catch (error) {
      setPlatformError(
        error instanceof Error ? error.message : "Appointment sync failed",
      );
    }
  }, [refreshAppointmentsFromPlatform, refreshQueueFromPlatform]);

  const branchId = getPlatformSession()?.branchId;
  useOperationalEventStream(branchId, {
    onSnapshot: () => {
      void syncPlatformAppointments();
    },
    onDelta: () => {
      void syncPlatformAppointments();
    },
  });

  useEffect(() => {
    if (isPlatformRuntimeEnabled()) {
      void syncPlatformAppointments();
    }
  }, [syncPlatformAppointments]);

  const selectedAppointment =
    appointments.find(
      (appointment) => appointment.id === selectedAppointmentId,
    ) || null;

  const stats = useMemo(() => {
    const today = toYmd(new Date());
    const todaysAppointments = appointments.filter(
      (appointment) => appointment.date === today,
    );
    return {
      total: todaysAppointments.length,
      active: todaysAppointments.filter((appointment) =>
        ["scheduled", "confirmed", "checked-in", "in-consultation"].includes(
          appointment.status,
        ),
      ).length,
      checkedIn: todaysAppointments.filter(
        (appointment) =>
          appointment.status === "checked-in" ||
          appointment.status === "in-consultation",
      ).length,
      completed: todaysAppointments.filter(
        (appointment) => appointment.status === "completed",
      ).length,
    };
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    const query = search.toLowerCase();
    return appointments
      .filter((appointment) => {
        const matchesSearch =
          appointment.patientName.toLowerCase().includes(query) ||
          appointment.doctor.toLowerCase().includes(query) ||
          appointment.department.toLowerCase().includes(query) ||
          appointment.id.toLowerCase().includes(query) ||
          appointment.uhid.toLowerCase().includes(query);
        const matchesStatus =
          statusFilter === "all" || appointment.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort(compareByDateTime);
  }, [appointments, search, statusFilter]);

  const dayAppointments = useMemo(
    () =>
      filteredAppointments.filter(
        (appointment) => appointment.date === selectedDate,
      ),
    [filteredAppointments, selectedDate],
  );

  const weekDates = useMemo(() => {
    const selected = new Date(`${selectedDate}T00:00:00`);
    const start = new Date(selected);
    start.setDate(selected.getDate() - selected.getDay());
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return toYmd(date);
    });
  }, [selectedDate]);

  const slotConflict = useMemo(() => {
    if (!bookingForm.doctor || !bookingForm.date || !bookingForm.time) {
      return false;
    }

    return appointments.some(
      (appointment) =>
        appointment.doctor === bookingForm.doctor &&
        appointment.date === bookingForm.date &&
        appointment.time === bookingForm.time &&
        appointment.status !== "cancelled" &&
        appointment.status !== "no-show",
    );
  }, [appointments, bookingForm.date, bookingForm.doctor, bookingForm.time]);

  const handlePickPatient = (uhid: string) => {
    const patient = patients.find((item) => item.uhid === uhid);
    setBookingForm((prev) => ({
      ...prev,
      patientUhid: uhid,
      patientName: patient?.name || "",
      phone: patient?.phone || "",
      department: patient?.department || prev.department,
      doctor: patient?.assignedDoctor || prev.doctor,
    }));
  };

  const handleBookAppointment = () => {
    if (
      !bookingForm.patientUhid ||
      !bookingForm.patientName ||
      !bookingForm.phone ||
      !bookingForm.department ||
      !bookingForm.doctor ||
      slotConflict
    ) {
      return;
    }

    const appointmentId = bookAppointment({
      uhid: bookingForm.patientUhid,
      patientName: bookingForm.patientName,
      phone: bookingForm.phone,
      doctor: bookingForm.doctor,
      department: bookingForm.department,
      date: bookingForm.date,
      time: bookingForm.time,
      duration: Number(bookingForm.duration),
      status: "scheduled",
      type: bookingForm.type,
      notes: bookingForm.notes,
    });

    if (bookingForm.checkInNow) {
      checkInPatient(appointmentId, bookingForm.notes || "Walk-in check-in");
    }

    setShowBooking(false);
    setBookingForm({
      patientUhid: "",
      patientName: "",
      phone: "",
      department: "",
      doctor: "",
      date: selectedDate,
      time: "09:00",
      duration: "30",
      type: "new",
      notes: "",
      checkInNow: false,
    });
  };

  const handleCancelAppointment = (appointmentId: string) => {
    updateAppointmentStatus(appointmentId, "cancelled");
  };

  const handleCompleteAppointment = (appointmentId: string) => {
    updateAppointmentStatus(appointmentId, "completed");
  };

  const handleCheckInAppointment = (appointmentId: string, notes?: string) => {
    checkInPatient(appointmentId, notes);
  };

  return (
    <div className="space-y-6">
      {isPlatformAuthoritative() ? (
        <PlatformConnectivityStrip detail="Appointments hydrate from scheduling range and OPD queue linkage when platform runtime is on." />
      ) : null}

      <InlinePlatformError
        error={platformError}
        onRetry={syncPlatformAppointments}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live calendar linked with registration, check-in, queue, and doctor
            workflow
          </p>
        </div>
        <button
          onClick={() => setShowBooking(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Book Appointment
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Today Total</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-xl font-bold">{stats.active}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-xl font-bold">{stats.checkedIn}</p>
          <p className="text-xs text-muted-foreground">Checked In</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-xl font-bold">{stats.completed}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[280px] max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border bg-card text-sm"
            placeholder="Search patient, doctor, UHID, or appointment id..."
          />
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="px-3 py-2 rounded-lg border bg-card text-sm"
        />
        <div className="flex rounded-lg border overflow-hidden">
          {(["day", "week", "list"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${view === mode ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto">
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${statusFilter === status ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            {status === "all" ? "All" : status.replace("-", " ")}
          </button>
        ))}
      </div>

      {view === "day" && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="border-b px-4 py-3 text-sm font-medium flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            {formatDateLabel(selectedDate)}
          </div>
          <div className="divide-y">
            {TIME_SLOTS.map((slot) => {
              const slotAppointments = dayAppointments.filter(
                (appointment) => appointment.time === slot,
              );
              return (
                <div key={slot} className="flex min-h-[52px]">
                  <div className="w-20 shrink-0 px-3 py-2 text-xs text-muted-foreground font-mono border-r bg-muted/20">
                    {slot}
                  </div>
                  <div className="flex-1 p-1.5 flex gap-2 flex-wrap">
                    {slotAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="rounded-lg border px-3 py-2 min-w-[250px] bg-card"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">
                            {appointment.patientName}
                          </p>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full ${STATUS_STYLES[appointment.status]}`}
                          >
                            {appointment.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {appointment.doctor} · {appointment.department} ·{" "}
                          {appointment.duration} min
                        </p>
                        <div className="mt-2 flex gap-1.5">
                          {(appointment.status === "scheduled" ||
                            appointment.status === "confirmed") && (
                            <button
                              onClick={() =>
                                handleCheckInAppointment(
                                  appointment.id,
                                  appointment.notes,
                                )
                              }
                              className="text-[11px] px-2 py-1 rounded border hover:bg-accent"
                            >
                              Check In
                            </button>
                          )}
                          {appointment.status !== "completed" &&
                            appointment.status !== "cancelled" && (
                              <button
                                onClick={() =>
                                  handleCompleteAppointment(appointment.id)
                                }
                                className="text-[11px] px-2 py-1 rounded border hover:bg-accent"
                              >
                                Complete
                              </button>
                            )}
                          {appointment.status !== "cancelled" &&
                            appointment.status !== "completed" && (
                              <button
                                onClick={() =>
                                  handleCancelAppointment(appointment.id)
                                }
                                className="text-[11px] px-2 py-1 rounded border border-destructive/30 text-destructive hover:bg-destructive/10"
                              >
                                Cancel
                              </button>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "week" && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="grid grid-cols-7 border-b">
            {weekDates.map((date) => (
              <div
                key={date}
                className="px-3 py-2 border-r last:border-r-0 text-center text-xs font-semibold text-muted-foreground"
              >
                {formatDateLabel(date)}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 min-h-[320px]">
            {weekDates.map((date) => {
              const dayItems = filteredAppointments.filter(
                (appointment) => appointment.date === date,
              );
              return (
                <div
                  key={date}
                  className="border-r last:border-r-0 p-2 space-y-1.5"
                >
                  {dayItems.map((appointment) => (
                    <button
                      key={appointment.id}
                      onClick={() => setSelectedAppointmentId(appointment.id)}
                      className="w-full text-left rounded-lg border px-2 py-1.5 hover:bg-accent/40 transition-colors"
                    >
                      <p className="text-xs font-medium truncate">
                        {appointment.patientName}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {appointment.time} ·{" "}
                        {appointment.doctor.split(" ").slice(-1)[0]}
                      </p>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "list" && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  Appointment
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">
                  Doctor
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">
                  Date & Time
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredAppointments.map((appointment) => (
                <tr
                  key={appointment.id}
                  className="hover:bg-accent/40 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">
                      {appointment.patientName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {appointment.id} · {appointment.uhid} ·{" "}
                      {appointment.department}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm hidden md:table-cell">
                    {appointment.doctor}
                  </td>
                  <td className="px-4 py-3 text-sm hidden md:table-cell">
                    {appointment.date} · {appointment.time}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[appointment.status]}`}
                    >
                      {appointment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      {(appointment.status === "scheduled" ||
                        appointment.status === "confirmed") && (
                        <button
                          onClick={() =>
                            handleCheckInAppointment(
                              appointment.id,
                              appointment.notes,
                            )
                          }
                          className="text-xs px-2 py-1 rounded border hover:bg-accent"
                        >
                          Check In
                        </button>
                      )}
                      {appointment.status !== "completed" &&
                        appointment.status !== "cancelled" && (
                          <button
                            onClick={() =>
                              handleCancelAppointment(appointment.id)
                            }
                            className="text-xs px-2 py-1 rounded border border-destructive/30 text-destructive hover:bg-destructive/10"
                          >
                            Cancel
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAppointments.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    No appointments found for current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {showBooking && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowBooking(false)}
          >
            <div
              className="bg-card border rounded-xl w-full max-w-2xl p-6 space-y-5"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Book Appointment</h2>
                <button
                  onClick={() => setShowBooking(false)}
                  className="p-1 rounded hover:bg-accent"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {slotConflict && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Selected doctor already has an appointment at this slot.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Patient
                  </label>
                  <AppSelect
                    value={bookingForm.patientUhid || undefined}
                    onValueChange={handlePickPatient}
                    placeholder="Select patient"
                    options={patients.map((patient) => ({
                      value: patient.uhid,
                      label: `${patient.name} (${patient.uhid})`,
                    }))}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Patient Name
                  </label>
                  <input
                    value={bookingForm.patientName}
                    onChange={(event) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        patientName: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Phone
                  </label>
                  <input
                    value={bookingForm.phone}
                    onChange={(event) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        phone: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Department
                  </label>
                  <AppSelect
                    value={bookingForm.department || undefined}
                    onValueChange={(value) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        department: value,
                        doctor: "",
                      }))
                    }
                    placeholder="Select"
                    options={DEPARTMENTS.map((department) => ({
                      value: department,
                      label: department,
                    }))}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Doctor
                  </label>
                  <AppSelect
                    value={bookingForm.doctor || undefined}
                    onValueChange={(value) =>
                      setBookingForm((prev) => ({ ...prev, doctor: value }))
                    }
                    placeholder="Select"
                    options={(DOCTORS[bookingForm.department] || []).map(
                      (doctor) => ({ value: doctor, label: doctor }),
                    )}
                    disabled={!bookingForm.department}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Type</label>
                  <AppSelect
                    value={bookingForm.type}
                    onValueChange={(value) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        type: value as HospitalAppointment["type"],
                      }))
                    }
                    options={[
                      { value: "new", label: "New" },
                      { value: "follow-up", label: "Follow-up" },
                      { value: "teleconsultation", label: "Teleconsultation" },
                    ]}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Date</label>
                  <input
                    type="date"
                    value={bookingForm.date}
                    onChange={(event) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        date: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Time</label>
                  <AppSelect
                    value={bookingForm.time}
                    onValueChange={(value) =>
                      setBookingForm((prev) => ({ ...prev, time: value }))
                    }
                    options={TIME_SLOTS.map((slot) => ({
                      value: slot,
                      label: slot,
                    }))}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Duration
                  </label>
                  <AppSelect
                    value={bookingForm.duration}
                    onValueChange={(value) =>
                      setBookingForm((prev) => ({ ...prev, duration: value }))
                    }
                    options={[
                      { value: "15", label: "15 min" },
                      { value: "30", label: "30 min" },
                      { value: "45", label: "45 min" },
                      { value: "60", label: "60 min" },
                    ]}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium mb-1 block">
                    Notes
                  </label>
                  <textarea
                    value={bookingForm.notes}
                    onChange={(event) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        notes: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                    rows={2}
                  />
                </div>
                <label className="sm:col-span-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={bookingForm.checkInNow}
                    onChange={(event) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        checkInNow: event.target.checked,
                      }))
                    }
                  />
                  Check in immediately and generate queue token
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowBooking(false)}
                  className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBookAppointment}
                  disabled={slotConflict}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  Save Appointment
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedAppointment && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setSelectedAppointmentId(null)}
          >
            <div
              className="bg-card border rounded-xl w-full max-w-lg p-6 space-y-4"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">
                    {selectedAppointment.patientName}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedAppointment.id} · {selectedAppointment.uhid}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAppointmentId(null)}
                  className="p-1 rounded hover:bg-accent"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Doctor:</span>{" "}
                  {selectedAppointment.doctor}
                </div>
                <div>
                  <span className="text-muted-foreground">Department:</span>{" "}
                  {selectedAppointment.department}
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>{" "}
                  {selectedAppointment.date}
                </div>
                <div>
                  <span className="text-muted-foreground">Time:</span>{" "}
                  {selectedAppointment.time}
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>{" "}
                  {selectedAppointment.type}
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>{" "}
                  {selectedAppointment.duration} min
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Status:</span>{" "}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${STATUS_STYLES[selectedAppointment.status]}`}
                  >
                    {selectedAppointment.status}
                  </span>
                </div>
                {selectedAppointment.notes && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Notes:</span>{" "}
                    {selectedAppointment.notes}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {(selectedAppointment.status === "scheduled" ||
                  selectedAppointment.status === "confirmed") && (
                  <button
                    onClick={() =>
                      handleCheckInAppointment(
                        selectedAppointment.id,
                        selectedAppointment.notes,
                      )
                    }
                    className="flex-1 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-accent flex items-center justify-center gap-1"
                  >
                    <UserCheck className="w-4 h-4" /> Check In
                  </button>
                )}
                {selectedAppointment.status !== "completed" &&
                  selectedAppointment.status !== "cancelled" && (
                    <button
                      onClick={() =>
                        handleCompleteAppointment(selectedAppointment.id)
                      }
                      className="flex-1 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-accent flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Mark Complete
                    </button>
                  )}
                {selectedAppointment.status !== "cancelled" &&
                  selectedAppointment.status !== "completed" && (
                    <button
                      onClick={() =>
                        handleCancelAppointment(selectedAppointment.id)
                      }
                      className="flex-1 px-3 py-2 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 flex items-center justify-center gap-1"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
