import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, IndianRupee, ShieldCheck, Receipt, Clock } from "lucide-react";
import { useBillingStoreAggregates } from "@/hooks/useBillingDeptPlatform";
import { BillingDeptShell } from "@/components/billing/BillingDeptShell";

const insuranceReport = [
  { provider: "Star Health Insurance", claims: 8, claimed: 125400, approved: 112000, pending: 2 },
  { provider: "ICICI Lombard", claims: 5, claimed: 198500, approved: 160000, pending: 1 },
  { provider: "HDFC ERGO", claims: 4, claimed: 85200, approved: 85200, pending: 0 },
  { provider: "Bajaj Allianz", claims: 3, claimed: 62000, approved: 45000, pending: 1 },
  { provider: "New India Assurance", claims: 3, claimed: 54800, approved: 38000, pending: 1 },
];

const gstSummary = [
  { category: "Laboratory Services", taxable: 337200, gst: 60696, rate: "18%" },
  { category: "Radiology Services", taxable: 251400, gst: 45252, rate: "18%" },
  { category: "Pharmacy Sales", taxable: 417900, gst: 50148, rate: "12%" },
  { category: "Procedures / OT", taxable: 193050, gst: 9653, rate: "5%" },
  { category: "Room Charges", taxable: 500000, gst: 0, rate: "Exempt" },
  { category: "Consultations", taxable: 585900, gst: 0, rate: "Exempt" },
];

const auditLog = [
  { time: "10:15 AM", user: "Billing Staff Anil", action: "Invoice generated", detail: "INV-7001 — Ravi Sharma — ₹1,626", billId: "BIL-9001" },
  { time: "10:18 AM", user: "Billing Staff Anil", action: "Payment recorded", detail: "PAY-6001 — UPI — ₹1,626", billId: "BIL-9001" },
  { time: "10:45 AM", user: "Billing Staff Meera", action: "Insurance claim submitted", detail: "CLM-401 — Star Health — ₹2,498", billId: "BIL-9003" },
  { time: "11:00 AM", user: "Finance Admin Rajesh", action: "Discount approved", detail: "10% discount on BIL-9002 — ₹3,850", billId: "BIL-9002" },
  { time: "11:30 AM", user: "Billing Staff Anil", action: "Advance recorded", detail: "PAY-6002 — Card — ₹25,000", billId: "BIL-9002" },
  { time: "12:00 PM", user: "Billing Staff Meera", action: "Refund processed", detail: "PAY-6006 — Cash — ₹1,500", billId: "BIL-9006" },
];

export default function BillingReports() {
  const aggregates = useBillingStoreAggregates();

  const dailyCollection = useMemo(() => {
    if (!aggregates.platformOn) {
      return [
        { method: "Cash", count: 42, amount: 185400 },
        { method: "Card", count: 28, amount: 312500 },
        { method: "UPI", count: 65, amount: 198200 },
        { method: "Bank Transfer", count: 4, amount: 85000 },
        { method: "Insurance", count: 17, amount: 425000 },
      ];
    }
    return Object.entries(aggregates.collectionsByMethod).map(([method, data]) => ({
      method,
      count: data.count,
      amount: data.amount,
    }));
  }, [aggregates]);

  const outstandingBills = aggregates.platformOn
    ? aggregates.outstandingBills.map((b) => ({ ...b, days: 0 }))
    : [
        { patient: "Suresh Kumar", uhid: "UH-10035", billId: "BIL-9002", amount: 7038, days: 1, category: "IPD" },
        { patient: "Vikram Singh", uhid: "UH-10021", billId: "BIL-9004", amount: 8130, days: 1, category: "Emergency" },
        { patient: "Anita Desai", uhid: "UH-10038", billId: "BIL-9003", amount: 2498, days: 0, category: "OPD" },
      ];

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
                  {dailyCollection.map(d => {
                    const total = dailyCollection.reduce((s, x) => s + x.amount, 0);
                    const pct = ((d.amount / total) * 100).toFixed(1);
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
                  <TableRow className="font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell>{dailyCollection.reduce((s, d) => s + d.count, 0)}</TableCell>
                    <TableCell>₹{dailyCollection.reduce((s, d) => s + d.amount, 0).toLocaleString()}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
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
                  {outstandingBills.map(b => (
                    <TableRow key={b.billId}>
                      <TableCell className="font-medium">{b.patient}</TableCell>
                      <TableCell className="text-muted-foreground">{b.uhid}</TableCell>
                      <TableCell className="font-mono text-sm">{b.billId}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{b.category}</Badge></TableCell>
                      <TableCell className="font-medium text-destructive">₹{b.amount.toLocaleString()}</TableCell>
                      <TableCell><Badge variant={b.days > 5 ? "destructive" : "secondary"} className="text-xs">{b.days}d</Badge></TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold">
                    <TableCell colSpan={4}>Total Outstanding</TableCell>
                    <TableCell className="text-destructive">₹{outstandingBills.reduce((s, b) => s + b.amount, 0).toLocaleString()}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
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
                  {gstSummary.map(g => (
                    <TableRow key={g.category}>
                      <TableCell className="font-medium">{g.category}</TableCell>
                      <TableCell>₹{g.taxable.toLocaleString()}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{g.rate}</Badge></TableCell>
                      <TableCell className="font-medium">{g.gst > 0 ? `₹${g.gst.toLocaleString()}` : "—"}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold">
                    <TableCell>Total GST Payable</TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell>₹{gstSummary.reduce((s, g) => s + g.gst, 0).toLocaleString()}</TableCell>
                  </TableRow>
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
