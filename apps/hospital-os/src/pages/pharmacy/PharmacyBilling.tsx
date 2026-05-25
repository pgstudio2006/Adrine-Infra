import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppSelect } from "@/components/ui/app-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Eye, Receipt, IndianRupee, CreditCard, Banknote, Smartphone, Plus, Printer, Trash2 } from "lucide-react";
import { useHospital, type BillingInvoice } from "@/stores/hospitalStore";

type PaymentMode = "cash" | "card" | "upi";

interface WalkInLine {
  inventoryId: string;
  qty: string;
  unitPrice: string;
}

const EMPTY_WALK_IN_LINE: WalkInLine = {
  inventoryId: "",
  qty: "1",
  unitPrice: "",
};

const payStatusColor: Record<string, string> = {
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  partial: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const paymentIcons: Record<PaymentMode, typeof CreditCard> = {
  cash: Banknote,
  card: CreditCard,
  upi: Smartphone,
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getUnitPrice(drug: string) {
  const normalized = drug.toLowerCase();
  if (normalized.includes("atorvastatin")) return 18;
  if (normalized.includes("aspirin")) return 5;
  if (normalized.includes("paracetamol")) return 4;
  if (normalized.includes("amoxicillin")) return 14;
  if (normalized.includes("pantoprazole")) return 9;
  return 12;
}

export default function PharmacyBilling() {
  const { prescriptions, invoices, createInvoice, collectPayment, pharmacyInventory } = useHospital();
  const [search, setSearch] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState("");
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInCustomerName, setWalkInCustomerName] = useState("");
  const [walkInLines, setWalkInLines] = useState<WalkInLine[]>([{ ...EMPTY_WALK_IN_LINE }]);

  const pharmacyInvoices = useMemo(
    () => invoices.filter(invoice => invoice.category === "Pharmacy"),
    [invoices],
  );

  const filteredInvoices = pharmacyInvoices.filter((invoice) => {
    const query = search.toLowerCase();
    return (
      invoice.patientName.toLowerCase().includes(query) ||
      invoice.id.toLowerCase().includes(query) ||
      invoice.uhid.toLowerCase().includes(query)
    );
  });

  const selectedInvoice = pharmacyInvoices.find(invoice => invoice.id === selectedInvoiceId) || null;
  const paymentInvoice = pharmacyInvoices.find(invoice => invoice.id === paymentInvoiceId) || null;

  const medicineById = useMemo(
    () => new Map(pharmacyInventory.map(item => [item.id, item])),
    [pharmacyInventory],
  );

  const walkInMedicineOptions = useMemo(
    () => pharmacyInventory.map((item) => ({
      value: item.id,
      label: `${item.drug} | Stock ${item.qty} | Rs ${item.price.toFixed(2)}`,
      disabled: item.qty === 0,
    })),
    [pharmacyInventory],
  );

  const walkInTotal = useMemo(() => {
    return walkInLines.reduce((sum, line) => {
      const qty = Number(line.qty);
      const price = Number(line.unitPrice);
      if (!line.inventoryId || !qty || qty <= 0 || !price || price <= 0) {
        return sum;
      }
      return sum + (qty * price);
    }, 0);
  }, [walkInLines]);

  const invoiceablePrescriptions = prescriptions.filter((rx) => {
    const alreadyInvoiced = pharmacyInvoices.some((invoice) =>
      invoice.uhid === rx.uhid && invoice.items.some((item) => item.description.includes(rx.id)),
    );
    return !alreadyInvoiced && (rx.status === "Verified" || rx.status === "Dispensed" || rx.status === "Partially dispensed");
  });

  const todayTotal = pharmacyInvoices.reduce((sum, invoice) => sum + invoice.paid, 0);
  const pendingTotal = pharmacyInvoices.reduce((sum, invoice) => sum + (invoice.total - invoice.paid), 0);

  const generateInvoice = () => {
    const rx = prescriptions.find(item => item.id === selectedPrescriptionId);
    if (!rx) return;

    const items = rx.meds.map((med) => ({
      description: `${rx.id} · ${med.drug} x ${med.qty}`,
      amount: med.qty * getUnitPrice(med.drug),
    }));
    const total = items.reduce((sum, item) => sum + item.amount, 0);

    createInvoice({
      uhid: rx.uhid,
      patientName: rx.patientName,
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      category: "Pharmacy",
      items,
      total,
      paid: 0,
      status: "pending",
    });

    setSelectedPrescriptionId("");
  };

  const openPayment = (invoiceId: string) => {
    const invoice = pharmacyInvoices.find(item => item.id === invoiceId);
    if (!invoice) return;
    setPaymentInvoiceId(invoiceId);
    setPaymentMode((invoice.paymentMode as PaymentMode) || "cash");
    setPaymentAmount(String(invoice.total - invoice.paid));
  };

  const handleCollectPayment = async () => {
    if (!paymentInvoice) return;
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) return;
    await collectPayment(paymentInvoice.id, amount, paymentMode);
    setPaymentInvoiceId(null);
    setPaymentAmount("");
  };

  const resetWalkInDraft = () => {
    setWalkInCustomerName("");
    setWalkInLines([{ ...EMPTY_WALK_IN_LINE }]);
  };

  const updateWalkInMedicine = (index: number, inventoryId: string) => {
    setWalkInLines((prev) => prev.map((line, lineIndex) => {
      if (lineIndex !== index) {
        return line;
      }
      const medicine = medicineById.get(inventoryId);
      return {
        ...line,
        inventoryId,
        unitPrice: medicine ? String(medicine.price) : "",
      };
    }));
  };

  const updateWalkInLineField = (index: number, field: "qty" | "unitPrice", value: string) => {
    setWalkInLines((prev) => prev.map((line, lineIndex) => {
      if (lineIndex !== index) {
        return line;
      }
      return {
        ...line,
        [field]: value,
      };
    }));
  };

  const addWalkInLine = () => {
    setWalkInLines((prev) => [...prev, { ...EMPTY_WALK_IN_LINE }]);
  };

  const removeWalkInLine = (index: number) => {
    setWalkInLines((prev) => {
      if (prev.length === 1) {
        return [{ ...EMPTY_WALK_IN_LINE }];
      }
      return prev.filter((_, lineIndex) => lineIndex !== index);
    });
  };

  const generateWalkInInvoice = () => {
    const parsedLines = walkInLines
      .map((line) => {
        const medicine = medicineById.get(line.inventoryId);
        const qty = Number(line.qty);
        const unitPrice = Number(line.unitPrice);
        return { medicine, qty, unitPrice };
      })
      .filter((line) => !!line.medicine && line.qty > 0 && line.unitPrice > 0);

    if (parsedLines.length === 0) {
      toast.error("Add at least one medicine with valid quantity and unit price.");
      return;
    }

    const exceedsStock = parsedLines.find((line) => line.medicine && line.qty > line.medicine.qty);
    if (exceedsStock?.medicine) {
      toast.error(`${exceedsStock.medicine.drug} quantity exceeds available stock (${exceedsStock.medicine.qty}).`);
      return;
    }

    const items = parsedLines.map((line) => ({
      description: `OTC | ${line.medicine?.drug || "Medicine"} x ${line.qty}`,
      amount: Number((line.qty * line.unitPrice).toFixed(2)),
    }));
    const total = Number(items.reduce((sum, item) => sum + item.amount, 0).toFixed(2));

    const invoiceId = createInvoice({
      uhid: `OTC-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`,
      patientName: walkInCustomerName.trim() || "Walk-in Customer",
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      category: "Pharmacy",
      items,
      total,
      paid: 0,
      status: "pending",
    });

    toast.success(`Walk-in invoice ${invoiceId} created.`);
    setWalkInOpen(false);
    resetWalkInDraft();
    setSelectedInvoiceId(invoiceId);
  };

  const printInvoice = (invoice: BillingInvoice) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Pop-up blocked. Allow pop-ups to print invoice.");
      return;
    }

    const rows = invoice.items.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item.description)}</td>
        <td class="amount">Rs ${item.amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
      </tr>
    `).join("");

    const balance = Math.max(0, invoice.total - invoice.paid);
    const paymentModeLabel = invoice.paymentMode ? invoice.paymentMode.toUpperCase() : "NA";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pharmacy Invoice ${escapeHtml(invoice.id)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 30px; color: #1f2937; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
          .hospital { font-size: 22px; font-weight: 700; }
          .meta { color: #4b5563; font-size: 12px; margin-top: 4px; }
          .invoice-title { font-size: 18px; font-weight: 700; text-align: right; }
          .invoice-id { font-size: 12px; color: #4b5563; margin-top: 4px; text-align: right; }
          .box { border: 1px solid #d1d5db; border-radius: 6px; padding: 10px 12px; margin-top: 12px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; font-size: 12px; }
          .label { color: #6b7280; }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 12px; }
          th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
          th { background: #f9fafb; font-weight: 600; }
          .amount { text-align: right; }
          .summary { margin-top: 12px; margin-left: auto; width: 280px; font-size: 12px; }
          .summary-row { display: flex; justify-content: space-between; padding: 4px 0; }
          .total { font-weight: 700; border-top: 1px solid #d1d5db; margin-top: 6px; padding-top: 6px; }
          .footer { margin-top: 24px; font-size: 11px; color: #6b7280; text-align: center; }
          @media print { body { margin: 16px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="hospital">ADRINE HOSPITAL PHARMACY</div>
            <div class="meta">S.G. Highway, Ahmedabad | +91 79 1234 5678</div>
          </div>
          <div>
            <div class="invoice-title">Tax Invoice</div>
            <div class="invoice-id">Invoice: ${escapeHtml(invoice.id)}</div>
          </div>
        </div>

        <div class="box">
          <div class="grid">
            <div><span class="label">Customer:</span> ${escapeHtml(invoice.patientName)}</div>
            <div><span class="label">Date:</span> ${escapeHtml(invoice.date)}</div>
            <div><span class="label">UHID/Ref:</span> ${escapeHtml(invoice.uhid)}</div>
            <div><span class="label">Payment Mode:</span> ${escapeHtml(paymentModeLabel)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 44px;">#</th>
              <th>Description</th>
              <th style="width: 160px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row"><span>Subtotal</span><span>Rs ${invoice.total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span></div>
          <div class="summary-row"><span>Paid</span><span>Rs ${invoice.paid.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span></div>
          <div class="summary-row"><span>Balance</span><span>Rs ${balance.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span></div>
          <div class="summary-row total"><span>Total</span><span>Rs ${invoice.total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span></div>
        </div>

        <div class="footer">Computer generated pharmacy invoice</div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pharmacy Billing</h1>
        <p className="text-muted-foreground text-sm">Generate medicine bills from prescriptions or walk-in customers and print invoices</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6 flex items-center gap-3"><Receipt className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{pharmacyInvoices.length}</p><p className="text-xs text-muted-foreground">Pharmacy Invoices</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3"><IndianRupee className="h-8 w-8 text-green-600" /><div><p className="text-2xl font-bold">Rs {todayTotal.toLocaleString()}</p><p className="text-xs text-muted-foreground">Collected</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3"><Banknote className="h-8 w-8 text-yellow-600" /><div><p className="text-2xl font-bold">Rs {pendingTotal.toLocaleString()}</p><p className="text-xs text-muted-foreground">Pending</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3"><Plus className="h-8 w-8 text-blue-600" /><div><p className="text-2xl font-bold">{invoiceablePrescriptions.length}</p><p className="text-xs text-muted-foreground">Ready to Bill</p></div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Generate Bill from Prescription</p>
              <p className="text-xs text-muted-foreground">Verified or dispensed prescriptions can be converted into a pharmacy invoice.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <AppSelect
              value={selectedPrescriptionId || undefined}
              onValueChange={setSelectedPrescriptionId}
              placeholder="Select prescription"
              options={invoiceablePrescriptions.map((rx) => ({
                value: rx.id,
                label: `${rx.id} · ${rx.patientName} (${rx.meds.length} items)`,
              }))}
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
            />
            <Button onClick={generateInvoice} disabled={!selectedPrescriptionId}>
              <Receipt className="h-4 w-4 mr-2" /> Generate Invoice
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-foreground">Walk-in Counter Invoice</p>
              <p className="text-xs text-muted-foreground">Create invoice for customers purchasing medicines without a prescription.</p>
            </div>
            <Button variant="outline" onClick={() => setWalkInOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Walk-in Invoice
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search patient or invoice ID..." value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>UHID</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No pharmacy invoices yet. Generate one from a verified prescription or create a walk-in invoice above.</TableCell></TableRow>
              ) : filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-sm">{invoice.id}</TableCell>
                  <TableCell className="font-medium">{invoice.patientName}</TableCell>
                  <TableCell className="text-muted-foreground">{invoice.uhid}</TableCell>
                  <TableCell>{invoice.items.length}</TableCell>
                  <TableCell>Rs {invoice.total.toLocaleString()}</TableCell>
                  <TableCell>Rs {invoice.paid.toLocaleString()}</TableCell>
                  <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${payStatusColor[invoice.status]}`}>{invoice.status}</span></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedInvoiceId(invoice.id)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => printInvoice(invoice)} title="Print Invoice"><Printer className="h-4 w-4" /></Button>
                      {invoice.status !== "paid" && (
                        <Button variant="ghost" size="icon" onClick={() => openPayment(invoice.id)}><CreditCard className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={walkInOpen}
        onOpenChange={(open) => {
          setWalkInOpen(open);
          if (!open) {
            resetWalkInDraft();
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Walk-in Pharmacy Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <p className="mb-1 text-sm font-medium">Customer Name</p>
                <Input
                  value={walkInCustomerName}
                  onChange={(event) => setWalkInCustomerName(event.target.value)}
                  placeholder="Walk-in Customer"
                />
              </div>
              <div className="rounded-lg border border-border px-3 py-2">
                <p className="text-xs text-muted-foreground">Invoice Total</p>
                <p className="text-lg font-semibold">Rs {walkInTotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div className="space-y-3">
              {walkInLines.map((line, index) => {
                const medicine = medicineById.get(line.inventoryId);
                const qty = Number(line.qty) || 0;
                const unitPrice = Number(line.unitPrice) || 0;
                const lineTotal = qty > 0 && unitPrice > 0 ? qty * unitPrice : 0;
                const stockError = !!medicine && qty > medicine.qty;

                return (
                  <div key={`walkin-${index}`} className="rounded-lg border border-border p-3 space-y-2">
                    <div className="grid sm:grid-cols-[2fr_0.7fr_0.9fr_auto] gap-2 items-end">
                      <div>
                        <p className="mb-1 text-xs font-medium text-muted-foreground">Medicine</p>
                        <AppSelect
                          value={line.inventoryId || undefined}
                          onValueChange={(value) => updateWalkInMedicine(index, value)}
                          placeholder="Select medicine"
                          options={walkInMedicineOptions}
                          className="rounded-lg border bg-background px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-medium text-muted-foreground">Qty</p>
                        <Input
                          type="number"
                          min={1}
                          value={line.qty}
                          onChange={(event) => updateWalkInLineField(index, "qty", event.target.value)}
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-medium text-muted-foreground">Unit Price</p>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.unitPrice}
                          onChange={(event) => updateWalkInLineField(index, "unitPrice", event.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeWalkInLine(index)}
                        title="Remove line"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className={stockError ? "text-destructive" : "text-muted-foreground"}>
                        {medicine ? `Available stock: ${medicine.qty}` : "Select medicine"}
                      </div>
                      <div className="font-medium text-foreground">Line Total: Rs {lineTotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <Button type="button" variant="outline" onClick={addWalkInLine}>
                <Plus className="h-4 w-4 mr-2" /> Add Medicine
              </Button>
              <Button type="button" onClick={generateWalkInInvoice} disabled={walkInTotal <= 0}>
                <Receipt className="h-4 w-4 mr-2" /> Generate Walk-in Invoice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoiceId(null)}>
        <DialogContent>
          {selectedInvoice && (
            <>
              <DialogHeader><DialogTitle>Invoice {selectedInvoice.id}</DialogTitle></DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => printInvoice(selectedInvoice)}>
                    <Printer className="h-4 w-4 mr-2" /> Print Invoice
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Patient:</span> <span className="font-medium">{selectedInvoice.patientName}</span></div>
                  <div><span className="text-muted-foreground">UHID:</span> {selectedInvoice.uhid}</div>
                  <div><span className="text-muted-foreground">Date:</span> {selectedInvoice.date}</div>
                  <div><span className="text-muted-foreground">Status:</span> {selectedInvoice.status}</div>
                </div>
                <div className="border border-border rounded-lg p-3 space-y-2">
                  {selectedInvoice.items.map((item, index) => (
                    <div key={`${selectedInvoice.id}-${index}`} className="flex justify-between">
                      <span>{item.description}</span>
                      <span>Rs {item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold border-t border-border pt-2"><span>Total:</span><span>Rs {selectedInvoice.total.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Paid:</span><span>Rs {selectedInvoice.paid.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Balance:</span><span>Rs {(selectedInvoice.total - selectedInvoice.paid).toLocaleString()}</span></div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!paymentInvoice} onOpenChange={() => setPaymentInvoiceId(null)}>
        <DialogContent>
          {paymentInvoice && (
            <>
              <DialogHeader><DialogTitle>Collect Pharmacy Payment</DialogTitle></DialogHeader>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium">{paymentInvoice.patientName}</p>
                  <p className="text-muted-foreground">{paymentInvoice.id} · Due Rs {(paymentInvoice.total - paymentInvoice.paid).toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(["cash", "card", "upi"] as PaymentMode[]).map((mode) => {
                    const Icon = paymentIcons[mode];
                    return (
                      <button
                        key={mode}
                        onClick={() => setPaymentMode(mode)}
                        className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                          paymentMode === mode ? "bg-primary text-primary-foreground" : "bg-background"
                        }`}
                      >
                        <Icon className="h-4 w-4" /> {mode.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
                <div>
                  <p className="mb-1 font-medium">Amount</p>
                  <Input type="number" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} />
                </div>
                <Button className="w-full" onClick={handleCollectPayment}>Record Payment</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
