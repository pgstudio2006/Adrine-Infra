import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Clock,
  Star,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useDoctorScope } from '@/hooks/useDoctorScope';

const fadeIn = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.3 },
});

const COLORS = ['hsl(0,0%,12%)', 'hsl(0,0%,28%)', 'hsl(0,0%,42%)', 'hsl(0,0%,55%)', 'hsl(0,0%,68%)', 'hsl(0,0%,80%)'];

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString('en-IN', { month: 'short' });
}

function parseDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function classifyDiagnosis(input: string) {
  const normalized = input.toLowerCase();
  if (normalized.includes('diabet')) return 'Diabetes';
  if (normalized.includes('hyper') || normalized.includes('blood pressure')) return 'Hypertension';
  if (normalized.includes('card') || normalized.includes('cabg') || normalized.includes('mi')) return 'Cardiac';
  if (normalized.includes('respir') || normalized.includes('copd')) return 'Respiratory';
  if (normalized.includes('renal') || normalized.includes('kidney')) return 'Renal';
  return 'Others';
}

export default function DoctorAnalytics() {
  const {
    isDoctor,
    doctorName,
    department,
    patients,
    appointments,
    admissions,
    invoices,
    labOrders,
    radiologyOrders,
  } = useDoctorScope();

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthIndex = today.getMonth();
  const currentMonth = monthKey(new Date(currentYear, currentMonthIndex, 1));

  const monthlyPatients = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, offset) => {
      const date = new Date(currentYear, currentMonthIndex - (5 - offset), 1);
      return { key: monthKey(date), label: monthLabel(date), opd: 0, ipd: 0 };
    });

    appointments.forEach((appointment) => {
      const date = parseDate(`${appointment.date}T00:00:00`);
      if (!date) return;
      const target = months.find((month) => month.key === monthKey(date));
      if (target) {
        target.opd += 1;
      }
    });

    admissions.forEach((admission) => {
      const date = parseDate(admission.admittedAt);
      if (!date) return;
      const target = months.find((month) => month.key === monthKey(date));
      if (target) {
        target.ipd += 1;
      }
    });

    return months.map((month) => ({
      month: month.label,
      opd: month.opd,
      ipd: month.ipd,
    }));
  }, [admissions, appointments, currentMonthIndex, currentYear]);

  const revenueData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, offset) => {
      const date = new Date(currentYear, currentMonthIndex - (5 - offset), 1);
      return { key: monthKey(date), label: monthLabel(date), consultation: 0, procedures: 0 };
    });

    invoices.forEach((invoice) => {
      const date = parseDate(invoice.date);
      if (!date) return;
      const target = months.find((month) => month.key === monthKey(date));
      if (!target) return;

      invoice.items.forEach((item) => {
        if (item.description.toLowerCase().includes('consultation')) {
          target.consultation += item.amount;
        } else {
          target.procedures += item.amount;
        }
      });
    });

    return months.map((month) => ({
      month: month.label,
      consultation: month.consultation,
      procedures: month.procedures,
    }));
  }, [currentMonthIndex, currentYear, invoices]);

  const diagnosisDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    admissions.forEach((admission) => {
      const key = classifyDiagnosis(admission.primaryDiagnosis);
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    if (counts.size === 0) {
      counts.set('Others', 1);
    }

    const total = Array.from(counts.values()).reduce((sum, value) => sum + value, 0);

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({
        name,
        value: Math.round((value / total) * 100),
      }));
  }, [admissions]);

  const dailyConsults = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts = new Map<string, number>();
    appointments.forEach((appointment) => {
      const date = parseDate(`${appointment.date}T00:00:00`);
      if (!date) return;
      const label = date.toLocaleDateString('en-IN', { weekday: 'short' });
      counts.set(label, (counts.get(label) || 0) + 1);
    });

    const avg = appointments.length > 0 ? Math.round(appointments.length / 7) : 0;
    return days.map((day) => ({ day, count: counts.get(day) || 0, avg }));
  }, [appointments]);

  const ageDistribution = useMemo(() => {
    const groups = [
      { label: '0-18', min: 0, max: 18, male: 0, female: 0 },
      { label: '19-35', min: 19, max: 35, male: 0, female: 0 },
      { label: '36-50', min: 36, max: 50, male: 0, female: 0 },
      { label: '51-65', min: 51, max: 65, male: 0, female: 0 },
      { label: '65+', min: 66, max: 200, male: 0, female: 0 },
    ];

    patients.forEach((patient) => {
      const group = groups.find((entry) => patient.age >= entry.min && patient.age <= entry.max);
      if (!group) return;
      if (patient.gender.toUpperCase().startsWith('F')) {
        group.female += 1;
      } else {
        group.male += 1;
      }
    });

    return groups.map((group) => ({ group: group.label, male: group.male, female: group.female }));
  }, [patients]);

  const topProcedures = useMemo(() => {
    const counts = new Map<string, { count: number; revenue: number }>();

    labOrders.forEach((order) => {
      const current = counts.get(order.tests) || { count: 0, revenue: 0 };
      current.count += 1;
      current.revenue += 500;
      counts.set(order.tests, current);
    });

    radiologyOrders.forEach((order) => {
      const key = order.study;
      const current = counts.get(key) || { count: 0, revenue: 0 };
      current.count += 1;
      current.revenue += 1000;
      counts.set(key, current);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([name, value]) => ({
        name,
        count: value.count,
        revenue: `INR ${value.revenue.toLocaleString('en-IN')}`,
      }));
  }, [labOrders, radiologyOrders]);

  const totalPatientsThisMonth = appointments
    .filter((appointment) => monthKey(new Date(`${appointment.date}T00:00:00`)) === currentMonth)
    .map((appointment) => appointment.uhid)
    .filter((uhid, index, all) => all.indexOf(uhid) === index).length;

  const avgConsultTime = appointments.length > 0
    ? Math.round(appointments.reduce((sum, appointment) => sum + appointment.duration, 0) / appointments.length)
    : 0;

  const monthRevenue = revenueData.reduce((sum, month) => sum + month.consultation + month.procedures, 0);

  const appointmentCompletionRate = appointments.length > 0
    ? Math.round((appointments.filter((appointment) => appointment.status === 'completed').length / appointments.length) * 100)
    : 0;

  const stats = [
    {
      label: 'Patients This Month',
      value: String(totalPatientsThisMonth),
      change: `${patients.length} assigned`,
      up: true,
      icon: Users,
    },
    {
      label: 'Avg Consult Time',
      value: `${avgConsultTime} min`,
      change: `${appointments.length} total slots`,
      up: true,
      icon: Clock,
    },
    {
      label: 'Revenue (6M)',
      value: `INR ${Math.round(monthRevenue / 1000)}K`,
      change: `${invoices.length} invoices`,
      up: true,
      icon: TrendingUp,
    },
    {
      label: 'Completion Rate',
      value: `${appointmentCompletionRate}%`,
      change: `${appointments.filter((appointment) => appointment.status === 'completed').length} completed`,
      up: appointmentCompletionRate >= 50,
      icon: Star,
    },
  ];

  if (!isDoctor) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Access denied. Only doctor users can access analytics.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {doctorName} · {department || 'All Departments'} · last 6 months
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div key={stat.label} {...fadeIn(index + 1)} className="border rounded-xl p-5 bg-card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                <stat.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className={`flex items-center gap-0.5 text-xs font-semibold ${stat.up ? 'text-emerald-600' : 'text-destructive'}`}>
                {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div {...fadeIn(5)} className="border rounded-xl bg-card p-5">
          <h2 className="font-semibold text-sm mb-1">Patient Volume</h2>
          <p className="text-xs text-muted-foreground mb-4">Monthly OPD vs IPD trend</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyPatients} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(0,0%,70%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(0,0%,70%)" />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid hsl(0,0%,90%)' }} />
              <Bar dataKey="opd" fill="hsl(0,0%,15%)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="ipd" fill="hsl(0,0%,65%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div {...fadeIn(6)} className="border rounded-xl bg-card p-5">
          <h2 className="font-semibold text-sm mb-1">Revenue Breakdown</h2>
          <p className="text-xs text-muted-foreground mb-4">Consultation vs procedures</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0,0%,15%)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(0,0%,15%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(0,0%,70%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(0,0%,70%)" tickFormatter={(value) => `INR ${Math.round(value / 1000)}K`} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid hsl(0,0%,90%)' }} />
              <Area type="monotone" dataKey="consultation" stroke="hsl(0,0%,15%)" fill="url(#gradRev)" strokeWidth={2} />
              <Area type="monotone" dataKey="procedures" stroke="hsl(0,0%,55%)" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div {...fadeIn(7)} className="border rounded-xl bg-card p-5">
          <h2 className="font-semibold text-sm mb-1">Diagnosis Mix</h2>
          <p className="text-xs text-muted-foreground mb-4">Current admission categories</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={diagnosisDistribution} innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value">
                {diagnosisDistribution.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value}%`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {diagnosisDistribution.map((diagnosis, index) => (
              <div key={diagnosis.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  {diagnosis.name}
                </span>
                <span className="font-medium">{diagnosis.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div {...fadeIn(8)} className="lg:col-span-2 border rounded-xl bg-card p-5">
          <h2 className="font-semibold text-sm mb-1">Daily Consultation Pattern</h2>
          <p className="text-xs text-muted-foreground mb-4">Current week vs baseline average</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyConsults} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(0,0%,70%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(0,0%,70%)" />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid hsl(0,0%,90%)' }} />
              <Bar dataKey="count" fill="hsl(0,0%,15%)" radius={[3, 3, 0, 0]} name="This Week" />
              <Bar dataKey="avg" fill="hsl(0,0%,80%)" radius={[3, 3, 0, 0]} name="Average" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div {...fadeIn(9)} className="border rounded-xl bg-card p-5">
          <h2 className="font-semibold text-sm mb-1">Age And Gender Distribution</h2>
          <p className="text-xs text-muted-foreground mb-4">Assigned patient demographics</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ageDistribution} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
              <XAxis dataKey="group" tick={{ fontSize: 11 }} stroke="hsl(0,0%,70%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(0,0%,70%)" />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid hsl(0,0%,90%)' }} />
              <Bar dataKey="male" fill="hsl(0,0%,20%)" radius={[3, 3, 0, 0]} name="Male" />
              <Bar dataKey="female" fill="hsl(0,0%,55%)" radius={[3, 3, 0, 0]} name="Female" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div {...fadeIn(10)} className="border rounded-xl bg-card overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-sm">Top Ordered Procedures</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Labs and imaging requests</p>
          </div>
          <div className="divide-y">
            {topProcedures.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">No procedure activity yet.</div>
            )}
            {topProcedures.map((procedure, index) => (
              <div key={procedure.name} className="flex items-center gap-3 px-4 py-3">
                <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">{index + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{procedure.name}</p>
                  <p className="text-[11px] text-muted-foreground">{procedure.count} ordered</p>
                </div>
                <span className="text-sm font-semibold">{procedure.revenue}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
