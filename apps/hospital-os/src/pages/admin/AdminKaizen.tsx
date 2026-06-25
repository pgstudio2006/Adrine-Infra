import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AppSelect } from '@/components/ui/app-select';
import { toast } from 'sonner';
import {
  Target, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2,
  Clock, Users, BarChart3, Plus, ArrowRight, Repeat, Shield, Zap
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const fadeIn = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.3 },
});

const errorMetrics = [
  { month: 'Jul', medicationErrors: 12, labErrors: 8, documentationErrors: 15, fallIncidents: 3 },
  { month: 'Aug', medicationErrors: 10, labErrors: 7, documentationErrors: 14, fallIncidents: 2 },
  { month: 'Sep', medicationErrors: 8, labErrors: 6, documentationErrors: 11, fallIncidents: 3 },
  { month: 'Oct', medicationErrors: 7, labErrors: 5, documentationErrors: 9, fallIncidents: 1 },
  { month: 'Nov', medicationErrors: 6, labErrors: 4, documentationErrors: 8, fallIncidents: 2 },
  { month: 'Dec', medicationErrors: 5, labErrors: 3, documentationErrors: 7, fallIncidents: 1 },
  { month: 'Jan', medicationErrors: 4, labErrors: 3, documentationErrors: 6, fallIncidents: 1 },
  { month: 'Feb', medicationErrors: 3, labErrors: 2, documentationErrors: 5, fallIncidents: 0 },
];

const processMetrics = [
  { process: 'Patient Registration → OPD', target: '15 min', actual: '22 min', status: 'improving', improvement: '-3 min' },
  { process: 'Lab Sample → Report', target: '4 hrs', actual: '5.2 hrs', status: 'warning', improvement: '-0.8 hr' },
  { process: 'ER Triage → Treatment', target: '10 min', actual: '12 min', status: 'good', improvement: '-5 min' },
  { process: 'Discharge Order → Release', target: '2 hrs', actual: '3.8 hrs', status: 'critical', improvement: '-0.2 hr' },
  { process: 'Prescription → Dispensing', target: '20 min', actual: '18 min', status: 'achieved', improvement: '-7 min' },
  { process: 'OT Request → Schedule', target: '24 hrs', actual: '28 hrs', status: 'improving', improvement: '-4 hr' },
];

const kaizenBoard = [
  { id: 1, title: 'Reduce discharge turnaround time', dept: 'IPD', status: 'in-progress', owner: 'Nurse Mgr Priya', impact: 'high', daysActive: 15, progress: 45 },
  { id: 2, title: 'Standardize medication reconciliation', dept: 'Pharmacy', status: 'in-progress', owner: 'Dr. Anil', impact: 'critical', daysActive: 30, progress: 72 },
  { id: 3, title: 'Digital pre-surgical checklist', dept: 'OT', status: 'completed', owner: 'OT Coord. Rajan', impact: 'high', daysActive: 45, progress: 100 },
  { id: 4, title: 'Automate lab critical value alerts', dept: 'Lab', status: 'planned', owner: 'Lab Head', impact: 'critical', daysActive: 0, progress: 0 },
  { id: 5, title: 'Reduce patient wait time in OPD', dept: 'Reception', status: 'in-progress', owner: 'Front Desk Lead', impact: 'medium', daysActive: 20, progress: 35 },
  { id: 6, title: 'Hand hygiene compliance audit system', dept: 'Infection Control', status: 'in-progress', owner: 'IC Nurse', impact: 'high', daysActive: 10, progress: 20 },
];

const incidentLog = [
  { id: 1, date: '08 Mar', type: 'Medication Error', severity: 'moderate', dept: 'Ward 3', description: 'Wrong dosage transcribed — caught before administration', status: 'resolved', rca: 'completed' },
  { id: 2, date: '07 Mar', type: 'Fall Incident', severity: 'minor', dept: 'Ward 5', description: 'Patient slipped near bathroom — no injury', status: 'resolved', rca: 'completed' },
  { id: 3, date: '06 Mar', type: 'Documentation Gap', severity: 'low', dept: 'OPD', description: 'Allergy not documented in patient chart', status: 'under-review', rca: 'pending' },
  { id: 4, date: '05 Mar', type: 'Lab Delay', severity: 'moderate', dept: 'Lab', description: 'Stat CBC delayed by 45 min due to equipment issue', status: 'resolved', rca: 'completed' },
];

