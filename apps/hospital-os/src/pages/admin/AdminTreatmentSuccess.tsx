import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  CheckCircle2, TrendingUp, BarChart3, Users, Activity,
  Target, Award, Clock, ArrowUpRight, Download
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, AreaChart, Area, LineChart, Line } from 'recharts';

const fadeIn = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.3 },
});

const departmentOutcomes = [
  { dept: 'General Medicine', treated: 1240, successful: 1178, rate: 95.0, readmission: 4.2, avgLOS: 3.2 },
  { dept: 'General Surgery', treated: 680, successful: 639, rate: 94.0, readmission: 5.1, avgLOS: 5.8 },
  { dept: 'Cardiology', treated: 420, successful: 386, rate: 91.9, readmission: 6.8, avgLOS: 6.4 },
  { dept: 'Orthopedics', treated: 350, successful: 332, rate: 94.9, readmission: 3.5, avgLOS: 7.2 },
  { dept: 'Pediatrics', treated: 560, successful: 542, rate: 96.8, readmission: 2.1, avgLOS: 2.8 },
  { dept: 'Obstetrics', treated: 310, successful: 301, rate: 97.1, readmission: 1.8, avgLOS: 3.5 },
  { dept: 'Neurology', treated: 180, successful: 162, rate: 90.0, readmission: 7.2, avgLOS: 8.1 },
  { dept: 'Nephrology', treated: 220, successful: 198, rate: 90.0, readmission: 8.5, avgLOS: 5.5 },
];

const outcomesTrend = [
  { month: 'Jul', success: 92.1, readmission: 6.8, complications: 5.2 },
  { month: 'Aug', success: 92.8, readmission: 6.2, complications: 4.8 },
  { month: 'Sep', success: 93.5, readmission: 5.8, complications: 4.5 },
  { month: 'Oct', success: 93.8, readmission: 5.5, complications: 4.2 },
  { month: 'Nov', success: 94.2, readmission: 5.1, complications: 3.8 },
  { month: 'Dec', success: 94.5, readmission: 4.8, complications: 3.5 },
  { month: 'Jan', success: 94.8, readmission: 4.5, complications: 3.2 },
  { month: 'Feb', success: 95.2, readmission: 4.2, complications: 3.0 },
];

const surgicalOutcomes = [
  { procedure: 'Appendectomy', cases: 85, success: 98.8, complications: 1.2, avgDuration: '45 min' },
  { procedure: 'Cholecystectomy', cases: 62, success: 97.8, complications: 2.2, avgDuration: '55 min' },
  { procedure: 'Hernia Repair', cases: 78, success: 98.2, complications: 1.8, avgDuration: '40 min' },
  { procedure: 'CABG', cases: 28, success: 92.9, complications: 7.1, avgDuration: '4.5 hrs' },
  { procedure: 'Total Knee Replacement', cases: 35, success: 94.3, complications: 5.7, avgDuration: '2 hrs' },
  { procedure: 'C-Section', cases: 120, success: 99.2, complications: 0.8, avgDuration: '35 min' },
];

const doctorPerformance = [
  { name: 'Dr. Anil Sharma', dept: 'Gen Medicine', patients: 280, successRate: 96.4, satisfaction: 4.8 },
  { name: 'Dr. Meena Gupta', dept: 'Cardiology', patients: 145, successRate: 93.1, satisfaction: 4.7 },
  { name: 'Dr. Rajesh Kumar', dept: 'Surgery', patients: 120, successRate: 95.8, satisfaction: 4.6 },
  { name: 'Dr. Priya Patel', dept: 'Pediatrics', patients: 210, successRate: 97.1, satisfaction: 4.9 },
  { name: 'Dr. Vijay Desai', dept: 'Orthopedics', patients: 95, successRate: 94.7, satisfaction: 4.5 },
];

const qualityRadar = [
  { metric: 'Treatment Success', value: 95 },
  { metric: 'Patient Satisfaction', value: 88 },
  { metric: 'Readmission Rate', value: 92 },
  { metric: 'Infection Control', value: 85 },
  { metric: 'Documentation', value: 78 },
  { metric: 'Protocol Adherence', value: 87 },
];

