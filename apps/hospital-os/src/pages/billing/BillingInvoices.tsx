import { useMemo, useState } from "react";
import {
  useBillingDeptPlatform,
  useOpdLiveFinancial,
  mapStoreInvoiceStatus,
} from "@/hooks/useBillingDeptPlatform";
import { BillingDeptShell } from "@/components/billing/BillingDeptShell";
import { BillingEmptyState } from "@/components/billing/BillingEmptyState";
import { BillingStepWizard, type WizardStep } from "@/components/billing/BillingStepWizard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Search, Eye, Plus, Printer, Send, FileText, Trash2 } from "lucide-react";
import { pickPlatformRows } from "@/lib/platform/demo-fallback";

interface InvoiceItem {
  service: string;
  dept: string;
  qty: number;
  rate: number;
  tax: number;
  amount: number;
}

interface Invoice {
  id: string;
  billId: string;
  uhid: string;
  patient: string;
  category: "OPD" | "IPD" | "Emergency" | "Pharmacy" | "Lab" | "Radiology" | "Package";
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  taxTotal: number;
  discount: number;
  netAmount: number;
  status: "Draft" | "Finalized" | "Sent" | "Paid" | "Cancelled";
  paymentStatus: "Pending" | "Paid" | "Partial" | "Refunded";
}

const DEMO_INVOICES: Invoice[] = [
  {
    id: "INV-7001", billId: "BIL-9001", uhid: "UH-10042", patient: "Ravi Sharma", category: "OPD", date: "2026-03-08",
    items: [
      { service: "Consultation — General Medicine", dept: "Medicine", qty: 1, rate: 800, tax: 0, amount: 800 },
      { service: "Blood Test — CBC", dept: "Laboratory", qty: 1, rate: 350, tax: 18, amount: 413 },
      { service: "X-ray Chest PA", dept: "Radiology", qty: 1, rate: 350, tax: 18, amount: 413 },
    ],
    subtotal: 1500, taxTotal: 126, discount: 0, netAmount: 1626, status: "Finalized", paymentStatus: "Paid",
  },
  {
    id: "INV-7002", billId: "BIL-9002", uhid: "UH-10035", patient: "Suresh Kumar", category: "IPD", date: "2026-03-08",
    items: [
      { service: "General Ward — 3 days", dept: "IPD", qty: 3, rate: 2500, tax: 0, amount: 7500 },
      { service: "Surgery — Appendectomy", dept: "Surgery", qty: 1, rate: 25000, tax: 5, amount: 26250 },
      { service: "Anesthesia", dept: "OT", qty: 1, rate: 5000, tax: 5, amount: 5250 },
      { service: "Post-op medications", dept: "Pharmacy", qty: 1, rate: 3200, tax: 12, amount: 3584 },
      { service: "Lab investigations", dept: "Laboratory", qty: 1, rate: 2800, tax: 18, amount: 3304 },
    ],
    subtotal: 38500, taxTotal: 7388, discount: 3850, netAmount: 42038, status: "Finalized", paymentStatus: "Partial",
  },
  {
    id: "INV-7003", billId: "BIL-9003", uhid: "UH-10038", patient: "Anita Desai", category: "OPD", date: "2026-03-08",
    items: [
      { service: "Consultation — Cardiology", dept: "Cardiology", qty: 1, rate: 1200, tax: 0, amount: 1200 },
      { service: "ECG", dept: "Cardiology", qty: 1, rate: 500, tax: 18, amount: 590 },
      { service: "Lipid Profile", dept: "Laboratory", qty: 1, rate: 600, tax: 18, amount: 708 },
    ],
    subtotal: 2300, taxTotal: 198, discount: 0, netAmount: 2498, status: "Sent", paymentStatus: "Pending",
  },
  {
    id: "INV-7004", billId: "BIL-9004", uhid: "UH-10021", patient: "Vikram Singh", category: "Emergency", date: "2026-03-07",
    items: [
      { service: "Emergency consultation", dept: "Emergency", qty: 1, rate: 2000, tax: 0, amount: 2000 },
      { service: "IV fluids + medication", dept: "Pharmacy", qty: 1, rate: 1500, tax: 12, amount: 1680 },
      { service: "CT Head", dept: "Radiology", qty: 1, rate: 2500, tax: 18, amount: 2950 },
      { service: "Observation — 6 hrs", dept: "Emergency", qty: 1, rate: 1500, tax: 0, amount: 1500 },
    ],
    subtotal: 7500, taxTotal: 630, discount: 0, netAmount: 8130, status: "Draft", paymentStatus: "Pending",
  },
  {
    id: "INV-7005", billId: "BIL-9005", uhid: "UH-10029", patient: "Meena Joshi", category: "Package", date: "2026-03-07",
    items: [
      { service: "Health Checkup — Premium Package", dept: "Preventive", qty: 1, rate: 5999, tax: 18, amount: 7079 },
    ],
    subtotal: 5999, taxTotal: 1080, discount: 600, netAmount: 6479, status: "Finalized", paymentStatus: "Paid",
  },
];

