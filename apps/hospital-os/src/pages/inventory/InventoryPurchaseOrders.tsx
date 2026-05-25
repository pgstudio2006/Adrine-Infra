import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Truck, Search, Plus, CheckCircle2, Clock, Package, 
  AlertTriangle, Star, Phone, Mail
} from 'lucide-react';
import { motion } from 'framer-motion';
import { OperationsModulePage } from '@/components/operations/OperationsModulePage';

interface PurchaseOrder {
  id: string;
  supplier: string;
  date: string;
  items: { name: string; qty: number; unit: string; price: string }[];
  totalValue: string;
  status: 'draft' | 'sent' | 'confirmed' | 'partial' | 'delivered' | 'cancelled';
  expectedDelivery: string;
}

const PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'PO-236', supplier: 'BD Medical', date: '8 Mar 2026',
    items: [{ name: 'IV Cannula 20G', qty: 500, unit: 'pcs', price: '₹15,000' }, { name: 'Syringes 5ml', qty: 1000, unit: 'pcs', price: '₹8,000' }],
    totalValue: '₹23,000', status: 'sent', expectedDelivery: '12 Mar 2026'
  },
  {
    id: 'PO-235', supplier: 'Zimmer Biomet', date: '7 Mar 2026',
    items: [{ name: 'TKR Implant Set', qty: 2, unit: 'sets', price: '₹3,20,000' }],
    totalValue: '₹3,20,000', status: 'confirmed', expectedDelivery: '15 Mar 2026'
  },
  {
    id: 'PO-234', supplier: 'Ansell Healthcare', date: '5 Mar 2026',
    items: [{ name: 'Surgical Gloves (7.5)', qty: 500, unit: 'pairs', price: '₹12,500' }, { name: 'Exam Gloves (M)', qty: 1000, unit: 'pairs', price: '₹6,000' }],
    totalValue: '₹18,500', status: 'delivered', expectedDelivery: '8 Mar 2026'
  },
  {
    id: 'PO-233', supplier: 'Drager', date: '4 Mar 2026',
    items: [{ name: 'Oxygen Flowmeter', qty: 5, unit: 'pcs', price: '₹45,000' }],
    totalValue: '₹45,000', status: 'confirmed', expectedDelivery: '18 Mar 2026'
  },
];

const STATUS_CONFIG = {
  draft: { label: 'Draft', class: 'bg-muted text-muted-foreground' },
  sent: { label: 'Sent', class: 'bg-info/10 text-info border-info/20' },
  confirmed: { label: 'Confirmed', class: 'bg-success/10 text-success border-success/20' },
  partial: { label: 'Partial Delivery', class: 'bg-warning/10 text-warning border-warning/20' },
  delivered: { label: 'Delivered', class: 'bg-success/10 text-success border-success/20' },
  cancelled: { label: 'Cancelled', class: 'bg-destructive/10 text-destructive border-destructive/20' },
};

interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  categories: string[];
  rating: number;
  totalOrders: number;
  pendingPayment: string;
  status: 'active' | 'inactive';
}

const SUPPLIERS: Supplier[] = [
  { id: 'SUP-01', name: 'Ansell Healthcare', contact: '+91 98765 43210', email: 'orders@ansell.in', categories: ['Gloves', 'PPE'], rating: 4.5, totalOrders: 45, pendingPayment: '₹0', status: 'active' },
  { id: 'SUP-02', name: 'BD Medical', contact: '+91 98765 43211', email: 'supply@bd.in', categories: ['Cannula', 'Syringes', 'Tubes'], rating: 4.2, totalOrders: 38, pendingPayment: '₹23,000', status: 'active' },
  { id: 'SUP-03', name: 'Ethicon (J&J)', contact: '+91 98765 43212', email: 'orders@ethicon.in', categories: ['Sutures', 'Staplers'], rating: 4.8, totalOrders: 28, pendingPayment: '₹0', status: 'active' },
  { id: 'SUP-04', name: 'Roche Diagnostics', contact: '+91 98765 43213', email: 'supply@roche.in', categories: ['Lab Reagents', 'Test Kits'], rating: 4.6, totalOrders: 22, pendingPayment: '₹1,24,000', status: 'active' },
  { id: 'SUP-05', name: 'Zimmer Biomet', contact: '+91 98765 43214', email: 'implants@zimmer.in', categories: ['Orthopedic Implants'], rating: 4.7, totalOrders: 12, pendingPayment: '₹3,20,000', status: 'active' },
  { id: 'SUP-06', name: 'Neon Laboratories', contact: '+91 98765 43215', email: 'pharma@neonlabs.in', categories: ['Anesthesia', 'Emergency Drugs'], rating: 4.0, totalOrders: 18, pendingPayment: '₹9,600', status: 'active' },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function InventoryPurchaseOrders() {
  const [tab, setTab] = useState<'orders' | 'suppliers'>('orders');

  return (
    <OperationsModulePage module="inventory" layout="list" title="Procurement" subtitle="Purchase orders and supplier management" actions={<Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> {tab === 'orders' ? 'New PO' : 'Add supplier'}</Button>}>
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <div className="flex gap-1 bg-muted p-0.5 rounded-lg w-fit">
          <button onClick={() => setTab('orders')} className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${tab === 'orders' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>Purchase Orders</button>
          <button onClick={() => setTab('suppliers')} className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${tab === 'suppliers' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>Suppliers</button>
        </div>
      </motion.div>

      {tab === 'orders' ? (
        <div className="space-y-3">
          {PURCHASE_ORDERS.map(po => (
            <motion.div key={po.id} variants={item}>
              <Card className="border-border/60 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-foreground text-background flex items-center justify-center">
                        <Truck className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-bold">{po.id}</span>
                          <Badge className={`${STATUS_CONFIG[po.status].class} text-[10px]`}>{STATUS_CONFIG[po.status].label}</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{po.supplier} • {po.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{po.totalValue}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end"><Clock className="h-3 w-3" /> ETA: {po.expectedDelivery}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {po.items.map((itm, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-md bg-muted text-xs">
                        {itm.name} <span className="font-mono font-semibold">×{itm.qty}</span> — {itm.price}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {SUPPLIERS.map(sup => (
            <motion.div key={sup.id} variants={item}>
              <Card className="border-border/60 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-foreground text-background flex items-center justify-center text-xs font-bold">
                        {sup.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{sup.name}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">{sup.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-warning">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span className="text-xs font-semibold">{sup.rating}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {sup.categories.map(c => (
                      <span key={c} className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-medium text-muted-foreground">{c}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3 w-3" /> {sup.contact}</div>
                    <div className="flex items-center gap-1.5 text-muted-foreground"><Mail className="h-3 w-3" /> {sup.email}</div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
                    <span className="text-muted-foreground">{sup.totalOrders} orders</span>
                    <span className={sup.pendingPayment === '₹0' ? 'text-success font-medium' : 'text-warning font-medium'}>
                      {sup.pendingPayment === '₹0' ? 'No dues' : `Pending: ${sup.pendingPayment}`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
      </motion.div>
    </OperationsModulePage>
  );
}
