import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  CalendarDays,
  FlaskConical,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useHospital } from '@/stores/hospitalStore';
import { useDoctorScope } from '@/hooks/useDoctorScope';
import { useClinicalBasePath } from '@/hooks/useClinicalBasePath';
import { PlatformConnectivityStrip } from '@/components/PlatformConnectivityStrip';
import { useClinicalPlatformListSync } from '@/hooks/useClinicalPlatformListSync';
import { useDashboardEngine } from '@/hooks/useDashboardEngine';
import { buildDoctorKpis } from '@/lib/dashboard/dashboard-engine';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const fadeIn = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.3 },
});

const statusStyle: Record<string, string> = {
  completed: 'bg-emerald-500/10 text-emerald-600',
  'in-consultation': 'bg-blue-500/10 text-blue-600',
  'checked-in': 'bg-amber-500/10 text-amber-600',
  waiting: 'bg-amber-500/10 text-amber-600',
  scheduled: 'bg-muted text-muted-foreground',
  confirmed: 'bg-muted text-muted-foreground',
};

const severityStyle: Record<string, string> = {
  critical: 'bg-destructive/10 text-destructive',
  warning: 'bg-amber-500/10 text-amber-600',
  info: 'bg-blue-500/10 text-blue-600',
};

function parseDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDisplayTime(value: string) {
  const normalized = value.trim().toUpperCase();
  if (normalized.includes('AM') || normalized.includes('PM')) {
    return normalized;
  }

  const [hourRaw, minuteRaw] = normalized.split(':');
  const hour = Number(hourRaw || '0');
  const minute = Number(minuteRaw || '0');
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = ((hour + 11) % 12) + 1;
  return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`;
}

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const roleBasePath = useClinicalBasePath();
  const { nursingRounds } = useHospital();
  const {
    isDoctor,
    doctorName,
    department,
    patients,
    appointments,
    queue,
    labOrders,
    radiologyOrders,
    admissions,
  } = useDoctorScope();
  const { counts, branchId, platformOn, error: platformError } = useDashboardEngine('24h');

  useClinicalPlatformListSync({ queue: true, departmentWorklists: true, ipd: true });

  const platformDetail = counts
    ? `Branch ${branchId ?? '—'} · OPD queue ${counts.opdWaitingQueue} · active ${counts.opdActiveVisits} · IPD ${counts.ipdActiveAdmissions}`
    : null;

  const latestRoundByAdmission = useMemo(() => {
    const map = new Map<string, (typeof nursingRounds)[number]>();
    nursingRounds.forEach((round) => {
      if (!map.has(round.admissionId)) {
        map.set(round.admissionId, round);
      }
    });
    return map;
  }, [nursingRounds]);

  const opdQueueCount = queue.filter((entry) => {
    return entry.status === 'waiting' || entry.status === 'called' || entry.status === 'in-consultation';
  }).length;

  const pendingLabCount = labOrders.filter((order) => order.stage !== 'Reported' && order.stage !== 'Validated').length;
  const pendingRadiologyCount = radiologyOrders.filter((order) => order.status !== 'Reported').length;
  const pendingReportsCount = pendingLabCount + pendingRadiologyCount;

  const roundsDueCount = admissions.filter((admission) => {
    const latest = latestRoundByAdmission.get(admission.id);
    return (
      admission.status === 'icu' ||
      admission.nursingPriority === 'high' ||
      !latest ||
      latest.painScore >= 4
    );
  }).length;

  const engineKpis = useMemo(
    () =>
      buildDoctorKpis(counts, {
        patients: patients.length,
        pendingReports: pendingReportsCount,
        roundsDue: roundsDueCount,
      }),
    [counts, patients.length, pendingReportsCount, roundsDueCount],
  );

  const useLiveTiles = platformOn && engineKpis.length >= 4;

  const stats = useLiveTiles
    ? engineKpis.map((kpi, i) => ({
        label: kpi.label,
        value: String(kpi.value),
        change: kpi.hint ?? '',
        up: i !== 1,
        icon: [CalendarDays, Building2, FlaskConical, Users][i] ?? Users,
      }))
    : [
        {
          label: 'Assigned Patients',
          value: String(patients.length),
          change: `${patients.filter((patient) => patient.patientType === 'IPD' || patient.patientType === 'ICU').length} inpatients`,
          up: true,
          icon: Users,
        },
        {
          label: 'OPD Queue',
          value: String(opdQueueCount),
          change: `${queue.filter((entry) => entry.status === 'waiting').length} waiting`,
          up: false,
          icon: CalendarDays,
        },
        {
          label: 'Pending Reports',
          value: String(pendingReportsCount),
          change: `${pendingLabCount} lab · ${pendingRadiologyCount} radiology`,
          up: true,
          icon: FlaskConical,
        },
        {
          label: 'IPD Rounds Due',
          value: String(roundsDueCount),
          change: `${admissions.filter((admission) => admission.status === 'icu').length} ICU`,
          up: false,
          icon: Building2,
        },
      ];

  const weeklyPatients = useMemo(() => {
    const now = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - index));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    return days.map((day) => {
      const dayKey = day.toDateString();
      const opd = appointments.filter((appointment) => {
        const date = parseDate(`${appointment.date}T00:00:00`);
        return date?.toDateString() === dayKey;
      }).length;
      const ipd = admissions.filter((admission) => {
        const date = parseDate(admission.admittedAt);
        return date?.toDateString() === dayKey;
      }).length;

      return {
        day: day.toLocaleDateString('en-IN', { weekday: 'short' }),
        opd,
        ipd,
      };
    });
  }, [admissions, appointments]);

  const consultationTrend = useMemo(() => {
    const buckets = Array.from({ length: 9 }, (_, offset) => {
      const hour = 9 + offset;
      return {
        hour: `${hour}:00`,
        count: 0,
      };
    });

    appointments.forEach((appointment) => {
      const hour = Number(appointment.time.split(':')[0]);
      const bucket = buckets.find((item) => Number(item.hour.split(':')[0]) === hour);
      if (bucket) {
        bucket.count += 1;
      }
    });

    return buckets;
  }, [appointments]);

  const todayIso = new Date().toISOString().split('T')[0];
  const todayAppointments = useMemo(() => {
    const todays = appointments
      .filter((appointment) => appointment.date === todayIso)
      .sort((a, b) => a.time.localeCompare(b.time));

    if (todays.length > 0) {
      return todays;
    }

    return [...appointments]
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
      .slice(0, 8);
  }, [appointments, todayIso]);

  const pendingLabs = useMemo(() => {
    return labOrders
      .filter((order) => order.stage !== 'Reported' && order.stage !== 'Validated')
      .slice(0, 5)
      .map((order) => ({
        patient: order.patientName,
        test: order.tests,
        ordered: order.orderTime,
        priority: order.priority.toLowerCase(),
      }));
  }, [labOrders]);

  const criticalAlerts = useMemo(() => {
    const alerts: Array<{ patient: string; message: string; time: string; severity: 'critical' | 'warning' | 'info' }> = [];

    admissions.forEach((admission) => {
      if (admission.status === 'icu') {
        alerts.push({
          patient: `${admission.bed} · ${admission.patientName}`,
          message: 'ICU admission requires high-frequency doctor review.',
          time: admission.nextDoctorRoundAt || 'Now',
          severity: 'critical',
        });
      } else if (admission.nursingPriority === 'high') {
        alerts.push({
          patient: `${admission.bed} · ${admission.patientName}`,
          message: 'High-priority nursing flag raised for inpatient monitoring.',
          time: admission.nextDoctorRoundAt || 'Today',
          severity: 'warning',
        });
      }
    });

    labOrders.forEach((order) => {
      if (order.criticalAlert) {
        alerts.push({
          patient: order.patientName,
          message: `Critical lab alert for ${order.tests}.`,
          time: order.orderTime,
          severity: 'critical',
        });
      }
    });

    radiologyOrders.forEach((order) => {
      if (order.critical) {
        alerts.push({
          patient: order.patientName,
          message: `Critical imaging flagged for ${order.study}.`,
          time: order.orderTime,
          severity: 'warning',
        });
      }
    });

    if (alerts.length === 0) {
      alerts.push({
        patient: department || 'Department',
        message: 'No critical alerts. Continue regular rounds and queue flow.',
        time: 'Now',
        severity: 'info',
      });
    }

    return alerts.slice(0, 4);
  }, [admissions, department, labOrders, radiologyOrders]);

  if (!isDoctor) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Access denied. Only doctor users can access the doctor dashboard.
      </div>
    );
  }

  const waitingCount = queue.filter((q) => q.status === 'waiting' || q.status === 'called').length;

  return (
    <div className="space-y-6">
      {platformOn && (
        <PlatformConnectivityStrip
          label="Live OPD / IPD counts"
          detail={platformDetail ?? 'Loading platform snapshot…'}
          error={platformError}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => navigate(`${roleBasePath}/queue`)} className="gap-1.5">
            Open OPD queue
            {waitingCount > 0 ? ` (${waitingCount} waiting)` : ''}
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/doctor/inbox')}>
            Inbox
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/doctor/critical')}>
            Critical
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/doctor/emr')}>
            EMR
          </Button>
        </div>
      </div>

      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Good Morning, {doctorName}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })} · {department || 'All Departments'}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div key={stat.label} {...fadeIn(index + 1)} className="border rounded-xl p-5 bg-card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                <stat.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className={`flex items-center gap-0.5 text-xs font-semibold ${stat.up ? 'text-emerald-600' : 'text-amber-600'}`}>
                {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div {...fadeIn(5)} className="lg:col-span-2 border rounded-xl bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-sm">Patient Volume</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Last 7 days OPD vs IPD</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyPatients} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(0,0%,70%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(0,0%,70%)" />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid hsl(0,0%,90%)' }} />
              <Bar dataKey="opd" fill="hsl(0,0%,15%)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="ipd" fill="hsl(0,0%,65%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div {...fadeIn(6)} className="border rounded-xl bg-card p-5">
          <h2 className="font-semibold text-sm mb-1">Consultation Flow</h2>
          <p className="text-xs text-muted-foreground mb-4">Today by hour</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={consultationTrend}>
              <defs>
                <linearGradient id="gradConsult" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0,0%,15%)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(0,0%,15%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="hsl(0,0%,70%)" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(0,0%,70%)" />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid hsl(0,0%,90%)' }} />
              <Area type="monotone" dataKey="count" stroke="hsl(0,0%,15%)" fill="url(#gradConsult)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div {...fadeIn(7)} className="lg:col-span-2 border rounded-xl bg-card overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-sm">Appointments</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{todayAppointments.length} slot(s) in focus</p>
            </div>
            <button className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y">
            {todayAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors">
                <span className="text-xs font-mono font-medium text-muted-foreground w-16 shrink-0">{formatDisplayTime(appointment.time)}</span>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold">{appointment.patientName.split(' ').map((part) => part[0]).join('')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{appointment.patientName}</p>
                  <p className="text-[11px] text-muted-foreground">{appointment.type} · {appointment.department}</p>
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusStyle[appointment.status] || statusStyle.scheduled}`}>
                  {appointment.status}
                </span>
              </div>
            ))}
            {todayAppointments.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">No appointments in scope yet.</div>
            )}
          </div>
        </motion.div>

        <div className="space-y-4">
          <motion.div {...fadeIn(8)} className="border rounded-xl bg-card overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                Clinical Alerts
              </h2>
            </div>
            <div className="divide-y">
              {criticalAlerts.map((alert, index) => (
                <div key={`${alert.patient}-${index}`} className="px-4 py-3 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${severityStyle[alert.severity]}`}>
                      {alert.severity}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{alert.time}</span>
                  </div>
                  <p className="text-xs font-medium">{alert.patient}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{alert.message}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeIn(9)} className="border rounded-xl bg-card overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-sm flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-muted-foreground" />
                Pending Labs
              </h2>
              <span className="text-[11px] font-medium bg-muted px-2 py-0.5 rounded-full">{pendingLabs.length}</span>
            </div>
            <div className="divide-y">
              {pendingLabs.map((lab, index) => (
                <div key={`${lab.patient}-${index}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{lab.patient}</p>
                    <p className="text-[11px] text-muted-foreground">{lab.test}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[10px] font-semibold uppercase ${lab.priority === 'urgent' || lab.priority === 'emergency' ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {lab.priority}
                    </span>
                    <p className="text-[10px] text-muted-foreground">{lab.ordered}</p>
                  </div>
                </div>
              ))}
              {pendingLabs.length === 0 && (
                <div className="py-6 text-center text-xs text-muted-foreground">No pending labs.</div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