const statusColor: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Finalized: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Sent: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  Paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const payColor: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Partial: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  Refunded: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function BillingInvoices() {
  const { platformOn, storeInvoices, resolveOpdVisitId } = useBillingDeptPlatform();
  const [search, setSearch] = useState("");
  const [wizardStep, setWizardStep] = useState(0);
  const INVOICE_WIZARD_STEPS: WizardStep[] = [
    { id: "patient", label: "Patient" },
    { id: "items", label: "Line items" },
    { id: "review", label: "Review" },
    { id: "confirm", label: "Confirm" },
  ];
  const [catFilter, setCatFilter] = useState("all");
  const [selected, setSelected] = useState<Invoice | null>(null);

  const invoices: Invoice[] = useMemo(() => {
    const platformInvoices = storeInvoices.map((inv) => {
      const { status, paymentStatus } = mapStoreInvoiceStatus(inv);
      const items: InvoiceItem[] = inv.items.map((line) => ({
        service: line.description,
        dept: inv.category,
        qty: 1,
        rate: line.amount,
        tax: 0,
        amount: line.amount,
      }));
      const subtotal = inv.total;
      return {
        id: inv.id,
        billId: inv.id,
        uhid: inv.uhid,
        patient: inv.patientName,
        category: inv.category,
        date: inv.date,
        items,
        subtotal,
        taxTotal: 0,
        discount: inv.discountAmount ?? 0,
        netAmount: inv.total,
        status,
        paymentStatus,
      };
    });
    return pickPlatformRows(platformOn, platformInvoices, DEMO_INVOICES);
  }, [platformOn, storeInvoices]);

  const selectedVisitId = selected ? resolveOpdVisitId(selected.uhid) : undefined;
  const liveOpd = useOpdLiveFinancial(selectedVisitId);
  
  // New Invoice State
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [newPatient, setNewPatient] = useState("");
  const [newUhid, setNewUhid] = useState("");
  const [newCategory, setNewCategory] = useState<"OPD" | "IPD" | "Emergency" | "Pharmacy" | "Lab" | "Radiology" | "Package">("OPD");
  const [newItems, setNewItems] = useState<InvoiceItem[]>([
    { service: "", dept: "", qty: 1, rate: 0, tax: 0, amount: 0 }
  ]);

  const filtered = invoices.filter(inv => {
    const matchSearch = inv.patient.toLowerCase().includes(search.toLowerCase()) || inv.id.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || inv.category === catFilter;
    return matchSearch && matchCat;
  });

  const handleAddItem = () => {
    setNewItems([...newItems, { service: "", dept: "", qty: 1, rate: 0, tax: 0, amount: 0 }]);
  };

  const handleUpdateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...newItems];
    updated[index] = { ...updated[index], [field]: value };
    // Recalculate amount
    if (field === 'qty' || field === 'rate' || field === 'tax') {
       const qty = Number(updated[index].qty) || 0;
       const rate = Number(updated[index].rate) || 0;
       const tax = Number(updated[index].tax) || 0;
       const base = qty * rate;
       updated[index].amount = base + (base * tax / 100);
    }
    setNewItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setNewItems(newItems.filter((_, i) => i !== index));
  };

  const newSubtotal = newItems.reduce((acc, item) => acc + (item.qty * item.rate), 0);
  const newTaxTotal = newItems.reduce((acc, item) => acc + ((item.qty * item.rate * item.tax) / 100), 0);
  const newNetTotal = newSubtotal + newTaxTotal;

  const handleSaveInvoice = () => {
    // API logic would go here
    setShowNewInvoice(false);
    // Reset form
    setNewPatient("");
    setNewUhid("");
    setNewItems([{ service: "", dept: "", qty: 1, rate: 0, tax: 0, amount: 0 }]);
  };

  return (
    <BillingDeptShell
      title="Invoices"
      subtitle="Generate, manage, and track patient invoices"
      gateFocus="GAP-006"
      blockers={liveOpd.blockers}
      warnings={liveOpd.state?.warnings}
      platformError={liveOpd.error}
      platformLabel="OPD live invoice (selected row)"
      actions={
        <Button onClick={() => { setWizardStep(0); setShowNewInvoice(true); }} disabled={platformOn}>
          <Plus className="h-4 w-4 mr-2" /> New Invoice
        </Button>
      }
    >

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search patient or invoice ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="OPD">OPD</SelectItem>
            <SelectItem value="IPD">IPD</SelectItem>
            <SelectItem value="Emergency">Emergency</SelectItem>
            <SelectItem value="Pharmacy">Pharmacy</SelectItem>
            <SelectItem value="Lab">Laboratory</SelectItem>
            <SelectItem value="Radiology">Radiology</SelectItem>
            <SelectItem value="Package">Package</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Net Amount</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="p-0">
                    <BillingEmptyState
                      title="No invoices match"
                      description={platformOn ? "Platform-synced invoices appear after OPD billing exit or charge sync." : "Try a different search or create a demo invoice (local mode)."}
                      actionLabel={!platformOn ? "Create invoice" : undefined}
                      onAction={!platformOn ? () => setShowNewInvoice(true) : undefined}
                    />
                  </TableCell>
                </TableRow>
              ) : filtered.map(inv => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-sm">{inv.id}</TableCell>
                  <TableCell>
                    <div><span className="font-medium">{inv.patient}</span><br /><span className="text-xs text-muted-foreground">{inv.uhid}</span></div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{inv.category}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{inv.date}</TableCell>
                  <TableCell>{inv.items.length}</TableCell>
                  <TableCell className="font-medium">₹{inv.netAmount.toLocaleString()}</TableCell>
                  <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[inv.status]}`}>{inv.status}</span></TableCell>
                  <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${payColor[inv.paymentStatus]}`}>{inv.paymentStatus}</span></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setSelected(inv)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon"><Printer className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invoice Detail */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Invoice {selected.id}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[selected.status]}`}>{selected.status}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Patient:</span> <span className="font-medium">{selected.patient}</span></div>
                  <div><span className="text-muted-foreground">UHID:</span> {selected.uhid}</div>
                  <div><span className="text-muted-foreground">Bill ID:</span> {selected.billId}</div>
                  <div><span className="text-muted-foreground">Date:</span> {selected.date}</div>
                  <div><span className="text-muted-foreground">Category:</span> <Badge variant="outline" className="text-xs">{selected.category}</Badge></div>
                  <div><span className="text-muted-foreground">Payment:</span> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${payColor[selected.paymentStatus]}`}>{selected.paymentStatus}</span></div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Dept</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Tax %</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selected.items.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-sm">{item.service}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{item.dept}</TableCell>
                        <TableCell>{item.qty}</TableCell>
                        <TableCell>₹{item.rate.toLocaleString()}</TableCell>
                        <TableCell>{item.tax > 0 ? `${item.tax}%` : "—"}</TableCell>
                        <TableCell className="font-medium">₹{item.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="border border-border rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal:</span><span>₹{selected.subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tax:</span><span>₹{selected.taxTotal.toLocaleString()}</span></div>
                  {selected.discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount:</span><span className="text-green-600">-₹{selected.discount.toLocaleString()}</span></div>}
                  <div className="flex justify-between font-bold text-base border-t border-border pt-2"><span>Net Payable:</span><span>₹{selected.netAmount.toLocaleString()}</span></div>
                </div>

                <div className="flex gap-2">
                  {selected.status === "Draft" && <Button className="flex-1" onClick={() => setSelected(null)}>Finalize Invoice</Button>}
                  {selected.status === "Finalized" && <Button className="flex-1" onClick={() => setSelected(null)}><Send className="h-4 w-4 mr-2" /> Send to Patient</Button>}
                  <Button variant="outline"><Printer className="h-4 w-4 mr-2" /> Print</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Invoice Wizard */}
      <Dialog open={showNewInvoice} onOpenChange={setShowNewInvoice}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice wizard</DialogTitle>
          </DialogHeader>
          <BillingStepWizard
            steps={INVOICE_WIZARD_STEPS}
            currentStep={wizardStep}
            onStepChange={setWizardStep}
            onBack={() => setWizardStep((s) => Math.max(0, s - 1))}
            onNext={() => setWizardStep((s) => s + 1)}
            onFinish={handleSaveInvoice}
            finishLabel="Save draft"
            canNext={wizardStep === 0 ? !!newPatient : wizardStep === 1 ? newItems.some((i) => i.service) : true}
            canFinish={!!newPatient && newNetTotal > 0}
          >
            {wizardStep === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-xl bg-muted/20">
              <div className="space-y-2">
                <Label>Patient Search (Name or UHID)</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search patient..." 
                    className="pl-9" 
                    value={newPatient} 
                    onChange={e => {
                      setNewPatient(e.target.value);
                      if (!newUhid) setNewUhid("UH-" + Math.floor(10000 + Math.random() * 90000));
                    }} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>UHID</Label>
                <Input placeholder="Auto-filled" value={newUhid} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={newCategory} onValueChange={(v: any) => setNewCategory(v)}>
                  <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPD">OPD</SelectItem>
                    <SelectItem value="IPD">IPD</SelectItem>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                    <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                    <SelectItem value="Lab">Laboratory</SelectItem>
                    <SelectItem value="Radiology">Radiology</SelectItem>
                    <SelectItem value="Package">Package</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            )}
            {wizardStep === 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Services / Items</h3>
                <Button variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-2" /> Add Item
                </Button>
              </div>
              <div className="border rounded-xl bg-card overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[30%]">Service/Description</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="w-20">Qty</TableHead>
                      <TableHead className="w-28">Rate (₹)</TableHead>
                      <TableHead className="w-20">Tax %</TableHead>
                      <TableHead className="w-32 text-right">Amount (₹)</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {newItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="p-2">
                          <Input 
                            placeholder="Service name..." 
                            value={item.service}
                            onChange={(e) => handleUpdateItem(index, 'service', e.target.value)}
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input 
                            placeholder="Dept..." 
                            value={item.dept}
                            onChange={(e) => handleUpdateItem(index, 'dept', e.target.value)}
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input 
                            type="number" min="1" 
                            value={item.qty}
                            onChange={(e) => handleUpdateItem(index, 'qty', Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input 
                            type="number" min="0" 
                            value={item.rate}
                            onChange={(e) => handleUpdateItem(index, 'rate', Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input 
                            type="number" min="0" 
                            value={item.tax}
                            onChange={(e) => handleUpdateItem(index, 'tax', Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium p-2 pr-4 text-foreground/80">
                          {item.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="p-2">
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleRemoveItem(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            )}
            {(wizardStep === 2 || wizardStep === 3) && (
              <div className="space-y-2 bg-muted/30 p-4 rounded-xl border text-sm">
                <p><span className="text-muted-foreground">Patient:</span> {newPatient} ({newUhid})</p>
                <p><span className="text-muted-foreground">Category:</span> {newCategory}</p>
                <p><span className="text-muted-foreground">Items:</span> {newItems.filter((i) => i.service).length}</p>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Net Amount</span>
                  <span>₹{newNetTotal.toLocaleString()}</span>
                </div>
                {wizardStep === 3 && platformOn && (
                  <p className="text-xs text-amber-600">Live invoices are created via BillingSync on OPD/IPD exit — this wizard saves locally when platform is off.</p>
                )}
              </div>
            )}
          </BillingStepWizard>
        </DialogContent>
      </Dialog>
    </BillingDeptShell>
  );
}
