import { useMemo, useState } from "react";
import { useBillingFinanceDeskData } from "@/hooks/useBillingDeptData";
import { BillingDeptShell } from "@/components/billing/BillingDeptShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { IndianRupee, ShieldAlert, Stethoscope, AlertTriangle, FileText, CheckCircle, XCircle, ArrowUpRight, Building2, Search } from "lucide-react";

/* ── Authorization Requests ── */
interface AuthRequest {
  id: string;
  type: "Discount" | "Refund" | "Write-Off" | "Bill Cancel";
  billId: string;
  patient: string;
  requestedBy: string;
  amount: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  date: string;
  rule: string;
}

const authRequests: AuthRequest[] = [
  { id: "AUTH-101", type: "Discount", billId: "BIL-9002", patient: "Suresh Kumar", requestedBy: "Billing Staff Anil", amount: 3850, reason: "10% loyalty discount — long-term patient", status: "Pending", date: "2026-03-08", rule: "Discount >5% requires Finance approval" },
  { id: "AUTH-102", type: "Refund", billId: "BIL-9006", patient: "Arun Pillai", requestedBy: "Billing Staff Meera", amount: 1500, reason: "Service cancelled before execution", status: "Approved", date: "2026-03-07", rule: "Refund <₹5000 — auto-approved" },
  { id: "AUTH-103", type: "Refund", billId: "BIL-9010", patient: "Priya Menon", requestedBy: "Billing Staff Anil", amount: 8500, reason: "Insurance overcharge correction", status: "Pending", date: "2026-03-08", rule: "Refund >₹5000 requires Finance Admin approval" },
  { id: "AUTH-104", type: "Write-Off", billId: "BIL-8985", patient: "Geeta Nair", requestedBy: "Finance Rajesh", amount: 12800, reason: "Charity case — patient unable to pay", status: "Pending", date: "2026-03-08", rule: "Write-offs require Admin approval" },
  { id: "AUTH-105", type: "Bill Cancel", billId: "BIL-9007", patient: "Ramesh Patel", requestedBy: "Billing Staff Meera", amount: 2200, reason: "Duplicate bill generated in error", status: "Approved", date: "2026-03-06", rule: "Bill cancellation requires supervisor approval" },
];

/* ── Doctor Revenue ── */
const doctorRevenue = [
  { doctor: "Dr. Patel", dept: "Medicine", consultations: 145, procedures: 12, totalRev: 485000, share: 242500, pct: 50 },
  { doctor: "Dr. Rao", dept: "Orthopedics", consultations: 98, procedures: 18, totalRev: 680000, share: 272000, pct: 40 },
  { doctor: "Dr. Mehta", dept: "Cardiology", consultations: 120, procedures: 8, totalRev: 520000, share: 260000, pct: 50 },
  { doctor: "Dr. Shah", dept: "ENT", consultations: 85, procedures: 22, totalRev: 310000, share: 124000, pct: 40 },
  { doctor: "Dr. Iyer", dept: "Radiology", consultations: 0, procedures: 0, totalRev: 280000, share: 84000, pct: 30 },
  { doctor: "Dr. Gupta", dept: "Emergency", consultations: 210, procedures: 5, totalRev: 420000, share: 168000, pct: 40 },
];

/* ── Credit Notes / Debit Notes ── */
const creditDebitNotes = [
  { id: "CN-201", type: "Credit Note", billId: "BIL-9003", patient: "Anita Desai", amount: 590, reason: "ECG charge reversal — machine error", date: "2026-03-08", approver: "Finance Rajesh" },
  { id: "DN-201", type: "Debit Note", billId: "BIL-9002", patient: "Suresh Kumar", amount: 1200, reason: "Additional dressing charges not billed", date: "2026-03-08", approver: "Billing Staff Anil" },
  { id: "CN-200", type: "Credit Note", billId: "BIL-9010", patient: "Priya Menon", amount: 2000, reason: "Insurance deduction adjustment", date: "2026-03-07", approver: "Finance Rajesh" },
];

/* ── Write-offs ── */
const writeOffs = [
  { id: "WO-301", billId: "BIL-8985", patient: "Geeta Nair", uhid: "UH-10003", amount: 12800, type: "Charity", reason: "Patient financially unable to pay — BPL card verified", approver: "Admin", date: "2026-03-08", status: "Pending" },
  { id: "WO-300", billId: "BIL-8970", patient: "Ram Prasad", uhid: "UH-9998", amount: 5400, type: "Bad Debt", reason: "Patient absconded — untraceable after 90 days", approver: "Finance Rajesh", date: "2026-02-28", status: "Approved" },
  { id: "WO-299", billId: "BIL-8965", patient: "Lakshmi Devi", uhid: "UH-9992", amount: 8200, type: "Insurance Rejection", reason: "Claim rejected — pre-existing condition. Patient unable to pay balance.", approver: "Finance Rajesh", date: "2026-02-25", status: "Approved" },
];

