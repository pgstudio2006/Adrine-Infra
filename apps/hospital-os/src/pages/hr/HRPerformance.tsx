import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Star, Download } from 'lucide-react';
import { useState } from 'react';

const performanceData = [
  { name: 'Dr. Rajesh Kumar', role: 'Doctor', dept: 'Cardiology', metric: 'Consultations', value: 142, target: 120, score: 92, period: 'Feb 2024' },
  { name: 'Dr. Ananya Mishra', role: 'Doctor', dept: 'Cardiology', metric: 'Consultations', value: 98, target: 100, score: 85, period: 'Feb 2024' },
  { name: 'Nurse Priya Shah', role: 'Nurse', dept: 'ICU', metric: 'Tasks Completed', value: 234, target: 200, score: 95, period: 'Feb 2024' },
  { name: 'Amit Patel', role: 'Lab Tech', dept: 'Pathology', metric: 'Tests Processed', value: 312, target: 300, score: 88, period: 'Feb 2024' },
  { name: 'Mohammed Irfan', role: 'Pharmacist', dept: 'Pharmacy', metric: 'Prescriptions', value: 456, target: 400, score: 91, period: 'Feb 2024' },
  { name: 'Sunita Verma', role: 'Receptionist', dept: 'Front Desk', metric: 'Registrations', value: 189, target: 180, score: 87, period: 'Feb 2024' },
];

const deptChart = [
  { dept: 'Cardiology', avg: 89 },
  { dept: 'ICU', avg: 92 },
  { dept: 'Emergency', avg: 88 },
  { dept: 'Pathology', avg: 85 },
  { dept: 'Pharmacy', avg: 91 },
  { dept: 'OT', avg: 90 },
  { dept: 'Radiology', avg: 86 },
];

export default function HRPerformance() {
  const [deptFilter, setDeptFilter] = useState('all');
  const filtered = deptFilter === 'all' ? performanceData : performanceData.filter(p => p.dept === deptFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Performance</h1>
          <p className="text-sm text-muted-foreground mt-1">Staff productivity metrics and performance reviews</p>
        </div>
        <Button variant="outline" className="gap-2 text-sm"><Download className="w-4 h-4" />Export</Button>
      </div>

      {/* Dept Performance Chart */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">Department Average Performance Score</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={deptChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="dept" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} domain={[70, 100]} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="avg" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Departments" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {[...new Set(performanceData.map(p => p.dept))].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Staff Performance Cards */}
      <div className="space-y-3">
        {filtered.map(p => (
          <Card key={p.name} className="p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <Badge variant="outline" className="text-[10px]">{p.role}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{p.dept}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{p.metric}: {p.value}/{p.target} · {p.period}</p>
              </div>
              <div className="flex items-center gap-1">
                <Star className={`w-4 h-4 ${p.score >= 90 ? 'text-warning fill-warning' : 'text-muted-foreground'}`} />
                <span className="text-lg font-bold text-foreground">{p.score}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={p.score} className={`h-2 flex-1 ${p.score >= 90 ? '[&>div]:bg-success' : p.score >= 80 ? '' : '[&>div]:bg-warning'}`} />
              <span className="text-xs text-muted-foreground">{p.score}%</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}