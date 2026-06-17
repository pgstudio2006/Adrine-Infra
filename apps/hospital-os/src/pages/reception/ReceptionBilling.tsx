import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Banknote,
  CreditCard,
  Eye,
  FileText,
  IndianRupee,
  Printer,
  Plus,
  Search,
  Smartphone,
  Undo2,
  X,
  SkipForward,
  Stethoscope,
} from "lucide-react";
import { useHospital, type BillingInvoice } from "@/stores/hospitalStore";
import { useClinicalPlatformListSync } from "@/hooks/useClinicalPlatformListSync";
import { canUseOpdRuntime } from "@/runtime/opd-runtime";
import {
  platformEnsureOpdDraft,
  platformSyncCharge,
} from "@/runtime/billing-runtime";
import { getPlatformSession } from "@/runtime/platform-session";
import { AppSelect } from "@/components/ui/app-select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { isNavayuTenant } from "@/lib/navayu/navayu-forms";
import { getOpdPaymentStatus } from "@/lib/navayu/navayu-opd-journey";

const statusStyles: Record<BillingInvoice["status"], string> = {
  paid: "bg-success/10 text-success",
  partial: "bg-warning/10 text-warning",
  pending: "bg-info/10 text-info",
  overdue: "bg-destructive/10 text-destructive",
};

const paymentModeIcons: Record<
  NonNullable<BillingInvoice["paymentMode"]>,
  { icon: typeof CreditCard; label: string }
> = {
  cash: { icon: Banknote, label: "Cash" },
  card: { icon: CreditCard, label: "Card" },
  upi: { icon: Smartphone, label: "UPI" },
  cheque: { icon: Banknote, label: "Cheque" },
  "bank-transfer": { icon: CreditCard, label: "Bank Transfer" },
};

const DESK_CHARGE_PACKAGES: Array<{
  label: string;
  description: string;
  amount: number;
  category: BillingInvoice["category"];
}> = [
  {
    label: "Registration fee",
    description: "OPD registration fee",
    amount: 250,
    category: "OPD",
  },
  {
    label: "Consultation fee",
    description: "OPD consultation fee",
    amount: 500,
    category: "OPD",
  },
  {
    label: "Registration + consult",
    description: "OPD registration and consultation package",
    amount: 750,
    category: "OPD",
  },
  {
    label: "IPD admission deposit",
    description: "IPD admission deposit handoff",
    amount: 5000,
    category: "IPD",
  },
];

function inferServiceType(description: string) {
  if (description.toLowerCase().includes("lab")) return "Lab";
  if (description.toLowerCase().includes("radiology")) return "Radiology";
  if (description.toLowerCase().includes("registration")) return "Registration";
  if (description.toLowerCase().includes("consultation")) return "Consultation";
  if (
    description.toLowerCase().includes("admission") ||
    description.toLowerCase().includes("bed")
  )
    return "IPD";
  return "Service";
}

