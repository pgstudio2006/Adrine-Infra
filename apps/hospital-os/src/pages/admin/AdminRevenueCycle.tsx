import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  TrendingUp, IndianRupee, AlertTriangle, BarChart3, PieChart as PieIcon,
  ArrowUpRight, ArrowDownRight, Target, Zap, FileText, Download
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line } from 'recharts';
import { useHospital } from '@/stores/hospitalStore';
import { PlatformConnectivityStrip } from '@/components/PlatformConnectivityStrip';
import { useAdminOperationalData } from '@/hooks/useAdminOperationalData';

const fadeIn = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.3 },
});

const revenueByDept = [
  { dept: 'OPD', revenue: 28.5, cost: 12.2, margin: 57 },
  { dept: 'IPD', revenue: 45.2, cost: 28.1, margin: 38 },
  { dept: 'Emergency', revenue: 12.8, cost: 8.4, margin: 34 },
  { dept: 'Lab', revenue: 18.4, cost: 6.2, margin: 66 },
  { dept: 'Radiology', revenue: 15.6, cost: 7.8, margin: 50 },
  { dept: 'Pharmacy', revenue: 22.1, cost: 16.5, margin: 25 },
  { dept: 'OT/Surgery', revenue: 35.8, cost: 18.2, margin: 49 },
];

const monthlyRevenue = [
  { month: 'Jul', revenue: 142, collection: 128, outstanding: 14 },
  { month: 'Aug', revenue: 155, collection: 138, outstanding: 17 },
  { month: 'Sep', revenue: 148, collection: 135, outstanding: 13 },
  { month: 'Oct', revenue: 168, collection: 152, outstanding: 16 },
  { month: 'Nov', revenue: 172, collection: 158, outstanding: 14 },
  { month: 'Dec', revenue: 185, collection: 170, outstanding: 15 },
  { month: 'Jan', revenue: 178, collection: 165, outstanding: 13 },
  { month: 'Feb', revenue: 192, collection: 180, outstanding: 12 },
];

const leakagePoints = [
  { area: 'Unbilled Procedures', amount: 'Γé╣4.2L', impact: 'high', description: '23 procedures not linked to billing' },
  { area: 'Insurance Claim Rejections', amount: 'Γé╣8.5L', impact: 'critical', description: '45 claims rejected ΓÇö incomplete documentation' },
  { area: 'Pharmacy Returns', amount: 'Γé╣1.8L', impact: 'medium', description: 'Unused dispensed medications not reconciled' },
  { area: 'Late Charge Capture', amount: 'Γé╣3.1L', impact: 'high', description: 'Ward charges entered >48h after service' },
  { area: 'Under-coded Diagnoses', amount: 'Γé╣5.7L', impact: 'high', description: 'DRG coding opportunities missed' },
];

const payerMix = [
  { name: 'Self-Pay', value: 38, color: 'hsl(var(--primary))' },
  { name: 'CGHS/ECHS', value: 22, color: 'hsl(var(--destructive))' },
  { name: 'TPA/Insurance', value: 28, color: 'hsl(var(--muted-foreground))' },
  { name: 'Corporate', value: 8, color: 'hsl(var(--accent-foreground))' },
  { name: 'Ayushman Bharat', value: 4, color: 'hsl(var(--secondary-foreground))' },
];

const claimsCycle = [
  { stage: 'Claims Submitted', count: 245, value: 'Γé╣48.2L' },
  { stage: 'Under Processing', count: 89, value: 'Γé╣18.6L' },
  { stage: 'Approved', count: 128, value: 'Γé╣24.8L' },
  { stage: 'Rejected', count: 18, value: 'Γé╣3.2L' },
  { stage: 'Settled', count: 112, value: 'Γé╣22.1L' },
];

