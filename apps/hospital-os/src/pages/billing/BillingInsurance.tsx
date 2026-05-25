import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { BillingDeptShell } from "@/components/billing/BillingDeptShell";
import { BillingEmptyState } from "@/components/billing/BillingEmptyState";
import { useBillingInsuranceDeskData } from "@/hooks/useBillingDeptData";
import { platformInsuranceTransition } from "@/runtime/finance-runtime";
import { canUseFinanceRuntime } from "@/runtime/finance-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Eye, Plus, ShieldCheck, Send, CheckCircle, XCircle } from "lucide-react";

interface InsuranceClaim {
  id: string;
  uhid: string;
  patient: string;
  provider: string;
  policyNo: string;
  billId: string;
  claimAmount: number;
  approvedAmount: number | null;
  submittedDate: string;
  status: "Pre-Auth Pending" | "Pre-Auth Approved" | "Submitted" | "Under Review" | "Approved" | "Rejected" | "Settled";
  type: "Cashless" | "Reimbursement";
  notes: string;
}

const claims: InsuranceClaim[] = [
  { id: "CLM-401", uhid: "UH-10038", patient: "Anita Desai", provider: "Star Health Insurance", policyNo: "SH-20258844", billId: "BIL-9003", claimAmount: 2498, approvedAmount: null, submittedDate: "2026-03-08", status: "Submitted", type: "Cashless", notes: "OPD cardiology consultation and diagnostics" },
  { id: "CLM-400", uhid: "UH-10035", patient: "Suresh Kumar", provider: "ICICI Lombard", policyNo: "IL-30124567", billId: "BIL-9002", claimAmount: 42038, approvedAmount: 38000, submittedDate: "2026-03-07", status: "Under Review", type: "Cashless", notes: "IPD — Appendectomy surgery package. Pre-auth approved for 38,000." },
  { id: "CLM-399", uhid: "UH-10012", patient: "Kavita Reddy", provider: "HDFC ERGO", policyNo: "HE-44589231", billId: "BIL-9008", claimAmount: 15600, approvedAmount: 15600, submittedDate: "2026-03-05", status: "Approved", type: "Cashless", notes: "IPD delivery — normal. Approved in full." },
  { id: "CLM-398", uhid: "UH-10009", patient: "Sanjay Patil", provider: "New India Assurance", policyNo: "NI-78123456", billId: "BIL-9009", claimAmount: 8500, approvedAmount: 0, submittedDate: "2026-03-04", status: "Rejected", type: "Reimbursement", notes: "Claim rejected — pre-existing condition exclusion." },
  { id: "CLM-397", uhid: "UH-10006", patient: "Priya Menon", provider: "Star Health Insurance", policyNo: "SH-20251122", billId: "BIL-9010", claimAmount: 22000, approvedAmount: 22000, submittedDate: "2026-03-01", status: "Settled", type: "Cashless", notes: "IPD knee arthroscopy — settled in full." },
  { id: "CLM-396", uhid: "UH-10021", patient: "Vikram Singh", provider: "Bajaj Allianz", policyNo: "BA-55123890", billId: "BIL-9004", claimAmount: 8130, approvedAmount: null, submittedDate: "2026-03-08", status: "Pre-Auth Pending", type: "Cashless", notes: "Emergency admission — awaiting TPA pre-authorization." },
];

const statusColor: Record<string, string> = {
  "Pre-Auth Pending": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Pre-Auth Approved": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Submitted: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  "Under Review": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  Approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  Settled: "bg-muted text-muted-foreground",
};

const providers = [...new Set(claims.map(c => c.provider))];

function mapAuthState(state: string): InsuranceClaim["status"] {
  const s = state.toLowerCase();
  if (s === "initiated" || s === "documents_pending") return "Pre-Auth Pending";
  if (s === "approved" || s === "partially_approved") return "Pre-Auth Approved";
  if (s === "submitted") return "Submitted";
  if (s === "under_review") return "Under Review";
  if (s === "settled") return "Settled";
  if (s === "rejected") return "Rejected";
  return "Under Review";
}

