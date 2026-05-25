import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Package, Search, Plus, AlertTriangle, CheckCircle2, 
  Scissors, Syringe, Filter
} from 'lucide-react';
import { motion } from 'framer-motion';
import { OperationsModulePage } from '@/components/operations/OperationsModulePage';

interface InventoryItem {
  id: string;
  name: string;
  category: 'instruments' | 'consumables' | 'implants' | 'anesthesia' | 'sutures';
  available: number;
  minimum: number;
  unit: string;
  lastRestocked: string;
  supplier: string;
  batchNo: string;
  expiryDate: string;
}

const ITEMS: InventoryItem[] = [
  { id: 'INV-001', name: 'Laparoscopic Trocar (10mm)', category: 'instruments', available: 24, minimum: 10, unit: 'pcs', lastRestocked: '2 days ago', supplier: 'Medline', batchNo: 'ML-2026-881', expiryDate: '—' },
  { id: 'INV-002', name: 'Vicryl 2-0 Sutures', category: 'sutures', available: 48, minimum: 20, unit: 'pcs', lastRestocked: '5 days ago', supplier: 'Ethicon', batchNo: 'ETH-V20-445', expiryDate: 'Dec 2027' },
  { id: 'INV-003', name: 'Propofol 200mg/20ml', category: 'anesthesia', available: 15, minimum: 10, unit: 'vials', lastRestocked: '1 day ago', supplier: 'Neon Labs', batchNo: 'NL-PRO-662', expiryDate: 'Jun 2027' },
  { id: 'INV-004', name: 'Surgical Drape (Standard)', category: 'consumables', available: 80, minimum: 30, unit: 'pcs', lastRestocked: '3 days ago', supplier: 'Medline', batchNo: 'ML-2026-900', expiryDate: '—' },
  { id: 'INV-005', name: 'Zimmer TKR Implant Set', category: 'implants', available: 3, minimum: 2, unit: 'sets', lastRestocked: '1 week ago', supplier: 'Zimmer Biomet', batchNo: 'ZB-TKR-2026', expiryDate: '—' },
  { id: 'INV-006', name: 'Succinylcholine 100mg', category: 'anesthesia', available: 8, minimum: 10, unit: 'vials', lastRestocked: '4 days ago', supplier: 'Neon Labs', batchNo: 'NL-SUC-334', expiryDate: 'Mar 2027' },
  { id: 'INV-007', name: 'Sterile Surgical Gloves (7.5)', category: 'consumables', available: 200, minimum: 100, unit: 'pairs', lastRestocked: 'Today', supplier: 'Ansell', batchNo: 'AN-SG-1120', expiryDate: 'Sep 2027' },
  { id: 'INV-008', name: 'Electrocautery Pencil', category: 'instruments', available: 12, minimum: 5, unit: 'pcs', lastRestocked: '1 week ago', supplier: 'Covidien', batchNo: 'COV-EC-778', expiryDate: '—' },
  { id: 'INV-009', name: 'Chromic Catgut 3-0', category: 'sutures', available: 5, minimum: 15, unit: 'pcs', lastRestocked: '2 weeks ago', supplier: 'Ethicon', batchNo: 'ETH-CC-221', expiryDate: 'Jan 2027' },
  { id: 'INV-010', name: 'Hip Implant (Cemented)', category: 'implants', available: 2, minimum: 2, unit: 'sets', lastRestocked: '2 weeks ago', supplier: 'Smith & Nephew', batchNo: 'SN-HIP-557', expiryDate: '—' },
];

const CATEGORIES = ['All', 'instruments', 'consumables', 'implants', 'anesthesia', 'sutures'] as const;

const CATEGORY_LABELS: Record<string, string> = {
  instruments: 'Instruments',
  consumables: 'Consumables',
  implants: 'Implants',
  anesthesia: 'Anesthesia',
  sutures: 'Sutures',
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function OTInventory() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All');

  const filtered = ITEMS.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || i.category === category;
    return matchSearch && matchCat;
  });

  const lowStock = ITEMS.filter(i => i.available <= i.minimum).length;
  const totalItems = ITEMS.length;

  return (
    <OperationsModulePage
      module="ot"
      layout="list"
      title="OT inventory"
      subtitle={`${totalItems} items tracked • ${lowStock} low stock alerts`}
      actions={<Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add item</Button>}
    >
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {CATEGORIES.filter(c => c !== 'All').map(cat => {
          const count = ITEMS.filter(i => i.category === cat).length;
          const low = ITEMS.filter(i => i.category === cat && i.available <= i.minimum).length;
          return (
            <motion.div key={cat} variants={item}>
              <Card className={`border-border/60 cursor-pointer hover:shadow-md transition-shadow ${category === cat ? 'ring-1 ring-foreground/20' : ''}`}
                onClick={() => setCategory(category === cat ? 'All' : cat)}>
                <CardContent className="p-4">
                  <Package className="h-4 w-4 mb-2 text-muted-foreground" strokeWidth={1.5} />
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{CATEGORY_LABELS[cat]}</p>
                  {low > 0 && <p className="text-[10px] text-destructive mt-1">⚠ {low} low stock</p>}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <motion.div variants={item} className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search inventory..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
      </motion.div>

      {/* Table */}
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
                  <TableHead className="text-[11px]">Batch</TableHead>
                  <TableHead className="text-[11px]">Supplier</TableHead>
                  <TableHead className="text-[11px]">Expiry</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(i => {
                  const isLow = i.available <= i.minimum;
                  return (
                    <TableRow key={i.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <p className="text-sm font-semibold">{i.name}</p>
                        <p className="text-[10px] text-muted-foreground">{i.id}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-muted text-muted-foreground text-[10px] capitalize">{CATEGORY_LABELS[i.category]}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-sm font-bold ${isLow ? 'text-destructive' : ''}`}>{i.available}</span>
                          <span className="text-[10px] text-muted-foreground">/ {i.minimum} min • {i.unit}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isLow ? (
                          <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] gap-1">
                            <AlertTriangle className="h-3 w-3" /> Low Stock
                          </Badge>
                        ) : (
                          <Badge className="bg-success/10 text-success border-success/20 text-[10px] gap-1">
                            <CheckCircle2 className="h-3 w-3" /> In Stock
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{i.batchNo}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{i.supplier}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{i.expiryDate}</TableCell>
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