export default function AdminRevenueCycle() {
  const { invoices } = useHospital();
  const { finance, snapshot, analytics, platformOn, error } = useAdminOperationalData('7d');
  const totalFromStore = invoices.reduce((s, i) => s + i.total, 0);

  const liveKpis = useMemo(() => {
    if (!finance || !snapshot) return null;
    const outstanding = finance.summary.outstandingCents / 100;
    return [
      { label: 'Open Invoices', value: String(finance.summary.openInvoices), change: 'Live finance API', good: true },
      { label: 'Outstanding', value: `Γé╣${outstanding.toLocaleString('en-IN')}`, change: 'Branch ledger', good: outstanding < 500_000 },
      { label: 'Billing Blockers', value: String(finance.summary.dischargeBillingBlockers), change: 'Discharge clearance', good: finance.summary.dischargeBillingBlockers === 0 },
      { label: 'Draft Invoices', value: String(snapshot.counts.billingDraftInvoices), change: 'Command snapshot', good: true },
      { label: 'Insurance Auth', value: String(finance.summary.insuranceAuthorizations), change: 'Pending pipeline', good: true },
    ];
  }, [finance, snapshot]);

  const handleFixLeakage = (area: string) => {
    toast.success(`Revenue recovery initiated for: ${area}`);
  };

  const kpiCards = liveKpis ?? [
    { label: 'Monthly Revenue', value: `Γé╣${(192 + totalFromStore / 100).toFixed(1)}L`, change: 'Preview', good: true },
    { label: 'Collection Rate', value: '93.7%', change: 'Preview', good: true },
    { label: 'Revenue Leakage', value: 'Γé╣23.3L', change: 'Preview', good: true },
    { label: 'Avg Days to Collect', value: '32', change: 'Preview', good: true },
    { label: 'Claim Rejection Rate', value: '7.3%', change: 'Preview', good: true },
  ];

  return (
    <div className="space-y-4">
      {platformOn && (
        <PlatformConnectivityStrip
          label="Live revenue cycle signals"
          detail={`Outstanding Γé╣${((finance?.summary.outstandingCents ?? 0) / 100).toLocaleString('en-IN')} ┬╖ ${analytics?.metrics.dischargeTurnaround ?? 0} discharges (7d)`}
          error={error}
        />
      )}
      {!platformOn && (
        <p className="text-xs text-muted-foreground border border-dashed rounded-lg px-3 py-2">
          Charts and leakage tables below are illustrative preview data. KPI row uses hospitalStore totals when platform is off.
        </p>
      )}
      <motion.div {...fadeIn(0)} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-primary" /> Revenue Cycle Intelligence
          </h1>
          <p className="text-sm text-muted-foreground">AI-driven revenue analytics, leakage detection & collection optimization</p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => toast.success('Revenue report exported')}>
          <Download className="w-3.5 h-3.5" /> Export
        </Button>
      </motion.div>

      {/* KPIs */}
      <motion.div {...fadeIn(1)} className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {kpiCards.map((kpi, i) => (
          <Card key={i}>
            <CardContent className="p-3">
              <p className="text-lg font-bold">{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
              <p className={`text-[10px] font-medium flex items-center gap-0.5 ${kpi.good ? 'text-emerald-600' : 'text-destructive'}`}>
                {kpi.good ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {kpi.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Revenue Leakage Alert */}
      <motion.div {...fadeIn(2)}>
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> AI-Detected Revenue Leakage Points
              </p>
              <Badge className="text-[10px] bg-amber-600">Γé╣23.3L potential recovery</Badge>
            </div>
            <div className="space-y-2">
              {leakagePoints.map((l, i) => (
                <div key={i} className="flex items-center justify-between bg-background border rounded-lg p-2.5">
                  <div>
                    <p className="text-xs font-medium">{l.area}</p>
                    <p className="text-[10px] text-muted-foreground">{l.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{l.amount}</span>
                    <Badge variant={l.impact === 'critical' ? 'destructive' : l.impact === 'high' ? 'secondary' : 'outline'} className="text-[10px]">{l.impact}</Badge>
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => handleFixLeakage(l.area)}>Fix</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue vs Collection */}
        <motion.div {...fadeIn(3)}>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Revenue vs Collection Trend (Γé╣L)</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, background: 'hsl(var(--card))' }} />
                  <Area type="monotone" dataKey="revenue" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" name="Revenue" />
                  <Area type="monotone" dataKey="collection" fill="hsl(142 76% 36% / 0.15)" stroke="hsl(142 76% 36%)" name="Collected" />
                  <Line type="monotone" dataKey="outstanding" stroke="hsl(var(--destructive))" name="Outstanding" strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payer Mix */}
        <motion.div {...fadeIn(4)}>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Payer Mix Distribution</p>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={payerMix} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                      {payerMix.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 flex-1">
                  {payerMix.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                        <span>{p.name}</span>
                      </div>
                      <span className="font-medium">{p.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Revenue by Department */}
        <motion.div {...fadeIn(5)}>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Department Revenue & Margin (Γé╣L)</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueByDept}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="dept" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, background: 'hsl(var(--card))' }} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} name="Revenue (Γé╣L)" />
                  <Bar dataKey="cost" fill="hsl(var(--muted))" radius={[2, 2, 0, 0]} name="Cost (Γé╣L)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Claims Pipeline */}
        <motion.div {...fadeIn(6)}>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Insurance Claims Pipeline
              </p>
              <div className="space-y-2">
                {claimsCycle.map((c, i) => (
                  <div key={i} className="flex items-center justify-between border rounded-lg p-2.5">
                    <div className="flex items-center gap-2">
                      {i < claimsCycle.length - 1 && <ArrowDownRight className="w-3 h-3 text-muted-foreground" />}
                      {i === claimsCycle.length - 1 && <Target className="w-3 h-3 text-emerald-500" />}
                      <span className="text-xs font-medium">{c.stage}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[10px]">{c.count} claims</Badge>
                      <span className="text-xs font-bold">{c.value}</span>
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