export default function ReceptionBilling() {
  const navigate = useNavigate();
  const navayuMode = isNavayuTenant();
  const {
    patients,
    invoices,
    estimates,
    createInvoice,
    createEstimate,
    convertEstimateToInvoice,
    collectPayment,
    refundPayment,
    skipOpdPayment,
    queue,
    convertOpdToIPDByUHID,
  } = useHospital();
  useClinicalPlatformListSync({ queue: true, departmentWorklists: false });

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | BillingInvoice["status"]>("all");
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | BillingInvoice["category"]
  >("all");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    null,
  );

  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [showNewEstimate, setShowNewEstimate] = useState(false);

  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] =
    useState<NonNullable<BillingInvoice["paymentMode"]>>("cash");
  const [paymentAmount, setPaymentAmount] = useState("");

  const [refundInvoiceId, setRefundInvoiceId] = useState<string | null>(null);
  const [refundMode, setRefundMode] =
    useState<NonNullable<BillingInvoice["paymentMode"]>>("upi");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [printInvoiceId, setPrintInvoiceId] = useState<string | null>(null);

  const [newInvoicePatient, setNewInvoicePatient] = useState("");
  const [newInvoiceDescription, setNewInvoiceDescription] = useState("");
  const [newInvoiceAmount, setNewInvoiceAmount] = useState("");
  const [newInvoiceCategory, setNewInvoiceCategory] =
    useState<BillingInvoice["category"]>("OPD");

  const [newEstimatePatient, setNewEstimatePatient] = useState("");
  const [newEstimateDescription, setNewEstimateDescription] = useState("");
  const [newEstimateAmount, setNewEstimateAmount] = useState("");
  const [newEstimateCategory, setNewEstimateCategory] =
    useState<BillingInvoice["category"]>("OPD");

  const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.paid, 0);
  const totalPending = invoices.reduce(
    (sum, invoice) => sum + Math.max(0, invoice.total - invoice.paid),
    0,
  );

  const filteredInvoices = useMemo(() => {
    const query = search.toLowerCase();
    return invoices
      .filter((invoice) => {
        const matchesSearch =
          invoice.patientName.toLowerCase().includes(query) ||
          invoice.id.toLowerCase().includes(query) ||
          invoice.uhid.toLowerCase().includes(query);
        const matchesStatus = filter === "all" || invoice.status === filter;
        const matchesCategory =
          categoryFilter === "all" || invoice.category === categoryFilter;
        return matchesSearch && matchesStatus && matchesCategory;
      })
      .sort((left, right) => right.id.localeCompare(left.id));
  }, [categoryFilter, filter, invoices, search]);

  const draftEstimates = useMemo(() => {
    const query = search.toLowerCase();
    return estimates.filter(
      (estimate) =>
        estimate.status === "draft" &&
        (estimate.patientName.toLowerCase().includes(query) ||
          estimate.id.toLowerCase().includes(query) ||
          estimate.uhid.toLowerCase().includes(query)),
    );
  }, [estimates, search]);

  const selectedInvoice =
    invoices.find((invoice) => invoice.id === selectedInvoiceId) || null;
  const paymentInvoice =
    invoices.find((invoice) => invoice.id === paymentInvoiceId) || null;
  const refundInvoice =
    invoices.find((invoice) => invoice.id === refundInvoiceId) || null;

  const openPaymentModal = (invoiceId: string) => {
    const invoice = invoices.find((item) => item.id === invoiceId);
    if (!invoice) return;

    setPaymentInvoiceId(invoiceId);
    setPaymentMode(invoice.paymentMode || "cash");
    setPaymentAmount(String(Math.max(0, invoice.total - invoice.paid)));
  };

  const openRefundModal = (invoiceId: string) => {
    const invoice = invoices.find((item) => item.id === invoiceId);
    if (!invoice || invoice.paid <= 0) return;

    setRefundInvoiceId(invoiceId);
    setRefundMode(
      (invoice.paymentMode as NonNullable<BillingInvoice["paymentMode"]>) ||
        "upi",
    );
    setRefundAmount(String(invoice.paid));
    setRefundReason("");
  };

  const handleCreateInvoice = async () => {
    const patient = patients.find((item) => item.uhid === newInvoicePatient);
    const amount = Number(newInvoiceAmount);
    const description = newInvoiceDescription.trim();
    if (!patient || !description || amount <= 0) return;

    const invoiceId = createInvoice({
      uhid: patient.uhid,
      patientName: patient.name,
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      category: newInvoiceCategory,
      items: [{ description, amount }],
      total: amount,
      paid: 0,
      status: "pending",
    });

    if (
      canUseOpdRuntime() &&
      newInvoiceCategory === "OPD" &&
      patient.platformOpdVisitId &&
      patient.platformPatientId &&
      getPlatformSession()
    ) {
      try {
        await platformEnsureOpdDraft({
          opdVisitId: patient.platformOpdVisitId,
          patientId: patient.platformPatientId,
        });
        await platformSyncCharge({
          opdVisitId: patient.platformOpdVisitId,
          patientId: patient.platformPatientId,
          idempotencyKey: `reception-desk:${patient.platformOpdVisitId}:${invoiceId}`,
          description,
          amountCents: Math.round(amount * 100),
          sourceModule: "reception_billing",
          sourceAction: "desk_invoice",
          sourceRefId: invoiceId,
        });
      } catch (err) {
        toast.error("Platform billing sync failed", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    }

    setShowNewInvoice(false);
    setNewInvoicePatient("");
    setNewInvoiceDescription("");
    setNewInvoiceAmount("");
    setNewInvoiceCategory("OPD");
  };

  const printInvoice = invoices.find((i) => i.id === printInvoiceId) ?? null;

  // Billing blocker strip — patients currently in queue with unpaid invoices
  const queueBlockers = useMemo(() => {
    const activeUhids = new Set(
      queue
        .filter((q) => q.status === "waiting" || q.status === "called")
        .map((q) => q.uhid),
    );
    return invoices.filter(
      (inv) =>
        (inv.status === "pending" || inv.status === "overdue") &&
        activeUhids.has(inv.uhid),
    );
  }, [queue, invoices]);

  const opdBillingQueue = useMemo(() => {
    if (!navayuMode) return [];
    return patients
      .map((patient) => {
        const paymentStatus =
          patient.opdPaymentStatus ?? getOpdPaymentStatus(patient.uhid);
        const invoice = invoices.find(
          (inv) =>
            inv.uhid === patient.uhid &&
            inv.category === "OPD" &&
            (inv.status === "pending" || inv.status === "partial"),
        );
        if (!invoice && paymentStatus !== "billing_pending") return null;
        if (paymentStatus === "paid") return null;
        return { patient, invoice, paymentStatus: paymentStatus ?? "billing_pending" };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);
  }, [navayuMode, patients, invoices]);

  const applyDeskChargePackage = (
    item: (typeof DESK_CHARGE_PACKAGES)[number],
  ) => {
    setNewInvoiceDescription(item.description);
    setNewInvoiceAmount(String(item.amount));
    setNewInvoiceCategory(item.category);
  };

  const handleCreateEstimate = () => {
    const patient = patients.find((item) => item.uhid === newEstimatePatient);
    const amount = Number(newEstimateAmount);
    if (!patient || !newEstimateDescription.trim() || amount <= 0) return;

    createEstimate({
      uhid: patient.uhid,
      patientName: patient.name,
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      category: newEstimateCategory,
      items: [{ description: newEstimateDescription.trim(), amount }],
      total: amount,
    });

    setShowNewEstimate(false);
    setNewEstimatePatient("");
    setNewEstimateDescription("");
    setNewEstimateAmount("");
    setNewEstimateCategory("OPD");
  };

  const handleCollectPayment = async () => {
    if (!paymentInvoice) return;
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) return;

    await collectPayment(paymentInvoice.id, amount, paymentMode);
    setPaymentInvoiceId(null);
    setPaymentAmount("");
  };

  const handleRefundPayment = () => {
    if (!refundInvoice) return;
    const amount = Number(refundAmount);
    if (!amount || amount <= 0) return;

    refundPayment(
      refundInvoice.id,
      amount,
      refundMode,
      refundReason || undefined,
    );
    setRefundInvoiceId(null);
    setRefundAmount("");
    setRefundReason("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Integrated billing desk with estimates, advances, and refunds
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewEstimate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent transition-colors"
          >
            <FileText className="w-4 h-4" /> New Estimate
          </button>
          <button
            onClick={() => setShowNewInvoice(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        </div>
      </div>

      {queueBlockers.length > 0 && (
        <div className="rounded-xl border-l-4 border-warning bg-warning/5 p-4 space-y-2">
          <p className="text-sm font-semibold text-warning flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {queueBlockers.length} patient{queueBlockers.length > 1 ? "s" : ""}{" "}
            in queue with unpaid bill{queueBlockers.length > 1 ? "s" : ""} —
            collect before exit
          </p>
          <div className="space-y-1">
            {queueBlockers.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">
                  {inv.patientName} · {inv.id}
                </span>
                <button
                  onClick={() => openPaymentModal(inv.id)}
                  className="text-xs px-2 py-1 rounded bg-warning text-warning-foreground font-medium hover:opacity-90"
                >
                  Rs {Math.max(0, inv.total - inv.paid).toLocaleString("en-IN")}{" "}
                  due — Collect
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {navayuMode && opdBillingQueue.length > 0 ? (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-primary" />
                OPD billing queue
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Collect payment before doctor queue — or skip for post-consult collection
              </p>
            </div>
            <Badge variant="secondary">{opdBillingQueue.length} waiting</Badge>
          </div>
          <div className="space-y-2">
            {opdBillingQueue.map(({ patient, invoice, paymentStatus }) => (
              <div
                key={patient.uhid}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{patient.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {patient.uhid} · {patient.assignedDoctor ?? "—"} ·{" "}
                    <Badge variant="outline" className="text-[10px] ml-1">
                      {paymentStatus.replace("_", " ")}
                    </Badge>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {invoice ? (
                    <Button size="sm" onClick={() => openPaymentModal(invoice.id)}>
                      Collect Rs{" "}
                      {Math.max(0, invoice.total - invoice.paid).toLocaleString("en-IN")}
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => skipOpdPayment(patient.uhid)}
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    Skip payment
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      convertOpdToIPDByUHID({ uhid: patient.uhid });
                      toast.success("OPD → IPD conversion initiated");
                    }}
                  >
                    OPD → IPD
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border bg-card p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold">Front-desk billing scope</p>
          <p className="text-xs text-muted-foreground mt-1">
            Collect basic registration, consultation, package, and deposit
            charges here. Complex IPD, TPA, GST, and reconciliation cases should
            be handed off to the Billing department.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/billing-dept")}
          className="shrink-0 px-3 py-2 rounded-lg border text-xs font-medium hover:bg-accent"
        >
          Handoff to Billing dept
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Collected</p>
          <p className="text-xl font-bold flex items-center">
            <IndianRupee className="w-4 h-4" />
            {totalRevenue.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Pending</p>
          <p className="text-xl font-bold flex items-center text-warning">
            <IndianRupee className="w-4 h-4" />
            {totalPending.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Invoices</p>
          <p className="text-xl font-bold">{invoices.length}</p>
          <p className="text-xs text-success">
            {invoices.filter((invoice) => invoice.status === "paid").length}{" "}
            paid
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Draft Estimates</p>
          <p className="text-xl font-bold">{draftEstimates.length}</p>
          <p className="text-xs text-muted-foreground">ready to convert</p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border bg-card text-sm"
            placeholder="Search invoices or estimates..."
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "paid", "partial", "pending", "overdue"] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === status ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
              >
                {status === "all"
                  ? "All"
                  : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto">
        {(
          [
            "all",
            "OPD",
            "IPD",
            "Emergency",
            "Lab",
            "Pharmacy",
            "Radiology",
          ] as const
        ).map((category) => (
          <button
            key={category}
            onClick={() => setCategoryFilter(category)}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${categoryFilter === category ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            {category === "all" ? "All Categories" : category}
          </button>
        ))}
      </div>

      {draftEstimates.length > 0 && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <p className="text-sm font-semibold">Estimate Queue</p>
          <div className="space-y-2">
            {draftEstimates.map((estimate) => (
              <div
                key={estimate.id}
                className="rounded-lg border p-3 flex items-center justify-between gap-3 flex-wrap"
              >
                <div>
                  <p className="text-sm font-medium">
                    {estimate.id} · {estimate.patientName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {estimate.category} · {estimate.items[0]?.description} · Rs{" "}
                    {estimate.total.toLocaleString("en-IN")}
                  </p>
                </div>
                <button
                  onClick={() => convertEstimateToInvoice(estimate.id)}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
                >
                  Convert to Invoice
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  Invoice
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">
                  Patient
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">
                  Category
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  Amount
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  onClick={() => setSelectedInvoiceId(invoice.id)}
                  className={`hover:bg-accent/50 transition-colors cursor-pointer ${selectedInvoiceId === invoice.id ? "bg-accent/50" : ""}`}
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{invoice.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.date}
                    </p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <p className="text-sm">{invoice.patientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.uhid}
                    </p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {invoice.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-sm font-semibold">
                      Rs {invoice.total.toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Paid Rs {invoice.paid.toLocaleString("en-IN")}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${statusStyles[invoice.status]}`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="p-1.5 rounded hover:bg-accent">
                      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No invoices found for current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border bg-card p-5">
          {selectedInvoice ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{selectedInvoice.id}</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedInvoice.patientName} ({selectedInvoice.uhid})
                </p>
              </div>

              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Category:</span>{" "}
                  {selectedInvoice.category}
                </p>
                <p>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-xs ${statusStyles[selectedInvoice.status]}`}
                  >
                    {selectedInvoice.status}
                  </span>
                </p>
                {selectedInvoice.paymentMode && (
                  <p>
                    <span className="text-muted-foreground">Last mode:</span>{" "}
                    {paymentModeIcons[selectedInvoice.paymentMode]?.label}
                  </p>
                )}
              </div>

              <div className="border-t pt-3 space-y-2">
                {selectedInvoice.items.map((item, index) => (
                  <div
                    key={`${selectedInvoice.id}-${index}`}
                    className="flex justify-between text-sm"
                  >
                    <div>
                      <span>{item.description}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({inferServiceType(item.description)})
                      </span>
                    </div>
                    <span className="font-medium">
                      Rs {item.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>
                    Rs {selectedInvoice.total.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-success">
                  <span>Paid</span>
                  <span>Rs {selectedInvoice.paid.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-sm text-warning font-medium">
                  <span>Balance</span>
                  <span>
                    Rs{" "}
                    {Math.max(
                      0,
                      selectedInvoice.total - selectedInvoice.paid,
                    ).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {selectedInvoice.total - selectedInvoice.paid > 0 && (
                  <button
                    onClick={() => openPaymentModal(selectedInvoice.id)}
                    className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" /> Collect Advance / Payment
                  </button>
                )}
                {selectedInvoice.paid > 0 && (
                  <button
                    onClick={() => openRefundModal(selectedInvoice.id)}
                    className="w-full py-2 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <Undo2 className="w-4 h-4" /> Issue Refund
                  </button>
                )}
                <button
                  onClick={() => setPrintInvoiceId(selectedInvoice.id)}
                  className="w-full py-2 rounded-lg border text-sm font-medium hover:bg-accent transition-colors flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print Receipt
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <FileText className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Select an invoice to preview</p>
            </div>
          )}
        </div>
      </div>

      {showNewInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowNewInvoice(false)}
        >
          <div
            className="bg-card border rounded-xl w-full max-w-lg p-6 space-y-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">New Invoice</h2>
              <button
                onClick={() => setShowNewInvoice(false)}
                className="p-1 rounded hover:bg-accent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <AppSelect
                value={newInvoicePatient || undefined}
                onValueChange={setNewInvoicePatient}
                placeholder="Select patient"
                options={patients.map((patient) => ({
                  value: patient.uhid,
                  label: `${patient.name} (${patient.uhid})`,
                }))}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
              />
              <AppSelect
                value={newInvoiceCategory}
                onValueChange={(value) =>
                  setNewInvoiceCategory(value as BillingInvoice["category"])
                }
                options={(
                  [
                    "OPD",
                    "IPD",
                    "Emergency",
                    "Lab",
                    "Pharmacy",
                    "Radiology",
                  ] as const
                ).map((category) => ({ value: category, label: category }))}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
              />
              <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  Quick desk packages
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {DESK_CHARGE_PACKAGES.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => applyDeskChargePackage(item)}
                      className="rounded-md border bg-background px-2 py-1.5 text-left text-[11px] hover:bg-accent"
                    >
                      <span className="block font-medium">{item.label}</span>
                      <span className="text-muted-foreground">
                        Rs {item.amount.toLocaleString("en-IN")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <input
                value={newInvoiceDescription}
                onChange={(event) =>
                  setNewInvoiceDescription(event.target.value)
                }
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                placeholder="Description"
              />
              <input
                type="number"
                value={newInvoiceAmount}
                onChange={(event) => setNewInvoiceAmount(event.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                placeholder="Amount"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowNewInvoice(false)}
                className="flex-1 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInvoice}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
              >
                Create Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewEstimate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowNewEstimate(false)}
        >
          <div
            className="bg-card border rounded-xl w-full max-w-lg p-6 space-y-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">New Estimate</h2>
              <button
                onClick={() => setShowNewEstimate(false)}
                className="p-1 rounded hover:bg-accent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <AppSelect
                value={newEstimatePatient || undefined}
                onValueChange={setNewEstimatePatient}
                placeholder="Select patient"
                options={patients.map((patient) => ({
                  value: patient.uhid,
                  label: `${patient.name} (${patient.uhid})`,
                }))}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
              />
              <AppSelect
                value={newEstimateCategory}
                onValueChange={(value) =>
                  setNewEstimateCategory(value as BillingInvoice["category"])
                }
                options={(
                  [
                    "OPD",
                    "IPD",
                    "Emergency",
                    "Lab",
                    "Pharmacy",
                    "Radiology",
                  ] as const
                ).map((category) => ({ value: category, label: category }))}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
              />
              <input
                value={newEstimateDescription}
                onChange={(event) =>
                  setNewEstimateDescription(event.target.value)
                }
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                placeholder="Estimate line item"
              />
              <input
                type="number"
                value={newEstimateAmount}
                onChange={(event) => setNewEstimateAmount(event.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                placeholder="Estimated amount"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowNewEstimate(false)}
                className="flex-1 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEstimate}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
              >
                Create Estimate
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPaymentInvoiceId(null)}
        >
          <div
            className="bg-card border rounded-xl w-full max-w-md p-6 space-y-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Collect Payment</h2>
              <button
                onClick={() => setPaymentInvoiceId(null)}
                className="p-1 rounded hover:bg-accent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Invoice:</span>{" "}
                {paymentInvoice.id}
              </p>
              <p>
                <span className="text-muted-foreground">Patient:</span>{" "}
                {paymentInvoice.patientName}
              </p>
              <p className="text-lg font-bold">
                Balance: Rs{" "}
                {Math.max(
                  0,
                  paymentInvoice.total - paymentInvoice.paid,
                ).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["cash", "card", "upi"] as const).map((mode) => {
                const ModeIcon = paymentModeIcons[mode].icon;
                return (
                  <button
                    key={mode}
                    onClick={() => setPaymentMode(mode)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${paymentMode === mode ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                  >
                    <ModeIcon className="w-4 h-4" />{" "}
                    {paymentModeIcons[mode].label}
                  </button>
                );
              })}
            </div>
            <input
              type="number"
              value={paymentAmount}
              onChange={(event) => setPaymentAmount(event.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
              placeholder="Amount"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setPaymentInvoiceId(null)}
                className="flex-1 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleCollectPayment}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {printInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPrintInvoiceId(null)}
        >
          <div
            className="bg-card border rounded-xl w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Receipt</h2>
              <button
                onClick={() => setPrintInvoiceId(null)}
                className="p-1 rounded hover:bg-accent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div
              className="border rounded-lg p-4 space-y-3 text-sm"
              id="receipt-print-area"
            >
              <div className="text-center border-b pb-3">
                <p className="font-bold text-base">Adrine Hospital</p>
                <p className="text-xs text-muted-foreground">OPD Receipt</p>
              </div>
              <div className="grid grid-cols-2 gap-y-1 text-xs">
                <span className="text-muted-foreground">Invoice #</span>
                <span className="font-mono">{printInvoice.id}</span>
                <span className="text-muted-foreground">Patient</span>
                <span>{printInvoice.patientName}</span>
                <span className="text-muted-foreground">UHID</span>
                <span className="font-mono">{printInvoice.uhid}</span>
                <span className="text-muted-foreground">Date</span>
                <span>{printInvoice.date}</span>
                <span className="text-muted-foreground">Category</span>
                <span>{printInvoice.category}</span>
              </div>
              <div className="border-t pt-2 space-y-1">
                {printInvoice.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span>{item.description}</span>
                    <span>Rs {item.amount.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 space-y-1 text-xs">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>Rs {printInvoice.total.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-success">
                  <span>Paid</span>
                  <span>Rs {printInvoice.paid.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Balance</span>
                  <span>
                    Rs{" "}
                    {Math.max(
                      0,
                      printInvoice.total - printInvoice.paid,
                    ).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
              {printInvoice.paymentMode && (
                <div className="border-t pt-2 text-xs text-muted-foreground text-center">
                  Payment mode:{" "}
                  {paymentModeIcons[printInvoice.paymentMode]?.label ??
                    printInvoice.paymentMode}
                </div>
              )}
              <div className="text-center text-[10px] text-muted-foreground border-t pt-2">
                Thank you for visiting. Get well soon!
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPrintInvoiceId(null)}
                className="flex-1 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>
          </div>
        </div>
      )}

      {refundInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setRefundInvoiceId(null)}
        >
          <div
            className="bg-card border rounded-xl w-full max-w-md p-6 space-y-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Issue Refund</h2>
              <button
                onClick={() => setRefundInvoiceId(null)}
                className="p-1 rounded hover:bg-accent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Invoice:</span>{" "}
                {refundInvoice.id}
              </p>
              <p>
                <span className="text-muted-foreground">Patient:</span>{" "}
                {refundInvoice.patientName}
              </p>
              <p className="text-lg font-bold">
                Refundable: Rs {refundInvoice.paid.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["cash", "card", "upi"] as const).map((mode) => {
                const ModeIcon = paymentModeIcons[mode].icon;
                return (
                  <button
                    key={mode}
                    onClick={() => setRefundMode(mode)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${refundMode === mode ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                  >
                    <ModeIcon className="w-4 h-4" />{" "}
                    {paymentModeIcons[mode].label}
                  </button>
                );
              })}
            </div>
            <input
              type="number"
              value={refundAmount}
              onChange={(event) => setRefundAmount(event.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
              placeholder="Refund amount"
            />
            <input
              value={refundReason}
              onChange={(event) => setRefundReason(event.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
              placeholder="Refund reason"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setRefundInvoiceId(null)}
                className="flex-1 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleRefundPayment}
                className="flex-1 px-4 py-2 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10"
              >
                Process Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
