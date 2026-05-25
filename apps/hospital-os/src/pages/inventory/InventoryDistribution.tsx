import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, Building2, CheckCircle2, Clock, Package
} from 'lucide-react';
import { motion } from 'framer-motion';
import { OperationsModulePage } from '@/components/operations/OperationsModulePage';

interface Distribution {
  id: string;
  date: string;
  fromStore: string;
  toDepartment: string;
  items: { name: string; qty: number; unit: string; batch: string }[];
  status: 'issued' | 'in_transit' | 'received' | 'returned';
  issuedBy: string;
  receivedBy?: string;
}

const DISTRIBUTIONS: Distribution[] = [
  {
    id: 'DIST-112', date: '8 Mar 2026, 11:00 AM', fromStore: 'Central Store', toDepartment: 'OT Department',
    items: [
      { name: 'Sterile Surgical Gloves (7.5)', qty: 50, unit: 'pairs', batch: 'AN-SG-1120' },
      { name: 'Gauze Rolls (Sterile)', qty: 20, unit: 'rolls', batch: 'JJ-GR-890' },
    ],
    status: 'received', issuedBy: 'Ravi Kumar', receivedBy: 'Sr. Priya Nair'
  },
  {
    id: 'DIST-111', date: '8 Mar 2026, 09:30 AM', fromStore: 'Central Store', toDepartment: 'Emergency Ward',
    items: [
      { name: 'IV Cannula 20G', qty: 50, unit: 'pcs', batch: 'BD-IC-334' },
      { name: 'Normal Saline 500ml', qty: 30, unit: 'bottles', batch: 'BX-NS-221' },
    ],
    status: 'in_transit', issuedBy: 'Sunil Patil'
  },
  {
    id: 'DIST-110', date: '7 Mar 2026, 03:00 PM', fromStore: 'Central Store', toDepartment: 'Pharmacy',
    items: [
      { name: 'Propofol 200mg', qty: 10, unit: 'vials', batch: 'NL-PRO-662' },
    ],
    status: 'received', issuedBy: 'Ravi Kumar', receivedBy: 'Dinesh Shah'
  },
  {
    id: 'DIST-109', date: '7 Mar 2026, 10:00 AM', fromStore: 'Central Store', toDepartment: 'Laboratory',
    items: [
      { name: 'EDTA Tubes', qty: 200, unit: 'pcs', batch: 'BD-ET-990' },
    ],
    status: 'received', issuedBy: 'Sunil Patil', receivedBy: 'Rajesh Verma'
  },
];

const STATUS_CONFIG = {
  issued: { label: 'Issued', class: 'bg-info/10 text-info border-info/20' },
  in_transit: { label: 'In Transit', class: 'bg-warning/10 text-warning border-warning/20' },
  received: { label: 'Received', class: 'bg-success/10 text-success border-success/20' },
  returned: { label: 'Returned', class: 'bg-destructive/10 text-destructive border-destructive/20' },
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function InventoryDistribution() {
  return (
    <OperationsModulePage module="inventory" layout="list" title="Stock distribution" subtitle="Track item issuance to departments" actions={<Button size="sm" className="gap-1.5"><Package className="h-3.5 w-3.5" /> Issue stock</Button>}>
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Issued Today', value: '2', icon: CheckCircle2, color: 'text-success' },
          { label: 'In Transit', value: '1', icon: Clock, color: 'text-warning' },
          { label: 'This Week', value: '12', icon: Package, color: 'text-foreground' },
          { label: 'Departments Served', value: '6', icon: Building2, color: 'text-info' },
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

      {/* Distribution Records */}
      <div className="space-y-3">
        {DISTRIBUTIONS.map(dist => (
          <motion.div key={dist.id} variants={item}>
            <Card className="border-border/60 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="px-2.5 py-1 rounded-md bg-muted text-xs font-semibold">{dist.fromStore}</div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="px-2.5 py-1 rounded-md bg-foreground text-background text-xs font-semibold">{dist.toDepartment}</div>
                    </div>
                    <Badge className={`${STATUS_CONFIG[dist.status].class} text-[10px]`}>{STATUS_CONFIG[dist.status].label}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-semibold">{dist.id}</p>
                    <p className="text-[10px] text-muted-foreground">{dist.date}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {dist.items.map((itm, i) => (
                    <div key={i} className="px-3 py-1.5 rounded-md bg-muted/50 border border-border/40 text-xs">
                      <span className="font-semibold">{itm.name}</span>
                      <span className="ml-1.5 font-mono text-muted-foreground">×{itm.qty} {itm.unit}</span>
                      <span className="ml-1.5 text-[10px] text-muted-foreground">({itm.batch})</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/40">
                  <span>Issued by: <span className="font-medium text-foreground">{dist.issuedBy}</span></span>
                  {dist.receivedBy && <span>Received by: <span className="font-medium text-foreground">{dist.receivedBy}</span></span>}
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
