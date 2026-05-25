import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Plus, Eye, ShoppingCart, Truck, CheckCircle } from "lucide-react";

interface PurchaseOrder {
  id: string;
  supplier: string;
  date: string;
  items: { drug: string; qty: number; unitPrice: number }[];
  total: number;
  status: "Draft" | "Ordered" | "Shipped" | "Delivered" | "Cancelled";
  expectedDate: string;
}

const orders: PurchaseOrder[] = [
  { id: "PO-301", supplier: "MedPharma Ltd", date: "2026-03-06", items: [{ drug: "Amoxicillin 500mg", qty: 500, unitPrice: 6.50 }, { drug: "Azithromycin 500mg", qty: 200, unitPrice: 18.00 }], total: 6850, status: "Ordered", expectedDate: "2026-03-10" },
  { id: "PO-300", supplier: "LifeCare Pharma", date: "2026-03-05", items: [{ drug: "Paracetamol 650mg", qty: 1000, unitPrice: 1.20 }], total: 1200, status: "Shipped", expectedDate: "2026-03-08" },
  { id: "PO-299", supplier: "DiaCare Inc", date: "2026-03-03", items: [{ drug: "Metformin 850mg", qty: 300, unitPrice: 3.50 }], total: 1050, status: "Delivered", expectedDate: "2026-03-06" },
  { id: "PO-298", supplier: "HeartMed Corp", date: "2026-03-01", items: [{ drug: "Atorvastatin 20mg", qty: 400, unitPrice: 9.00 }, { drug: "Aspirin 75mg", qty: 500, unitPrice: 1.00 }], total: 4100, status: "Delivered", expectedDate: "2026-03-04" },
  { id: "PO-297", supplier: "NarcoMed Ltd", date: "2026-02-28", items: [{ drug: "Morphine 10mg Inj", qty: 50, unitPrice: 75.00 }], total: 3750, status: "Delivered", expectedDate: "2026-03-02" },
];

const statusColor: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Ordered: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  Delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const statusIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  Ordered: ShoppingCart,
  Shipped: Truck,
  Delivered: CheckCircle,
};

export default function PharmacyPurchase() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const filtered = orders.filter(o => {
    const matchSearch = o.supplier.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Purchase Orders</h1>
          <p className="text-muted-foreground text-sm">Create and track drug purchase orders from suppliers</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> New Purchase Order</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search PO or supplier..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Ordered">Ordered</SelectItem>
            <SelectItem value="Shipped">Shipped</SelectItem>
            <SelectItem value="Delivered">Delivered</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO ID</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total (₹)</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(o => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-sm">{o.id}</TableCell>
                  <TableCell className="font-medium">{o.supplier}</TableCell>
                  <TableCell className="text-muted-foreground">{o.date}</TableCell>
                  <TableCell>{o.items.length}</TableCell>
                  <TableCell className="font-medium">₹{o.total.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground">{o.expectedDate}</TableCell>
                  <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[o.status]}`}>{o.status}</span></TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => setSelected(o)}><Eye className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* PO Detail */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader><DialogTitle>Purchase Order {selected.id}</DialogTitle></DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Supplier:</span> <span className="font-medium">{selected.supplier}</span></div>
                  <div><span className="text-muted-foreground">Order Date:</span> {selected.date}</div>
                  <div><span className="text-muted-foreground">Expected:</span> {selected.expectedDate}</div>
                  <div><span className="text-muted-foreground">Status:</span> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[selected.status]}`}>{selected.status}</span></div>
                </div>
                <div>
                  <p className="font-medium mb-2">Order Items</p>
                  <Table>
                    <TableHeader><TableRow><TableHead>Drug</TableHead><TableHead>Qty</TableHead><TableHead>Unit Price</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {selected.items.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell>{item.drug}</TableCell>
                          <TableCell>{item.qty}</TableCell>
                          <TableCell>₹{item.unitPrice}</TableCell>
                          <TableCell className="font-medium">₹{(item.qty * item.unitPrice).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex justify-end mt-2 font-bold">Total: ₹{selected.total.toLocaleString()}</div>
                </div>
                {selected.status === "Shipped" && <Button className="w-full" onClick={() => { setSelected(null); toast.success("Order marked as delivered"); }}>Mark as Delivered</Button>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create PO */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Purchase Order</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Supplier</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medpharma">MedPharma Ltd</SelectItem>
                    <SelectItem value="lifecare">LifeCare Pharma</SelectItem>
                    <SelectItem value="diacare">DiaCare Inc</SelectItem>
                    <SelectItem value="heartmed">HeartMed Corp</SelectItem>
                    <SelectItem value="narcomed">NarcoMed Ltd</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Expected Delivery</Label><Input type="date" /></div>
            </div>
            <div>
              <Label>Add Items</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <Input placeholder="Drug name" />
                <Input type="number" placeholder="Qty" />
                <Input type="number" step="0.01" placeholder="Unit price (₹)" />
              </div>
              <Button variant="outline" size="sm" className="mt-2"><Plus className="h-3 w-3 mr-1" /> Add Item</Button>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={() => { setShowCreate(false); toast.success("Purchase order created"); }}>Create Order</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
