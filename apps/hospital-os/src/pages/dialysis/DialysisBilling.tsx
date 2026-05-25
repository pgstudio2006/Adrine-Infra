import { OperationsModulePage } from '@/components/operations/OperationsModulePage';
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Package, TrendingUp, Plus, FileText, IndianRupee } from "lucide-react";

const invoices = [
  { id: "DI-2025-001", patient: "Ramesh Kumar", uhid: "UH-10234", date: "2025-03-07", session: "₹2,500", dialyzer: "₹1,800", consumables: "₹850", meds: "₹320", techCharge: "₹500", total: "₹5,970", type: "Insurance", status: "Paid" },
  { id: "DI-2025-002", patient: "Lakshmi Devi", uhid: "UH-10456", date: "2025-03-07", session: "₹2,500", dialyzer: "₹1,800", consumables: "₹780", meds: "₹450", techCharge: "₹500", total: "₹6,030", type: "Private", status: "Pending" },
  { id: "DI-2025-003", patient: "Mohammad Ali", uhid: "UH-10789", date: "2025-03-06", session: "₹2,500", dialyzer: "₹2,200", consumables: "₹920", meds: "₹280", techCharge: "₹500", total: "₹6,400", type: "PMJAY", status: "Claimed" },
  { id: "DI-2025-004", patient: "Savita Joshi", uhid: "UH-11023", date: "2025-03-06", session: "₹2,500", dialyzer: "₹1,800", consumables: "₹750", meds: "₹190", techCharge: "₹500", total: "₹5,740", type: "Insurance", status: "Paid" },
  { id: "DI-2025-005", patient: "Anil Sharma", uhid: "UH-11234", date: "2025-03-05", session: "₹3,500", dialyzer: "₹2,200", consumables: "₹1,100", meds: "₹560", techCharge: "₹700", total: "₹8,060", type: "Private", status: "Paid" },
];

const packages = [
  { id: "PKG-001", name: "Monthly HD Plan (12 sessions)", sessions: 12, price: "₹55,000", validity: "30 days", mrp: "₹71,640", discount: "23%", active: 8, status: "Active" },
  { id: "PKG-002", name: "Quarterly HD Plan (36 sessions)", sessions: 36, price: "₹1,50,000", validity: "90 days", mrp: "₹2,14,920", discount: "30%", active: 3, status: "Active" },
  { id: "PKG-003", name: "10 Session Pack", sessions: 10, price: "₹48,000", validity: "45 days", mrp: "₹59,700", discount: "20%", active: 12, status: "Active" },
  { id: "PKG-004", name: "Insurance HD Package (PMJAY)", sessions: 12, price: "₹45,000", validity: "30 days", mrp: "₹45,000", discount: "Govt Rate", active: 5, status: "Active" },
  { id: "PKG-005", name: "SLED Session Package (5)", sessions: 5, price: "₹38,000", validity: "30 days", mrp: "₹40,300", discount: "6%", active: 2, status: "Active" },
];

export default function DialysisBilling() {
  const [showInvoice, setShowInvoice] = useState(false);

  return (
    <OperationsModulePage module="dialysis" layout="list" title="Dialysis billing and packages" subtitle="Session billing, packages, and revenue tracking" actions={
        <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> New Invoice</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Generate Dialysis Invoice</DialogTitle></DialogHeader>
            <div className="grid gap-4 mt-4">
              <div><Label>Patient</Label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>{["Ramesh Kumar","Lakshmi Devi","Mohammad Ali"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Session Date</Label><Input type="date" className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Session Charge</Label><Input defaultValue="2500" className="mt-1" /></div>
                <div><Label>Dialyzer Cost</Label><Input defaultValue="1800" className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Consumables</Label><Input defaultValue="850" className="mt-1" /></div>
                <div><Label>Medicines</Label><Input defaultValue="320" className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Technician Charges</Label><Input defaultValue="500" className="mt-1" /></div>
                <div><Label>Billing Type</Label>
                  <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="pmjay">PMJAY</SelectItem>
                      <SelectItem value="govt">Government Scheme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowInvoice(false)}>Cancel</Button>
              <Button onClick={() => { setShowInvoice(false); toast.success("Invoice generated successfully"); }}>Generate Invoice</Button>
            </div>
          </DialogContent>
        </Dialog>
      }>

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <IndianRupee className="w-5 h-5 text-primary" />
          <div><p className="text-2xl font-bold">₹3.2L</p><p className="text-xs text-muted-foreground">Revenue This Month</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-600" />
          <div><p className="text-2xl font-bold">52</p><p className="text-xs text-muted-foreground">Invoices This Month</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <Package className="w-5 h-5 text-green-600" />
          <div><p className="text-2xl font-bold">30</p><p className="text-xs text-muted-foreground">Active Packages</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-orange-600" />
          <div><p className="text-2xl font-bold">₹6,150</p><p className="text-xs text-muted-foreground">Avg Cost/Session</p></div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices"><CreditCard className="w-3.5 h-3.5 mr-1.5" />Invoices</TabsTrigger>
          <TabsTrigger value="packages"><Package className="w-3.5 h-3.5 mr-1.5" />Packages</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Dialyzer</TableHead>
                    <TableHead>Consumables</TableHead>
                    <TableHead>Meds</TableHead>
                    <TableHead>Tech</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                      <TableCell><div><p className="font-medium text-sm">{inv.patient}</p><p className="text-[10px] text-muted-foreground">{inv.uhid}</p></div></TableCell>
                      <TableCell className="text-xs">{inv.date}</TableCell>
                      <TableCell className="font-mono text-xs">{inv.session}</TableCell>
                      <TableCell className="font-mono text-xs">{inv.dialyzer}</TableCell>
                      <TableCell className="font-mono text-xs">{inv.consumables}</TableCell>
                      <TableCell className="font-mono text-xs">{inv.meds}</TableCell>
                      <TableCell className="font-mono text-xs">{inv.techCharge}</TableCell>
                      <TableCell className="font-mono font-bold text-sm">{inv.total}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{inv.type}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={inv.status === 'Paid' ? 'default' : inv.status === 'Claimed' ? 'secondary' : 'destructive'} className="text-[10px]">
                          {inv.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map(pkg => (
              <Card key={pkg.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="default" className="text-[10px]">{pkg.status}</Badge>
                    <span className="text-xs text-muted-foreground">{pkg.id}</span>
                  </div>
                  <h3 className="font-semibold text-sm mb-3">{pkg.name}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Sessions</span><span className="font-bold">{pkg.sessions}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Package Price</span><span className="font-bold text-primary">{pkg.price}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">MRP</span><span className="line-through text-muted-foreground">{pkg.mrp}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><Badge variant="secondary" className="text-[10px]">{pkg.discount}</Badge></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Validity</span><span>{pkg.validity}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Active Subscriptions</span><span className="font-bold">{pkg.active}</span></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </OperationsModulePage>
  );
}
