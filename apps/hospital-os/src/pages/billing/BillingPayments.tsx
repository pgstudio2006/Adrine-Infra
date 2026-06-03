import { useMemo, useState } from "react";
import { useBillingDeptPlatform } from "@/hooks/useBillingDeptPlatform";
import { BillingDeptShell } from "@/components/billing/BillingDeptShell";
import { BillingEmptyState } from "@/components/billing/BillingEmptyState";
import { BillingStepWizard, type WizardStep } from "@/components/billing/BillingStepWizard";
import type { PaymentMode } from "@/stores/hospitalStore";
import { toast } from "sonner";
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
import { Search, Plus, Eye, IndianRupee, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { pickPlatformRows } from "@/lib/platform/demo-fallback";

interface Payment {
  id: string;
  billId: string;
  uhid: string;
  patient: string;
  date: string;
  amount: number;
  method: "Cash" | "Card" | "UPI" | "Bank Transfer" | "Insurance";
  status: "Completed" | "Pending" | "Failed" | "Refunded";
  type: "Payment" | "Advance" | "Refund";
  reference?: string;
}

const DEMO_PAYMENTS: Payment[] = [
  { id: "PAY-6001", billId: "BIL-9001", uhid: "UH-10042", patient: "Ravi Sharma", date: "2026-03-08", amount: 1626, method: "UPI", status: "Completed", type: "Payment", reference: "UPI-REF-44821" },
  { id: "PAY-6002", billId: "BIL-9002", uhid: "UH-10035", patient: "Suresh Kumar", date: "2026-03-08", amount: 25000, method: "Card", status: "Completed", type: "Advance", reference: "CARD-****4521" },
  { id: "PAY-6003", billId: "BIL-9002", uhid: "UH-10035", patient: "Suresh Kumar", date: "2026-03-08", amount: 10000, method: "Cash", status: "Completed", type: "Payment" },
  { id: "PAY-6004", billId: "BIL-9005", uhid: "UH-10029", patient: "Meena Joshi", date: "2026-03-07", amount: 6479, method: "Card", status: "Completed", type: "Payment", reference: "CARD-****8833" },
  { id: "PAY-6005", billId: "BIL-9003", uhid: "UH-10038", patient: "Anita Desai", date: "2026-03-08", amount: 2498, method: "Insurance", status: "Pending", type: "Payment" },
  { id: "PAY-6006", billId: "BIL-9006", uhid: "UH-10015", patient: "Arun Pillai", date: "2026-03-07", amount: 1500, method: "Cash", status: "Refunded", type: "Refund" },
];

const statusColor: Record<string, string> = {
  Completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  Refunded: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

const typeIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  Payment: ArrowDownLeft,
  Advance: ArrowDownLeft,
  Refund: ArrowUpRight,
};

export default function BillingPayments() {
  const { platformOn, storePayments, storeInvoices, collectPayment } = useBillingDeptPlatform();
  const [search, setSearch] = useState("");
  const [payWizardStep, setPayWizardStep] = useState(0);
  const PAY_STEPS: WizardStep[] = [
    { id: "bill", label: "Select bill" },
    { id: "amount", label: "Amount & method" },
    { id: "confirm", label: "Confirm" },
  ];
  const [methodFilter, setMethodFilter] = useState("all");
  const [tab, setTab] = useState("all");
  const [showRecord, setShowRecord] = useState(false);
  const [selected, setSelected] = useState<Payment | null>(null);
  const [payInvoiceId, setPayInvoiceId] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState<PaymentMode>("cash");

  const payments: Payment[] = useMemo(
    () => pickPlatformRows(platformOn, storePayments, DEMO_PAYMENTS),
    [platformOn, storePayments],
  );

  const filtered = payments.filter(p => {
    const matchSearch = p.patient.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
    const matchMethod = methodFilter === "all" || p.method === methodFilter;
    const matchTab = tab === "all" || p.type === tab;
    return matchSearch && matchMethod && matchTab;
  });

  const totalCollected = payments.filter(p => p.status === "Completed" && p.type !== "Refund").reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === "Pending").reduce((s, p) => s + p.amount, 0);
  const totalRefunds = payments.filter(p => p.type === "Refund").reduce((s, p) => s + p.amount, 0);

  const submitPayment = () => {
    const amount = Number(payAmount);
    if (!payInvoiceId || !amount) {
      toast.error('Select invoice and amount');
      return;
    }
    void collectPayment(payInvoiceId, amount, payMode);
    setShowRecord(false);
    setPayWizardStep(0);
    setPayInvoiceId('');
    setPayAmount('');
  };

  return (
    <BillingDeptShell
      title="Payments"
      subtitle="Record and track all payment transactions"
      gateFocus="GAP-006"
      platformLabel="Payments use store + BillingSyncService settlement on OPD collect"
      actions={
        <Button onClick={() => { setPayWizardStep(0); setShowRecord(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Record Payment
        </Button>
      }
    >

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6 flex items-center gap-3"><IndianRupee className="h-8 w-8 text-green-600" /><div><p className="text-2xl font-bold">₹{totalCollected.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Collected</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3"><IndianRupee className="h-8 w-8 text-yellow-600" /><div><p className="text-2xl font-bold">₹{totalPending.toLocaleString()}</p><p className="text-xs text-muted-foreground">Pending</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3"><ArrowUpRight className="h-8 w-8 text-purple-600" /><div><p className="text-2xl font-bold">₹{totalRefunds.toLocaleString()}</p><p className="text-xs text-muted-foreground">Refunds</p></div></CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search patient or payment ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Method" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="Cash">Cash</SelectItem>
            <SelectItem value="Card">Card</SelectItem>
            <SelectItem value="UPI">UPI</SelectItem>
            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
            <SelectItem value="Insurance">Insurance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="Payment">Payments</TabsTrigger>
          <TabsTrigger value="Advance">Advances</TabsTrigger>
          <TabsTrigger value="Refund">Refunds</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Bill ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="p-0">
                    <BillingEmptyState
                      title="No payments recorded"
                      description="Use the payment wizard to collect against an open invoice."
                      actionLabel="Record payment"
                      onAction={() => setShowRecord(true)}
                    />
                  </TableCell>
                </TableRow>
              ) : filtered.map(p => {
                const Icon = typeIcon[p.type];
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm">{p.id}</TableCell>
                    <TableCell>
                      <div><span className="font-medium">{p.patient}</span><br /><span className="text-xs text-muted-foreground">{p.uhid}</span></div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">{p.billId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Icon className={`h-3.5 w-3.5 ${p.type === "Refund" ? "text-purple-600" : "text-green-600"}`} />
                        <span className="text-sm">{p.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className={`font-medium ${p.type === "Refund" ? "text-purple-600" : ""}`}>
                      {p.type === "Refund" ? "-" : ""}₹{p.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{p.method}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{p.reference || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{p.date}</TableCell>
                    <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[p.status]}`}>{p.status}</span></TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => setSelected(p)}><Eye className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Detail */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader><DialogTitle>Payment {selected.id}</DialogTitle></DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Patient:</span> <span className="font-medium">{selected.patient}</span></div>
                  <div><span className="text-muted-foreground">UHID:</span> {selected.uhid}</div>
                  <div><span className="text-muted-foreground">Bill ID:</span> {selected.billId}</div>
                  <div><span className="text-muted-foreground">Date:</span> {selected.date}</div>
                  <div><span className="text-muted-foreground">Method:</span> {selected.method}</div>
                  <div><span className="text-muted-foreground">Reference:</span> {selected.reference || "N/A"}</div>
                </div>
                <div className="border border-border rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-muted-foreground">{selected.type} Amount</p>
                    <p className="text-2xl font-bold">{selected.type === "Refund" ? "-" : ""}₹{selected.amount.toLocaleString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[selected.status]}`}>{selected.status}</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showRecord} onOpenChange={setShowRecord}>
        <DialogContent>
          <DialogHeader><DialogTitle>Payment wizard</DialogTitle></DialogHeader>
          <BillingStepWizard
            steps={PAY_STEPS}
            currentStep={payWizardStep}
            onStepChange={setPayWizardStep}
            onBack={() => setPayWizardStep((s) => Math.max(0, s - 1))}
            onNext={() => setPayWizardStep((s) => s + 1)}
            onFinish={submitPayment}
            finishLabel="Record payment"
            canNext={payWizardStep === 0 ? !!payInvoiceId : payWizardStep === 1 ? Number(payAmount) > 0 : true}
            canFinish={!!payInvoiceId && Number(payAmount) > 0}
          >
            {payWizardStep === 0 && (
              <div>
                <Label>Invoice</Label>
                {platformOn ? (
                  <Select value={payInvoiceId} onValueChange={setPayInvoiceId}>
                    <SelectTrigger><SelectValue placeholder="Select invoice" /></SelectTrigger>
                    <SelectContent>
                      {storeInvoices
                        .filter((inv) => inv.status !== 'paid')
                        .map((inv) => (
                          <SelectItem key={inv.id} value={inv.id}>
                            {inv.id} — {inv.patientName} (₹{Math.max(0, inv.total - inv.paid)})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input placeholder="INV-XXXX" value={payInvoiceId} onChange={(e) => setPayInvoiceId(e.target.value)} />
                )}
              </div>
            )}
            {payWizardStep === 1 && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Amount (₹)</Label><Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} /></div>
                <div><Label>Method</Label>
                  <Select value={payMode} onValueChange={(v) => setPayMode(v as PaymentMode)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            {payWizardStep === 2 && (
              <p className="text-sm">Collect ₹{Number(payAmount).toLocaleString()} via {payMode} against {payInvoiceId}.</p>
            )}
          </BillingStepWizard>
        </DialogContent>
      </Dialog>
    </BillingDeptShell>
  );
}
