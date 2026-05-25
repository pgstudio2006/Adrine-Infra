import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, FileText, IndianRupee, Receipt, Calculator } from 'lucide-react';
import { useMemo } from 'react';
import { useBillingGstData } from '@/hooks/useBillingDeptData';
import { BillingDeptShell } from '@/components/billing/BillingDeptShell';

const gstSummary = [
  { month: 'Oct', cgst: 45200, sgst: 45200, igst: 8400, total: 98800 },
  { month: 'Nov', cgst: 48900, sgst: 48900, igst: 9100, total: 106900 },
  { month: 'Dec', cgst: 42100, sgst: 42100, igst: 7800, total: 92000 },
  { month: 'Jan', cgst: 51300, sgst: 51300, igst: 10200, total: 112800 },
  { month: 'Feb', cgst: 53800, sgst: 53800, igst: 10600, total: 118200 },
  { month: 'Mar', cgst: 56200, sgst: 56200, igst: 11100, total: 123500 },
];

const hsnWise = [
  { hsn: '9993', description: 'Healthcare Services (Exempt)', taxableValue: 2850000, gstRate: '0%', cgst: 0, sgst: 0, total: 0 },
  { hsn: '9993', description: 'Room Charges (AC)', taxableValue: 480000, gstRate: '12%', cgst: 28800, sgst: 28800, total: 57600 },
  { hsn: '9993', description: 'Room Charges (Suite)', taxableValue: 320000, gstRate: '18%', cgst: 28800, sgst: 28800, total: 57600 },
  { hsn: '3004', description: 'Pharmacy Sales', taxableValue: 680000, gstRate: '12%', cgst: 40800, sgst: 40800, total: 81600 },
  { hsn: '3004', description: 'Surgical Consumables', taxableValue: 210000, gstRate: '18%', cgst: 18900, sgst: 18900, total: 37800 },
  { hsn: '9018', description: 'Medical Equipment Rental', taxableValue: 95000, gstRate: '18%', cgst: 8550, sgst: 8550, total: 17100 },
];

const gstr1Data = [
  { invoice: 'INV-2026-0845', date: '2026-03-01', patient: 'Ramesh Kumar', gstin: '—', taxable: 15000, cgst: 900, sgst: 900, total: 16800 },
  { invoice: 'INV-2026-0846', date: '2026-03-01', patient: 'Corporate A', gstin: '29AABCU9603R1ZM', taxable: 85000, cgst: 5100, sgst: 5100, total: 95200 },
  { invoice: 'INV-2026-0847', date: '2026-03-02', patient: 'Suresh Patel', gstin: '—', taxable: 22000, cgst: 1320, sgst: 1320, total: 24640 },
  { invoice: 'INV-2026-0848', date: '2026-03-02', patient: 'Corporate B', gstin: '27AADCB2230M1Z3', taxable: 120000, cgst: 10800, sgst: 10800, total: 141600 },
  { invoice: 'INV-2026-0849', date: '2026-03-03', patient: 'Anita Sharma', gstin: '—', taxable: 8500, cgst: 0, sgst: 0, total: 8500 },
];

const inputCredit = [
  { supplier: 'Medline Pharma Pvt Ltd', gstin: '29AABCM1234R1ZK', invoice: 'SUP-4521', taxable: 180000, cgst: 10800, sgst: 10800, total: 201600 },
  { supplier: 'Surgical Supplies Co.', gstin: '29AADCS5678M1Z2', invoice: 'SUP-4522', taxable: 95000, cgst: 8550, sgst: 8550, total: 112100 },
  { supplier: 'Lab Equipment India', gstin: '07AAECL9012N1Z5', invoice: 'SUP-4523', taxable: 45000, cgst: 4050, sgst: 4050, total: 53100 },
];

