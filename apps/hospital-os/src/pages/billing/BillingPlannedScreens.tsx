import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {

  Banknote,
  FileSpreadsheet,
  FileText,
  FileCheck,
  FileX,
  Pill,
  Building2,
  DollarSign,
  Search,
  ShieldCheck,
  Landmark,
  Handshake,
  Smartphone,
  Plus,
  X,
  Check,
  Clock,
  Percent,
  Edit3,
  Download,
  Printer,
  Eye,
  Filter,
  Mail,
  CreditCard,
  Scale,
  Info,
  RotateCcw,
  RefreshCw,
} from "lucide-react";

function PreviewStrip({ message, docs }: { message: string; docs?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/10 px-4 py-3 text-xs text-muted-foreground">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <div className="flex-1 space-y-0.5">
        <p>{message}</p>
        {docs && <p className="font-mono text-[10px] text-muted-foreground/60">{docs}</p>}
      </div>
    </div>
  );
}

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

/* ────────────────────────────────────────────── */
/* 1. CHARGE MASTER — Service Tariff / HSN-SAC   */
/* ────────────────────────────────────────────── */

type ChargeType = "room" | "procedure" | "consultation" | "pharmacy" | "lab" | "radiology" | "misc";

interface ChargeItem {
  id: string;
  code: string;
  name: string;
  type: ChargeType;
  department: string;
  hsnSac: string;
  baseRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  effectiveFrom: string;
  effectiveTo: string;
  status: "active" | "inactive" | "pending";
  packageFlag: boolean;
  notes: string;
}

const MOCK_CHARGES: ChargeItem[] = [
  { id: "CH001", code: "ROOM-GEN", name: "General Ward — Per Day", type: "room", department: "IPD", hsnSac: "996312", baseRate: 1500, cgst: 9, sgst: 9, igst: 0, effectiveFrom: "2025-04-01", effectiveTo: "2026-03-31", status: "active", packageFlag: true, notes: "" },
  { id: "CH002", code: "ROOM-SHARE", name: "Semi-Private — Per Day", type: "room", department: "IPD", hsnSac: "996312", baseRate: 3000, cgst: 9, sgst: 9, igst: 0, effectiveFrom: "2025-04-01", effectiveTo: "2026-03-31", status: "active", packageFlag: true, notes: "" },
  { id: "CH003", code: "CONS-GEN", name: "General Consultation", type: "consultation", department: "OPD", hsnSac: "998311", baseRate: 500, cgst: 9, sgst: 9, igst: 0, effectiveFrom: "2025-04-01", effectiveTo: "2026-03-31", status: "active", packageFlag: false, notes: "" },
  { id: "CH004", code: "CONS-SPEC", name: "Specialist Consultation", type: "consultation", department: "OPD", hsnSac: "998312", baseRate: 1000, cgst: 9, sgst: 9, igst: 0, effectiveFrom: "2025-04-01", effectiveTo: "2026-03-31", status: "active", packageFlag: false, notes: "" },
  { id: "CH005", code: "PROC-CSEC", name: "Caesarean Section", type: "procedure", department: "OT", hsnSac: "998332", baseRate: 35000, cgst: 9, sgst: 9, igst: 0, effectiveFrom: "2025-04-01", effectiveTo: "2026-03-31", status: "active", packageFlag: true, notes: "" },
  { id: "CH006", code: "PROC-LAP", name: "Laparoscopic Cholecystectomy", type: "procedure", department: "OT", hsnSac: "998332", baseRate: 55000, cgst: 9, sgst: 9, igst: 0, effectiveFrom: "2025-04-01", effectiveTo: "2026-03-31", status: "active", packageFlag: true, notes: "" },
  { id: "CH007", code: "LAB-CBC", name: "Complete Blood Count", type: "lab", department: "Lab", hsnSac: "998311", baseRate: 350, cgst: 9, sgst: 9, igst: 0, effectiveFrom: "2025-04-01", effectiveTo: "2026-03-31", status: "active", packageFlag: false, notes: "" },
  { id: "CH008", code: "RAD-XR", name: "Chest X-Ray PA View", type: "radiology", department: "Radiology", hsnSac: "998312", baseRate: 600, cgst: 9, sgst: 9, igst: 0, effectiveFrom: "2025-04-01", effectiveTo: "2026-03-31", status: "active", packageFlag: false, notes: "" },
  { id: "CH009", code: "PHARM-PCM", name: "Paracetamol 500mg (10 tabs)", type: "pharmacy", department: "Pharmacy", hsnSac: "300490", baseRate: 45, cgst: 9, sgst: 9, igst: 0, effectiveFrom: "2025-04-01", effectiveTo: "2026-03-31", status: "active", packageFlag: false, notes: "" },
  { id: "CH010", code: "MISC-MLC", name: "MLC Certificate", type: "misc", department: "Admin", hsnSac: "998391", baseRate: 200, cgst: 9, sgst: 9, igst: 0, effectiveFrom: "2025-04-01", effectiveTo: "2026-03-31", status: "active", packageFlag: false, notes: "Medicolegal certificate" },
];

