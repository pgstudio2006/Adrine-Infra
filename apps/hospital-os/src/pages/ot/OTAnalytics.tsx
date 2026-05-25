import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, TrendingUp, Clock, Scissors, AlertTriangle,
  CheckCircle2, Users, Calendar, Download
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { OperationsModulePage } from '@/components/operations/OperationsModulePage';

const MONTHLY_SURGERIES = [
  { month: 'Sep', total: 85, emergency: 12 },
  { month: 'Oct', total: 92, emergency: 15 },
  { month: 'Nov', total: 88, emergency: 10 },
  { month: 'Dec', total: 78, emergency: 8 },
  { month: 'Jan', total: 95, emergency: 14 },
  { month: 'Feb', total: 102, emergency: 11 },
  { month: 'Mar', total: 38, emergency: 5 },
];

const OT_UTILIZATION = [
  { room: 'OT-1', utilization: 82, surgeries: 45 },
  { room: 'OT-2', utilization: 75, surgeries: 38 },
  { room: 'OT-3', utilization: 45, surgeries: 22 },
  { room: 'OT-4', utilization: 68, surgeries: 52 },
];

const SPECIALTY_DIST = [
  { name: 'General Surgery', value: 35, color: 'hsl(var(--foreground))' },
  { name: 'Orthopedics', value: 25, color: 'hsl(var(--muted-foreground))' },
  { name: 'Cardiothoracic', value: 15, color: 'hsl(var(--info))' },
  { name: 'Ophthalmology', value: 12, color: 'hsl(var(--success))' },
  { name: 'Others', value: 13, color: 'hsl(var(--border))' },
];

const SURGEON_PERFORMANCE = [
  { name: 'Dr. Mehta', surgeries: 28, avgDuration: '1h 45m', complications: 1, cancellations: 0 },
  { name: 'Dr. Shah', surgeries: 22, avgDuration: '2h 30m', complications: 2, cancellations: 1 },
  { name: 'Dr. Kapoor', surgeries: 15, avgDuration: '3h 15m', complications: 0, cancellations: 0 },
  { name: 'Dr. Desai', surgeries: 18, avgDuration: '45m', complications: 0, cancellations: 1 },
  { name: 'Dr. Joshi', surgeries: 12, avgDuration: '2h 10m', complications: 1, cancellations: 0 },
  { name: 'Dr. Trivedi', surgeries: 8, avgDuration: '1h 20m', complications: 0, cancellations: 0 },
];

const DURATION_TREND = [
  { month: 'Sep', avg: 105 },
  { month: 'Oct', avg: 112 },
  { month: 'Nov', avg: 98 },
  { month: 'Dec', avg: 95 },
  { month: 'Jan', avg: 100 },
  { month: 'Feb', avg: 92 },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function OTAnalytics() {
  return (
    <OperationsModulePage
      module="ot"
      layout="dashboard"
      title="OT analytics"
      subtitle="Surgical performance metrics and operational insights"
      actions={<Button variant="outline" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" /> Export</Button>}
    >
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Surgeries (MTD)', value: '38', change: '+12%', icon: Scissors, color: 'text-foreground' },
          { label: 'Avg Duration', value: '1h 52m', change: '-8%', icon: Clock, color: 'text-info' },
          { label: 'Complication Rate', value: '2.1%', change: '-0.5%', icon: AlertTriangle, color: 'text-success' },
          { label: 'Cancellation Rate', value: '3.8%', change: '+0.2%', icon: CheckCircle2, color: 'text-warning' },
        ].map(s => (
          <motion.div key={s.label} variants={item}>
            <Card className="border-border/60 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <s.icon className={`h-5 w-5 mb-3 ${s.color}`} strokeWidth={1.5} />
                <p className="text-2xl font-bold tracking-tight">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                <p className={`text-xs mt-1 ${s.change.startsWith('-') ? 'text-success' : 'text-warning'}`}>{s.change} vs last month</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly Surgeries */}
        <motion.div variants={item}>
          <Card className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">Monthly Surgeries</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={MONTHLY_SURGERIES} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="total" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="emergency" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Specialty Distribution */}
        <motion.div variants={item}>
          <Card className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Scissors className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">By Specialty</span>
              </div>
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={SPECIALTY_DIST} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                      {SPECIALTY_DIST.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1">
                  {SPECIALTY_DIST.map(s => (
                    <div key={s.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-xs">{s.name}</span>
                      </div>
                      <span className="text-xs font-mono font-semibold">{s.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* OT Utilization + Duration Trend */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div variants={item}>
          <Card className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">OT Room Utilization</span>
              </div>
              <div className="space-y-4">
                {OT_UTILIZATION.map(r => (
                  <div key={r.room}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{r.room}</span>
                        <span className="text-[10px] text-muted-foreground">{r.surgeries} surgeries</span>
                      </div>
                      <span className="text-sm font-mono font-bold">{r.utilization}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted">
                      <div className={`h-full rounded-full transition-all ${r.utilization > 75 ? 'bg-success' : r.utilization > 50 ? 'bg-info' : 'bg-warning'}`}
                        style={{ width: `${r.utilization}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">Avg Duration Trend (min)</span>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={DURATION_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                  <Line type="monotone" dataKey="avg" stroke="hsl(var(--foreground))" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Surgeon Performance Table */}
      <motion.div variants={item}>
        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">Surgeon Performance</span>
            </div>
            <div className="space-y-2">
              {SURGEON_PERFORMANCE.map(s => (
                <div key={s.name} className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-bold">
                      {s.name.split(' ')[1]?.[0] || s.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground">{s.surgeries} surgeries • Avg {s.avgDuration}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground">Complications</p>
                      <p className={`text-sm font-mono font-bold ${s.complications === 0 ? 'text-success' : 'text-warning'}`}>{s.complications}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground">Cancellations</p>
                      <p className={`text-sm font-mono font-bold ${s.cancellations === 0 ? 'text-success' : 'text-warning'}`}>{s.cancellations}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
      </motion.div>
    </OperationsModulePage>
  );
}
