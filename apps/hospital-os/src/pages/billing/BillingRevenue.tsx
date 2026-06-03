import { useMemo, useState } from "react";
import { useBillingRevenueData } from "@/hooks/useBillingDeptData";
import { BillingDeptShell } from "@/components/billing/BillingDeptShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, IndianRupee, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { allowDemoFallback } from "@/lib/platform/demo-fallback";
import { PlatformEmptyState } from "@/components/platform/PlatformEmptyState";

const dailyRevenue = [
  { date: "2026-03-08", opd: 125400, ipd: 98500, pharmacy: 87200, lab: 72300, radiology: 56800, procedures: 42150, total: 482350 },
  { date: "2026-03-07", opd: 118200, ipd: 105000, pharmacy: 79500, lab: 68400, radiology: 48200, procedures: 38900, total: 458200 },
  { date: "2026-03-06", opd: 132100, ipd: 92800, pharmacy: 91000, lab: 65500, radiology: 52100, procedures: 45200, total: 478700 },
  { date: "2026-03-05", opd: 110500, ipd: 115200, pharmacy: 83400, lab: 71200, radiology: 49800, procedures: 35600, total: 465700 },
  { date: "2026-03-04", opd: 98700, ipd: 88500, pharmacy: 76800, lab: 59800, radiology: 44500, procedures: 31200, total: 399500 },
];

const monthlyTotals = [
  { month: "March 2026", revenue: 2284450, expenses: 1850000, profit: 434450, margin: 19 },
  { month: "February 2026", revenue: 12850000, expenses: 10400000, profit: 2450000, margin: 19.1 },
  { month: "January 2026", revenue: 13200000, expenses: 10800000, profit: 2400000, margin: 18.2 },
];

const deptRevenue = [
  { dept: "OPD Consultations", thisMonth: 585900, lastMonth: 3420000, change: 8.2 },
  { dept: "IPD / Room", thisMonth: 500000, lastMonth: 3180000, change: -2.1 },
  { dept: "Pharmacy", thisMonth: 417900, lastMonth: 2680000, change: 5.4 },
  { dept: "Laboratory", thisMonth: 337200, lastMonth: 2100000, change: 3.8 },
  { dept: "Radiology", thisMonth: 251400, lastMonth: 1560000, change: 12.1 },
  { dept: "Procedures / OT", thisMonth: 193050, lastMonth: 1910000, change: -1.5 },
];

