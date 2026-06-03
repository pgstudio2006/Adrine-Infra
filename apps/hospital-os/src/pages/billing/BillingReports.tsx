import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, IndianRupee, ShieldCheck, Receipt, Clock } from "lucide-react";
import { useBillingStoreAggregates } from "@/hooks/useBillingDeptPlatform";
import { BillingDeptShell } from "@/components/billing/BillingDeptShell";

const insuranceReport: { provider: string; claims: number; claimed: number; approved: number; pending: number }[] = [];

const gstSummary: { category: string; taxable: number; gst: number; rate: string }[] = [];

const auditLog: { time: string; user: string; action: string; detail: string; billId: string }[] = [];

export default function BillingReports() {
  const aggregates = useBillingStoreAggregates();

  const dailyCollection = useMemo(() => {
    if (!aggregates.platformOn) return [];
    return Object.entries(aggregates.collectionsByMethod).map(([method, data]) => ({
      method,
      count: data.count,
      amount: data.amount,
    }));
  }, [aggregates]);

  const outstandingBills = aggregates.platformOn
    ? aggregates.outstandingBills.map((b) => ({ ...b, days: 0 }))
    : [];

  return (
    <BillingDeptShell
      title="Financial Reports"
      subtitle="Operational and financial reports, GST, and audit logs"
      platformLabel="Collections / outstanding from hospitalStore"
      actions={<Button variant="outline"><Download className="h-4 w-4 mr-2" /> Export All</Button>}
    >

      <Tabs defaultValue="collections">
        <TabsList className="flex-wrap">
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="outstanding">Outstanding</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
          <TabsTrigger value="gst">GST</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {/* Collections */}
        <TabsContent value="collections" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><IndianRupee className="h-5 w-5" /> Daily Collection by Payment Method</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Method</TableHead><TableHead>Transactions</TableHead><TableHead>Amount</TableHead><TableHead>Share</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {dailyCollection.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">No collections recorded today</TableCell>
                    </TableRow>
                  ) : dailyCollection.map(d => {
                    const total = dailyCollection.reduce((s, x) => s + x.amount, 0);
                    const pct = total > 0 ? ((d.amount / total) * 100).toFixed(1) : "0";
                    return (
                      <TableRow key={d.method}>
                        <TableCell className="font-medium">{d.method}</TableCell>
                        <TableCell>{d.count}</TableCell>
                        <TableCell className="font-medium">₹{d.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 bg-muted rounded-full w-20 overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} /></div>
                            <span className="text-xs text-muted-foreground">{pct}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {dailyCollection.length > 0 && (
                    <TableRow className="font-bold">
                      <TableCell>Total</TableCell>
                      <TableCell>{dailyCollection.reduce((s, d) => s + d.count, 0)}</TableCell>
                      <TableCell>₹{dailyCollection.reduce((s, d) => s + d.amount, 0).toLocaleString()}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Outstanding */}
        <TabsContent value="outstanding" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5" /> Outstanding Bills</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Patient</TableHead><TableHead>UHID</TableHead><TableHead>Bill ID</TableHead><TableHead>Category</TableHead><TableHead>Outstanding</TableHead><TableHead>Days</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {outstandingBills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">No outstanding bills</TableCell>
                    </TableRow>
                  ) : outstandingBills.map(b => (
                    <TableRow key={b.billId}>
                      <TableCell className="font-medium">{b.patient}</TableCell>
                      <TableCell className="text-muted-foreground">{b.uhid}</TableCell>
                      <TableCell className="font-mono text-sm">{b.billId}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{b.category}</Badge></TableCell>
                      <TableCell className="font-medium text-destructive">₹{b.amount.toLocaleString()}</TableCell>
                      <TableCell><Badge variant={b.days > 5 ? "destructive" : "secondary"} className="text-xs">{b.days}d</Badge></TableCell>
                    </TableRow>
                  ))}
                  {outstandingBills.length > 0 && (
                    <TableRow className="font-bold">
                      <TableCell colSpan={4}>Total Outstanding</TableCell>
                      <TableCell className="text-destructive">₹{outstandingBills.reduce((s, b) => s + b.amount, 0).toLocaleString()}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insurance */}
        <TabsContent value="insurance" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Insurance Claims Summary</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Provider</TableHead><TableHead>Claims</TableHead><TableHead>Claimed</TableHead><TableHead>Approved</TableHead><TableHead>Pending</TableHead><TableHead>Approval Rate</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {insuranceReport.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">No insurance claims submitted</TableCell>
                    </TableRow>
                  )}
                  {insuranceReport.map(i => {
                    const rate = i.claimed > 0 ? ((i.approved / i.claimed) * 100).toFixed(0) : "0";
                    return (
                      <TableRow key={i.provider}>
                        <TableCell className="font-medium">{i.provider}</TableCell>
                        <TableCell>{i.claims}</TableCell>
                        <TableCell>₹{i.claimed.toLocaleString()}</TableCell>
                        <TableCell className="text-green-600 font-medium">₹{i.approved.toLocaleString()}</TableCell>
                        <TableCell>{i.pending > 0 ? <Badge variant="secondary" className="text-xs">{i.pending}</Badge> : "—"}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{rate}%</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GST */}
        <TabsContent value="gst" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Receipt className="h-5 w-5" /> GST Summary — March 2026</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Category</TableHead><TableHead>Taxable Value</TableHead><TableHead>GST Rate</TableHead><TableHead>GST Amount</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {gstSummary.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">No GST data for this period</TableCell>
                    </TableRow>
                  ) : gstSummary.map(g => (
                    <TableRow key={g.category}>
                      <TableCell className="font-medium">{g.category}</TableCell>
                      <TableCell>₹{g.taxable.toLocaleString()}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{g.rate}</Badge></TableCell>
                      <TableCell className="font-medium">{g.gst > 0 ? `₹${g.gst.toLocaleString()}` : "—"}</TableCell>
                    </TableRow>
                  ))}
                  {gstSummary.length > 0 && (
                    <TableRow className="font-bold">
                      <TableCell>Total GST Payable</TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell>₹{gstSummary.reduce((s, g) => s + g.gst, 0).toLocaleString()}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit */}
        <TabsContent value="audit" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5" /> Financial Audit Trail</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Time</TableHead><TableHead>User</TableHead><TableHead>Action</TableHead><TableHead>Detail</TableHead><TableHead>Bill ID</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {auditLog.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">No audit events recorded</TableCell>
                    </TableRow>
                  )}
                  {auditLog.map((a, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground text-sm">{a.time}</TableCell>
                      <TableCell className="font-medium text-sm">{a.user}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{a.action}</Badge></TableCell>
                      <TableCell className="text-sm">{a.detail}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{a.billId}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </BillingDeptShell>
  );
}
