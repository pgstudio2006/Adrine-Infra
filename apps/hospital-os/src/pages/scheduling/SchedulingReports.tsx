import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, FileText, Users, Clock, TrendingUp, UserX } from 'lucide-react';

const volumeData = [
  { day: 'Mon', total: 92, opd: 65, followUp: 15, teleconsult: 12 },
  { day: 'Tue', total: 88, opd: 58, followUp: 18, teleconsult: 12 },
  { day: 'Wed', total: 95, opd: 68, followUp: 14, teleconsult: 13 },
  { day: 'Thu', total: 102, opd: 72, followUp: 16, teleconsult: 14 },
  { day: 'Fri', total: 98, opd: 70, followUp: 15, teleconsult: 13 },
  { day: 'Sat', total: 78, opd: 55, followUp: 12, teleconsult: 11 },
];

const noShowTrend = [
  { week: 'W1', rate: 6.2 }, { week: 'W2', rate: 5.8 }, { week: 'W3', rate: 4.5 },
  { week: 'W4', rate: 5.1 }, { week: 'W5', rate: 4.7 }, { week: 'W6', rate: 3.9 },
];

const deptDistribution = [
  { name: 'Cardiology', value: 22, color: 'hsl(var(--foreground))' },
  { name: 'Gen. Medicine', value: 28, color: 'hsl(var(--muted-foreground))' },
  { name: 'Orthopedics', value: 15, color: 'hsl(var(--info))' },
  { name: 'ENT', value: 10, color: 'hsl(var(--warning))' },
  { name: 'Dermatology', value: 12, color: 'hsl(var(--success))' },
  { name: 'Others', value: 13, color: 'hsl(var(--destructive))' },
];

const doctorLoad = [
  { doctor: 'Dr. Sharma', appointments: 30 },
  { doctor: 'Dr. Kumar', appointments: 24 },
  { doctor: 'Dr. Mishra', appointments: 18 },
  { doctor: 'Dr. Singh', appointments: 15 },
  { doctor: 'Dr. Patel', appointments: 12 },
  { doctor: 'Dr. Gupta', appointments: 8 },
];

const reportTemplates = [
  { title: 'Daily Appointment Report', desc: 'All appointments with status breakdown', icon: FileText },
  { title: 'No-Show Analysis', desc: 'No-show rates by doctor, department, time', icon: UserX },
  { title: 'Doctor Load Report', desc: 'Appointment distribution per doctor', icon: Users },
  { title: 'Cancellation Report', desc: 'Cancellation reasons and trends', icon: FileText },
  { title: 'Wait Time Analysis', desc: 'Average patient wait times', icon: Clock },
  { title: 'Resource Utilization', desc: 'Equipment and room booking rates', icon: TrendingUp },
];

export default function SchedulingReports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Scheduling Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Appointment analytics and performance metrics</p>
        </div>
        <Button variant="outline" className="gap-2 text-sm"><Download className="w-4 h-4" />Export</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Weekly Appointments', value: '553', change: '+8% vs last week' },
          { label: 'Avg Wait Time', value: '14 min', change: '↓ 3 min improvement' },
          { label: 'No-Show Rate', value: '3.9%', change: '↓ 1.2% this month' },
          { label: 'Cancellation Rate', value: '6.4%', change: 'Stable' },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{s.change}</p>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="analytics">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-4 space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">Weekly Appointment Volume</h3>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="opd" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} name="OPD" />
                  <Bar dataKey="followUp" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} name="Follow-up" />
                  <Bar dataKey="teleconsult" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} name="Teleconsult" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">No-Show Rate Trend (%)</h3>
              <ResponsiveContainer width="100%" height={230}>
                <LineChart data={noShowTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 10]} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="rate" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">Department Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={deptDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {deptDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">Doctor Appointment Load</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={doctorLoad} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis dataKey="doctor" type="category" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={80} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="appointments" fill="hsl(var(--foreground))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTemplates.map(r => (
              <Card key={r.title} className="p-4 hover:shadow-sm transition-shadow cursor-pointer">
                <r.icon className="w-5 h-5 text-muted-foreground mb-3" />
                <h3 className="text-sm font-semibold text-foreground">{r.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
                <Button variant="outline" size="sm" className="text-xs mt-3 gap-1"><Download className="w-3 h-3" />Generate</Button>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}