import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Pill, ExternalLink } from "lucide-react";
import { useInventoryPlatformData } from "@/hooks/useInventoryPlatformData";
import { mapCatalogToUiItem } from "@/lib/inventory/inventory-presenters";
import { DepartmentWorklistTable } from "@/components/diagnostics/DepartmentWorklistTable";
import { WorklistStatusChip } from "@/components/diagnostics/WorklistStatusChip";
import { pickPlatformRows } from "@/lib/platform/demo-fallback";
import { PlatformEmptyState } from "@/components/platform/PlatformEmptyState";

type DrugRow = {
  id: string;
  name: string;
  category: string;
  unit: string;
  qty: number;
  reorder: number;
  status: string;
};

const DEMO_DRUGS: DrugRow[] = [
  { id: "DRG-001", name: "Amoxicillin 500mg Cap", category: "Antibiotics", unit: "Capsule", qty: 120, reorder: 50, status: "Demo" },
  { id: "DRG-002", name: "Paracetamol 650mg Tab", category: "Analgesics", unit: "Tablet", qty: 340, reorder: 100, status: "Demo" },
  { id: "DRG-003", name: "Propofol 200mg/20ml", category: "Pharmacy Stock", unit: "Vial", qty: 15, reorder: 10, status: "Demo" },
];

export default function PharmacyDrugs() {
  const { platformOn, catalog, loading } = useInventoryPlatformData();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  const platformDrugs = useMemo((): DrugRow[] => {
    return catalog
      .filter(
        (item) =>
          /pharmacy|drug|medicine|controlled/i.test(item.category) ||
          item.category === "General",
      )
      .map((item) => {
        const m = mapCatalogToUiItem(item);
        return {
          id: item.sku,
          name: m.name,
          category: m.category,
          unit: m.unit,
          qty: m.qty,
          reorder: m.reorder,
          status: "Catalog",
        };
      });
  }, [catalog]);

  const drugs = useMemo(
    () => pickPlatformRows(platformOn && catalog.length > 0, platformDrugs, DEMO_DRUGS),
    [platformOn, catalog.length, platformDrugs],
  );

  const categories = [...new Set(drugs.map((d) => d.category))];

  const filtered = drugs.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || d.category === catFilter;
    return matchSearch && matchCat;
  });

  const columns = useMemo(
    () => [
      {
        id: "status",
        header: "Source",
        cell: (d: DrugRow) => (
          <WorklistStatusChip
            label={d.status}
            tone={d.status === "Catalog" ? "default" : "outline"}
          />
        ),
      },
      {
        id: "drug",
        header: "Drug / SKU",
        cell: (d: DrugRow) => (
          <div>
            <p className="text-sm font-medium flex items-center gap-1">
              <Pill className="h-3.5 w-3.5 text-muted-foreground" />
              {d.name}
            </p>
            <p className="text-xs text-muted-foreground font-mono">{d.id}</p>
          </div>
        ),
      },
      {
        id: "category",
        header: "Category",
        cell: (d: DrugRow) => <WorklistStatusChip label={d.category} tone="outline" />,
      },
      {
        id: "stock",
        header: "On hand",
        cell: (d: DrugRow) => (
          <span className="text-sm">
            {d.qty} {d.unit}
            {d.qty <= d.reorder && (
              <span className="text-xs text-amber-600 dark:text-amber-400 block">Below reorder</span>
            )}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        className: "text-right",
        cell: () => (
          <Button variant="ghost" size="sm" className="text-xs h-7" asChild>
            <Link to="/pharmacy/inventory">View stock</Link>
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
          <h1 className="text-2xl font-bold text-foreground">Drug catalog (read-only)</h1>
          <p className="text-muted-foreground text-sm">
            {platformOn
              ? "Pharmacy-relevant SKUs from platform inventory catalog"
              : "Enable platform runtime for live formulary catalog"}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" asChild>
          <Link to="/inventory/catalog">
            <ExternalLink className="h-3.5 w-3.5" />
            Inventory catalog
          </Link>
        </Button>
      </div>

      {!platformOn && drugs.length === 0 && (
        <PlatformEmptyState message="Drug catalog is empty. Enable platform runtime or VITE_ALLOW_DEMO_DATA for local preview rows." />
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search drug or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading && platformOn ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground text-center">Loading catalog…</CardContent>
        </Card>
      ) : (
        <DepartmentWorklistTable
          rows={filtered}
          columns={columns}
          getRowKey={(d) => d.id}
          emptyMessage="No pharmacy catalog items match this filter."
        />
      )}
    </div>
  );
}
