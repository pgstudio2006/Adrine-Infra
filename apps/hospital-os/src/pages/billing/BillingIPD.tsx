import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppSelect } from "@/components/ui/app-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Eye, IndianRupee, Bed, Clock, AlertTriangle, CreditCard } from "lucide-react";
import { useHospital, type PaymentMode } from "@/stores/hospitalStore";
import { canUseIpdBillingRuntime, platformGetLiveIpdFinancialState, type LiveIpdFinancialState } from "@/runtime/billing-runtime";
import { formatPlatformErrorBody, PlatformApiError } from "@/runtime/platform-client";
import { useIpdLiveFinancial } from "@/hooks/useBillingDeptPlatform";
import { BillingDeptShell } from "@/components/billing/BillingDeptShell";
import { BillingEmptyState } from "@/components/billing/BillingEmptyState";
import { isPlatformAuthoritative } from "@/runtime/platform-store-bridge";
import { canUseBillingRuntime } from "@/runtime/billing-runtime";
import { OperationalDischargePanel } from "@/components/operations/OperationalDischargePanel";
import {
  canMarkLocalDischarged,
  canUseDischargeRuntime,
  type LiveDischargeState,
} from "@/runtime/discharge-runtime";

type IPDBillStatus = "Running" | "Discharge" | "Locked";

function deriveStatus(balance: number, admissionStatus: string, isLocked?: boolean): IPDBillStatus {
  if (isLocked || admissionStatus === "discharged") return "Locked";
  if (admissionStatus === "discharge-ready") return "Discharge";
  return balance > 0 ? "Running" : "Locked";
}

const statusColor: Record<IPDBillStatus, string> = {
  Running: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Discharge: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  Locked: "bg-muted text-muted-foreground",
};

