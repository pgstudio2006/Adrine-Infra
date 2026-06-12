import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  AlertTriangle, Activity, Heart, Clock, TrendingDown, TrendingUp,
  Bell, Shield, Users, BedDouble, Zap, BarChart3, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PlatformConnectivityStrip } from '@/components/PlatformConnectivityStrip';
import { useAdminOperationalData } from '@/hooks/useAdminOperationalData';

const fadeIn = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.3 },
});

// Mock ICU data
const icuPatients = [
  { id: 'ICU-001', name: 'Ramesh Patel', age: 68, bed: 'ICU-A1', mews: 7, status: 'critical', responseTime: '2.3 min', admittedHours: 48, condition: 'Sepsis', trend: 'deteriorating' },
  { id: 'ICU-002', name: 'Sunita Sharma', age: 55, bed: 'ICU-A3', mews: 4, status: 'stable', responseTime: '1.8 min', admittedHours: 72, condition: 'Post-CABG', trend: 'improving' },
  { id: 'ICU-003', name: 'Arjun Mehta', age: 72, bed: 'ICU-B2', mews: 6, status: 'warning', responseTime: '3.1 min', admittedHours: 24, condition: 'ARDS', trend: 'deteriorating' },
  { id: 'ICU-004', name: 'Kavita Desai', age: 61, bed: 'ICU-A4', mews: 3, status: 'stable', responseTime: '1.5 min', admittedHours: 96, condition: 'Renal Failure', trend: 'stable' },
  { id: 'ICU-005', name: 'Vijay Kumar', age: 78, bed: 'ICU-B1', mews: 8, status: 'critical', responseTime: '4.2 min', admittedHours: 12, condition: 'MI + Cardiogenic Shock', trend: 'deteriorating' },
];

const mortalityTrend = [
  { month: 'Jul', rate: 3.2, benchmark: 2.8 }, { month: 'Aug', rate: 2.9, benchmark: 2.8 },
  { month: 'Sep', rate: 3.5, benchmark: 2.8 }, { month: 'Oct', rate: 2.6, benchmark: 2.7 },
  { month: 'Nov', rate: 2.4, benchmark: 2.7 }, { month: 'Dec', rate: 2.1, benchmark: 2.7 },
  { month: 'Jan', rate: 2.3, benchmark: 2.6 }, { month: 'Feb', rate: 1.9, benchmark: 2.6 },
];

const responseTimeData = [
  { dept: 'ICU', avg: 2.3, target: 3.0 }, { dept: 'Emergency', avg: 4.1, target: 5.0 },
  { dept: 'CCU', avg: 1.8, target: 3.0 }, { dept: 'NICU', avg: 2.1, target: 3.0 },
  { dept: 'General Ward', avg: 8.5, target: 10.0 },
];

const mortalityCause = [
  { name: 'Sepsis', value: 28, color: 'hsl(var(--destructive))' },
  { name: 'Cardiac', value: 22, color: 'hsl(var(--primary))' },
  { name: 'Respiratory', value: 18, color: 'hsl(var(--accent-foreground))' },
  { name: 'Neurological', value: 15, color: 'hsl(var(--muted-foreground))' },
  { name: 'Post-Surgical', value: 10, color: 'hsl(var(--secondary-foreground))' },
  { name: 'Other', value: 7, color: 'hsl(var(--border))' },
];

const protocolAdherence = [
  { protocol: 'Sepsis Bundle (3hr)', adherence: 87, target: 95 },
  { protocol: 'DVT Prophylaxis', adherence: 92, target: 95 },
  { protocol: 'VAP Prevention', adherence: 78, target: 90 },
  { protocol: 'CAUTI Prevention', adherence: 85, target: 90 },
  { protocol: 'Early Mobilization', adherence: 71, target: 85 },
  { protocol: 'Pain Assessment', adherence: 94, target: 95 },
];

const deteriorationAlerts = [
  { id: 1, patient: 'Vijay Kumar', bed: 'ICU-B1', alert: 'SpO2 dropped below 88%', time: '2 min ago', severity: 'critical', mews: 8 },
  { id: 2, patient: 'Ramesh Patel', bed: 'ICU-A1', alert: 'MAP <65 for 30 min', time: '8 min ago', severity: 'critical', mews: 7 },
  { id: 3, patient: 'Arjun Mehta', bed: 'ICU-B2', alert: 'Rising lactate (4.2 ΓåÆ 5.8)', time: '15 min ago', severity: 'warning', mews: 6 },
  { id: 4, patient: 'Ward-12 Bed 3', bed: 'W12-B3', alert: 'MEWS score increased to 5', time: '22 min ago', severity: 'warning', mews: 5 },
  { id: 5, patient: 'Ward-8 Bed 7', bed: 'W8-B7', alert: 'Urine output <0.5ml/kg/hr x 4hrs', time: '35 min ago', severity: 'moderate', mews: 4 },
];