export default function AdminTreatmentSuccess() {
  return (
    <div className="space-y-4">
      <motion.div {...fadeIn(0)} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" /> Treatment Success & Outcomes
          </h1>
          <p className="text-sm text-muted-foreground">Clinical outcomes measurement, doctor performance & quality metrics</p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => toast.success('Outcomes report exported')}>
          <Download className="w-3.5 h-3.5" /> Export
        </Button>
      </motion.div>

      {/* KPIs */}
      <motion.div {...fadeIn(1)} className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Overall Success Rate', value: '95.2%', change: '+0.4%' },
          { label: 'Readmission Rate', value: '4.2%', change: '-0.3%' },
          { label: 'Complication Rate', value: '3.0%', change: '-0.2%' },
          { label: 'Avg Length of Stay', value: '4.2 days', change: '-0.3d' },
          { label: 'Patient Satisfaction', value: '4.7/5', change: '+0.1' },
        ].map((kpi, i) => (
          <Card key={i}>
            <CardContent className="p-3">
              <p className="text-lg font-bold">{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
              <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> {kpi.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Outcomes Trend */}
      <motion.div {...fadeIn(2)}>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Treatment Outcomes Trend (%)</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={outcomesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, background: 'hsl(var(--card))' }} />
                <Area type="monotone" dataKey="success" fill="hsl(142 76% 36% / 0.2)" stroke="hsl(142 76% 36%)" name="Success %" strokeWidth={2} />
                <Line type="monotone" dataKey="readmission" stroke="hsl(var(--primary))" name="Readmission %" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="complications" stroke="hsl(var(--destructive))" name="Complications %" strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Department Outcomes Table */}
        <motion.div {...fadeIn(3)}>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Department-wise Outcomes</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-muted-foreground">Department</th>
                      <th className="text-center py-2 font-medium text-muted-foreground">Cases</th>
                      <th className="text-center py-2 font-medium text-muted-foreground">Success</th>
                      <th className="text-center py-2 font-medium text-muted-foreground">Readmit</th>
                      <th className="text-center py-2 font-medium text-muted-foreground">LOS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentOutcomes.map((d, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 font-medium">{d.dept}</td>
                        <td className="py-2 text-center">{d.treated}</td>
                        <td className="py-2 text-center">
                          <Badge variant={d.rate >= 95 ? 'default' : d.rate >= 92 ? 'secondary' : 'outline'} className="text-[10px]">
                            {d.rate}%
                          </Badge>
                        </td>
                        <td className="py-2 text-center text-muted-foreground">{d.readmission}%</td>
                        <td className="py-2 text-center text-muted-foreground">{d.avgLOS}d</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quality Radar */}
        <motion.div {...fadeIn(4)}>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Quality Score Radar</p>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={qualityRadar}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Surgical Outcomes */}
        <motion.div {...fadeIn(5)}>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Surgical Procedure Outcomes</p>
              <div className="space-y-2">
                {surgicalOutcomes.map((s, i) => (
                  <div key={i} className="flex items-center justify-between border rounded-lg p-2.5">
                    <div>
                      <p className="text-xs font-medium">{s.procedure}</p>
                      <p className="text-[10px] text-muted-foreground">{s.cases} cases • Avg: {s.avgDuration}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-xs font-bold text-emerald-600">{s.success}%</p>
                        <p className="text-[10px] text-muted-foreground">{s.complications}% comp.</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Doctor Performance */}
        <motion.div {...fadeIn(6)}>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Doctor Outcomes Scorecard
              </p>
              <div className="space-y-2">
                {doctorPerformance.map((d, i) => (
                  <div key={i} className="flex items-center justify-between border rounded-lg p-2.5">
                    <div>
                      <p className="text-xs font-medium">{d.name}</p>
                      <p className="text-[10px] text-muted-foreground">{d.dept} • {d.patients} patients</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-xs font-bold">{d.successRate}%</p>
                        <p className="text-[8px] text-muted-foreground">Success</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold">⭐ {d.satisfaction}</p>
                        <p className="text-[8px] text-muted-foreground">Rating</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