export function BillingChargeMaster() {
  const [charges] = useState<ChargeItem[]>(MOCK_CHARGES);
  const [typeFilter, setTypeFilter] = useState<ChargeType | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return charges.filter((c) => {
      if (typeFilter !== "all" && c.type !== typeFilter) return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.code.toLowerCase().includes(search.toLowerCase()) && !c.hsnSac.includes(search)) return false;
      return true;
    });
  }, [charges, typeFilter, search]);

  const totalActive = charges.filter((c) => c.status === "active").length;

  return (
    <motion.div {...fadeIn} className="p-6 space-y-6">
      <PreviewStrip
        message="Charge master is a P0 demo — service tariff with HSN/SAC mapping. Invoice engine requires this for production."
        docs="BILLING_FINANCE_MODULE.md | P0 — LB-12"
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
            Charge Master
          </h1>
          <p className="text-sm text-muted-foreground">
            {totalActive} active charges · {charges.length} total
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent">
            <Download className="h-4 w-4" /> Export
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> Add Charge
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {(["all", "room", "procedure", "consultation", "pharmacy", "lab", "radiology", "misc"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              typeFilter === t ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            className="h-9 w-56 rounded-lg border border-input bg-background pl-8 pr-3 text-sm outline-none focus:border-emerald-500"
            placeholder="Search code, name, HSN/SAC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-3">
        {(["room", "procedure", "consultation", "lab", "pharmacy"] as const).map((t) => {
          const count = charges.filter((c) => c.type === t && c.status === "active").length;
          const avg = charges.filter((c) => c.type === t && c.status === "active").reduce((s, c) => s + c.baseRate, 0) / (count || 1);
          return (
            <div key={t} className="rounded-xl border bg-card p-3 shadow-sm">
              <div className="text-xs text-muted-foreground capitalize">{t}</div>
              <div className="mt-1 text-lg font-bold">{count}</div>
              <div className="text-xs text-muted-foreground">Avg ₹{Math.round(avg).toLocaleString()}</div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2.5 text-left font-medium">Code</th>
              <th className="px-3 py-2.5 text-left font-medium">Name</th>
              <th className="px-3 py-2.5 text-left font-medium">Type</th>
              <th className="px-3 py-2.5 text-left font-medium">HSN/SAC</th>
              <th className="px-3 py-2.5 text-right font-medium">Base Rate (₹)</th>
              <th className="px-3 py-2.5 text-right font-medium">CGST</th>
              <th className="px-3 py-2.5 text-right font-medium">SGST</th>
              <th className="px-3 py-2.5 text-center font-medium">Status</th>
              <th className="px-3 py-2.5 text-center font-medium">Package</th>
              <th className="px-3 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2.5 font-mono text-xs">{c.code}</td>
                <td className="px-3 py-2.5 font-medium">{c.name}</td>
                <td className="px-3 py-2.5 capitalize">{c.type}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{c.hsnSac}</td>
                <td className="px-3 py-2.5 text-right font-mono">₹{c.baseRate.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right font-mono">{c.cgst}%</td>
                <td className="px-3 py-2.5 text-right font-mono">{c.sgst}%</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    c.status === "active" ? "bg-emerald-100 text-emerald-700" :
                    c.status === "inactive" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {c.status === "active" && <Check className="h-3 w-3" />}
                    {c.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  {c.packageFlag ? <Check className="mx-auto h-4 w-4 text-emerald-600" /> : <X className="mx-auto h-4 w-4 text-muted-foreground" />}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><Eye className="h-4 w-4" /></button>
                    <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><Edit3 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────── */
/* 2. TPA DESK — Third-Party Admin Claims Intake  */
/* ────────────────────────────────────────────── */

interface TPAItem {
  id: string;
  tpaName: string;
  patientName: string;
  policyNo: string;
  claimNo: string;
  amount: number;
  status: "received" | "processing" | "approved" | "rejected";
  receivedDate: string;
  turnAroundDays: number;
}

const MOCK_TPA: TPAItem[] = [
  { id: "TPA001", tpaName: "MediAssist", patientName: "Ravi Sharma", policyNo: "POL-1001", claimNo: "CLM-001", amount: 45000, status: "received", receivedDate: "2025-05-15", turnAroundDays: 2 },
  { id: "TPA002", tpaName: "Vidal Health", patientName: "Sunita Patel", policyNo: "POL-1002", claimNo: "CLM-002", amount: 125000, status: "processing", receivedDate: "2025-05-14", turnAroundDays: 3 },
  { id: "TPA003", tpaName: "MediAssist", patientName: "Amit Kumar", policyNo: "POL-1001", claimNo: "CLM-003", amount: 28000, status: "approved", receivedDate: "2025-05-12", turnAroundDays: 5 },
  { id: "TPA004", tpaName: "Ericson", patientName: "Priya Singh", policyNo: "POL-1003", claimNo: "CLM-004", amount: 89000, status: "rejected", receivedDate: "2025-05-10", turnAroundDays: 7 },
  { id: "TPA005", tpaName: "Vidal Health", patientName: "Deepak Verma", policyNo: "POL-1002", claimNo: "CLM-005", amount: 67000, status: "received", receivedDate: "2025-05-16", turnAroundDays: 1 },
];

export function BillingTPADesk() {
  const [items] = useState<TPAItem[]>(MOCK_TPA);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return items;
    return items.filter((i) => i.status === statusFilter);
  }, [items, statusFilter]);

  const pendingTotal = items.filter((i) => i.status === "received" || i.status === "processing").length;
  const approvedTotal = items.filter((i) => i.status === "approved").length;
  const rejectedTotal = items.filter((i) => i.status === "rejected").length;

  return (
    <motion.div {...fadeIn} className="p-6 space-y-6">
      <PreviewStrip message="TPA desk is a P1 preview — claims intake from third-party administrators. Integrates with insurance desk and pre-auth." docs="BILLING_FINANCE_MODULE.md" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Handshake className="h-6 w-6 text-blue-600" />
            TPA Desk
          </h1>
          <p className="text-sm text-muted-foreground">{items.length} claims · {pendingTotal} pending</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> New Intake
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="text-xs text-muted-foreground">Total Claims</div>
          <div className="mt-1 text-lg font-bold">{items.length}</div>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="text-xs text-muted-foreground">Pending</div>
          <div className="mt-1 text-lg font-bold text-amber-600">{pendingTotal}</div>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="text-xs text-muted-foreground">Approved</div>
          <div className="mt-1 text-lg font-bold text-emerald-600">{approvedTotal}</div>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="text-xs text-muted-foreground">Rejected</div>
          <div className="mt-1 text-lg font-bold text-red-600">{rejectedTotal}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        {["all", "received", "processing", "approved", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === s ? "bg-blue-100 text-blue-800" : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2.5 text-left font-medium">TPA</th>
              <th className="px-3 py-2.5 text-left font-medium">Patient</th>
              <th className="px-3 py-2.5 text-left font-medium">Policy No</th>
              <th className="px-3 py-2.5 text-left font-medium">Claim No</th>
              <th className="px-3 py-2.5 text-right font-medium">Amount (₹)</th>
              <th className="px-3 py-2.5 text-center font-medium">Status</th>
              <th className="px-3 py-2.5 text-center font-medium">TAT (days)</th>
              <th className="px-3 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2.5">{i.tpaName}</td>
                <td className="px-3 py-2.5">{i.patientName}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{i.policyNo}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{i.claimNo}</td>
                <td className="px-3 py-2.5 text-right font-mono">₹{i.amount.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    i.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                    i.status === "rejected" ? "bg-red-100 text-red-700" :
                    i.status === "processing" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {i.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center font-mono text-xs">{i.turnAroundDays}d</td>
                <td className="px-3 py-2.5 text-right">
                  <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><Eye className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────── */
/* 3. CO-PAY — Co-Pay Percentage Management       */
/* ────────────────────────────────────────────── */

interface CopayRule {
  id: string;
  payerName: string;
  procedureGroup: string;
  copayPercent: number;
  maxCap: number;
  effectiveFrom: string;
  effectiveTo: string;
  status: "active" | "inactive";
}

const MOCK_COPAY: CopayRule[] = [
  { id: "CP001", payerName: "MediAssist", procedureGroup: "Surgery", copayPercent: 10, maxCap: 15000, effectiveFrom: "2025-04-01", effectiveTo: "2026-03-31", status: "active" },
  { id: "CP002", payerName: "Vidal Health", procedureGroup: "Diagnostics", copayPercent: 15, maxCap: 5000, effectiveFrom: "2025-04-01", effectiveTo: "2026-03-31", status: "active" },
  { id: "CP003", payerName: "Ericson", procedureGroup: "Room Rent", copayPercent: 20, maxCap: 10000, effectiveFrom: "2025-04-01", effectiveTo: "2026-03-31", status: "inactive" },
  { id: "CP004", payerName: "MediAssist", procedureGroup: "Pharmacy", copayPercent: 5, maxCap: 2000, effectiveFrom: "2025-04-01", effectiveTo: "2026-03-31", status: "active" },
  { id: "CP005", payerName: "Star Health", procedureGroup: "ICU", copayPercent: 10, maxCap: 20000, effectiveFrom: "2025-04-01", effectiveTo: "2026-03-31", status: "active" },
];

export function BillingCopay() {
  const [rules] = useState<CopayRule[]>(MOCK_COPAY);

  return (
    <motion.div {...fadeIn} className="p-6 space-y-6">
      <PreviewStrip message="Co-pay management is a P1 preview — percentage rules per payer and procedure group. Drives patient share computation." docs="BILLING_FINANCE_MODULE.md" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Percent className="h-6 w-6 text-purple-600" />
            Co-Pay Management
          </h1>
          <p className="text-sm text-muted-foreground">{rules.length} rules defined</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700">
          <Plus className="h-4 w-4" /> New Rule
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2.5 text-left font-medium">Payer</th>
              <th className="px-3 py-2.5 text-left font-medium">Procedure Group</th>
              <th className="px-3 py-2.5 text-right font-medium">Co-Pay %</th>
              <th className="px-3 py-2.5 text-right font-medium">Max Cap (₹)</th>
              <th className="px-3 py-2.5 text-center font-medium">Valid From</th>
              <th className="px-3 py-2.5 text-center font-medium">Valid To</th>
              <th className="px-3 py-2.5 text-center font-medium">Status</th>
              <th className="px-3 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2.5">{r.payerName}</td>
                <td className="px-3 py-2.5">{r.procedureGroup}</td>
                <td className="px-3 py-2.5 text-right font-mono">{r.copayPercent}%</td>
                <td className="px-3 py-2.5 text-right font-mono">₹{r.maxCap.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-center text-xs">{r.effectiveFrom}</td>
                <td className="px-3 py-2.5 text-center text-xs">{r.effectiveTo}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                  }`}>{r.status}</span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><Edit3 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────── */
/* 4. ECL — Estimated Cost of Treatment Letter   */
/* ────────────────────────────────────────────── */

interface ECLRecord {
  id: string;
  patientName: string;
  uhid: string;
  procedure: string;
  estimatedAmount: number;
  issuedDate: string;
  validUntil: string;
  status: "draft" | "issued" | "accepted" | "expired";
}

const MOCK_ECL: ECLRecord[] = [
  { id: "ECL001", patientName: "Ravi Sharma", uhid: "UH-1001", procedure: "Lap. Cholecystectomy", estimatedAmount: 75000, issuedDate: "2025-05-15", validUntil: "2025-06-14", status: "issued" },
  { id: "ECL002", patientName: "Sunita Patel", uhid: "UH-1002", procedure: "C-Section", estimatedAmount: 45000, issuedDate: "2025-05-14", validUntil: "2025-06-13", status: "accepted" },
  { id: "ECL003", patientName: "Amit Kumar", uhid: "UH-1003", procedure: "Knee Replacement", estimatedAmount: 180000, issuedDate: "2025-05-12", validUntil: "2025-06-11", status: "draft" },
  { id: "ECL004", patientName: "Priya Singh", uhid: "UH-1004", procedure: "Appendectomy", estimatedAmount: 35000, issuedDate: "2025-04-10", validUntil: "2025-05-10", status: "expired" },
];

export function BillingECL() {
  const [ecls] = useState<ECLRecord[]>(MOCK_ECL);

  const statusIcon = (s: ECLRecord["status"]) => {
    switch (s) {
      case "draft": return <FileText className="h-4 w-4 text-muted-foreground" />;
      case "issued": return <Mail className="h-4 w-4 text-blue-600" />;
      case "accepted": return <Check className="h-4 w-4 text-emerald-600" />;
      case "expired": return <Clock className="h-4 w-4 text-red-600" />;
    }
  };

  return (
    <motion.div {...fadeIn} className="p-6 space-y-6">
      <PreviewStrip message="ECL (Estimated Cost of Treatment) letters — P1 preview. Generates cost estimates for insurance pre-authorization." docs="BILLING_FINANCE_MODULE.md" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-amber-600" />
            ECL — Cost Estimate Letters
          </h1>
          <p className="text-sm text-muted-foreground">{ecls.length} estimates</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700">
          <Plus className="h-4 w-4" /> New ECL
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2.5 text-left font-medium">Patient</th>
              <th className="px-3 py-2.5 text-left font-medium">UHID</th>
              <th className="px-3 py-2.5 text-left font-medium">Procedure</th>
              <th className="px-3 py-2.5 text-right font-medium">Estimate (₹)</th>
              <th className="px-3 py-2.5 text-center font-medium">Issued</th>
              <th className="px-3 py-2.5 text-center font-medium">Valid Until</th>
              <th className="px-3 py-2.5 text-center font-medium">Status</th>
              <th className="px-3 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ecls.map((e) => (
              <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2.5">{e.patientName}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{e.uhid}</td>
                <td className="px-3 py-2.5">{e.procedure}</td>
                <td className="px-3 py-2.5 text-right font-mono">₹{e.estimatedAmount.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-center text-xs">{e.issuedDate}</td>
                <td className="px-3 py-2.5 text-center text-xs">{e.validUntil}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-muted">
                    {statusIcon(e.status)} {e.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><Printer className="h-4 w-4" /></button>
                  <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><Mail className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────── */
/* 5. CLAIMS — Insurance Claim Submission & Status*/
/* ────────────────────────────────────────────── */

interface ClaimRecord {
  id: string;
  patientName: string;
  policyNo: string;
  insurer: string;
  claimAmount: number;
  approvedAmount: number | null;
  submittedDate: string;
  status: "draft" | "submitted" | "processing" | "approved" | "partially_approved" | "rejected";
}

const MOCK_CLAIMS: ClaimRecord[] = [
  { id: "CLM-001", patientName: "Ravi Sharma", policyNo: "POL-1001", insurer: "MediAssist", claimAmount: 75000, approvedAmount: null, submittedDate: "2025-05-15", status: "submitted" },
  { id: "CLM-002", patientName: "Sunita Patel", policyNo: "POL-1002", insurer: "Vidal Health", claimAmount: 125000, approvedAmount: 112000, submittedDate: "2025-05-10", status: "partially_approved" },
  { id: "CLM-003", patientName: "Amit Kumar", policyNo: "POL-1001", insurer: "MediAssist", claimAmount: 28000, approvedAmount: 28000, submittedDate: "2025-05-05", status: "approved" },
  { id: "CLM-004", patientName: "Priya Singh", policyNo: "POL-1003", insurer: "Ericson", claimAmount: 89000, approvedAmount: null, submittedDate: "2025-05-12", status: "processing" },
  { id: "CLM-005", patientName: "Deepak Verma", policyNo: "POL-1002", insurer: "Vidal Health", claimAmount: 67000, approvedAmount: 0, submittedDate: "2025-04-28", status: "rejected" },
];

export function BillingClaims() {
  const [claims] = useState<ClaimRecord[]>(MOCK_CLAIMS);

  const totalSubmitted = claims.filter((c) => c.status !== "draft").length;
  const totalClaimed = claims.reduce((s, c) => s + c.claimAmount, 0);
  const totalApproved = claims.reduce((s, c) => s + (c.approvedAmount || 0), 0);

  return (
    <motion.div {...fadeIn} className="p-6 space-y-6">
      <PreviewStrip message="Claims management is a P1 preview — insurance claim submission & status tracking with payer-wise reconciliation." docs="BILLING_FINANCE_MODULE.md" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-indigo-600" />
            Insurance Claims
          </h1>
          <p className="text-sm text-muted-foreground">{totalSubmitted} submitted · ₹{totalClaimed.toLocaleString()} claimed</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent">
            <Filter className="h-4 w-4" /> Filter
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> New Claim
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="text-xs text-muted-foreground">Total Claimed</div>
          <div className="mt-1 text-lg font-bold">₹{totalClaimed.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="text-xs text-muted-foreground">Approved</div>
          <div className="mt-1 text-lg font-bold text-emerald-600">₹{totalApproved.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="text-xs text-muted-foreground">Settlement %</div>
          <div className="mt-1 text-lg font-bold">{totalClaimed > 0 ? Math.round((totalApproved / totalClaimed) * 100) : 0}%</div>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="text-xs text-muted-foreground">Pending</div>
          <div className="mt-1 text-lg font-bold text-amber-600">{claims.filter((c) => c.status === "submitted" || c.status === "processing").length}</div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2.5 text-left font-medium">Patient</th>
              <th className="px-3 py-2.5 text-left font-medium">Insurer</th>
              <th className="px-3 py-2.5 text-left font-medium">Policy No</th>
              <th className="px-3 py-2.5 text-right font-medium">Claimed (₹)</th>
              <th className="px-3 py-2.5 text-right font-medium">Approved (₹)</th>
              <th className="px-3 py-2.5 text-center font-medium">Submitted</th>
              <th className="px-3 py-2.5 text-center font-medium">Status</th>
              <th className="px-3 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2.5">{c.patientName}</td>
                <td className="px-3 py-2.5">{c.insurer}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{c.policyNo}</td>
                <td className="px-3 py-2.5 text-right font-mono">₹{c.claimAmount.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right font-mono">{c.approvedAmount !== null ? `₹${c.approvedAmount.toLocaleString()}` : "—"}</td>
                <td className="px-3 py-2.5 text-center text-xs">{c.submittedDate}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    c.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                    c.status === "rejected" ? "bg-red-100 text-red-700" :
                    c.status === "partially_approved" ? "bg-amber-100 text-amber-700" :
                    c.status === "processing" ? "bg-blue-100 text-blue-700" :
                    c.status === "submitted" ? "bg-sky-100 text-sky-700" : "bg-muted text-muted-foreground"
                  }`}>{c.status.replace("_", " ")}</span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><Eye className="h-4 w-4" /></button>
                  <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><RefreshCw className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────── */
/* 6. DENIALS — Denial Management & Rework        */
/* ────────────────────────────────────────────── */

interface DenialRecord {
  id: string;
  claimNo: string;
  patientName: string;
  insurer: string;
  amount: number;
  denialCode: string;
  denialReason: string;
  receivedDate: string;
  reworkDue: string;
  status: "new" | "in_rework" | "resubmitted" | "resolved" | "escalated";
}

const MOCK_DENIALS: DenialRecord[] = [
  { id: "DN001", claimNo: "CLM-004", patientName: "Priya Singh", insurer: "Ericson", amount: 89000, denialCode: "D10", denialReason: "Pre-auth not obtained", receivedDate: "2025-05-15", reworkDue: "2025-05-30", status: "new" },
  { id: "DN002", claimNo: "CLM-002", patientName: "Sunita Patel", insurer: "Vidal Health", amount: 13000, denialCode: "D22", denialReason: "Partial payment — non-covered procedure", receivedDate: "2025-05-13", reworkDue: "2025-05-28", status: "in_rework" },
  { id: "DN003", claimNo: "CLM-005", patientName: "Deepak Verma", insurer: "Vidal Health", amount: 67000, denialCode: "D35", denialReason: "Member not eligible at service date", receivedDate: "2025-05-10", reworkDue: "2025-05-25", status: "escalated" },
  { id: "DN004", claimNo: "CLM-001", patientName: "Ravi Sharma", insurer: "MediAssist", amount: 3000, denialCode: "D05", denialReason: "Duplicate claim", receivedDate: "2025-05-08", reworkDue: "2025-05-23", status: "resolved" },
];

export function BillingDenials() {
  const [denials] = useState<DenialRecord[]>(MOCK_DENIALS);

  const pendingRework = denials.filter((d) => d.status === "new" || d.status === "in_rework").length;

  return (
    <motion.div {...fadeIn} className="p-6 space-y-6">
      <PreviewStrip message="Denial management is a P1 preview — tracks claim denials from insurers with rework workflow and escalation." docs="BILLING_FINANCE_MODULE.md" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileX className="h-6 w-6 text-red-600" />
            Denial Management
          </h1>
          <p className="text-sm text-muted-foreground">{denials.length} denials · {pendingRework} need rework</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="text-xs text-muted-foreground">Total Denied</div>
          <div className="mt-1 text-lg font-bold">₹{denials.reduce((s, d) => s + d.amount, 0).toLocaleString()}</div>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="text-xs text-muted-foreground">New</div>
          <div className="mt-1 text-lg font-bold text-red-600">{denials.filter((d) => d.status === "new").length}</div>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="text-xs text-muted-foreground">In Rework</div>
          <div className="mt-1 text-lg font-bold text-amber-600">{denials.filter((d) => d.status === "in_rework").length}</div>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="text-xs text-muted-foreground">Resolved</div>
          <div className="mt-1 text-lg font-bold text-emerald-600">{denials.filter((d) => d.status === "resolved").length}</div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2.5 text-left font-medium">Claim</th>
              <th className="px-3 py-2.5 text-left font-medium">Patient</th>
              <th className="px-3 py-2.5 text-left font-medium">Insurer</th>
              <th className="px-3 py-2.5 text-right font-medium">Amount (₹)</th>
              <th className="px-3 py-2.5 text-left font-medium">Denial Code</th>
              <th className="px-3 py-2.5 text-left font-medium">Reason</th>
              <th className="px-3 py-2.5 text-center font-medium">Rework Due</th>
              <th className="px-3 py-2.5 text-center font-medium">Status</th>
              <th className="px-3 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {denials.map((d) => (
              <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2.5 font-mono text-xs">{d.claimNo}</td>
                <td className="px-3 py-2.5">{d.patientName}</td>
                <td className="px-3 py-2.5">{d.insurer}</td>
                <td className="px-3 py-2.5 text-right font-mono">₹{d.amount.toLocaleString()}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{d.denialCode}</td>
                <td className="px-3 py-2.5 text-xs max-w-[200px] truncate">{d.denialReason}</td>
                <td className="px-3 py-2.5 text-center text-xs">{d.reworkDue}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    d.status === "resolved" ? "bg-emerald-100 text-emerald-700" :
                    d.status === "escalated" ? "bg-red-100 text-red-700" :
                    d.status === "in_rework" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                  }`}>{d.status.replace("_", " ")}</span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><RotateCcw className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────── */
/* 7. PHARMACY BILLING — Pharmacy Counter Billing */
/* ────────────────────────────────────────────── */

interface PharmacyBillItem {
  id: string;
  billNo: string;
  patientName: string;
  items: number;
  total: number;
  discount: number;
  netAmount: number;
  mode: "cash" | "card" | "upi" | "credit";
  billedAt: string;
  status: "completed" | "pending" | "cancelled";
}

const MOCK_PHARMACY_BILLS: PharmacyBillItem[] = [
  { id: "PB001", billNo: "PH-2505001", patientName: "Ravi Sharma", items: 3, total: 1245, discount: 100, netAmount: 1145, mode: "cash", billedAt: "2025-05-16 09:30", status: "completed" },
  { id: "PB002", billNo: "PH-2505002", patientName: "Sunita Patel", items: 5, total: 2890, discount: 200, netAmount: 2690, mode: "upi", billedAt: "2025-05-16 10:15", status: "completed" },
  { id: "PB003", billNo: "PH-2505003", patientName: "Amit Kumar", items: 2, total: 560, discount: 0, netAmount: 560, mode: "card", billedAt: "2025-05-16 11:00", status: "pending" },
  { id: "PB004", billNo: "PH-2505004", patientName: "Priya Singh", items: 8, total: 4560, discount: 350, netAmount: 4210, mode: "credit", billedAt: "2025-05-15 16:45", status: "cancelled" },
];

export function BillingPharmacyBilling() {
  const [bills] = useState<PharmacyBillItem[]>(MOCK_PHARMACY_BILLS);

  return (
    <motion.div {...fadeIn} className="p-6 space-y-6">
      <PreviewStrip message="Pharmacy counter billing — P2 preview. Consolidated billing for pharmacy counter sales and prescriptions." docs="BILLING_FINANCE_MODULE.md" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Pill className="h-6 w-6 text-rose-600" />
            Pharmacy Billing
          </h1>
          <p className="text-sm text-muted-foreground">{bills.length} bills today</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700">
          <Plus className="h-4 w-4" /> New Bill
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2.5 text-left font-medium">Bill No</th>
              <th className="px-3 py-2.5 text-left font-medium">Patient</th>
              <th className="px-3 py-2.5 text-right font-medium">Items</th>
              <th className="px-3 py-2.5 text-right font-medium">Total (₹)</th>
              <th className="px-3 py-2.5 text-right font-medium">Discount</th>
              <th className="px-3 py-2.5 text-right font-medium">Net (₹)</th>
              <th className="px-3 py-2.5 text-center font-medium">Mode</th>
              <th className="px-3 py-2.5 text-center font-medium">Time</th>
              <th className="px-3 py-2.5 text-center font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((b) => (
              <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2.5 font-mono text-xs">{b.billNo}</td>
                <td className="px-3 py-2.5">{b.patientName}</td>
                <td className="px-3 py-2.5 text-right">{b.items}</td>
                <td className="px-3 py-2.5 text-right font-mono">₹{b.total.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right font-mono">₹{b.discount}</td>
                <td className="px-3 py-2.5 text-right font-mono font-semibold">₹{b.netAmount.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{b.mode}</span>
                </td>
                <td className="px-3 py-2.5 text-center text-xs">{b.billedAt}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    b.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                    b.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                  }`}>{b.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────── */
/* 8. CORPORATE BILLING — Corporate/TA Billing    */
/* ────────────────────────────────────────────── */

interface CorpBill {
  id: string;
  billNo: string;
  corporateName: string;
  patientName: string;
  dept: string;
  amount: number;
  poRef: string;
  billedAt: string;
  status: "billed" | "disputed" | "paid" | "overdue";
}

const MOCK_CORP_BILLS: CorpBill[] = [
  { id: "CB001", billNo: "CR-2505001", corporateName: "Tata Motors", patientName: "Vijay Kumar", dept: "OPD", amount: 8500, poRef: "PO-1001", billedAt: "2025-05-15", status: "paid" },
  { id: "CB002", billNo: "CR-2505002", corporateName: "Infosys Ltd", patientName: "Neha Gupta", dept: "IPD", amount: 45000, poRef: "PO-1002", billedAt: "2025-05-14", status: "billed" },
  { id: "CB003", billNo: "CR-2505003", corporateName: "Reliance Ind", patientName: "Mohan Singh", dept: "Health Check", amount: 12000, poRef: "PO-1003", billedAt: "2025-05-12", status: "overdue" },
  { id: "CB004", billNo: "CR-2505004", corporateName: "Tata Motors", patientName: "Suresh Rao", dept: "Pharmacy", amount: 3200, poRef: "PO-1001", billedAt: "2025-05-10", status: "disputed" },
];

export function BillingCorporateBilling() {
  const [bills] = useState<CorpBill[]>(MOCK_CORP_BILLS);

  return (
    <motion.div {...fadeIn} className="p-6 space-y-6">
      <PreviewStrip message="Corporate billing — P2 preview. Manages billing for corporate/TA patients with PO reference and credit terms." docs="BILLING_FINANCE_MODULE.md" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-sky-600" />
            Corporate Billing
          </h1>
          <p className="text-sm text-muted-foreground">{bills.length} corporate bills</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700">
          <Plus className="h-4 w-4" /> New Corporate Bill
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {(["billed", "paid", "disputed", "overdue"] as const).map((s) => (
          <div key={s} className="rounded-xl border bg-card p-3 shadow-sm">
            <div className="text-xs text-muted-foreground capitalize">{s}</div>
            <div className="mt-1 text-lg font-bold">{bills.filter((b) => b.status === s).length}</div>
            <div className="text-xs text-muted-foreground">₹{bills.filter((b) => b.status === s).reduce((sum, b) => sum + b.amount, 0).toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2.5 text-left font-medium">Bill No</th>
              <th className="px-3 py-2.5 text-left font-medium">Corporate</th>
              <th className="px-3 py-2.5 text-left font-medium">Patient</th>
              <th className="px-3 py-2.5 text-left font-medium">Dept</th>
              <th className="px-3 py-2.5 text-right font-medium">Amount (₹)</th>
              <th className="px-3 py-2.5 text-left font-medium">PO Ref</th>
              <th className="px-3 py-2.5 text-center font-medium">Date</th>
              <th className="px-3 py-2.5 text-center font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((b) => (
              <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2.5 font-mono text-xs">{b.billNo}</td>
                <td className="px-3 py-2.5">{b.corporateName}</td>
                <td className="px-3 py-2.5">{b.patientName}</td>
                <td className="px-3 py-2.5">{b.dept}</td>
                <td className="px-3 py-2.5 text-right font-mono">₹{b.amount.toLocaleString()}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{b.poRef}</td>
                <td className="px-3 py-2.5 text-center text-xs">{b.billedAt}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    b.status === "paid" ? "bg-emerald-100 text-emerald-700" :
                    b.status === "overdue" ? "bg-red-100 text-red-700" :
                    b.status === "disputed" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                  }`}>{b.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────── */
/* 9. CASHIER — Day-to-Day Cash Counter           */
/* ────────────────────────────────────────────── */

type PaymentMode = "cash" | "card" | "upi" | "cheque" | "credit";

interface CashierTransaction {
  id: string;
  receiptNo: string;
  patientName: string;
  type: "payment" | "refund" | "advance" | "adjustment";
  mode: PaymentMode;
  amount: number;
  refNo: string;
  timestamp: string;
  status: "completed" | "voided";
}

const MOCK_TRANSACTIONS: CashierTransaction[] = [
  { id: "TX001", receiptNo: "RCPT-001", patientName: "Ravi Sharma", type: "payment", mode: "cash", amount: 5000, refNo: "", timestamp: "2025-05-16 09:00", status: "completed" },
  { id: "TX002", receiptNo: "RCPT-002", patientName: "Sunita Patel", type: "payment", mode: "upi", amount: 12500, refNo: "UPI-REF-001", timestamp: "2025-05-16 09:30", status: "completed" },
  { id: "TX003", receiptNo: "RCPT-003", patientName: "Amit Kumar", type: "advance", mode: "cash", amount: 20000, refNo: "", timestamp: "2025-05-16 10:15", status: "completed" },
  { id: "TX004", receiptNo: "RCPT-004", patientName: "Priya Singh", type: "refund", mode: "card", amount: 3500, refNo: "CARD-REF-001", timestamp: "2025-05-16 11:00", status: "completed" },
  { id: "TX005", receiptNo: "RCPT-005", patientName: "Deepak Verma", type: "payment", mode: "cheque", amount: 45000, refNo: "CHQ-001234", timestamp: "2025-05-16 11:30", status: "completed" },
];

export function BillingCashier() {
  const [txns] = useState<CashierTransaction[]>(MOCK_TRANSACTIONS);
  const [modeFilter, setModeFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (modeFilter === "all") return txns;
    return txns.filter((t) => t.mode === modeFilter);
  }, [txns, modeFilter]);

  const totalCollection = txns.filter((t) => t.type === "payment" || t.type === "advance").reduce((s, t) => s + t.amount, 0);
  const totalRefunds = txns.filter((t) => t.type === "refund").reduce((s, t) => s + t.amount, 0);

  return (
    <motion.div {...fadeIn} className="p-6 space-y-6">
      <PreviewStrip message="Cashier counter — P2 preview. Day-to-day cash, card, UPI, and cheque receipting with refund and advance support." docs="BILLING_FINANCE_MODULE.md" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-600" />
            Cashier
          </h1>
          <p className="text-sm text-muted-foreground">{txns.length} transactions today</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700">
          <Plus className="h-4 w-4" /> New Receipt
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="text-xs text-muted-foreground">Collection</div>
          <div className="mt-1 text-lg font-bold text-emerald-600">₹{totalCollection.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="text-xs text-muted-foreground">Refunds</div>
          <div className="mt-1 text-lg font-bold text-red-600">₹{totalRefunds.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="text-xs text-muted-foreground">Net</div>
          <div className="mt-1 text-lg font-bold">₹{(totalCollection - totalRefunds).toLocaleString()}</div>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="text-xs text-muted-foreground">Transactions</div>
          <div className="mt-1 text-lg font-bold">{txns.length}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {["all", "cash", "card", "upi", "cheque"].map((m) => (
          <button
            key={m}
            onClick={() => setModeFilter(m)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              modeFilter === m ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {m === "all" ? "All" : m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2.5 text-left font-medium">Receipt No</th>
              <th className="px-3 py-2.5 text-left font-medium">Patient</th>
              <th className="px-3 py-2.5 text-center font-medium">Type</th>
              <th className="px-3 py-2.5 text-center font-medium">Mode</th>
              <th className="px-3 py-2.5 text-right font-medium">Amount (₹)</th>
              <th className="px-3 py-2.5 text-left font-medium">Ref No</th>
              <th className="px-3 py-2.5 text-center font-medium">Time</th>
              <th className="px-3 py-2.5 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2.5 font-mono text-xs">{t.receiptNo}</td>
                <td className="px-3 py-2.5">{t.patientName}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{t.type}</span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    {t.mode === "cash" ? <Banknote className="h-3 w-3" /> : t.mode === "card" ? <CreditCard className="h-3 w-3" /> : t.mode === "upi" ? <Smartphone className="h-3 w-3" /> : null}
                    {t.mode}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right font-mono">₹{t.amount.toLocaleString()}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{t.refNo || "—"}</td>
                <td className="px-3 py-2.5 text-center text-xs">{t.timestamp}</td>
                <td className="px-3 py-2.5 text-center">
                  <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><Printer className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────── */
/* 10. COPAY AUDIT — Copay Compliance Audit Log   */
/* ────────────────────────────────────────────── */

interface CopayAuditEntry {
  id: string;
  patientName: string;
  uhid: string;
  billNo: string;
  totalBill: number;
  expectedCopay: number;
  collectedCopay: number;
  variance: number;
  billedDate: string;
  status: "compliant" | "shortfall" | "excess" | "waived";
}

const MOCK_COPAY_AUDIT: CopayAuditEntry[] = [
  { id: "CA001", patientName: "Ravi Sharma", uhid: "UH-1001", billNo: "INV-001", totalBill: 45000, expectedCopay: 4500, collectedCopay: 4500, variance: 0, billedDate: "2025-05-15", status: "compliant" },
  { id: "CA002", patientName: "Sunita Patel", uhid: "UH-1002", billNo: "INV-002", totalBill: 12000, expectedCopay: 1800, collectedCopay: 1000, variance: -800, billedDate: "2025-05-14", status: "shortfall" },
  { id: "CA003", patientName: "Amit Kumar", uhid: "UH-1003", billNo: "INV-003", totalBill: 28000, expectedCopay: 2800, collectedCopay: 0, variance: -2800, billedDate: "2025-05-12", status: "waived" },
  { id: "CA004", patientName: "Priya Singh", uhid: "UH-1004", billNo: "INV-004", totalBill: 89000, expectedCopay: 8900, collectedCopay: 10000, variance: 1100, billedDate: "2025-05-10", status: "excess" },
];

export function BillingCopayAudit() {
  const [entries] = useState<CopayAuditEntry[]>(MOCK_COPAY_AUDIT);

  const totalVariance = entries.reduce((s, e) => s + e.variance, 0);

  return (
    <motion.div {...fadeIn} className="p-6 space-y-6">
      <PreviewStrip message="Co-pay audit — P2 preview. Compliance audit log tracking expected vs collected co-pay amounts with variance detection." docs="BILLING_FINANCE_MODULE.md" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-orange-600" />
            Co-Pay Audit
          </h1>
          <p className="text-sm text-muted-foreground">{entries.length} entries · Variance ₹{Math.abs(totalVariance).toLocaleString()}</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent">
          <Download className="h-4 w-4" /> Export Report
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {(["compliant", "shortfall", "excess", "waived"] as const).map((s) => (
          <div key={s} className="rounded-xl border bg-card p-3 shadow-sm">
            <div className="text-xs text-muted-foreground capitalize">{s}</div>
            <div className="mt-1 text-lg font-bold">{entries.filter((e) => e.status === s).length}</div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2.5 text-left font-medium">Patient</th>
              <th className="px-3 py-2.5 text-left font-medium">Bill No</th>
              <th className="px-3 py-2.5 text-right font-medium">Total (₹)</th>
              <th className="px-3 py-2.5 text-right font-medium">Expected (₹)</th>
              <th className="px-3 py-2.5 text-right font-medium">Collected (₹)</th>
              <th className="px-3 py-2.5 text-right font-medium">Variance (₹)</th>
              <th className="px-3 py-2.5 text-center font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2.5">{e.patientName}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{e.billNo}</td>
                <td className="px-3 py-2.5 text-right font-mono">₹{e.totalBill.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right font-mono">₹{e.expectedCopay.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right font-mono">₹{e.collectedCopay.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right font-mono">
                  <span className={`${e.variance === 0 ? "" : e.variance > 0 ? "text-green-600" : "text-red-600"}`}>
                    {e.variance > 0 ? "+" : ""}{e.variance.toLocaleString()}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    e.status === "compliant" ? "bg-emerald-100 text-emerald-700" :
                    e.status === "shortfall" ? "bg-red-100 text-red-700" :
                    e.status === "excess" ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
                  }`}>{e.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────── */
/* 11. SCHEME BILLING — Govt Scheme Billing       */
/* ────────────────────────────────────────────── */

interface SchemeBill {
  id: string;
  schemeName: string;
  patientName: string;
  uhid: string;
  procedure: string;
  packageAmount: number;
  claimAmount: number;
  benificiaryId: string;
  authorizedDate: string;
  status: "authorized" | "claimed" | "disbursed" | "rejected";
}

const MOCK_SCHEME_BILLS: SchemeBill[] = [
  { id: "SB001", schemeName: "Ayushman Bharat", patientName: "Ravi Sharma", uhid: "UH-1001", procedure: "C-Section", packageAmount: 35000, claimAmount: 35000, benificiaryId: "AB-2025-001", authorizedDate: "2025-05-15", status: "claimed" },
  { id: "SB002", schemeName: "CGHS", patientName: "Sunita Patel", uhid: "UH-1002", procedure: "Knee Replacement", packageAmount: 80000, claimAmount: 72000, benificiaryId: "CGHS-2025-002", authorizedDate: "2025-05-14", status: "authorized" },
  { id: "SB003", schemeName: "Ayushman Bharat", patientName: "Amit Kumar", uhid: "UH-1003", procedure: "Appendectomy", packageAmount: 25000, claimAmount: 25000, benificiaryId: "AB-2025-003", authorizedDate: "2025-05-10", status: "disbursed" },
  { id: "SB004", schemeName: "PM-JAY", patientName: "Priya Singh", uhid: "UH-1004", procedure: "Hysterectomy", packageAmount: 45000, claimAmount: 0, benificiaryId: "PMJ-2025-001", authorizedDate: "2025-05-12", status: "rejected" },
];

export function BillingSchemeBilling() {
  const [bills] = useState<SchemeBill[]>(MOCK_SCHEME_BILLS);

  const totalClaimed = bills.reduce((s, b) => s + b.claimAmount, 0);
  const totalPackage = bills.reduce((s, b) => s + b.packageAmount, 0);

  return (
    <motion.div {...fadeIn} className="p-6 space-y-6">
      <PreviewStrip message="Scheme billing — P2 preview. Government scheme billing (Ayushman Bharat, CGHS, PM-JAY) with package rates and claims." docs="BILLING_FINANCE_MODULE.md" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Landmark className="h-6 w-6 text-teal-600" />
            Scheme Billing
          </h1>
          <p className="text-sm text-muted-foreground">{totalClaimed > 0 ? `₹${totalClaimed.toLocaleString()} claimed` : "No claims yet"}</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700">
          <Plus className="h-4 w-4" /> New Authorization
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="text-xs text-muted-foreground">Package Value</div>
          <div className="mt-1 text-lg font-bold">₹{totalPackage.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="text-xs text-muted-foreground">Claimed</div>
          <div className="mt-1 text-lg font-bold text-teal-600">₹{totalClaimed.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="text-xs text-muted-foreground">Disbursed</div>
          <div className="mt-1 text-lg font-bold text-emerald-600">{bills.filter((b) => b.status === "disbursed").length}</div>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="text-xs text-muted-foreground">Pending</div>
          <div className="mt-1 text-lg font-bold text-amber-600">{bills.filter((b) => b.status === "authorized" || b.status === "claimed").length}</div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2.5 text-left font-medium">Scheme</th>
              <th className="px-3 py-2.5 text-left font-medium">Patient</th>
              <th className="px-3 py-2.5 text-left font-medium">Procedure</th>
              <th className="px-3 py-2.5 text-left font-medium">Beneficiary ID</th>
              <th className="px-3 py-2.5 text-right font-medium">Package (₹)</th>
              <th className="px-3 py-2.5 text-right font-medium">Claimed (₹)</th>
              <th className="px-3 py-2.5 text-center font-medium">Date</th>
              <th className="px-3 py-2.5 text-center font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((b) => (
              <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2.5">{b.schemeName}</td>
                <td className="px-3 py-2.5">{b.patientName}</td>
                <td className="px-3 py-2.5">{b.procedure}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{b.benificiaryId}</td>
                <td className="px-3 py-2.5 text-right font-mono">₹{b.packageAmount.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right font-mono">₹{b.claimAmount.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-center text-xs">{b.authorizedDate}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    b.status === "disbursed" ? "bg-emerald-100 text-emerald-700" :
                    b.status === "rejected" ? "bg-red-100 text-red-700" :
                    b.status === "claimed" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                  }`}>{b.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────── */
/* 12. SETTLEMENT — Final Settlement / Discharge   */
/* ────────────────────────────────────────────── */

interface SettlementRecord {
  id: string;
  patientName: string;
  uhid: string;
  admissionDate: string;
  dischargeDate: string;
  totalBill: number;
  paidAmount: number;
  insuranceCovered: number;
  balance: number;
  mode: "cash" | "card" | "upi" | "combined";
  status: "pending" | "partial" | "settled" | "waived";
}

const MOCK_SETTLEMENTS: SettlementRecord[] = [
  { id: "ST001", patientName: "Ravi Sharma", uhid: "UH-1001", admissionDate: "2025-05-10", dischargeDate: "2025-05-15", totalBill: 75000, paidAmount: 50000, insuranceCovered: 20000, balance: 5000, mode: "combined", status: "partial" },
  { id: "ST002", patientName: "Sunita Patel", uhid: "UH-1002", admissionDate: "2025-05-08", dischargeDate: "2025-05-14", totalBill: 45000, paidAmount: 45000, insuranceCovered: 0, balance: 0, mode: "cash", status: "settled" },
  { id: "ST003", patientName: "Amit Kumar", uhid: "UH-1003", admissionDate: "2025-05-12", dischargeDate: "", totalBill: 28000, paidAmount: 10000, insuranceCovered: 15000, balance: 3000, mode: "combined", status: "pending" },
  { id: "ST004", patientName: "Priya Singh", uhid: "UH-1004", admissionDate: "2025-05-05", dischargeDate: "2025-05-10", totalBill: 89000, paidAmount: 89000, insuranceCovered: 0, balance: 0, mode: "card", status: "settled" },
];

export function BillingSettlement() {
  const [settlements] = useState<SettlementRecord[]>(MOCK_SETTLEMENTS);

  const pendingAmount = settlements.filter((s) => s.status !== "settled").reduce((sum, s) => sum + s.balance, 0);

  return (
    <motion.div {...fadeIn} className="p-6 space-y-6">
      <PreviewStrip message="Final settlement — P2 preview. Discharge settlement with balance computation, insurance coverage allocation, and payment mode capture." docs="BILLING_FINANCE_MODULE.md" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Scale className="h-6 w-6 text-violet-600" />
            Final Settlement
          </h1>
          <p className="text-sm text-muted-foreground">{settlements.length} records · ₹{pendingAmount.toLocaleString()} pending</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700">
          <Plus className="h-4 w-4" /> New Settlement
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="text-xs text-muted-foreground">Total Billed</div>
          <div className="mt-1 text-lg font-bold">₹{settlements.reduce((s, st) => s + st.totalBill, 0).toLocaleString()}</div>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="text-xs text-muted-foreground">Collected</div>
          <div className="mt-1 text-lg font-bold text-emerald-600">₹{settlements.reduce((s, st) => s + st.paidAmount, 0).toLocaleString()}</div>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="text-xs text-muted-foreground">Insurance</div>
          <div className="mt-1 text-lg font-bold text-blue-600">₹{settlements.reduce((s, st) => s + st.insuranceCovered, 0).toLocaleString()}</div>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="text-xs text-muted-foreground">Outstanding</div>
          <div className="mt-1 text-lg font-bold text-red-600">₹{pendingAmount.toLocaleString()}</div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2.5 text-left font-medium">Patient</th>
              <th className="px-3 py-2.5 text-left font-medium">Admitted</th>
              <th className="px-3 py-2.5 text-left font-medium">Discharged</th>
              <th className="px-3 py-2.5 text-right font-medium">Total (₹)</th>
              <th className="px-3 py-2.5 text-right font-medium">Paid (₹)</th>
              <th className="px-3 py-2.5 text-right font-medium">Insurance (₹)</th>
              <th className="px-3 py-2.5 text-right font-medium">Balance (₹)</th>
              <th className="px-3 py-2.5 text-center font-medium">Status</th>
              <th className="px-3 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {settlements.map((s) => (
              <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2.5">{s.patientName}</td>
                <td className="px-3 py-2.5 text-xs">{s.admissionDate}</td>
                <td className="px-3 py-2.5 text-xs">{s.dischargeDate || "—"}</td>
                <td className="px-3 py-2.5 text-right font-mono">₹{s.totalBill.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right font-mono">₹{s.paidAmount.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right font-mono">₹{s.insuranceCovered.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right font-mono">
                  <span className={s.balance > 0 ? "text-red-600 font-semibold" : ""}>₹{s.balance.toLocaleString()}</span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    s.status === "settled" ? "bg-emerald-100 text-emerald-700" :
                    s.status === "pending" ? "bg-amber-100 text-amber-700" :
                    s.status === "partial" ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground"
                  }`}>{s.status}</span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><Eye className="h-4 w-4" /></button>
                  <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><Printer className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