export default function AdminMortalityAnalytics() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const period = timeRange === '7d' ? '24h' : '7d';
  const { snapshot, analytics, platformOn, error } = useAdminOperationalData(period);

  const liveKpis = useMemo(() => {
    if (!snapshot || !analytics) return null;
    const c = snapshot.counts;
    const bedPct = c.bedsOccupied + c.bedsAvailable > 0
      ? Math.round((c.bedsOccupied / (c.bedsOccupied + c.bedsAvailable)) * 100)
      : 0;
    return [
      { label: 'Discharges (period)', value: String(analytics.metrics.dischargeTurnaround ?? 0), change: 'Analytics API', icon: TrendingDown, good: true },
      { label: 'Nursing Missed', value: String(analytics.metrics.nursingMissed ?? 0), change: '24h/7d window', icon: Clock, good: (analytics.metrics.nursingMissed ?? 0) === 0 },
      { label: 'Open Escalations', value: String(c.openEscalations), change: 'Command snapshot', icon: Bell, good: c.openEscalations === 0 },
      { label: 'Lab Critical', value: String(c.labCriticalUnacked), change: 'Unacked critical', icon: Shield, good: c.labCriticalUnacked === 0 },
      { label: 'Bed Occupancy', value: `${bedPct}%`, change: `${c.bedsOccupied}/${c.bedsOccupied + c.bedsAvailable}`, icon: BedDouble, good: bedPct < 90 },
    ];
  }, [analytics, snapshot]);

  const handleAcknowledgeAlert = (id: number) => {
    toast.success(`Alert #${id} acknowledged. Care team notified.`);
  };

  const handleEscalate = (patientName: string) => {
    toast.success(`Rapid Response Team activated for ${patientName}`);
  };

  const kpiRow = liveKpis ?? [
    { label: 'Mortality Rate', value: '1.9%', change: '-0.4%', icon: TrendingDown, good: true },
    { label: 'Avg ICU Response', value: '2.3 min', change: '-0.8 min', icon: Clock, good: true },
    { label: 'Active Alerts', value: '5', change: '+2', icon: Bell, good: false },
    { label: 'Protocol Adherence', value: '84.5%', change: '+3.2%', icon: Shield, good: true },
    { label: 'ICU Occupancy', value: '82%', change: '', icon: BedDouble, good: true },
  ];

  return (
    <div className="space-y-4">
      {platformOn && (
        <PlatformConnectivityStrip
          label="Live safety signals"
          detail={`Escalations ${snapshot?.counts.openEscalations ?? 0} ┬╖ nursing missed ${analytics?.metrics.nursingMissed ?? 0}`}
          error={error}
        />
      )}
      {!platformOn && (
        <p className="text-xs text-muted-foreground border border-dashed rounded-lg px-3 py-2">
          ICU panels, mortality trends, and protocol charts are preview-only. Enable platform runtime for live operational safety KPIs.
        </p>
      )}
      <motion.div {...fadeIn(0)} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Heart className="w-5 h-5 text-destructive" /> Mortality Analytics & Patient Safety
          </h1>
          <p className="text-sm text-muted-foreground">ICU response tracking, deterioration alerts, and mortality trends</p>
        </div>
        <div className="flex gap-1.5 border rounded-lg overflow-hidden">
          {(['7d', '30d', '90d', '1y'] as const).map(r => (
            <button key={r} onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${timeRange === r ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {r}
            </button>
          ))}
        </div>
      </motion.div>

      {/* KPI Row */}
      <motion.div {...fadeIn(1)} className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {kpiRow.map((kpi, i) => (
          <Card key={i} className="border bg-card">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <kpi.icon className="w-4 h-4 text-muted-foreground" />
                {kpi.change && (
                  <span className={`text-[10px] font-medium flex items-center gap-0.5 ${kpi.good ? 'text-emerald-600' : 'text-destructive'}`}>
                    {kpi.good ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                    {kpi.change}
                  </span>
                )}
              </div>
              <p className="text-lg font-bold">{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Deterioration Alerts */}
      <motion.div {...fadeIn(2)}>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-destructive flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> Live Deterioration Alerts
              </p>
              <Badge variant="destructive" className="text-[10px]">{deteriorationAlerts.length} Active</Badge>
            </div>
            <div className="space-y-2">
              {deteriorationAlerts.map(alert => (
                <div key={alert.id} className="flex items-center justify-between bg-background border rounded-lg p-2.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${alert.severity === 'critical' ? 'bg-destructive' : alert.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                    <div>
                      <p className="text-xs font-medium">{alert.patient} <span className="text-muted-foreground">({alert.bed})</span></p>
                      <p className="text-[10px] text-muted-foreground">{alert.alert}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'} className="text-[10px]">
                      MEWS: {alert.mews}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{alert.time}</span>
                    {alert.severity === 'critical' && (
                      <Button size="sm" variant="destructive" className="h-6 text-[10px] px-2" onClick={() => handleEscalate(alert.patient)}>
                        Escalate
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => handleAcknowledgeAlert(alert.id)}>
                      Ack
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Mortality Trend */}
        <motion.div {...fadeIn(3)}>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" /> Mortality Rate Trend vs Benchmark
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={mortalityTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, background: 'hsl(var(--card))' }} />
                  <Area type="monotone" dataKey="rate" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.1)" name="Hospital Rate %" />
                  <Line type="monotone" dataKey="benchmark" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" name="National Benchmark %" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Response Time by Dept */}
        <motion.div {...fadeIn(4)}>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Avg Response Time by Department (min)
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={responseTimeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="dept" type="category" tick={{ fontSize: 10 }} width={80} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, background: 'hsl(var(--card))' }} />
                  <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Avg (min)" />
                  <Bar dataKey="target" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} name="Target (min)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Mortality by Cause */}
        <motion.div {...fadeIn(5)}>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Mortality by Cause (%)</p>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={mortalityCause} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                      {mortalityCause.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 flex-1">
                  {mortalityCause.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                        <span>{c.name}</span>
                      </div>
                      <span className="font-medium">{c.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Protocol Adherence */}
        <motion.div {...fadeIn(6)}>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Treatment Protocol Adherence
              </p>
              <div className="space-y-3">
                {protocolAdherence.map((p, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs">{p.protocol}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${p.adherence >= p.target ? 'text-emerald-600' : 'text-amber-600'}`}>{p.adherence}%</span>
                        <span className="text-[10px] text-muted-foreground">/ {p.target}%</span>
                      </div>
                    </div>
                    <Progress value={p.adherence} className="h-1.5" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ICU Patient Monitor */}
      <motion.div {...fadeIn(7)}>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> ICU Patient Monitor
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">Patient</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Bed</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Condition</th>
                    <th className="text-center py-2 font-medium text-muted-foreground">MEWS</th>
                    <th className="text-center py-2 font-medium text-muted-foreground">Response</th>
                    <th className="text-center py-2 font-medium text-muted-foreground">Trend</th>
                    <th className="text-center py-2 font-medium text-muted-foreground">Hours</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {icuPatients.map(p => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{p.name} <span className="text-muted-foreground">({p.age}y)</span></td>
                      <td className="py-2">{p.bed}</td>
                      <td className="py-2">{p.condition}</td>
                      <td className="py-2 text-center">
                        <Badge variant={p.mews >= 7 ? 'destructive' : p.mews >= 5 ? 'secondary' : 'outline'} className="text-[10px]">
                          {p.mews}
                        </Badge>
                      </td>
                      <td className="py-2 text-center">{p.responseTime}</td>
                      <td className="py-2 text-center">
                        <Badge variant={p.trend === 'deteriorating' ? 'destructive' : p.trend === 'improving' ? 'default' : 'outline'} className="text-[10px]">
                          {p.trend === 'deteriorating' ? 'Γåô' : p.trend === 'improving' ? 'Γåæ' : 'ΓåÆ'} {p.trend}
                        </Badge>
                      </td>
                      <td className="py-2 text-center">{p.admittedHours}h</td>
                      <td className="py-2 text-right">
                        {p.status === 'critical' && (
                          <Button size="sm" variant="destructive" className="h-6 text-[10px]" onClick={() => handleEscalate(p.name)}>
                            RRT
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
