import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Plus, Truck, CheckCircle2, Clock, Package, Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import { OperationsModulePage } from '@/components/operations/OperationsModulePage';
import { Link } from 'react-router-dom';

interface StockEntry {
  id: string;
  date: string;
  supplier: string;
  poRef: string;
  items: { name: string; qty: number; unit: string; batch: string; expiry: string }[];
  totalValue: string;
  status: 'received' | 'inspecting' | 'approved' | 'rejected';
  receivedBy: string;
}

const ENTRIES: StockEntry[] = [
  {
    id: 'GRN-078', date: '8 Mar 2026, 09:15 AM', supplier: 'Ansell Healthcare', poRef: 'PO-234',
    items: [
      { name: 'Surgical Gloves (7.5)', qty: 500, unit: 'pairs', batch: 'AN-SG-1120', expiry: 'Sep 2027' },
      { name: 'Examination Gloves (M)', qty: 1000, unit: 'pairs', batch: 'AN-EG-2201', expiry: 'Oct 2027' },
    ],
    totalValue: '₹18,500', status: 'approved', receivedBy: 'Ravi Kumar'
  },
  {
    id: 'GRN-077', date: '7 Mar 2026, 02:30 PM', supplier: 'Roche Diagnostics', poRef: 'PO-231',
    items: [
      { name: 'CBC Reagent Kit', qty: 20, unit: 'kits', batch: 'RD-CBC-445', expiry: 'Jan 2027' },
      { name: 'LFT Reagent Kit', qty: 15, unit: 'kits', batch: 'RD-LFT-446', expiry: 'Feb 2027' },
    ],
    totalValue: '₹1,24,000', status: 'approved', receivedBy: 'Sunil Patil'
  },
  {
    id: 'GRN-076', date: '7 Mar 2026, 10:00 AM', supplier: 'Neon Laboratories', poRef: 'PO-229',
    items: [
      { name: 'Propofol 200mg/20ml', qty: 30, unit: 'vials', batch: 'NL-PRO-662', expiry: 'Jun 2027' },
    ],
    totalValue: '₹9,600', status: 'inspecting', receivedBy: 'Ravi Kumar'
  },
  {
    id: 'GRN-075', date: '6 Mar 2026, 04:00 PM', supplier: 'Ethicon (J&J)', poRef: 'PO-228',
    items: [
      { name: 'Vicryl 2-0 Sutures', qty: 100, unit: 'pcs', batch: 'ETH-V20-445', expiry: 'Dec 2027' },
      { name: 'Chromic Catgut 3-0', qty: 50, unit: 'pcs', batch: 'ETH-CC-222', expiry: 'Jan 2027' },
    ],
    totalValue: '₹32,400', status: 'approved', receivedBy: 'Sunil Patil'
  },
];

const STATUS_CONFIG = {
  received: { label: 'Received', class: 'bg-info/10 text-info border-info/20' },
  inspecting: { label: 'Inspecting', class: 'bg-warning/10 text-warning border-warning/20' },
  approved: { label: 'Approved', class: 'bg-success/10 text-success border-success/20' },
  rejected: { label: 'Rejected', class: 'bg-destructive/10 text-destructive border-destructive/20' },
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function InventoryStockEntry() {
  return (
    <OperationsModulePage
      module="inventory"
      layout="list"
      title="Stock entry"
      subtitle="Goods received notes and inbound tracking"
      actions={
        <>
          <Button variant="outline" size="sm" asChild><Link to="/inventory/grn">Receive (GRN)</Link></Button>
          <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> New GRN</Button>
        </>
      }
    >
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Today\'s Receipts', value: '1', icon: Truck, color: 'text-info' },
          { label: 'Pending Inspection', value: '1', icon: Clock, color: 'text-warning' },
          { label: 'This Week', value: '4', icon: Package, color: 'text-foreground' },
          { label: 'Total Value (Week)', value: '₹1.84L', icon: CheckCircle2, color: 'text-success' },
        ].map(s => (
          <motion.div key={s.label} variants={item}>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <s.icon className={`h-4 w-4 mb-2 ${s.color}`} strokeWidth={1.5} />
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* GRN List */}
      <div className="space-y-3">
        {ENTRIES.map(entry => (
          <motion.div key={entry.id} variants={item}>
            <Card className="border-border/60 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-foreground text-background flex items-center justify-center text-xs font-bold">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-bold">{entry.id}</span>
                        <Badge className={`${STATUS_CONFIG[entry.status].class} text-[10px]`}>{STATUS_CONFIG[entry.status].label}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{entry.supplier} • Ref: {entry.poRef}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{entry.totalValue}</p>
                    <p className="text-[10px] text-muted-foreground">{entry.date}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-2">
                  {entry.items.map((itm, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-muted/50 border border-border/40">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold">{itm.name}</p>
                        <span className="text-xs font-mono font-semibold">×{itm.qty} {itm.unit}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Batch: {itm.batch} • Exp: {itm.expiry}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                  <span>Received by: <span className="font-medium text-foreground">{entry.receivedBy}</span></span>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1"><Eye className="h-3 w-3" /> View Details</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      </motion.div>
    </OperationsModulePage>
  );
}
