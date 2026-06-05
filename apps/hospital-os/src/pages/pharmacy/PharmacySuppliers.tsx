import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Building2, ExternalLink } from "lucide-react";
import { DepartmentWorklistTable } from "@/components/diagnostics/DepartmentWorklistTable";
import { WorklistStatusChip } from "@/components/diagnostics/WorklistStatusChip";
import { PlatformConnectivityStrip } from "@/components/PlatformConnectivityStrip";
import { PlatformEmptyState } from "@/components/platform/PlatformEmptyState";
import { useHospital } from "@/stores/hospitalStore";
import { isPlatformRuntimeEnabled } from "@/runtime/platform-session";
import { canUsePharmacyRuntime } from "@/runtime/pharmacy-runtime";

type SupplierRow = {
  id: string;
  name: string;
  contact: string;
  categories: string;
  status: string;
};

export default function PharmacySuppliers() {
  const [search, setSearch] = useState("");
  const { pharmacyInventory, workflowEvents } = useHospital();
  const platformOn = isPlatformRuntimeEnabled() && canUsePharmacyRuntime();

  const suppliers = useMemo<SupplierRow[]>(() => {
    const byVendor = new Map<string, SupplierRow>();
    for (const item of pharmacyInventory) {
      const vendor = item.supplier?.trim();
      if (!vendor) continue;
      const existing = byVendor.get(vendor);
      if (existing) {
        existing.categories = `${existing.categories}, ${item.category}`;
        continue;
      }
      byVendor.set(vendor, {
        id: `SUP-${vendor.slice(0, 8).toUpperCase()}`,
        name: vendor,
        contact: "Procurement desk",
        categories: item.category,
        status: platformOn ? "Active" : "Store",
      });
    }
    return Array.from(byVendor.values());
  }, [pharmacyInventory, platformOn]);

  const procurementEvents = useMemo(
    () =>
      workflowEvents
        .filter((event) => {
          const text = `${event.module} ${event.action} ${event.details}`.toLowerCase();
          return text.includes("procurement") || text.includes("purchase") || text.includes("supplier");
        })
        .slice(0, 6),
    [workflowEvents],
  );

  const filtered = useMemo(
    () =>
      suppliers.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.contact.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, suppliers],
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
          <h1 className="text-2xl font-bold text-foreground">Suppliers</h1>
          <p className="text-muted-foreground text-sm">
            Vendor directory derived from live pharmacy inventory · PO workflow under Inventory
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" asChild>
          <Link to="/inventory/procurement">
            <ExternalLink className="h-3.5 w-3.5" />
            Inventory procurement
          </Link>
        </Button>
      </div>

      <PlatformConnectivityStrip
        label="Supplier master"
        detail={`${suppliers.length} vendors from inventory · ${procurementEvents.length} recent procurement events`}
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

      {filtered.length === 0 ? (
        <PlatformEmptyState
          title="No suppliers yet"
          message="Supplier rows appear when pharmacy inventory includes vendor names from the platform catalog."
        />
      ) : (
        <DepartmentWorklistTable
          rows={filtered}
          columns={columns}
          getRowKey={(s) => s.id}
          emptyMessage="No suppliers match your search."
        />
      )}
    </div>
  );
}