export default function AdminKaizen() {
  const [showNewImprovement, setShowNewImprovement] = useState(false);
  const [newInitiativeImpact, setNewInitiativeImpact] = useState('Critical Impact');

  const handleAddImprovement = () => {
    toast.success('Kaizen improvement initiative created');
    setShowNewImprovement(false);
  };

  return (
    <div className="space-y-4">
      <motion.div {...fadeIn(0)} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Repeat className="w-5 h-5 text-primary" /> Kaizen — Continuous Improvement
          </h1>
          <p className="text-sm text-muted-foreground">Process discipline tracking, operational error metrics & improvement initiatives</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowNewImprovement(true)}>
          <Plus className="w-3.5 h-3.5" /> New Initiative
        </Button>
      </motion.div>

      {/* KPIs */}
      <motion.div {...fadeIn(1)} className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Errors (MTD)', value: '10', change: '-58%', icon: TrendingDown, good: true },
          { label: 'Active Initiatives', value: '4', change: '', icon: Target, good: true },
          { label: 'Process Compliance', value: '87%', change: '+5%', icon: Shield, good: true },
          { label: 'Avg Cycle Time', value: '18 min', change: '-3 min', icon: Clock, good: true },
          { label: 'Near-Miss Reports', value: '6', change: '', icon: AlertTriangle, good: true },
        ].map((kpi, i) => (
          <Card key={i}>
            <CardContent className="p-3">
              <kpi.icon className="w-4 h-4 text-muted-foreground mb-1" />
              <p className="text-lg font-bold">{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
              {kpi.change && <p className="text-[10px] text-emerald-600 font-medium">{kpi.change}</p>}
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Error Trend */}
      <motion.div {...fadeIn(2)}>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" /> Operational Error Trends (Monthly)
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={errorMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, background: 'hsl(var(--card))' }} />
                <Line type="monotone" dataKey="medicationErrors" stroke="hsl(var(--destructive))" name="Medication" strokeWidth={2} />
                <Line type="monotone" dataKey="labErrors" stroke="hsl(var(--primary))" name="Lab" strokeWidth={2} />
                <Line type="monotone" dataKey="documentationErrors" stroke="hsl(var(--muted-foreground))" name="Documentation" strokeWidth={2} />
                <Line type="monotone" dataKey="fallIncidents" stroke="#f59e0b" name="Falls" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Process Cycle Times */}
        <motion.div {...fadeIn(3)}>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Process Cycle Time vs Target
              </p>
              <div className="space-y-3">
                {processMetrics.map((p, i) => (
                  <div key={i} className="border rounded-lg p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{p.process}</span>
                      <Badge variant={
                        p.status === 'achieved' ? 'default' :
                        p.status === 'good' ? 'secondary' :
                        p.status === 'critical' ? 'destructive' : 'outline'
                      } className="text-[10px]">{p.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Target: {p.target} • Actual: <strong className="text-foreground">{p.actual}</strong></span>
                      <span className="text-emerald-600 font-medium">{p.improvement}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Kaizen Board */}
        <motion.div {...fadeIn(4)}>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Kaizen Improvement Board
              </p>
              <div className="space-y-2">
                {kaizenBoard.map(k => (
                  <div key={k.id} className="border rounded-lg p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{k.title}</span>
                      <Badge variant={k.status === 'completed' ? 'default' : k.status === 'in-progress' ? 'secondary' : 'outline'} className="text-[10px]">
                        {k.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                      <span>{k.dept} • {k.owner}</span>
                      <Badge variant={k.impact === 'critical' ? 'destructive' : 'outline'} className="text-[8px]">{k.impact}</Badge>
                    </div>
                    <Progress value={k.progress} className="h-1.5" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Incident Log */}
      <motion.div {...fadeIn(5)}>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Recent Incident Log
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Dept</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Description</th>
                    <th className="text-center py-2 font-medium text-muted-foreground">Severity</th>
                    <th className="text-center py-2 font-medium text-muted-foreground">RCA</th>
                  </tr>
                </thead>
                <tbody>
                  {incidentLog.map(inc => (
                    <tr key={inc.id} className="border-b last:border-0">
                      <td className="py-2">{inc.date}</td>
                      <td className="py-2 font-medium">{inc.type}</td>
                      <td className="py-2">{inc.dept}</td>
                      <td className="py-2 text-muted-foreground max-w-xs truncate">{inc.description}</td>
                      <td className="py-2 text-center">
                        <Badge variant={inc.severity === 'moderate' ? 'secondary' : 'outline'} className="text-[10px]">{inc.severity}</Badge>
                      </td>
                      <td className="py-2 text-center">
                        <Badge variant={inc.rca === 'completed' ? 'default' : 'outline'} className="text-[10px]">{inc.rca}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* New Initiative Dialog */}
      {showNewImprovement && (
        <motion.div {...fadeIn(0)} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowNewImprovement(false)}>
          <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-semibold">New Kaizen Initiative</p>
              <Input placeholder="Initiative title" className="h-8 text-xs" />
              <div className="flex gap-2">
                <Input placeholder="Department" className="h-8 text-xs flex-1" />
                <Input placeholder="Owner" className="h-8 text-xs flex-1" />
              </div>
              <Textarea placeholder="Describe the improvement goal..." className="text-xs min-h-[60px] resize-none" />
              <AppSelect
                value={newInitiativeImpact}
                onValueChange={setNewInitiativeImpact}
                options={[
                  { value: 'Critical Impact', label: 'Critical Impact' },
                  { value: 'High Impact', label: 'High Impact' },
                  { value: 'Medium Impact', label: 'Medium Impact' },
                  { value: 'Low Impact', label: 'Low Impact' },
                ]}
                className="w-full h-8 text-xs"
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowNewImprovement(false)}>Cancel</Button>
                <Button size="sm" className="flex-1" onClick={handleAddImprovement}>Create</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
