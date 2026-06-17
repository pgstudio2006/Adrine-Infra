import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Plus,
  Search,
  UserCheck,
  X,
} from "lucide-react";
import { useHospital, type HospitalAppointment } from "@/stores/hospitalStore";
import { useOperationalEventStream } from "@/runtime/realtime-runtime";
import {
  getPlatformSession,
  isPlatformRuntimeEnabled,
} from "@/runtime/platform-session";
import { InlinePlatformError } from "@/components/shared/InlinePlatformError";
import { loadPatientPhone } from "@/lib/navayu/navayu-forms";
import { toast } from "sonner";
import { listSeniorDoctors } from "@/lib/scheduling/senior-doctor-registry";
import { findAppointmentConflict } from "@/lib/scheduling/appointment-slots";
import {
  AppointmentBookingModal,
  type BookingFormState,
} from "@/components/reception/AppointmentBookingModal";
import {
  DoctorDayScheduleGrid,
  type ScheduleGridAction,
} from "@/components/reception/DoctorDayScheduleGrid";
import type { SeniorDoctor } from "@/lib/scheduling/senior-doctor-registry";

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
  const navigate = useNavigate();
  const {
    appointments,
    patients,
    bookAppointment,
    updateAppointment,
    checkInPatient,
    updateAppointmentStatus,
    refreshAppointmentsFromPlatform,
    refreshQueueFromPlatform,
    refreshPatientsFromPlatform,
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
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [seniorDoctors, setSeniorDoctors] = useState<SeniorDoctor[]>(() => listSeniorDoctors());
  const [platformError, setPlatformError] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState<BookingFormState>(() => ({
    patientUhid: "",
    patientName: "",
    phone: "",
    department: listSeniorDoctors()[0]?.department ?? "",
    doctor: listSeniorDoctors()[0]?.name ?? "",
    date: toYmd(new Date()),
    time: "09:00",
    duration: "30",
    type: "new",
    notes: "",
  }));

  const refreshSeniorDoctors = useCallback(() => {
    setSeniorDoctors(listSeniorDoctors());
  }, []);

  useEffect(() => {
    refreshSeniorDoctors();
    const onStorage = (event: StorageEvent) => {
      if (event.key?.includes('senior_doctors') || event.key?.includes('doctor_leave')) {
        refreshSeniorDoctors();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refreshSeniorDoctors]);

  const syncPlatformAppointments = useCallback(async () => {
    try {
      await Promise.all([
        refreshPatientsFromPlatform(),
        refreshAppointmentsFromPlatform(),
        refreshQueueFromPlatform(),
      ]);
      setPlatformError(null);
    } catch (error) {
      setPlatformError(
        error instanceof Error ? error.message : "Appointment sync failed",
      );
    }
  }, [refreshAppointmentsFromPlatform, refreshPatientsFromPlatform, refreshQueueFromPlatform]);

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

  const bookingPatients = useMemo(() => {
    const byUhid = new Map<string, (typeof patients)[number]>();
    for (const patient of patients) {
      if (!patient.uhid) continue;
      const existing = byUhid.get(patient.uhid);
      if (!existing) {
        byUhid.set(patient.uhid, patient);
        continue;
      }
      const score = (entry: (typeof patients)[number]) =>
        (entry.phone?.trim() ? 4 : 0) +
        (entry.platformPatientId ? 2 : 0) +
        (entry.name?.length ?? 0);
      const preferred = score(patient) >= score(existing) ? patient : existing;
      const other = preferred === patient ? existing : patient;
      byUhid.set(patient.uhid, {
        ...other,
        ...preferred,
        phone:
          preferred.phone?.trim() ||
          other.phone?.trim() ||
          loadPatientPhone(patient.uhid) ||
          "",
        name: preferred.name || other.name,
      });
    }
    return Array.from(byUhid.values()).sort((left, right) =>
      left.name.localeCompare(right.name),
    );
  }, [patients]);

  const seniorDoctorNames = useMemo(
    () => new Set(seniorDoctors.map((doctor) => doctor.name)),
    [seniorDoctors],
  );

  const calendarAppointments = useMemo(
    () =>
      dayAppointments.filter((appointment) => seniorDoctorNames.has(appointment.doctor)),
    [dayAppointments, seniorDoctorNames],
  );

  const openBookingModal = (prefill?: Partial<BookingFormState>, editId?: string | null) => {
    const defaultDoctor = seniorDoctors[0];
    setBookingForm({
      patientUhid: "",
      patientName: "",
      phone: "",
      department: defaultDoctor?.department ?? "",
      doctor: defaultDoctor?.name ?? "",
      date: selectedDate,
      time: "09:00",
      duration: "30",
      type: "new",
      notes: "",
      ...prefill,
    });
    setEditingAppointmentId(editId ?? null);
    setShowBooking(true);
  };

  const handleSaveBooking = (form: BookingFormState) => {
    const duration = Number(form.duration);
    const conflict = findAppointmentConflict(appointments, {
      doctor: form.doctor,
      date: form.date,
      time: form.time,
      duration,
      excludeId: editingAppointmentId ?? undefined,
    });
    if (conflict) {
      toast.error("Slot overlaps another appointment");
      return;
    }

    if (editingAppointmentId) {
      updateAppointment(editingAppointmentId, {
        uhid: form.patientUhid,
        patientName: form.patientName,
        phone: form.phone,
        doctor: form.doctor,
        department: form.department,
        date: form.date,
        time: form.time,
        duration,
        type: form.type,
        notes: form.notes,
      });
    } else {
      bookAppointment({
        uhid: form.patientUhid,
        patientName: form.patientName,
        phone: form.phone,
        doctor: form.doctor,
        department: form.department,
        date: form.date,
        time: form.time,
        duration,
        status: "scheduled",
        type: form.type,
        notes: form.notes,
      });
    }

    setShowBooking(false);
    setEditingAppointmentId(null);
  };

  const handleGridAction = (action: ScheduleGridAction, appointment: HospitalAppointment) => {
    if (action === "open") {
      setSelectedAppointmentId(appointment.id);
      return;
    }
    if (action === "check-in") {
      handleCheckInAppointment(appointment.id, appointment.notes);
      return;
    }
    if (action === "reschedule") {
      openBookingModal(
        {
          patientUhid: appointment.uhid,
          patientName: appointment.patientName,
          phone: appointment.phone,
          department: appointment.department,
          doctor: appointment.doctor,
          date: appointment.date,
          time: appointment.time,
          duration: String(appointment.duration),
          type: appointment.type,
          notes: appointment.notes,
        },
        appointment.id,
      );
      return;
    }
    if (action === "cancel") {
      handleCancelAppointment(appointment.id);
      return;
    }
    if (action === "complete") {
      handleCompleteAppointment(appointment.id);
    }
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
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => navigate('/reception/registration')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent transition-colors"
          >
            <UserCheck className="w-4 h-4" /> New Registration
          </button>
          <button
            onClick={() => openBookingModal()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Book Appointment
          </button>
        </div>
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
        <div className="space-y-3">
          <div className="text-sm font-medium flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            {formatDateLabel(selectedDate)} · Senior doctor schedule
          </div>
          <DoctorDayScheduleGrid
            doctors={seniorDoctors}
            appointments={calendarAppointments}
            date={selectedDate}
            mode="appointments"
            onAction={handleGridAction}
            onEmptySlotClick={(doctor, time) =>
              openBookingModal({
                doctor: doctor.name,
                department: doctor.department,
                date: selectedDate,
                time,
              })
            }
          />
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
                      {appointment.status !== "cancelled" &&
                        appointment.status !== "completed" && (
                          <button
                            onClick={() =>
                              openBookingModal(
                                {
                                  patientUhid: appointment.uhid,
                                  patientName: appointment.patientName,
                                  phone: appointment.phone,
                                  department: appointment.department,
                                  doctor: appointment.doctor,
                                  date: appointment.date,
                                  time: appointment.time,
                                  duration: String(appointment.duration),
                                  type: appointment.type,
                                  notes: appointment.notes,
                                },
                                appointment.id,
                              )
                            }
                            className="text-xs px-2 py-1 rounded border hover:bg-accent"
                          >
                            Reschedule
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

      <AppointmentBookingModal
        key={`${showBooking}-${editingAppointmentId ?? "new"}-${bookingForm.time}`}
        open={showBooking}
        title={editingAppointmentId ? "Reschedule appointment" : "Book appointment"}
        patients={bookingPatients}
        appointments={appointments}
        seniorDoctors={seniorDoctors}
        initialForm={bookingForm}
        editingAppointmentId={editingAppointmentId}
        onClose={() => {
          setShowBooking(false);
          setEditingAppointmentId(null);
        }}
        onSubmit={handleSaveBooking}
      />

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
                      onClick={() => {
                        setSelectedAppointmentId(null);
                        openBookingModal(
                          {
                            patientUhid: selectedAppointment.uhid,
                            patientName: selectedAppointment.patientName,
                            phone: selectedAppointment.phone,
                            department: selectedAppointment.department,
                            doctor: selectedAppointment.doctor,
                            date: selectedAppointment.date,
                            time: selectedAppointment.time,
                            duration: String(selectedAppointment.duration),
                            type: selectedAppointment.type,
                            notes: selectedAppointment.notes,
                          },
                          selectedAppointment.id,
                        );
                      }}
                      className="flex-1 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-accent flex items-center justify-center gap-1"
                    >
                      Reschedule
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