/* ── Revenue Leakage ── */
const leakageAlerts = [
  { id: "LEAK-01", type: "Lab not billed", patient: "Ravi Sharma", uhid: "UH-10042", detail: "CBC test ordered and completed — no billing entry found", dept: "Laboratory", date: "2026-03-08", value: 350 },
  { id: "LEAK-02", type: "Pharmacy unbilled", patient: "Meena Joshi", uhid: "UH-10029", detail: "Fluticasone Nasal Spray dispensed — not linked to any invoice", dept: "Pharmacy", date: "2026-03-08", value: 280 },
  { id: "LEAK-03", type: "Procedure unbilled", patient: "Suresh Kumar", uhid: "UH-10035", detail: "Dressing change performed — charge missing from IPD running bill", dept: "Nursing", date: "2026-03-07", value: 200 },
  { id: "LEAK-04", type: "Radiology unbilled", patient: "Vikram Singh", uhid: "UH-10021", detail: "X-ray Chest PA completed — billing not generated", dept: "Radiology", date: "2026-03-07", value: 350 },
];

const authStatusColor: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function BillingFinance() {
  const [selectedAuth, setSelectedAuth] = useState<AuthRequest | null>(null);
  const { data: desk, platformOn } = useBillingFinanceDeskData();

  const approvalRows = useMemo((): AuthRequest[] => {
    if (!platformOn || !desk?.pendingApprovals?.length) return authRequests;
    return (desk.pendingApprovals as {
      invoiceId: string;
      patientName: string;
      outstandingCents: number;
      amountCents: number;
    }[]).map((p, i) => ({
      id: `AUTH-P${i}`,
      type: "Discount" as const,
      billId: p.invoiceId.slice(0, 12),
      patient: p.patientName,
      requestedBy: "Billing",
      amount: p.outstandingCents / 100,
      reason: "Invoice pending platform approval",
      status: "Pending" as const,
      date: new Date().toISOString().slice(0, 10),
      rule: "domain-api invoice lifecycle",
    }));
  }, [platformOn, desk]);

  const pendingAuths = approvalRows.filter(a => a.status === "Pending").length;
  const leakageValue = leakageAlerts.reduce((s, l) => s + l.value, 0);
  const outstanding = platformOn ? (desk?.summary?.outstandingCents ?? 0) / 100 : 0;

  return (
    <BillingDeptShell
      title="Finance & Controls"
      subtitle="Authorizations, doctor revenue, write-offs, credit notes, and leakage detection"
      gateFocus="GAP-006"
      platformLabel="Finance desk — GET /billing/dept/finance"
    >

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Pending Approvals</p><p className="text-2xl font-bold text-yellow-600">{pendingAuths}</p>{platformOn && <p className="text-xs text-muted-foreground">Outstanding ₹{outstanding.toLocaleString()}</p>}</CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Doctor Revenue (MTD)</p><p className="text-2xl font-bold">₹{doctorRevenue.reduce((s, d) => s + d.totalRev, 0).toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Write-offs (MTD)</p><p className="text-2xl font-bold text-destructive">₹{writeOffs.reduce((s, w) => s + w.amount, 0).toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Revenue Leakage</p><p className="text-2xl font-bold text-orange-600">₹{leakageValue.toLocaleString()}</p><p className="text-xs text-muted-foreground">{leakageAlerts.length} alerts</p></CardContent></Card>
      </div>

      <Tabs defaultValue="approvals">
        <TabsList className="flex-wrap">
          <TabsTrigger value="approvals">Approvals ({pendingAuths})</TabsTrigger>
          <TabsTrigger value="doctor-rev">Doctor Revenue</TabsTrigger>
          <TabsTrigger value="writeoffs">Write-offs</TabsTrigger>
          <TabsTrigger value="cn-dn">Credit/Debit Notes</TabsTrigger>
          <TabsTrigger value="leakage">Revenue Leakage</TabsTrigger>
        </TabsList>

        {/* Approvals */}
        <TabsContent value="approvals" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Authorization Requests</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>ID</TableHead><TableHead>Type</TableHead><TableHead>Bill</TableHead><TableHead>Patient</TableHead><TableHead>Amount</TableHead><TableHead>Requested By</TableHead><TableHead>Rule</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {approvalRows.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-sm">{a.id}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{a.type}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{a.billId}</TableCell>
                      <TableCell className="font-medium">{a.patient}</TableCell>
                      <TableCell className="font-medium">₹{a.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.requestedBy}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{a.rule}</TableCell>
                      <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${authStatusColor[a.status]}`}>{a.status}</span></TableCell>
                      <TableCell>
                        {a.status === "Pending" && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-xs"><CheckCircle className="h-3 w-3 mr-1" /> Approve</Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive"><XCircle className="h-3 w-3 mr-1" /> Reject</Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Doctor Revenue */}
        <TabsContent value="doctor-rev" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Stethoscope className="h-5 w-5" /> Doctor Revenue & Sharing — March 2026</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Doctor</TableHead><TableHead>Department</TableHead><TableHead>Consultations</TableHead><TableHead>Procedures</TableHead><TableHead>Total Revenue</TableHead><TableHead>Share %</TableHead><TableHead>Doctor Payout</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {doctorRevenue.map(d => (
                    <TableRow key={d.doctor}>
                      <TableCell className="font-medium">{d.doctor}</TableCell>
                      <TableCell className="text-muted-foreground">{d.dept}</TableCell>
                      <TableCell>{d.consultations}</TableCell>
                      <TableCell>{d.procedures}</TableCell>
                      <TableCell className="font-medium">₹{d.totalRev.toLocaleString()}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{d.pct}%</Badge></TableCell>
                      <TableCell className="font-medium text-green-600">₹{d.share.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold">
                    <TableCell colSpan={4}>Total</TableCell>
                    <TableCell>₹{doctorRevenue.reduce((s, d) => s + d.totalRev, 0).toLocaleString()}</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-green-600">₹{doctorRevenue.reduce((s, d) => s + d.share, 0).toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Write-offs */}
        <TabsContent value="writeoffs" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5" /> Write-off Records</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>ID</TableHead><TableHead>Patient</TableHead><TableHead>Bill</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Reason</TableHead><TableHead>Approver</TableHead><TableHead>Status</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {writeOffs.map(w => (
                    <TableRow key={w.id}>
                      <TableCell className="font-mono text-sm">{w.id}</TableCell>
                      <TableCell><div><span className="font-medium">{w.patient}</span><br /><span className="text-xs text-muted-foreground">{w.uhid}</span></div></TableCell>
                      <TableCell className="font-mono text-xs">{w.billId}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{w.type}</Badge></TableCell>
                      <TableCell className="font-medium text-destructive">₹{w.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate text-muted-foreground">{w.reason}</TableCell>
                      <TableCell className="text-sm">{w.approver}</TableCell>
                      <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${authStatusColor[w.status]}`}>{w.status}</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credit / Debit Notes */}
        <TabsContent value="cn-dn" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Credit Notes & Debit Notes</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>ID</TableHead><TableHead>Type</TableHead><TableHead>Bill</TableHead><TableHead>Patient</TableHead><TableHead>Amount</TableHead><TableHead>Reason</TableHead><TableHead>Date</TableHead><TableHead>Approver</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {creditDebitNotes.map(n => (
                    <TableRow key={n.id}>
                      <TableCell className="font-mono text-sm">{n.id}</TableCell>
                      <TableCell><Badge variant={n.type === "Credit Note" ? "default" : "destructive"} className="text-xs">{n.type}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{n.billId}</TableCell>
                      <TableCell className="font-medium">{n.patient}</TableCell>
                      <TableCell className={`font-medium ${n.type === "Credit Note" ? "text-green-600" : "text-destructive"}`}>{n.type === "Credit Note" ? "-" : "+"}₹{n.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{n.reason}</TableCell>
                      <TableCell className="text-muted-foreground">{n.date}</TableCell>
                      <TableCell className="text-sm">{n.approver}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Leakage */}
        <TabsContent value="leakage" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" /> Revenue Leakage Detection
                <Badge variant="destructive" className="text-xs">{leakageAlerts.length} alerts — ₹{leakageValue.toLocaleString()}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {leakageAlerts.map(l => (
                <div key={l.id} className="border border-destructive/30 bg-destructive/5 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{l.type}</Badge>
                      <span className="font-medium text-foreground">{l.patient}</span>
                      <span className="text-xs text-muted-foreground">({l.uhid})</span>
                    </div>
                    <span className="font-bold text-destructive">₹{l.value}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{l.detail}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{l.dept} • {l.date}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs">Generate Bill</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs">Dismiss</Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </BillingDeptShell>
  );
}
