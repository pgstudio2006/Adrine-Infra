import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Plus, ArrowRight, CheckCircle2, Clock, 
  XCircle, Package, Building2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { OperationsModulePage } from '@/components/operations/OperationsModulePage';

interface Requisition {
  id: string;
  department: string;
  requestedBy: string;
  date: string;
  items: { name: string; qty: number; unit: string }[];
  status: 'pending' | 'approved' | 'partial' | 'issued' | 'rejected';
  priority: 'high' | 'medium' | 'low';
  notes?: string;
}

const REQUISITIONS: Requisition[] = [
  {
    id: 'REQ-045', department: 'OT Department', requestedBy: 'Sr. Priya Nair', date: '8 Mar 2026, 10:30 AM',
    items: [
      { name: 'Surgical Drape (Standard)', qty: 20, unit: 'pcs' },
      { name: 'Vicryl 2-0 Sutures', qty: 10, unit: 'pcs' },
      { name: 'Sterile Gloves (7.5)', qty: 50, unit: 'pairs' },
    ],
    status: 'pending', priority: 'high'
  },
  {
    id: 'REQ-044', department: 'ICU', requestedBy: 'Sr. Meena Kumari', date: '8 Mar 2026, 08:00 AM',
    items: [
      { name: 'IV Cannula 20G', qty: 30, unit: 'pcs' },
      { name: 'Normal Saline 500ml', qty: 20, unit: 'bottles' },
    ],
    status: 'approved', priority: 'high'
  },
  {
    id: 'REQ-043', department: 'Pharmacy', requestedBy: 'Dinesh Shah', date: '7 Mar 2026, 04:00 PM',
    items: [
      { name: 'Propofol 200mg/20ml', qty: 10, unit: 'vials' },
      { name: 'Atropine 0.6mg', qty: 20, unit: 'ampoules' },
      { name: 'Adrenaline 1mg', qty: 15, unit: 'ampoules' },
    ],
    status: 'issued', priority: 'medium'
  },
  {
    id: 'REQ-042', department: 'Laboratory', requestedBy: 'Rajesh Verma', date: '7 Mar 2026, 02:00 PM',
    items: [
      { name: 'EDTA Tubes', qty: 200, unit: 'pcs' },
      { name: 'Plain Tubes', qty: 100, unit: 'pcs' },
    ],
    status: 'partial', priority: 'medium', notes: 'EDTA tubes issued, plain tubes out of stock'
  },
  {
    id: 'REQ-041', department: 'General Ward', requestedBy: 'Sr. Anita Patel', date: '6 Mar 2026, 11:00 AM',
    items: [
      { name: 'Cotton Rolls', qty: 50, unit: 'pcs' },
      { name: 'Bandage (4 inch)', qty: 30, unit: 'rolls' },
    ],
    status: 'issued', priority: 'low'
  },
];

const STATUS_CONFIG = {
  pending: { label: 'Pending', class: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  approved: { label: 'Approved', class: 'bg-info/10 text-info border-info/20', icon: CheckCircle2 },
  partial: { label: 'Partially Issued', class: 'bg-warning/10 text-warning border-warning/20', icon: Package },
  issued: { label: 'Issued', class: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
  rejected: { label: 'Rejected', class: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
};

const PRIORITY_CONFIG = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-muted text-muted-foreground',
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function InventoryRequisitions() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = REQUISITIONS.filter(r => {
    const matchSearch = r.department.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <OperationsModulePage module="inventory" layout="list" title="Requisitions" subtitle="Department stock requests and approvals" actions={<Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> New requisition</Button>}>
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search requisitions..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <div className="flex gap-1 bg-muted p-0.5 rounded-lg">
          {['All', 'pending', 'approved', 'issued', 'partial'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${statusFilter === s ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {s}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="space-y-3">
        {filtered.map(req => {
          const StatusIcon = STATUS_CONFIG[req.status].icon;
          return (
            <motion.div key={req.id} variants={item}>
              <Card className="border-border/60 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-foreground text-background flex items-center justify-center">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-bold">{req.id}</span>
                          <Badge className={`${STATUS_CONFIG[req.status].class} text-[10px]`}>{STATUS_CONFIG[req.status].label}</Badge>
                          <Badge className={`${PRIORITY_CONFIG[req.priority]} text-[10px]`}>{req.priority}</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{req.department} • {req.requestedBy}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{req.date}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-2">
                    {req.items.map((itm, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-md bg-muted text-xs">
                        {itm.name} <span className="font-mono font-semibold">×{itm.qty}</span> {itm.unit}
                      </span>
                    ))}
                  </div>

                  {req.notes && (
                    <p className="text-[11px] text-warning bg-warning/5 px-2.5 py-1.5 rounded-md border border-warning/20 mt-2">{req.notes}</p>
                  )}

                  {req.status === 'pending' && (
                    <div className="flex gap-2 mt-3 pt-2 border-t border-border/40">
                      <Button size="sm" className="h-7 text-[11px]">Approve & Issue</Button>
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
