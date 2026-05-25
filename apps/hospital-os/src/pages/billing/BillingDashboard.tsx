import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { platformGetBillingDeptDashboard } from "@/runtime/finance-runtime";
import { canUseFinanceRuntime } from "@/runtime/finance-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IndianRupee, TrendingUp, FileText, CreditCard, Clock, ShieldCheck, Scale, Receipt } from "lucide-react";
import { useBillingStoreAggregates } from "@/hooks/useBillingDeptPlatform";
import { BillingDeptShell } from "@/components/billing/BillingDeptShell";
import { BillingEmptyState } from "@/components/billing/BillingEmptyState";

const DEMO_STATS = [
  { label: "Today's Revenue", value: "₹4,82,350", icon: IndianRupee, trend: "+12% vs yesterday" },
  { label: "Pending Bills", value: "47", icon: Clock, trend: "₹8,45,200 outstanding" },
  { label: "Insurance Claims", value: "23", icon: ShieldCheck, trend: "5 awaiting approval (illustrative)" },
  { label: "Invoices Generated", value: "156", icon: FileText, trend: "Today" },
];

const DEMO_REVENUE_BREAKDOWN = [
  { dept: "OPD Consultations", amount: 125400, pct: 26 },
  { dept: "IPD Room Charges", amount: 98500, pct: 20 },
  { dept: "Pharmacy", amount: 87200, pct: 18 },
  { dept: "Laboratory", amount: 72300, pct: 15 },
  { dept: "Radiology", amount: 56800, pct: 12 },
  { dept: "Procedures", amount: 42150, pct: 9 },
];

const DEMO_RECENT_TRANSACTIONS = [
  { id: "TXN-8901", patient: "Ravi Sharma", uhid: "UH-10042", type: "OPD", amount: 1500, method: "UPI", status: "Paid", time: "10 min ago" },
  { id: "TXN-8900", patient: "Anita Desai", uhid: "UH-10038", type: "Pharmacy", amount: 1134, method: "Insurance", status: "Insurance", time: "25 min ago" },
  { id: "TXN-8899", patient: "Suresh Kumar", uhid: "UH-10035", type: "IPD", amount: 45000, method: "Card", status: "Partial", time: "1 hr ago" },
];

const payStatusColor: Record<string, string> = {
  Paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Partial: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  Insurance: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Refunded: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const shortcuts = [
  { label: "Invoices", path: "/billing-dept/invoices", icon: FileText },
  { label: "Payments", path: "/billing-dept/payments", icon: CreditCard },
  { label: "Pre-auth wizard", path: "/billing-dept/pre-auth", icon: ShieldCheck },
  { label: "Reconciliation", path: "/billing-dept/reconciliation", icon: Scale },
  { label: "IPD billing", path: "/billing-dept/ipd-billing", icon: Receipt },
  { label: "Insurance desk", path: "/billing-dept/insurance", icon: ShieldCheck },
];

export default function BillingDashboard() {
  const aggregates = useBillingStoreAggregates();
  const useLiveKpis = aggregates.platformOn;
  const [desk, setDesk] = useState<{ insuranceCount?: number } | null>(null);

  useEffect(() => {
    if (!canUseFinanceRuntime()) return;
    void platformGetBillingDeptDashboard().then(setDesk).catch(() => setDesk(null));
  }, [useLiveKpis]);

  const stats = useMemo(() => {
    if (!useLiveKpis) return DEMO_STATS;
    return [
      {
        label: "Collected (store)",
        value: `₹${aggregates.totalCollected.toLocaleString()}`,
        icon: IndianRupee,
        trend: "Platform-synced payments",
      },
      {
        label: "Pending Bills",
        value: String(aggregates.pendingBillCount),
        icon: Clock,
        trend: `₹${aggregates.totalOutstanding.toLocaleString()} outstanding`,
      },
      {
        label: "Insurance Authorizations",
        value: desk?.insuranceCount != null ? String(desk.insuranceCount) : "—",
        icon: ShieldCheck,
        trend: "GET /billing/dept/dashboard",
      },
      {
        label: "Invoices",
        value: String(aggregates.invoiceCount),
        icon: FileText,
        trend: "BillingSync / hospitalStore",
      },
    ];
  }, [useLiveKpis, aggregates, desk]);

  const revenueBreakdown = useMemo(() => {
    if (!useLiveKpis) return DEMO_REVENUE_BREAKDOWN;
    const entries = Object.entries(aggregates.revenueByCategory);
    const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
    return entries.map(([dept, amount]) => ({
      dept,
      amount,
      pct: Math.round((amount / total) * 100),
    }));
  }, [useLiveKpis, aggregates.revenueByCategory]);

  const recentTransactions = useLiveKpis && aggregates.recentTransactions.length > 0
    ? aggregates.recentTransactions
    : DEMO_RECENT_TRANSACTIONS;

  return (
    <BillingDeptShell
      title="Billing & Finance Dashboard"
      subtitle="Revenue cycle overview — live KPIs when platform runtime is on"
      showPlatformStrip={false}
    >
      {!useLiveKpis && (
        <p className="text-xs text-muted-foreground -mt-2">
          Illustrative KPI tiles below. Enable platform runtime for store-backed metrics.
        </p>
      )}

      {useLiveKpis ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.trend}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {DEMO_STATS.map((s) => (
            <Card key={s.label} className="opacity-80">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-semibold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {shortcuts.map((s) => (
          <Button key={s.path} variant="outline" size="sm" className="h-auto py-3 flex-col gap-1" asChild>
            <Link to={s.path}>
              <s.icon className="h-4 w-4" />
              <span className="text-[11px]">{s.label}</span>
            </Link>
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Revenue by Category</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {revenueBreakdown.length === 0 ? (
              <BillingEmptyState
                title="No revenue categories"
                description="Finalize invoices on platform to populate category breakdown."
              />
            ) : (
              revenueBreakdown.map((r) => (
                <div key={r.dept} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{r.dept}</span>
                    <span className="font-medium">₹{r.amount.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${r.pct}%` }} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to="/billing-dept/payments">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <BillingEmptyState
                title="No payments yet"
                description="Record a payment from the Payments screen or complete OPD billing exit at reception."
                actionLabel="Record payment"
                onAction={() => { window.location.href = '/billing-dept/payments'; }}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>TXN ID</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-sm">{t.id}</TableCell>
                      <TableCell>
                        <div><span className="font-medium">{t.patient}</span><br /><span className="text-xs text-muted-foreground">{t.uhid}</span></div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{t.type}</Badge></TableCell>
                      <TableCell className="font-medium">₹{t.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{t.method}</TableCell>
                      <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${payStatusColor[t.status] ?? payStatusColor.Paid}`}>{t.status}</span></TableCell>
                      <TableCell className="text-muted-foreground text-xs">{t.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild><Link to="/billing-dept/invoices"><FileText className="h-4 w-4 mr-2" /> Invoice wizard</Link></Button>
          <Button variant="outline" asChild><Link to="/billing-dept/payments"><CreditCard className="h-4 w-4 mr-2" /> Payment wizard</Link></Button>
          <Button variant="outline" asChild><Link to="/billing-dept/pre-auth"><ShieldCheck className="h-4 w-4 mr-2" /> Pre-auth</Link></Button>
          <Button variant="outline" asChild><Link to="/billing-dept/reconciliation"><Scale className="h-4 w-4 mr-2" /> Day-end reconcile</Link></Button>
        </CardContent>
      </Card>
    </BillingDeptShell>
  );
}
