import { useMemo, useState } from 'react';
import { useInventoryPlatformData } from '@/hooks/useInventoryPlatformData';
import { mapCatalogToUiItem } from '@/lib/inventory/inventory-presenters';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Search, Plus, Filter, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { OperationsModulePage } from '@/components/operations/OperationsModulePage';
import { Link } from 'react-router-dom';

interface CatalogItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  available: number;
  reorderLevel: number;
  supplier: string;
  location: string;
  status: 'active' | 'inactive';
}

const ITEMS: CatalogItem[] = [
  { id: 'ITM-001', name: 'Surgical Gloves (Sterile, 7.5)', category: 'Medical Consumables', unit: 'Pairs', available: 1200, reorderLevel: 500, supplier: 'Ansell', location: 'Rack A-01', status: 'active' },
  { id: 'ITM-002', name: 'IV Cannula 20G', category: 'Medical Consumables', unit: 'Pcs', available: 340, reorderLevel: 200, supplier: 'BD Medical', location: 'Rack A-03', status: 'active' },
  { id: 'ITM-003', name: 'Gauze Roll (Sterile)', category: 'Surgical Supplies', unit: 'Rolls', available: 580, reorderLevel: 300, supplier: 'Johnson & Johnson', location: 'Rack B-01', status: 'active' },
  { id: 'ITM-004', name: 'Vicryl Suture 2-0', category: 'Surgical Supplies', unit: 'Pcs', available: 48, reorderLevel: 20, supplier: 'Ethicon', location: 'Rack B-04', status: 'active' },
  { id: 'ITM-005', name: 'CBC Reagent Kit', category: 'Laboratory Reagents', unit: 'Kits', available: 25, reorderLevel: 10, supplier: 'Roche Diagnostics', location: 'Rack C-02', status: 'active' },
  { id: 'ITM-006', name: 'X-Ray Film 14x17', category: 'Radiology Supplies', unit: 'Sheets', available: 150, reorderLevel: 50, supplier: 'Fujifilm', location: 'Rack D-01', status: 'active' },
  { id: 'ITM-007', name: 'Propofol 200mg/20ml', category: 'Pharmacy Stock', unit: 'Vials', available: 15, reorderLevel: 10, supplier: 'Neon Labs', location: 'Cold Storage-01', status: 'active' },
  { id: 'ITM-008', name: 'Disinfectant (5L)', category: 'Housekeeping', unit: 'Bottles', available: 28, reorderLevel: 15, supplier: 'Reckitt', location: 'Rack E-01', status: 'active' },
  { id: 'ITM-009', name: 'Oxygen Flowmeter', category: 'Equipment Parts', unit: 'Pcs', available: 3, reorderLevel: 5, supplier: 'Drager', location: 'Equipment Store', status: 'active' },
  { id: 'ITM-010', name: 'Blood Collection Tube (EDTA)', category: 'Laboratory Reagents', unit: 'Pcs', available: 45, reorderLevel: 100, supplier: 'BD Vacutainer', location: 'Rack C-01', status: 'active' },
];

const CATEGORIES = ['All', 'Medical Consumables', 'Surgical Supplies', 'Laboratory Reagents', 'Pharmacy Stock', 'Equipment Parts', 'Housekeeping', 'Radiology Supplies'];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function InventoryCatalog() {
  const { platformOn, catalog } = useInventoryPlatformData();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const items = useMemo(() => {
    if (!platformOn || catalog.length === 0) return ITEMS;
    return catalog.map((i) => {
      const m = mapCatalogToUiItem(i);
      return {
        id: i.sku,
        name: m.name,
        category: m.category,
        unit: m.unit,
        available: m.qty,
        reorderLevel: m.reorder,
        supplier: 'Platform',
        location: 'Central store',
        status: 'active' as const,
      };
    });
  }, [platformOn, catalog]);

  const filtered = items.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.id.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || i.category === category;
    return matchSearch && matchCat;
  });

  return (
    <OperationsModulePage
      module="inventory"
      layout="list"
      title="Item catalog"
      subtitle={`${items.length} items • ${items.filter(i => i.available <= i.reorderLevel).length} below reorder`}
      actions={
        <>
          <Button variant="outline" size="sm" asChild><Link to="/inventory/issue">Issue stock</Link></Button>
          <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add item</Button>
        </>
      }
    >
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <div className="flex gap-1 bg-muted p-0.5 rounded-lg overflow-x-auto">
          {CATEGORIES.slice(0, 5).map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${category === c ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {c}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={item}>
        <Card className="border-border/60">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px]">Item</TableHead>
                  <TableHead className="text-[11px]">Category</TableHead>
                  <TableHead className="text-[11px]">Stock</TableHead>
                  <TableHead className="text-[11px]">Status</TableHead>
                  <TableHead className="text-[11px]">Supplier</TableHead>
                  <TableHead className="text-[11px]">Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(i => {
                  const isLow = i.available <= i.reorderLevel;
                  return (
                    <TableRow key={i.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <p className="text-sm font-semibold">{i.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{i.id} • {i.unit}</p>
                      </TableCell>
                      <TableCell><Badge className="bg-muted text-muted-foreground text-[10px]">{i.category}</Badge></TableCell>
                      <TableCell>
                        <span className={`text-sm font-bold ${isLow ? 'text-destructive' : ''}`}>{i.available}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">/ {i.reorderLevel} min</span>
                      </TableCell>
                      <TableCell>
                        {isLow ? (
                          <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] gap-1">
                            <AlertTriangle className="h-3 w-3" /> Low Stock
                          </Badge>
                        ) : (
                          <Badge className="bg-success/10 text-success border-success/20 text-[10px] gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Adequate
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{i.supplier}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{i.location}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
      </motion.div>
    </OperationsModulePage>
  );
}
