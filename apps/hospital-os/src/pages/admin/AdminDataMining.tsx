import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Database, TrendingUp, Users, Shield, Download, BarChart3,
  Activity, Globe, FileText, Layers, PieChart as PieIcon
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';

const fadeIn = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.3 },
});

const diseasePrevalence = [
  { disease: 'Type 2 Diabetes', cases: 2840, rate: 12.4, trend: '+2.1%' },
  { disease: 'Hypertension', cases: 3120, rate: 13.6, trend: '+1.8%' },
  { disease: 'COPD', cases: 890, rate: 3.9, trend: '-0.4%' },
  { disease: 'Coronary Artery Disease', cases: 1450, rate: 6.3, trend: '+0.9%' },
  { disease: 'Chronic Kidney Disease', cases: 670, rate: 2.9, trend: '+1.2%' },
  { disease: 'Dengue (Seasonal)', cases: 340, rate: 1.5, trend: '+45%' },
  { disease: 'Tuberculosis', cases: 280, rate: 1.2, trend: '-3.2%' },
  { disease: 'Anemia', cases: 1890, rate: 8.2, trend: '-0.8%' },
];

const ageDistribution = [
  { group: '0-10', male: 1200, female: 1100 }, { group: '11-20', male: 800, female: 900 },
  { group: '21-30', male: 1500, female: 1800 }, { group: '31-40', male: 2100, female: 2400 },
  { group: '41-50', male: 2800, female: 2200 }, { group: '51-60', male: 3100, female: 2600 },
  { group: '61-70', male: 2400, female: 2100 }, { group: '71+', male: 1200, female: 900 },
];

const treatmentOutcomes = [
  { month: 'Jul', successful: 92, complications: 5, readmission: 3 },
  { month: 'Aug', successful: 91, complications: 6, readmission: 3 },
  { month: 'Sep', successful: 93, complications: 4, readmission: 3 },
  { month: 'Oct', successful: 94, complications: 4, readmission: 2 },
  { month: 'Nov', successful: 95, complications: 3, readmission: 2 },
  { month: 'Dec', successful: 94, complications: 4, readmission: 2 },
  { month: 'Jan', successful: 96, complications: 2, readmission: 2 },
  { month: 'Feb', successful: 95, complications: 3, readmission: 2 },
];

const datasetSummary = [
  { name: 'Patient Records', records: '23,450', anonymized: true, lastUpdated: '2 hours ago' },
  { name: 'Lab Results', records: '1,45,670', anonymized: true, lastUpdated: '30 min ago' },
  { name: 'Prescription Data', records: '89,340', anonymized: true, lastUpdated: '1 hour ago' },
  { name: 'Radiology Reports', records: '12,890', anonymized: true, lastUpdated: '4 hours ago' },
  { name: 'Billing Transactions', records: '67,450', anonymized: false, lastUpdated: '15 min ago' },
];

const populationInsights = [
  { metric: 'Avg Patient Age', value: '45.2 years', change: '+0.8y' },
  { metric: 'Male:Female Ratio', value: '1.12:1', change: '' },
  { metric: 'Avg Length of Stay', value: '4.2 days', change: '-0.3d' },
  { metric: 'Readmission Rate (30d)', value: '8.4%', change: '-1.2%' },
  { metric: 'Insurance Coverage', value: '62%', change: '+5%' },
  { metric: 'Chronic Disease %', value: '34%', change: '+2%' },
];

export default function AdminDataMining() {
  const handleExportReport = (type: string) => {
    toast.success(`${type} report exported (anonymized)`);
  };

  return (
    <div className="space-y-4">
      <motion.div {...fadeIn(0)} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" /> Healthcare Data Mining
          </h1>
          <p className="text-sm text-muted-foreground">Population-level analytics, disease prevalence & anonymized health insights</p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleExportReport('Full Analytics')}>
          <Download className="w-3.5 h-3.5" /> Export Report
        </Button>
      </motion.div>

      {/* Data Privacy Banner */}
      <motion.div {...fadeIn(1)}>
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-3 flex items-center gap-3">
            <Shield className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-medium text-emerald-700">Data Anonymization Active</p>
              <p className="text-[10px] text-emerald-600">All patient identifiers are stripped. Data complies with DISHA and HIPAA standards.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Population KPIs */}
      <motion.div {...fadeIn(2)} className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {populationInsights.map((p, i) => (
          <Card key={i}>
            <CardContent className="p-3">
              <p className="text-lg font-bold">{p.value}</p>
              <p className="text-[10px] text-muted-foreground">{p.metric}</p>
              {p.change && <p className="text-[10px] text-emerald-600 font-medium">{p.change}</p>}
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Disease Prevalence */}
        <motion.div {...fadeIn(3)}>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Disease Prevalence (per 1000 patients)
              </p>
              <div className="space-y-2">
                {diseasePrevalence.map((d, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs w-44 shrink-0">{d.disease}</span>
                    <div className="flex-1">
                      <Progress value={d.rate * 5} className="h-1.5" />
                    </div>
                    <span className="text-xs font-bold w-10 text-right">{d.rate}</span>
                    <span className={`text-[10px] w-12 text-right ${d.trend.startsWith('+') ? 'text-destructive' : 'text-emerald-600'}`}>{d.trend}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Age Distribution */}
        <motion.div {...fadeIn(4)}>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Patient Age & Gender Distribution
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ageDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="group" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, background: 'hsl(var(--card))' }} />
                  <Bar dataKey="male" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} name="Male" />
                  <Bar dataKey="female" fill="hsl(var(--primary) / 0.4)" radius={[2, 2, 0, 0]} name="Female" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Treatment Outcomes */}
        <motion.div {...fadeIn(5)}>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Treatment Outcomes Trend (%)
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={treatmentOutcomes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, background: 'hsl(var(--card))' }} />
                  <Area type="monotone" dataKey="successful" fill="hsl(142 76% 36% / 0.2)" stroke="hsl(142 76% 36%)" name="Successful %" />
                  <Area type="monotone" dataKey="complications" fill="hsl(var(--destructive) / 0.1)" stroke="hsl(var(--destructive))" name="Complications %" />
                  <Area type="monotone" dataKey="readmission" fill="hsl(var(--primary) / 0.1)" stroke="hsl(var(--primary))" name="Readmission %" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Datasets */}
        <motion.div {...fadeIn(6)}>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Data Infrastructure
              </p>
              <div className="space-y-2">
                {datasetSummary.map((d, i) => (
                  <div key={i} className="flex items-center justify-between border rounded-lg p-2.5">
                    <div>
                      <p className="text-xs font-medium">{d.name}</p>
                      <p className="text-[10px] text-muted-foreground">{d.records} records • Updated {d.lastUpdated}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {d.anonymized ? (
                        <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                          <Shield className="w-2.5 h-2.5 mr-1" /> Anonymized
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">Pending</Badge>
                      )}
                      <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => handleExportReport(d.name)}>
                        <Download className="w-3 h-3" />
                      </Button>
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