export default function BillingRevenue() {
  const [period, setPeriod] = useState("daily");
  const { data: live, platformOn } = useBillingRevenueData(30);

  const todayTotal = useMemo(() => {
    if (platformOn && live?.daily?.length) {
      const last = live.daily[live.daily.length - 1];
      return last?.amount ?? 0;
    }
    return allowDemoFallback() ? 482350 : 0;
  }, [platformOn, live]);

  const deptRows = useMemo(() => {
    if (platformOn && live?.revenueByModule?.length) {
      return live.revenueByModule.map((r) => ({
        dept: r.module,
        thisMonth: Math.round(r.amount),
        lastMonth: 0,
        change: 0,
      }));
    }
    return allowDemoFallback() ? deptRevenue : [];
  }, [platformOn, live]);

  const dailyRows = useMemo(() => {
    if (platformOn && live?.daily?.length) {
      return live.daily.map((d) => ({
        date: d.date,
        opd: 0,
        ipd: 0,
        pharmacy: 0,
        lab: 0,
        radiology: 0,
        procedures: 0,
        total: d.amount,
      }));
    }
    return allowDemoFallback() ? dailyRevenue : [];
  }, [platformOn, live]);

  const monthlyRows = allowDemoFallback() ? monthlyTotals : [];

  return (
    <BillingDeptShell
      title="Revenue Tracking"
      subtitle="Monitor hospital revenue streams and financial performance"
      showPlatformStrip={false}
      actions={
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      }
    >

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Latest day revenue</p><p className="text-2xl font-bold text-foreground mt-1">₹{todayTotal.toLocaleString()}</p>{platformOn && <p className="text-xs text-muted-foreground mt-1">From domain-api settlements</p>}</CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Period total</p><p className="text-2xl font-bold text-foreground mt-1">₹{((live?.summary?.totalRevenueCents ?? 0) / 100).toLocaleString()}</p><p className="text-xs text-muted-foreground mt-1">{platformOn ? `${live?.summary?.settledInvoiceCount ?? 0} settled invoices` : 'No platform data'}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Monthly Target</p><p className="text-2xl font-bold text-foreground mt-1">{allowDemoFallback() ? '₹1,30,00,000' : '—'}</p>{allowDemoFallback() && <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: "17.6%" }} /></div>}<p className="text-xs text-muted-foreground mt-1">{allowDemoFallback() ? '17.6% achieved' : 'Targets not configured'}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Profit Margin</p><p className="text-2xl font-bold text-foreground mt-1">{allowDemoFallback() ? '19.0%' : '—'}</p>{allowDemoFallback() && <div className="flex items-center gap-1 text-xs text-green-600 mt-1"><ArrowUpRight className="h-3 w-3" /> +0.8% vs last month</div>}</CardContent></Card>
      </div>

      <Tabs defaultValue="breakdown">
        <TabsList>
          <TabsTrigger value="breakdown">Department Breakdown</TabsTrigger>
          <TabsTrigger value="daily">Daily Trend</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Revenue by Department</CardTitle></CardHeader>
            <CardContent>
              {deptRows.length === 0 ? (
                <PlatformEmptyState message="Department revenue breakdown requires platform billing analytics." />
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>This Month (MTD)</TableHead>
                    <TableHead>Last Month</TableHead>
                    <TableHead>Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deptRows.map(d => (
                    <TableRow key={d.dept}>
                      <TableCell className="font-medium">{d.dept}</TableCell>
                      <TableCell>₹{d.thisMonth.toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground">₹{d.lastMonth.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 text-sm ${d.change >= 0 ? "text-green-600" : "text-destructive"}`}>
                          {d.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {Math.abs(d.change)}%
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Daily Revenue</CardTitle></CardHeader>
            <CardContent>
              {dailyRows.length === 0 ? (
                <PlatformEmptyState message="Daily revenue trend appears when platform finance APIs return settlement data." />
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>OPD</TableHead>
                    <TableHead>IPD</TableHead>
                    <TableHead>Pharmacy</TableHead>
                    <TableHead>Lab</TableHead>
                    <TableHead>Radiology</TableHead>
                    <TableHead>Procedures</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyRows.map(d => (
                    <TableRow key={d.date}>
                      <TableCell className="font-medium">{d.date}</TableCell>
                      <TableCell>₹{d.opd.toLocaleString()}</TableCell>
                      <TableCell>₹{d.ipd.toLocaleString()}</TableCell>
                      <TableCell>₹{d.pharmacy.toLocaleString()}</TableCell>
                      <TableCell>₹{d.lab.toLocaleString()}</TableCell>
                      <TableCell>₹{d.radiology.toLocaleString()}</TableCell>
                      <TableCell>₹{d.procedures.toLocaleString()}</TableCell>
                      <TableCell className="font-bold">₹{d.total.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Monthly Financial Summary</CardTitle></CardHeader>
            <CardContent>
              {monthlyRows.length === 0 ? (
                <PlatformEmptyState message="Monthly summaries are not wired to platform analytics yet." />
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Expenses</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyRows.map(m => (
                    <TableRow key={m.month}>
                      <TableCell className="font-medium">{m.month}</TableCell>
                      <TableCell>₹{m.revenue.toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground">₹{m.expenses.toLocaleString()}</TableCell>
                      <TableCell className="text-green-600 font-medium">₹{m.profit.toLocaleString()}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{m.margin}%</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </BillingDeptShell>
  );
}
