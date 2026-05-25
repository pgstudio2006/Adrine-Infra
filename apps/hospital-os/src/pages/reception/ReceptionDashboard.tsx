import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users,
  CalendarCheck,
  Clock,
  UserPlus,
  ArrowRight,
  Activity,
  ClipboardList,
  Building2,
  UserCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useHospital } from "@/stores/hospitalStore";
import { useClinicalPlatformListSync } from "@/hooks/useClinicalPlatformListSync";
import {
  averageWaitMinutes,
  formatWaitMinutes,
} from "@/lib/opd/queue-presenters";
import { Button } from "@/components/ui/button";
import { PlatformConnectivityStrip } from "@/components/PlatformConnectivityStrip";
import { isPlatformAuthoritative } from "@/runtime/platform-store-bridge";
import { InlinePlatformError } from "@/components/shared/InlinePlatformError";
import { usePlatformHydration } from "@/hooks/usePlatformHydration";

export default function ReceptionDashboard() {
  const navigate = useNavigate();
  const { patients, appointments, queue, admissions } = useHospital();
  const { error: hydrationError, retry } = usePlatformHydration({});
  useClinicalPlatformListSync({
    queue: true,
    appointments: true,
    patients: true,
    departmentWorklists: false,
    ipd: true,
  });

  const todayYmd = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter((a) => a.date === todayYmd);
  const waitingQueue = queue.filter(
    (q) => q.status === "waiting" || q.status === "called",
  );
  const checkInsPending = todayAppointments.filter(
    (a) => a.status === "scheduled" || a.status === "confirmed",
  ).length;
  const avgWait = formatWaitMinutes(
    averageWaitMinutes(waitingQueue.map((q) => q.waitMinutes)),
  );
  const openAdmissions = admissions.filter(
    (a) => a.status !== "discharged",
  ).length;

  const stats = useMemo(
    () => [
      {
        label: "Appointments today",
        value: String(todayAppointments.length),
        change: "Authoritative day list when platform runtime is on",
        icon: CalendarCheck,
        trend: "neutral" as const,
      },
      {
        label: "Check-ins pending",
        value: String(checkInsPending),
        change: "Scheduled / confirmed, not yet tokened",
        icon: UserCheck,
        trend:
          checkInsPending > 8 ? ("warning" as const) : ("neutral" as const),
      },
      {
        label: "Waiting queue",
        value: String(waitingQueue.length),
        change: `Avg wait ${avgWait}`,
        icon: Clock,
        trend:
          waitingQueue.length > 10
            ? ("warning" as const)
            : ("neutral" as const),
      },
      {
        label: "Open admissions",
        value: String(openAdmissions),
        change: "Active IPD handoffs",
        icon: Users,
        trend: "neutral" as const,
      },
    ],
    [
      todayAppointments.length,
      checkInsPending,
      waitingQueue.length,
      avgWait,
      openAdmissions,
    ],
  );

  const recentPatients = [...patients]
    .slice(-5)
    .reverse()
    .map((p) => ({
      id: p.uhid,
      name: p.name,
      department: p.department ?? "—",
      type: p.patientType,
    }));

  return (
    <div className="space-y-6">
      {isPlatformAuthoritative() ? (
        <PlatformConnectivityStrip detail="Dashboard metrics derive from hydrated patients, appointments, OPD board queue, and IPD snapshots." />
      ) : null}

      <InlinePlatformError error={hydrationError} onRetry={retry} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reception</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Front desk command — run the P0 OPD spine through Flow,
            Registration, Appointments, Check-In, Queue, and Billing
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => navigate("/reception/flow")}>
            Flow hub
          </Button>
          <Button
            onClick={() => navigate("/reception/registration")}
            className="gap-2"
          >
            <UserPlus className="w-4 h-4" /> New registration
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border bg-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
            <p
              className={`text-xs mt-1 ${
                s.trend === "warning" ? "text-warning" : "text-muted-foreground"
              }`}
            >
              {s.change}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => navigate("/reception/flow")}
          className="rounded-xl border p-4 hover:bg-accent/50 transition-colors text-left"
        >
          <ClipboardList className="w-5 h-5 text-primary mb-2" />
          <p className="text-sm font-semibold">Flow hub</p>
          <p className="text-xs text-muted-foreground">
            OPD spine and blockers
          </p>
        </button>
        <button
          type="button"
          onClick={() => navigate("/reception/registration")}
          className="rounded-xl border p-4 hover:bg-accent/50 transition-colors text-left"
        >
          <UserPlus className="w-5 h-5 text-primary mb-2" />
          <p className="text-sm font-semibold">Registration</p>
          <p className="text-xs text-muted-foreground">
            Full or walk-in fast path
          </p>
        </button>
        <button
          type="button"
          onClick={() => navigate("/reception/appointments")}
          className="rounded-xl border p-4 hover:bg-accent/50 transition-colors text-left"
        >
          <CalendarCheck className="w-5 h-5 text-primary mb-2" />
          <p className="text-sm font-semibold">Appointments</p>
          <p className="text-xs text-muted-foreground">Schedule & confirm</p>
        </button>
        <button
          type="button"
          onClick={() => navigate("/reception/checkin")}
          className="rounded-xl border p-4 hover:bg-accent/50 transition-colors text-left"
        >
          <Activity className="w-5 h-5 text-primary mb-2" />
          <p className="text-sm font-semibold">Check-in</p>
          <p className="text-xs text-muted-foreground">Issue tokens</p>
        </button>
        <button
          type="button"
          onClick={() => navigate("/reception/queue")}
          className="rounded-xl border p-4 hover:bg-accent/50 transition-colors text-left"
        >
          <Clock className="w-5 h-5 text-primary mb-2" />
          <p className="text-sm font-semibold">Queue</p>
          <p className="text-xs text-muted-foreground">Avg wait {avgWait}</p>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">Recent patients</h2>
            <button
              type="button"
              onClick={() => navigate("/reception/registration")}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y">
            {recentPatients.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">
                No patients in context yet.
              </p>
            ) : (
              recentPatients.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.id} · {p.department}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                    {p.type}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Today&apos;s appointments
            </h2>
            <button
              type="button"
              onClick={() => navigate("/reception/appointments")}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              Calendar <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y max-h-64 overflow-y-auto">
            {todayAppointments.slice(0, 8).map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{a.patientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.time} · {a.doctor}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                  {a.status}
                </span>
              </div>
            ))}
            {todayAppointments.length === 0 && (
              <p className="p-6 text-sm text-muted-foreground text-center">
                No appointments for today.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 flex items-center gap-2 text-xs text-muted-foreground">
        <ClipboardList className="w-4 h-4 shrink-0" />
        Use Flow hub to avoid skipping check-in or queue handoff. Billing exit
        is the final front-desk step before the patient leaves.
      </div>
    </div>
  );
}