export default function BillingGST() {
  const { data: live, platformOn } = useBillingGstData(90);

  const gstr1Rows = useMemo(() => {
    if (!platformOn || !live?.invoices?.length) return gstr1Data;
    return (live.invoices as { invoiceId: string; updatedAt: string; patientName: string; taxableCents: number; cgstCents: number; sgstCents: number; totalCents: number }[]).map((inv) => ({
      invoice: inv.invoiceId.slice(0, 12),
      date: inv.updatedAt.slice(0, 10),
      patient: inv.patientName,
      gstin: '—',
      taxable: inv.taxableCents / 100,
      cgst: inv.cgstCents / 100,
      sgst: inv.sgstCents / 100,
      total: inv.totalCents / 100,
    }));
  }, [platformOn, live]);

  return (
    <BillingDeptShell
      title="GST Reports"
      subtitle="GST-compliant billing reports, GSTR-1, HSN summary, and input credit"
      showPlatformStrip={false}
      actions={
        <div className="flex gap-2">
          <Select defaultValue="mar">
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mar">March 2026</SelectItem>
              <SelectItem value="feb">February 2026</SelectItem>
              <SelectItem value="jan">January 2026</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2 text-sm"><Download className="w-4 h-4" />Export GSTR-1</Button>
        </div>
      }
    >

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Output GST', value: '₹1,23,500', icon: Receipt, sub: 'March 2026' },
          { label: 'Input Credit', value: '₹23,400', icon: Calculator, sub: 'Claimable ITC' },
          { label: 'Net GST Liability', value: '₹1,00,100', icon: IndianRupee, sub: 'Payable this month' },
          { label: 'Exempt Revenue', value: '₹28,50,000', icon: FileText, sub: 'Healthcare services' },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{s.sub}</p>
              </div>
              <s.icon className="w-4 h-4 text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">Monthly Summary</TabsTrigger>
          <TabsTrigger value="hsn">HSN-Wise</TabsTrigger>
          <TabsTrigger value="gstr1">GSTR-1 Data</TabsTrigger>
          <TabsTrigger value="itc">Input Tax Credit</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4">
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">GST Collection Trend (6 months)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={gstSummary}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `₹${(v/1000)}k`} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => `₹${v.toLocaleString()}`} />
                <Bar dataKey="cgst" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} name="CGST" />
                <Bar dataKey="sgst" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} name="SGST" />
                <Bar dataKey="igst" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} name="IGST" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="hsn" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>HSN Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Taxable Value</TableHead>
                  <TableHead>GST Rate</TableHead>
                  <TableHead className="text-right">CGST</TableHead>
                  <TableHead className="text-right">SGST</TableHead>
                  <TableHead className="text-right">Total GST</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hsnWise.map((h, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-sm">{h.hsn}</TableCell>
                    <TableCell className="font-medium">{h.description}</TableCell>
                    <TableCell className="text-right">₹{h.taxableValue.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={h.gstRate === '0%' ? 'secondary' : 'outline'} className="text-xs">{h.gstRate}</Badge>
                    </TableCell>
                    <TableCell className="text-right">₹{h.cgst.toLocaleString()}</TableCell>
                    <TableCell className="text-right">₹{h.sgst.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold">₹{h.total.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="gstr1" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient/Entity</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead className="text-right">Taxable</TableHead>
                  <TableHead className="text-right">CGST</TableHead>
                  <TableHead className="text-right">SGST</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gstr1Rows.map((g, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{g.invoice}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{g.date}</TableCell>
                    <TableCell className="font-medium">{g.patient}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{g.gstin}</TableCell>
                    <TableCell className="text-right">₹{g.taxable.toLocaleString()}</TableCell>
                    <TableCell className="text-right">₹{g.cgst.toLocaleString()}</TableCell>
                    <TableCell className="text-right">₹{g.sgst.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold">₹{g.total.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="itc" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead className="text-right">Taxable</TableHead>
                  <TableHead className="text-right">CGST</TableHead>
                  <TableHead className="text-right">SGST</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inputCredit.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{c.supplier}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{c.gstin}</TableCell>
                    <TableCell className="text-sm">{c.invoice}</TableCell>
                    <TableCell className="text-right">₹{c.taxable.toLocaleString()}</TableCell>
                    <TableCell className="text-right">₹{c.cgst.toLocaleString()}</TableCell>
                    <TableCell className="text-right">₹{c.sgst.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold">₹{c.total.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </BillingDeptShell>
  );
}
