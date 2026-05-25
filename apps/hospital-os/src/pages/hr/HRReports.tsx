import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, FileText, Users, Clock, TrendingUp } from 'lucide-react';

const attendanceTrend = [
  { month: 'Sep', present: 92, late: 4, absent: 4 },
  { month: 'Oct', present: 91, late: 5, absent: 4 },
  { month: 'Nov', present: 93, late: 3, absent: 4 },
  { month: 'Dec', present: 89, late: 6, absent: 5 },
  { month: 'Jan', present: 90, late: 5, absent: 5 },
  { month: 'Feb', present: 94, late: 3, absent: 3 },
];

const turnoverData = [
  { month: 'Sep', joined: 5, left: 2 },
  { month: 'Oct', joined: 3, left: 1 },
  { month: 'Nov', joined: 4, left: 3 },
  { month: 'Dec', joined: 2, left: 2 },
  { month: 'Jan', joined: 6, left: 1 },
  { month: 'Feb', joined: 5, left: 2 },
];

const roleDistribution = [
  { name: 'Doctors', value: 65, color: 'hsl(var(--foreground))' },
  { name: 'Nurses', value: 95, color: 'hsl(var(--muted-foreground))' },
  { name: 'Technicians', value: 42, color: 'hsl(var(--info))' },
  { name: 'Admin & Support', value: 80, color: 'hsl(var(--warning))' },
  { name: 'Pharmacy', value: 20, color: 'hsl(var(--success))' },
  { name: 'Others', value: 40, color: 'hsl(var(--destructive))' },
];

const reportTemplates = [
  { title: 'Staff Attendance Report', desc: 'Monthly attendance summary with late/absent details', icon: Clock },
  { title: 'Department Staffing Report', desc: 'Current staffing levels across all departments', icon: Users },
  { title: 'Leave Utilization Report', desc: 'Leave type distribution and balance summary', icon: FileText },
  { title: 'Training Compliance Report', desc: 'Mandatory training completion rates', icon: FileText },
  { title: 'Staff Turnover Analysis', desc: 'Hiring vs attrition trends', icon: TrendingUp },
  { title: 'Credential Expiry Report', desc: 'Upcoming license and certification renewals', icon: FileText },
];

export default function HRReports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">HR Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Workforce analytics and HR documentation</p>
        </div>
        <Button variant="outline" className="gap-2 text-sm"><Download className="w-4 h-4" />Export All</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Staff', value: '342', change: '+5 this month' },
          { label: 'Avg Attendance', value: '94%', change: '↑ 2% vs last month' },
          { label: 'Turnover Rate', value: '2.1%', change: '↓ 0.4% improvement' },
          { label: 'Training Compliance', value: '86%', change: '4 programs active' },
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
              <h3 className="text-sm font-semibold text-foreground mb-4">Attendance Trend (%)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} domain={[80, 100]} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="present" stroke="hsl(var(--foreground))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">Staff Turnover</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={turnoverData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="joined" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Joined" />
                  <Bar dataKey="left" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Left" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Staff Distribution by Role</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={roleDistribution} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`} fontSize={11}>
                  {roleDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
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