export default function BillingInsurance() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<InsuranceClaim | null>(null);
  const [showNew, setShowNew] = useState(false);
  const { data: desk, platformOn, refresh } = useBillingInsuranceDeskData();

  const claimRows = useMemo((): InsuranceClaim[] => {
    if (!platformOn || !desk?.authorizations?.length) return claims;
    return (desk.authorizations as {
      id: string;
      state: string;
      payerName?: string | null;
      policyNumber?: string | null;
      approvedCents?: number | null;
      createdAt: string;
      patient?: { fullName?: string; mrn?: string | null };
    }[]).map((a) => ({
      id: a.id.slice(0, 8).toUpperCase(),
      uhid: a.patient?.mrn ?? "—",
      patient: a.patient?.fullName ?? "—",
      provider: a.payerName ?? "TPA",
      policyNo: a.policyNumber ?? "—",
      billId: "—",
      claimAmount: (a.approvedCents ?? 0) / 100,
      approvedAmount: ["approved", "partially_approved", "settled"].includes(a.state) ? (a.approvedCents ?? 0) / 100 : null,
      submittedDate: a.createdAt.slice(0, 10),
      status: mapAuthState(a.state),
      type: "Cashless" as const,
      notes: `Platform authorization (${a.state})`,
      _platformId: a.id,
    })) as (InsuranceClaim & { _platformId?: string })[];
  }, [platformOn, desk]);

  const filtered = claimRows.filter(c => {
    const matchSearch = c.patient.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase()) || c.policyNo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalClaimed = claimRows.reduce((s, c) => s + c.claimAmount, 0);
  const totalApproved = claimRows.filter(c => c.approvedAmount).reduce((s, c) => s + (c.approvedAmount || 0), 0);
  const pendingCount = claimRows.filter(c => ["Pre-Auth Pending", "Submitted", "Under Review"].includes(c.status)).length;

  const handleApprovePreauth = async (row: InsuranceClaim & { _platformId?: string }) => {
    if (!canUseFinanceRuntime() || !row._platformId) return;
    try {
      await platformInsuranceTransition(row._platformId, "approve_authorization", {
        approvedCents: Math.round(row.claimAmount * 100) || 500000,
      });
      toast.success("Pre-authorization approved on platform");
      void refresh();
      setSelected(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Transition failed");
    }
  };

  return (
    <BillingDeptShell
      title="Insurance & TPA"
      subtitle="Manage insurance claims, pre-authorizations, and settlements"
      gateFocus="GAP-007"
      platformLabel="Insurance desk — GET /billing/dept/insurance"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/billing-dept/pre-auth">Pre-auth wizard</Link>
          </Button>
          <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-2" /> New Claim</Button>
        </div>
      }
    >

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Authorizations</p><p className="text-2xl font-bold">{claimRows.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Claimed</p><p className="text-2xl font-bold">₹{totalClaimed.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Approved Amount</p><p className="text-2xl font-bold text-green-600">₹{totalApproved.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Pending Claims</p><p className="text-2xl font-bold text-yellow-600">{pendingCount}</p></CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search patient, claim ID, or policy..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Pre-Auth Pending">Pre-Auth Pending</SelectItem>
            <SelectItem value="Submitted">Submitted</SelectItem>
            <SelectItem value="Under Review">Under Review</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="Settled">Settled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Policy No.</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Claimed</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="p-0">
                    <BillingEmptyState
                      title="No insurance authorizations"
                      description={platformOn ? "Start pre-auth from the wizard for IPD admissions on insurance/TPA mode." : "Demo claims shown when platform runtime is off."}
                      actionLabel="Open pre-auth wizard"
                      onAction={() => { window.location.href = '/billing-dept/pre-auth'; }}
                    />
                  </TableCell>
                </TableRow>
              ) : filtered.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-sm">{c.id}</TableCell>
                  <TableCell>
                    <div><span className="font-medium">{c.patient}</span><br /><span className="text-xs text-muted-foreground">{c.uhid}</span></div>
                  </TableCell>
                  <TableCell className="text-sm">{c.provider}</TableCell>
                  <TableCell className="font-mono text-xs">{c.policyNo}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{c.type}</Badge></TableCell>
                  <TableCell className="font-medium">₹{c.claimAmount.toLocaleString()}</TableCell>
                  <TableCell className={c.approvedAmount ? "font-medium text-green-600" : "text-muted-foreground"}>{c.approvedAmount != null ? `₹${c.approvedAmount.toLocaleString()}` : "—"}</TableCell>
                  <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[c.status]}`}>{c.status}</span></TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => setSelected(c)}><Eye className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Claim Detail */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" /> Claim {selected.id}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[selected.status]}`}>{selected.status}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Patient:</span> <span className="font-medium">{selected.patient}</span></div>
                  <div><span className="text-muted-foreground">UHID:</span> {selected.uhid}</div>
                  <div><span className="text-muted-foreground">Provider:</span> {selected.provider}</div>
                  <div><span className="text-muted-foreground">Policy:</span> {selected.policyNo}</div>
                  <div><span className="text-muted-foreground">Bill ID:</span> {selected.billId}</div>
                  <div><span className="text-muted-foreground">Type:</span> <Badge variant="outline" className="text-xs">{selected.type}</Badge></div>
                  <div><span className="text-muted-foreground">Submitted:</span> {selected.submittedDate}</div>
                </div>
                <div className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">Claim Amount:</span><span className="font-medium">₹{selected.claimAmount.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Approved:</span><span className={selected.approvedAmount ? "font-medium text-green-600" : "text-muted-foreground"}>{selected.approvedAmount != null ? `₹${selected.approvedAmount.toLocaleString()}` : "Pending"}</span></div>
                </div>
                <div><span className="text-muted-foreground">Notes:</span> {selected.notes}</div>
                {selected.status === "Pre-Auth Pending" && (
                  <div className="flex gap-2">
                    <Button className="flex-1" disabled={!canUseFinanceRuntime()} onClick={() => void handleApprovePreauth(selected as InsuranceClaim & { _platformId?: string })}><Send className="h-4 w-4 mr-2" /> Approve on platform</Button>
                  </div>
                )}
                {selected.status === "Approved" && (
                  <Button className="w-full" onClick={() => setSelected(null)}><CheckCircle className="h-4 w-4 mr-2" /> Mark as Settled</Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Claim */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Insurance Claim</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Patient UHID</Label><Input placeholder="UH-XXXXX" /></div>
              <div><Label>Bill ID</Label><Input placeholder="BIL-XXXX" /></div>
              <div><Label>Insurance Provider</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{providers.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Policy Number</Label><Input placeholder="Policy number" /></div>
              <div><Label>Claim Amount (₹)</Label><Input type="number" placeholder="0" /></div>
              <div><Label>Claim Type</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashless">Cashless</SelectItem>
                    <SelectItem value="reimbursement">Reimbursement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Notes</Label><Textarea placeholder="Claim details..." rows={2} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button onClick={() => { setShowNew(false); toast.success("Insurance claim submitted"); }}>Submit Claim</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </BillingDeptShell>
  );
}
