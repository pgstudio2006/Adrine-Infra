import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Plus, AlertTriangle, ArrowUpDown, Minus, Package, Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { OperationsModulePage } from '@/components/operations/OperationsModulePage';

interface Adjustment {
  id: string;
  date: string;
  item: string;
  itemId: string;
  type: 'damage' | 'expired' | 'missing' | 'correction' | 'return';
  qtyAdjusted: number;
  reason: string;
  adjustedBy: string;
  approvedBy?: string;
  status: 'pending' | 'approved' | 'rejected';
}

const ADJUSTMENTS: Adjustment[] = [
  { id: 'ADJ-034', date: '8 Mar 2026', item: 'Propofol 200mg/20ml', itemId: 'ITM-007', type: 'expired', qtyAdjusted: -5, reason: 'Batch NL-PRO-658 expired 28 Feb 2026', adjustedBy: 'Ravi Kumar', approvedBy: 'Store Manager', status: 'approved' },
  { id: 'ADJ-033', date: '7 Mar 2026', item: 'IV Cannula 20G', itemId: 'ITM-002', type: 'damage', qtyAdjusted: -12, reason: 'Package damaged during transit — supplier notified', adjustedBy: 'Sunil Patil', status: 'pending' },
  { id: 'ADJ-032', date: '7 Mar 2026', item: 'Surgical Gloves (7.5)', itemId: 'ITM-001', type: 'correction', qtyAdjusted: +25, reason: 'Physical count audit correction — 25 extra found', adjustedBy: 'Ravi Kumar', approvedBy: 'Store Manager', status: 'approved' },
  { id: 'ADJ-031', date: '6 Mar 2026', item: 'Cotton Rolls', itemId: 'ITM-015', type: 'missing', qtyAdjusted: -8, reason: 'Discrepancy found during weekly count', adjustedBy: 'Sunil Patil', status: 'pending' },
  { id: 'ADJ-030', date: '5 Mar 2026', item: 'Examination Gloves (M)', itemId: 'ITM-011', type: 'return', qtyAdjusted: +50, reason: 'Returned unused from General Ward', adjustedBy: 'Ravi Kumar', approvedBy: 'Store Manager', status: 'approved' },
];

const TYPE_CONFIG = {
  damage: { label: 'Damaged', class: 'bg-destructive/10 text-destructive border-destructive/20', icon: Trash2 },
  expired: { label: 'Expired', class: 'bg-warning/10 text-warning border-warning/20', icon: AlertTriangle },
  missing: { label: 'Missing', class: 'bg-destructive/10 text-destructive border-destructive/20', icon: Minus },
  correction: { label: 'Audit Correction', class: 'bg-info/10 text-info border-info/20', icon: ArrowUpDown },
  return: { label: 'Return', class: 'bg-success/10 text-success border-success/20', icon: Package },
};

const STATUS_CONFIG = {
  pending: { label: 'Pending Approval', class: 'bg-warning/10 text-warning border-warning/20' },
  approved: { label: 'Approved', class: 'bg-success/10 text-success border-success/20' },
  rejected: { label: 'Rejected', class: 'bg-destructive/10 text-destructive border-destructive/20' },
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function InventoryAdjustments() {
  return (
    <OperationsModulePage module="inventory" layout="list" title="Stock adjustments" subtitle="Damaged, expired, missing items and audit corrections" actions={<Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> New adjustment</Button>}>
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(TYPE_CONFIG).map(([key, config]) => {
          const count = ADJUSTMENTS.filter(a => a.type === key).length;
          const Icon = config.icon;
          return (
            <motion.div key={key} variants={item}>
              <Card className="border-border/60">
                <CardContent className="p-4">
                  <Icon className="h-4 w-4 mb-2 text-muted-foreground" strokeWidth={1.5} />
                  <p className="text-xl font-bold">{count}</p>
                  <p className="text-[10px] text-muted-foreground">{config.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Adjustment Records */}
      <div className="space-y-3">
        {ADJUSTMENTS.map(adj => {
          const typeConfig = TYPE_CONFIG[adj.type];
          const TypeIcon = typeConfig.icon;
          return (
            <motion.div key={adj.id} variants={item}>
              <Card className="border-border/60 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${adj.qtyAdjusted < 0 ? 'bg-destructive/10' : 'bg-success/10'}`}>
                        <TypeIcon className={`h-4 w-4 ${adj.qtyAdjusted < 0 ? 'text-destructive' : 'text-success'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-bold">{adj.id}</span>
                          <Badge className={`${typeConfig.class} text-[10px]`}>{typeConfig.label}</Badge>
                          <Badge className={`${STATUS_CONFIG[adj.status].class} text-[10px]`}>{STATUS_CONFIG[adj.status].label}</Badge>
                        </div>
                        <p className="text-sm font-semibold mt-0.5">{adj.item}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-mono font-bold ${adj.qtyAdjusted < 0 ? 'text-destructive' : 'text-success'}`}>
                        {adj.qtyAdjusted > 0 ? '+' : ''}{adj.qtyAdjusted}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{adj.date}</p>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-md bg-muted/50 border border-border/40 text-xs mb-2">
                    <span className="text-muted-foreground">Reason: </span>{adj.reason}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>By: <span className="font-medium text-foreground">{adj.adjustedBy}</span></span>
                    {adj.approvedBy && <span>Approved: <span className="font-medium text-foreground">{adj.approvedBy}</span></span>}
                  </div>
                  {adj.status === 'pending' && (
                    <div className="flex gap-2 mt-3 pt-2 border-t border-border/40">
                      <Button size="sm" className="h-7 text-[11px]">Approve</Button>
                      <Button variant="outline" size="sm" className="h-7 text-[11px]">Reject</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
      </motion.div>
    </OperationsModulePage>
  );
}
