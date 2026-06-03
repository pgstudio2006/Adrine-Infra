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

type RevenueByDept = { dept: string; revenue: number; cost: number; margin: number };
type MonthlyRevenue = { month: string; revenue: number; collection: number; outstanding: number };
type LeakagePoint = { area: string; amount: string; impact: 'critical' | 'high' | 'medium' | 'low'; description: string };
type PayerMixSlice = { name: string; value: number; color: string };
type ClaimsCycleStage = { stage: string; count: number; value: string };

const revenueByDept: RevenueByDept[] = [];
const monthlyRevenue: MonthlyRevenue[] = [];
const leakagePoints: LeakagePoint[] = [];
const payerMix: PayerMixSlice[] = [];
const claimsCycle: ClaimsCycleStage[] = [];

export default function AdminRevenueCycle() {
  const { invoices } = useHospital();
  const { finance, snapshot, analytics, platformOn, error } = useAdminOperationalData('7d');
  const totalFromStore = invoices.reduce((s, i) => s + i.total, 0);

  const liveKpis = useMemo(() => {
    if (!finance || !snapshot) return null;
    const outstanding = finance.summary.outstandingCents / 100;
    return [
      { label: 'Open Invoices', value: String(finance.summary.openInvoices), change: 'Live finance API', good: true },
      { label: 'Outstanding', value: `₹${outstanding.toLocaleString('en-IN')}`, change: 'Branch ledger', good: outstanding < 500_000 },
      { label: 'Billing Blockers', value: String(finance.summary.dischargeBillingBlockers), change: 'Discharge clearance', good: finance.summary.dischargeBillingBlockers === 0 },
      { label: 'Draft Invoices', value: String(snapshot.counts.billingDraftInvoices), change: 'Command snapshot', good: true },
      { label: 'Insurance Auth', value: String(finance.summary.insuranceAuthorizations), change: 'Pending pipeline', good: true },
    ];
  }, [finance, snapshot]);

  const handleFixLeakage = (area: string) => {
    toast.success(`Revenue recovery initiated for: ${area}`);
  };

  const kpiCards = liveKpis ?? [
    { label: 'Invoice Total (store)', value: `₹${(totalFromStore / 100).toLocaleString('en-IN')}`, change: 'Local store only', good: true },
    { label: 'Collection Rate', value: '—', change: 'Connect platform', good: true },
    { label: 'Revenue Leakage', value: '—', change: 'Connect platform', good: true },
    { label: 'Avg Days to Collect', value: '—', change: 'Connect platform', good: true },
    { label: 'Claim Rejection Rate', value: '—', change: 'Connect platform', good: true },
  ];

  return (
    <div className="space-y-4">
      {platformOn && (
        <PlatformConnectivityStrip
          label="Live revenue cycle signals"
          detail={`Outstanding ₹${((finance?.summary.outstandingCents ?? 0) / 100).toLocaleString('en-IN')} · ${analytics?.metrics.dischargeTurnaround ?? 0} discharges (7d)`}
          error={error}
        />
      )}
      {!platformOn && (
        <p className="text-xs text-muted-foreground border border-dashed rounded-lg px-3 py-2">
          Platform runtime is off. KPI row uses hospitalStore invoice totals; analytics panels below remain empty until live data is connected.
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
              <Badge className="text-[10px] bg-amber-600">{leakagePoints.length} detected</Badge>
            </div>
            <div className="space-y-2">
              {leakagePoints.length === 0 && (
                <p className="text-[11px] text-muted-foreground">No revenue leakage points detected yet.</p>
              )}
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
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Revenue vs Collection Trend (₹L)</p>
              {monthlyRevenue.length === 0 && (
                <p className="text-[11px] text-muted-foreground mb-2">No monthly revenue trend data yet.</p>
              )}
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
              {payerMix.length === 0 && (
                <p className="text-[11px] text-muted-foreground mb-2">No payer mix data yet.</p>
              )}
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
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Department Revenue & Margin (₹L)</p>
              {revenueByDept.length === 0 && (
                <p className="text-[11px] text-muted-foreground mb-2">No department revenue data yet.</p>
              )}
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueByDept}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="dept" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, background: 'hsl(var(--card))' }} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} name="Revenue (₹L)" />
                  <Bar dataKey="cost" fill="hsl(var(--muted))" radius={[2, 2, 0, 0]} name="Cost (₹L)" />
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
                {claimsCycle.length === 0 && (
                  <p className="text-[11px] text-muted-foreground">No insurance claims in pipeline yet.</p>
                )}
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