export default function BillingIPD() {
  const {
    admissions,
    invoices,
    estimates,
    billingTransactions,
    collectPayment,
    createEstimate,
    generateInterimBill,
    applyFinalBillDiscount,
    finalizeAdmissionBill,
    applyDischargeSummaryTemplate,
    updateAdmissionStatus,
    unlockAdmissionEditLock,
    refreshPlatformIpdSnapshots,
  } = useHospital();

  const [platformBilling, setPlatformBilling] = useState<LiveIpdFinancialState | null>(null);
  const [platformBillingError, setPlatformBillingError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedAdmissionId, setSelectedAdmissionId] = useState<string | null>(null);

  const [estimateAmount, setEstimateAmount] = useState("");
  const [estimateNote, setEstimateNote] = useState("");
  const [interimNote, setInterimNote] = useState("");

  const [discountAmount, setDiscountAmount] = useState("");
  const [discountReason, setDiscountReason] = useState("");

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
  const [paymentReference, setPaymentReference] = useState("");

  const [templateKey, setTemplateKey] = useState<"general" | "post-op" | "maternity" | "icu">("general");
  const [templateDoctor, setTemplateDoctor] = useState("Dr. A. Shah");

  const [unlockAdmin, setUnlockAdmin] = useState("Billing Admin");
  const [unlockReason, setUnlockReason] = useState("");
  const [liveDischarge, setLiveDischarge] = useState<LiveDischargeState | null>(null);

  const ipdInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.category === "IPD" || invoice.category === "Emergency"),
    [invoices],
  );

  const rows = useMemo(() => {
    return admissions.map((admission) => {
      const linkedInvoices = ipdInvoices.filter((invoice) => invoice.uhid === admission.uhid);
      const totalCharges = linkedInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
      const paid = linkedInvoices.reduce((sum, invoice) => sum + invoice.paid, 0);
      const balance = totalCharges - paid;
      return {
        admission,
        linkedInvoices,
        totalCharges,
        paid,
        balance,
        status: deriveStatus(balance, admission.status, admission.isIpLocked),
      };
    }).filter((row) => {
      const query = search.toLowerCase();
      return (
        row.admission.patientName.toLowerCase().includes(query) ||
        row.admission.uhid.toLowerCase().includes(query) ||
        row.admission.id.toLowerCase().includes(query)
      );
    });
  }, [admissions, ipdInvoices, search]);

  const selectedRow = rows.find((row) => row.admission.id === selectedAdmissionId) ?? null;

  useEffect(() => {
    if (!canUseIpdBillingRuntime()) return;
    void refreshPlatformIpdSnapshots();
    const timer = setInterval(() => void refreshPlatformIpdSnapshots(), 30_000);
    return () => clearInterval(timer);
  }, [refreshPlatformIpdSnapshots]);

  useEffect(() => {
    const platformId = selectedRow?.admission.platformAdmissionId;
    if (!canUseIpdBillingRuntime() || !platformId) {
      setPlatformBilling(null);
      setPlatformBillingError(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const live = await platformGetLiveIpdFinancialState(platformId);
        if (!cancelled) {
          setPlatformBilling(live);
          setPlatformBillingError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const body = err instanceof PlatformApiError ? err.body : undefined;
          setPlatformBilling(null);
          setPlatformBillingError(
            formatPlatformErrorBody(body) ?? (err instanceof Error ? err.message : "Failed to load platform billing"),
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedRow?.admission.platformAdmissionId, selectedRow?.admission.platformInvoiceVersion]);
  const platformOn = isPlatformAuthoritative() && canUseBillingRuntime();
  const liveIpd = useIpdLiveFinancial(
    platformOn ? selectedRow?.admission.platformAdmissionId : undefined,
  );
  const selectedEstimates = selectedRow
    ? estimates.filter((estimate) => estimate.uhid === selectedRow.admission.uhid)
    : [];
  const selectedTransactions = selectedRow
    ? billingTransactions.filter((transaction) => transaction.uhid === selectedRow.admission.uhid)
    : [];

  const activeBills = rows.filter((row) => row.status === "Running").length;
  const totalDeposits = rows.reduce((sum, row) => sum + row.paid, 0);
  const outstandingBalance = rows.reduce((sum, row) => sum + Math.max(0, row.balance), 0);
  const dischargePending = rows.filter((row) => row.status === "Discharge").length;

  const recordPayment = async () => {
    if (!selectedRow) return;
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }

    const unpaidInvoice = selectedRow.linkedInvoices.find((invoice) => invoice.paid < invoice.total);
    if (!unpaidInvoice) {
      toast.error("No pending invoice found for this admission");
      return;
    }

    await collectPayment(unpaidInvoice.id, amount, paymentMode, paymentReference || undefined);
    setPaymentAmount("");
    setPaymentReference("");
  };

  const createEstimateSnapshot = () => {
    if (!selectedRow) return;

    const amount = Number(estimateAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter valid estimate amount");
      return;
    }

    const id = createEstimate({
      uhid: selectedRow.admission.uhid,
      patientName: selectedRow.admission.patientName,
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      category: "IPD",
      items: [{ description: estimateNote || "IPD estimate snapshot", amount }],
      total: amount,
    });

    toast.success(`Estimate created: ${id}`);
    setEstimateAmount("");
    setEstimateNote("");
  };

  const generateInterimSnapshot = () => {
    if (!selectedRow) return;
    const id = generateInterimBill(selectedRow.admission.id, interimNote || undefined);
    if (id) {
      toast.success(`Interim bill generated: ${id}`);
      setInterimNote("");
    }
  };

  const applyDiscount = () => {
    if (!selectedRow) return;
    const amount = Number(discountAmount);
    if (!amount || amount <= 0 || !discountReason.trim()) {
      toast.error("Discount amount and reason are required.");
      return;
    }
    const invoiceId = applyFinalBillDiscount(selectedRow.admission.id, amount, discountReason);
    if (invoiceId) {
      toast.success(`Discount applied on ${invoiceId}`);
      setDiscountAmount("");
      setDiscountReason("");
    }
  };

  const finalizeBill = () => {
    if (!selectedRow) return;
    const id = finalizeAdmissionBill(selectedRow.admission.id);
    if (id) {
      toast.success(`Final bill generated: ${id}`);
    }
  };

  const applyTemplate = () => {
    if (!selectedRow) return;
    try {
      applyDischargeSummaryTemplate(selectedRow.admission.id, templateKey, templateDoctor || "Doctor On Call");
      toast.success("Discharge summary template applied.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to apply template.");
    }
  };

  const markDischargeReady = () => {
    if (!selectedRow) return;
    if (canUseDischargeRuntime() && liveDischarge?.blockers.some((b) => b.severity === "critical")) {
      toast.error("Resolve platform discharge blockers before discharge planning.");
      return;
    }
    updateAdmissionStatus(selectedRow.admission.id, "discharge-ready");
  };

  const markDischarged = () => {
    if (!selectedRow) return;
    if (canUseDischargeRuntime() && !canMarkLocalDischarged(liveDischarge)) {
      toast.error("Use platform discharge completion before marking discharged locally.");
      return;
    }
    updateAdmissionStatus(selectedRow.admission.id, "discharged");
  };

  const billingClearanceReady =
    selectedRow
    && (selectedRow.admission.billingStage === "finalized" || selectedRow.balance <= 0)
    && !liveIpd.blockers.some((b) => /critical/i.test(b));

  const insuranceClearanceReady =
    billingClearanceReady && !liveDischarge?.blockers.some((b) => b.severity === "critical");

  const unlockAdmission = () => {
    if (!selectedRow) return;
    if (!unlockAdmin.trim() || !unlockReason.trim()) {
      toast.error("Admin name and unlock reason are required.");
      return;
    }
    unlockAdmissionEditLock(selectedRow.admission.id, unlockAdmin, unlockReason);
    setUnlockReason("");
  };

  return (
    <BillingDeptShell
      title="IPD Running Billing"
      subtitle="Live billing overview for admitted patients, including emergency-to-IPD transfers"
      gateFocus="GAP-007"
      blockers={liveIpd.blockers}
      warnings={liveIpd.state?.warnings}
      platformError={liveIpd.error}
      platformLabel="IPD live invoice (selected admission)"
      showPlatformStrip={!!selectedRow?.admission.platformAdmissionId}
    >
      {canUseDischargeRuntime() && selectedRow?.admission.platformAdmissionId && (
        <OperationalDischargePanel
          admissionId={selectedRow.admission.platformAdmissionId}
          patientName={selectedRow.admission.patientName}
          billingClearanceContext={
            billingClearanceReady
              ? { interimBillReviewed: true, noBillingBlockers: true }
              : undefined
          }
          insuranceClearanceContext={
            insuranceClearanceReady
              ? { insuranceSettledOrSelfPay: true, noDischargeBlockers: true }
              : undefined
          }
          completeDischargeContext={
            selectedRow.balance <= 0 && selectedRow.admission.billingStage === "finalized"
              ? { finalBillSettled: true, bedReleaseScheduled: true }
              : undefined
          }
          onLiveStateChange={setLiveDischarge}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6 flex items-center gap-3"><Bed className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{activeBills}</p><p className="text-xs text-muted-foreground">Active IPD Bills</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3"><IndianRupee className="h-8 w-8 text-green-600" /><div><p className="text-2xl font-bold">Rs {totalDeposits.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Deposits</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3"><AlertTriangle className="h-8 w-8 text-yellow-600" /><div><p className="text-2xl font-bold">Rs {outstandingBalance.toLocaleString()}</p><p className="text-xs text-muted-foreground">Outstanding Balance</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3"><Clock className="h-8 w-8 text-orange-600" /><div><p className="text-2xl font-bold">{dischargePending}</p><p className="text-xs text-muted-foreground">Discharge Ready</p></div></CardContent></Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search patient, UHID, or admission ID..." value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admission</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Ward / Bed</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Charges</TableHead>
                <TableHead>Deposits</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No admissions available.</TableCell></TableRow>
              ) : rows.map((row) => (
                <TableRow key={row.admission.id}>
                  <TableCell className="font-mono text-sm">{row.admission.id}</TableCell>
                  <TableCell><div><span className="font-medium">{row.admission.patientName}</span><br /><span className="text-xs text-muted-foreground">{row.admission.uhid}</span></div></TableCell>
                  <TableCell className="text-sm">{row.admission.ward} / {row.admission.bed}</TableCell>
                  <TableCell className="text-sm">{row.admission.attendingDoctor}</TableCell>
                  <TableCell className="font-medium">Rs {row.totalCharges.toLocaleString()}</TableCell>
                  <TableCell className="text-green-600">Rs {row.paid.toLocaleString()}</TableCell>
                  <TableCell className={`font-medium ${row.balance > 0 ? "text-destructive" : "text-green-600"}`}>Rs {row.balance.toLocaleString()}</TableCell>
                  <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[row.status]}`}>{row.status}</span></TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => setSelectedAdmissionId(row.admission.id)}><Eye className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedRow} onOpenChange={() => setSelectedAdmissionId(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedRow && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedRow.admission.id} — {selectedRow.admission.patientName}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[selectedRow.status]}`}>{selectedRow.status}</span>
                </DialogTitle>
              </DialogHeader>

              {platformBillingError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  Platform billing: {platformBillingError}
                </div>
              )}
              {platformBilling && (
                <div className="rounded-lg border bg-muted/20 p-3 text-xs space-y-1">
                  <p>
                    <span className="text-muted-foreground">Platform admission:</span>{" "}
                    {platformBilling.admission.state}
                  </p>
                  {platformBilling.invoice && (
                    <p>
                      <span className="text-muted-foreground">Live invoice:</span>{" "}
                      {platformBilling.invoice.id} · ₹{(platformBilling.invoice.outstandingCents / 100).toLocaleString()}{" "}
                      outstanding ({platformBilling.invoice.lineCount} lines)
                    </p>
                  )}
                  {platformBilling.blockers.length > 0 && (
                    <p className="text-destructive">
                      Blockers: {platformBilling.blockers.join("; ")}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><span className="text-muted-foreground">UHID:</span> {selectedRow.admission.uhid}</div>
                <div><span className="text-muted-foreground">Journey:</span> {selectedRow.admission.journeyType}</div>
                <div><span className="text-muted-foreground">Source:</span> {selectedRow.admission.admissionSource}</div>
                <div><span className="text-muted-foreground">Ward:</span> {selectedRow.admission.ward}</div>
                <div><span className="text-muted-foreground">Bed:</span> {selectedRow.admission.bed}</div>
                <div><span className="text-muted-foreground">Priority:</span> {selectedRow.admission.nursingPriority}</div>
                <div><span className="text-muted-foreground">Billing Stage:</span> {selectedRow.admission.billingStage || "estimate"}</div>
                <div><span className="text-muted-foreground">IP Lock:</span> {selectedRow.admission.isIpLocked ? "Locked" : "Editable"}</div>
                <div><span className="text-muted-foreground">Discharge Status:</span> {selectedRow.admission.status}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg border p-4 space-y-3">
                  <p className="text-sm font-semibold">Estimate / Interim / Final</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Estimate Amount</Label>
                      <Input type="number" value={estimateAmount} onChange={(event) => setEstimateAmount(event.target.value)} placeholder="Amount" />
                    </div>
                    <div>
                      <Label>Estimate Note</Label>
                      <Input value={estimateNote} onChange={(event) => setEstimateNote(event.target.value)} placeholder="Estimate description" />
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={createEstimateSnapshot}>Create Estimate Snapshot</Button>

                  <div>
                    <Label>Interim Note</Label>
                    <Input value={interimNote} onChange={(event) => setInterimNote(event.target.value)} placeholder="Interim bill remark" />
                  </div>
                  <Button variant="outline" className="w-full" onClick={generateInterimSnapshot}>Generate Interim Bill</Button>
                  <Button className="w-full" onClick={finalizeBill}>Finalize Bill</Button>
                </div>

                <div className="rounded-lg border p-4 space-y-3">
                  <p className="text-sm font-semibold">Final Bill Discount</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Discount Amount</Label>
                      <Input type="number" value={discountAmount} onChange={(event) => setDiscountAmount(event.target.value)} placeholder="Amount" />
                    </div>
                    <div>
                      <Label>Reason</Label>
                      <Input value={discountReason} onChange={(event) => setDiscountReason(event.target.value)} placeholder="Discount reason" />
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={applyDiscount}>Apply Final Discount</Button>
                </div>
              </div>

              {selectedEstimates.length > 0 && (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Estimate</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedEstimates.map((estimate) => (
                          <TableRow key={estimate.id}>
                            <TableCell className="font-mono text-xs">{estimate.id}</TableCell>
                            <TableCell>{estimate.date}</TableCell>
                            <TableCell>Rs {estimate.total.toLocaleString()}</TableCell>
                            <TableCell><Badge variant="outline">{estimate.status}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRow.linkedInvoices.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No IPD invoices linked yet.</TableCell></TableRow>
                      ) : selectedRow.linkedInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono text-xs">{invoice.id}</TableCell>
                          <TableCell>{invoice.date}</TableCell>
                          <TableCell>{invoice.category}</TableCell>
                          <TableCell>Rs {invoice.total.toLocaleString()}</TableCell>
                          <TableCell>Rs {invoice.paid.toLocaleString()}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{invoice.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {selectedRow.balance > 0 && (
                <div className="rounded-lg border p-4 space-y-3">
                  <p className="text-sm font-semibold">Record Deposit</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label>Amount</Label>
                      <Input type="number" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} />
                    </div>
                    <div>
                      <Label>Payment Mode</Label>
                      <AppSelect
                        value={paymentMode}
                        onValueChange={(value) => setPaymentMode(value as PaymentMode)}
                        options={[
                          { value: "cash", label: "Cash" },
                          { value: "card", label: "Card" },
                          { value: "upi", label: "UPI" },
                          { value: "cheque", label: "Cheque" },
                          { value: "bank-transfer", label: "Bank Transfer" },
                        ]}
                        className="w-full h-10 px-3 text-sm"
                      />
                    </div>
                    <div>
                      <Label>Reference No.</Label>
                      <Input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="Txn / cheque reference" />
                    </div>
                  </div>
                  <Button onClick={recordPayment} className="w-full"><CreditCard className="h-4 w-4 mr-2" /> Record Payment</Button>
                </div>
              )}

              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-sm font-semibold">Discharge Templates and Lock Control</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <AppSelect
                    value={templateKey}
                    onValueChange={(value) => setTemplateKey(value as "general" | "post-op" | "maternity" | "icu")}
                    options={[
                      { value: "general", label: "General" },
                      { value: "post-op", label: "Post-op" },
                      { value: "maternity", label: "Maternity" },
                      { value: "icu", label: "ICU" },
                    ]}
                    className="w-full h-10 px-3 text-sm"
                  />
                  <Input value={templateDoctor} onChange={(event) => setTemplateDoctor(event.target.value)} placeholder="Doctor name" />
                  <Button variant="outline" onClick={applyTemplate}>Apply Template</Button>
                </div>

                {selectedRow.admission.dischargeSummary && (
                  <div className="rounded-md border bg-muted/20 p-3 text-xs whitespace-pre-wrap">
                    {selectedRow.admission.dischargeSummary}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={markDischargeReady}>Mark Discharge Ready</Button>
                  <Button
                    variant="outline"
                    onClick={markDischarged}
                    disabled={canUseDischargeRuntime() && !canMarkLocalDischarged(liveDischarge)}
                  >
                    Mark Discharged (Auto Lock)
                  </Button>
                  <Badge variant="outline">Lock: {selectedRow.admission.isIpLocked ? "Enabled" : "Disabled"}</Badge>
                </div>

                {selectedRow.admission.isIpLocked && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2">
                    <Input value={unlockAdmin} onChange={(event) => setUnlockAdmin(event.target.value)} placeholder="Admin name" />
                    <Input value={unlockReason} onChange={(event) => setUnlockReason(event.target.value)} placeholder="Unlock reason" />
                    <Button onClick={unlockAdmission}>Admin Unlock</Button>
                  </div>
                )}
              </div>

              {selectedTransactions.length > 0 && (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Txn</TableHead>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Kind</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead>Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedTransactions.slice(0, 8).map((txn) => (
                          <TableRow key={txn.id}>
                            <TableCell className="font-mono text-xs">{txn.id}</TableCell>
                            <TableCell className="font-mono text-xs">{txn.invoiceId}</TableCell>
                            <TableCell>{txn.kind}</TableCell>
                            <TableCell>Rs {txn.amount.toLocaleString()}</TableCell>
                            <TableCell>{txn.mode}</TableCell>
                            <TableCell>{txn.reference || "-"}</TableCell>
                            <TableCell>{txn.createdAt}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </BillingDeptShell>
  );
}
