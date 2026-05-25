import { OperationsModulePage } from '@/components/operations/OperationsModulePage';
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Search, AlertTriangle, Package, TrendingDown } from "lucide-react";

const inventory = [
  { item: "Dialyzer F60S (Fresenius)", category: "Dialyzer", stock: 12, reorder: 15, unit: "pcs", unitCost: 1800, supplier: "Fresenius Medical", lastRestock: "2025-02-20", expiry: "2026-06-30" },
  { item: "Dialyzer F80A (Fresenius)", category: "Dialyzer", stock: 8, reorder: 10, unit: "pcs", unitCost: 2200, supplier: "Fresenius Medical", lastRestock: "2025-02-15", expiry: "2026-05-15" },
  { item: "Blood Line Set (Arterial+Venous)", category: "Blood Lines", stock: 45, reorder: 20, unit: "sets", unitCost: 350, supplier: "Nipro Medical", lastRestock: "2025-03-01", expiry: "2026-03-01" },
  { item: "Normal Saline 0.9% 1L", category: "Saline", stock: 120, reorder: 50, unit: "bags", unitCost: 45, supplier: "B.Braun", lastRestock: "2025-03-05", expiry: "2026-12-31" },
  { item: "Heparin 5000 IU/ml (5ml)", category: "Heparin", stock: 30, reorder: 20, unit: "vials", unitCost: 95, supplier: "Gland Pharma", lastRestock: "2025-02-25", expiry: "2025-09-30" },
  { item: "AV Fistula Needle 16G", category: "Needles", stock: 60, reorder: 30, unit: "pcs", unitCost: 120, supplier: "Nipro Medical", lastRestock: "2025-02-28", expiry: "2026-02-28" },
  { item: "AV Fistula Needle 15G", category: "Needles", stock: 25, reorder: 20, unit: "pcs", unitCost: 130, supplier: "Nipro Medical", lastRestock: "2025-02-28", expiry: "2026-02-28" },
  { item: "Bicarbonate Cartridge 720g", category: "Dialysis Filters", stock: 18, reorder: 10, unit: "pcs", unitCost: 280, supplier: "Fresenius Medical", lastRestock: "2025-03-01", expiry: "2026-01-31" },
  { item: "Acid Concentrate 5L", category: "Dialysis Filters", stock: 10, reorder: 8, unit: "cans", unitCost: 450, supplier: "B.Braun", lastRestock: "2025-02-20", expiry: "2025-11-30" },
  { item: "Transducer Protector", category: "Filters", stock: 80, reorder: 30, unit: "pcs", unitCost: 35, supplier: "Nipro Medical", lastRestock: "2025-03-01", expiry: "2026-06-30" },
];

const usageHistory = [
  { date: "2025-03-07", item: "Dialyzer F60S", qty: 3, session: "DS-001, DS-002, DS-003", by: "Sunil K" },
  { date: "2025-03-07", item: "Blood Line Set", qty: 3, session: "DS-001, DS-002, DS-003", by: "Sunil K" },
  { date: "2025-03-07", item: "Heparin 5000 IU/ml", qty: 3, session: "DS-001, DS-002, DS-003", by: "Sunil K" },
  { date: "2025-03-07", item: "NS 0.9% 1L", qty: 6, session: "DS-001, DS-002, DS-003", by: "Sunil K" },
  { date: "2025-03-06", item: "Dialyzer F60S", qty: 4, session: "DS-004, DS-005, DS-006, DS-007", by: "Priya M" },
  { date: "2025-03-06", item: "Dialyzer F80A", qty: 1, session: "DS-008", by: "Ravi T" },
];

export default function DialysisConsumables() {
  const [search, setSearch] = useState("");
  const lowStock = inventory.filter(i => i.stock <= i.reorder);
  const filtered = inventory.filter(i => i.item.toLowerCase().includes(search.toLowerCase()));

  return (
    <OperationsModulePage module="dialysis" layout="list" title="Consumables tracking" subtitle="Dialysis consumables inventory and per-session usage">
      {/* Alerts */}
      {lowStock.length > 0 && (
        <Card className="border-orange-300 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="font-semibold text-sm text-orange-800 dark:text-orange-400">Low Stock Alerts</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStock.map(i => (
                <Badge key={i.item} variant="outline" className="border-orange-400 text-orange-700 dark:text-orange-300 text-xs">
                  {i.item}: {i.stock} left (reorder at {i.reorder})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <Package className="w-5 h-5 text-primary" />
          <div><p className="text-2xl font-bold">{inventory.length}</p><p className="text-xs text-muted-foreground">Item Types</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <div><p className="text-2xl font-bold text-orange-600">{lowStock.length}</p><p className="text-xs text-muted-foreground">Low Stock</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <TrendingDown className="w-5 h-5 text-blue-600" />
          <div><p className="text-2xl font-bold">₹{(inventory.reduce((a,i) => a + i.stock * i.unitCost, 0) / 1000).toFixed(0)}K</p><p className="text-xs text-muted-foreground">Inventory Value</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <Package className="w-5 h-5 text-green-600" />
          <div><p className="text-2xl font-bold">17</p><p className="text-xs text-muted-foreground">Used Today</p></div>
        </CardContent></Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search consumables..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Current Inventory</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Expiry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item, i) => {
                const pct = Math.min((item.stock / (item.reorder * 3)) * 100, 100);
                const isLow = item.stock <= item.reorder;
                return (
                  <TableRow key={i} className={isLow ? 'bg-orange-50/50 dark:bg-orange-950/10' : ''}>
                    <TableCell className="font-medium text-sm">{item.item}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{item.category}</Badge></TableCell>
                    <TableCell className={`font-mono ${isLow ? 'text-orange-600 font-bold' : ''}`}>{item.stock} {item.unit}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={pct} className="h-1.5 w-16" />
                        {isLow && <AlertTriangle className="w-3 h-3 text-orange-500" />}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">₹{item.unitCost}</TableCell>
                    <TableCell className="text-sm">{item.supplier}</TableCell>
                    <TableCell className="text-xs">{item.expiry}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Usage History */}
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Recent Usage Log</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Qty Used</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Logged By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usageHistory.map((u, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs">{u.date}</TableCell>
                  <TableCell className="font-medium text-sm">{u.item}</TableCell>
                  <TableCell className="font-mono">{u.qty}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.session}</TableCell>
                  <TableCell className="text-sm">{u.by}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </OperationsModulePage>
  );
}
