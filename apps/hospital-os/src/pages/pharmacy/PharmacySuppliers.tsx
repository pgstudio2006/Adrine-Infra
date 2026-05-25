import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Building2, ExternalLink } from "lucide-react";
import { DiagnosticsPreviewBanner } from "@/components/diagnostics/DiagnosticsPreviewBanner";
import { DepartmentWorklistTable } from "@/components/diagnostics/DepartmentWorklistTable";
import { WorklistStatusChip } from "@/components/diagnostics/WorklistStatusChip";

type SupplierRow = {
  id: string;
  name: string;
  contact: string;
  categories: string;
  status: string;
};

/** Local preview until pharmacy supplier master API ships — procurement lives under Inventory. */
const DEMO_SUPPLIERS: SupplierRow[] = [
  { id: "SUP-001", name: "MedPharma Ltd", contact: "Rajesh Gupta", categories: "Antibiotics, GI", status: "Preview" },
  { id: "SUP-002", name: "LifeCare Pharma", contact: "Priya Sharma", categories: "Analgesics", status: "Preview" },
  { id: "SUP-003", name: "Neon Labs", contact: "Cold chain desk", categories: "Pharmacy Stock", status: "Preview" },
];

export default function PharmacySuppliers() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      DEMO_SUPPLIERS.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.contact.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const columns = useMemo(
    () => [
      {
        id: "status",
        header: "Status",
        cell: (s: SupplierRow) => <WorklistStatusChip label={s.status} tone="outline" />,
      },
      {
        id: "supplier",
        header: "Supplier",
        cell: (s: SupplierRow) => (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{s.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{s.id}</p>
            </div>
          </div>
        ),
      },
      {
        id: "contact",
        header: "Contact",
        cell: (s: SupplierRow) => <span className="text-sm text-muted-foreground">{s.contact}</span>,
      },
      {
        id: "categories",
        header: "Categories",
        cell: (s: SupplierRow) => <span className="text-sm">{s.categories}</span>,
      },
      {
        id: "actions",
        header: "Actions",
        className: "text-right",
        cell: () => (
          <Button variant="ghost" size="sm" className="text-xs h-7" asChild>
            <Link to="/inventory/procurement">PO / procurement</Link>
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Suppliers (preview)</h1>
          <p className="text-muted-foreground text-sm">
            Supplier master is not wired to domain-api — use Inventory procurement for purchase orders
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" asChild>
          <Link to="/inventory/procurement">
            <ExternalLink className="h-3.5 w-3.5" />
            Inventory procurement
          </Link>
        </Button>
      </div>

      <DiagnosticsPreviewBanner
        title="Not connected to platform"
        description="This screen shows a static preview list. Authoritative supplier and PO data will appear under Inventory → Procurement when supplier APIs are available."
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search suppliers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <DepartmentWorklistTable
        rows={filtered}
        columns={columns}
        getRowKey={(s) => s.id}
        emptyMessage="No suppliers match your search."
      />
    </div>
  );
}
