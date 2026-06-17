import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useTenantSettings } from '@/hooks/useTenantSettings';
import { downloadCsv } from '@/lib/export';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { CheckCircle, Download, FileText, IndianRupee, Plus, Receipt, XCircle } from 'lucide-react';

type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'paid';
type ExpenseRecord = {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  department: string;
  source: string;
  status: ExpenseStatus;
};

type SupplierBill = {
  id: string;
  supplier: string;
  department: string;
  description: string;
  amount: number;
  date: string;
  status: ExpenseStatus;
};

const STORAGE_KEY = 'navayu_admin_finance_v1';

const SEED_EXPENSES: ExpenseRecord[] = [
  { id: 'EXP-2401', date: '2026-06-01', category: 'Rent', description: 'Gurgaon center monthly rent', amount: 185000, department: 'Administration', source: 'Admin', status: 'paid' },
  { id: 'EXP-2402', date: '2026-06-03', category: 'Electricity', description: 'May electricity bill', amount: 42000, department: 'Administration', source: 'Admin', status: 'approved' },
  { id: 'EXP-2403', date: '2026-06-05', category: 'Medical Equipment', description: 'Ultrasound probe replacement', amount: 95000, department: 'Spine & MSK', source: 'MSK', status: 'pending' },
];

const SEED_SUPPLIER_BILLS: SupplierBill[] = [
  { id: 'PO-7781', supplier: 'MedSupply India', department: 'Pharmacy', description: 'Monthly medicine procurement', amount: 248000, date: '2026-06-04', status: 'pending' },
  { id: 'PO-7782', supplier: 'Ortho Implants Co.', department: 'Spine & MSK', description: 'Knee brace inventory', amount: 56000, date: '2026-06-06', status: 'pending' },
];

function loadFinanceState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { expenses: SEED_EXPENSES, supplierBills: SEED_SUPPLIER_BILLS };
    }
    return JSON.parse(raw) as { expenses: ExpenseRecord[]; supplierBills: SupplierBill[] };
  } catch {
    return { expenses: SEED_EXPENSES, supplierBills: SEED_SUPPLIER_BILLS };
  }
}

function saveFinanceState(state: { expenses: ExpenseRecord[]; supplierBills: SupplierBill[] }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatInr(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}

export default function AdminFinanceHub() {
  const { settings } = useTenantSettings();
  const categories = settings.masterData?.expenseCategories ?? [];
  const [tab, setTab] = useState('overview');
  const [state, setState] = useState(loadFinanceState);
  const [expenseForm, setExpenseForm] = useState({
    category: categories[0] ?? 'Other',
    description: '',
    amount: '',
    department: 'Administration',
  });
  const [invoiceForm, setInvoiceForm] = useState({
    supplier: '',
    description: '',
    amount: '',
    department: 'Pharmacy',
  });

  const persist = (next: typeof state) => {
    setState(next);
    saveFinanceState(next);
  };

  const pendingCount =
    state.expenses.filter((item) => item.status === 'pending').length +
    state.supplierBills.filter((item) => item.status === 'pending').length;

  const monthlySpend = useMemo(() => {
    const buckets = new Map<string, number>();
    state.expenses.forEach((expense) => {
      const month = expense.date.slice(0, 7);
      buckets.set(month, (buckets.get(month) ?? 0) + expense.amount);
    });
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, amount }));
  }, [state.expenses]);

  const categorySpend = useMemo(() => {
    const buckets = new Map<string, number>();
    state.expenses.forEach((expense) => {
      buckets.set(expense.category, (buckets.get(expense.category) ?? 0) + expense.amount);
    });
    return Array.from(buckets.entries()).map(([category, amount]) => ({ category, amount }));
  }, [state.expenses]);

  const addExpense = () => {
    const amount = Number(expenseForm.amount);
    if (!expenseForm.description.trim() || !amount) {
      toast.error('Description and amount are required');
      return;
    }
    const next: ExpenseRecord = {
      id: `EXP-${2400 + state.expenses.length + 1}`,
      date: new Date().toISOString().slice(0, 10),
      category: expenseForm.category,
      description: expenseForm.description.trim(),
      amount,
      department: expenseForm.department,
      source: 'Admin',
      status: 'pending',
    };
    persist({ ...state, expenses: [next, ...state.expenses] });
    setExpenseForm({ category: categories[0] ?? 'Other', description: '', amount: '', department: 'Administration' });
    toast.success('Expense submitted for approval');
  };

  const addSupplierInvoice = () => {
    const amount = Number(invoiceForm.amount);
    if (!invoiceForm.supplier.trim() || !invoiceForm.description.trim() || !amount) {
      toast.error('Supplier, description and amount are required');
      return;
    }
    const next: SupplierBill = {
      id: `PO-${7700 + state.supplierBills.length + 1}`,
      supplier: invoiceForm.supplier.trim(),
      department: invoiceForm.department,
      description: invoiceForm.description.trim(),
      amount,
      date: new Date().toISOString().slice(0, 10),
      status: 'pending',
    };
    persist({ ...state, supplierBills: [next, ...state.supplierBills] });
    setInvoiceForm({ supplier: '', description: '', amount: '', department: 'Pharmacy' });
    toast.success('Supplier invoice logged for admin verification');
  };

  const updateExpenseStatus = (id: string, status: ExpenseStatus) => {
    persist({
      ...state,
      expenses: state.expenses.map((item) => (item.id === id ? { ...item, status } : item)),
    });
    toast.success(`Expense ${status}`);
  };

  const updateSupplierStatus = (id: string, status: ExpenseStatus) => {
    persist({
      ...state,
      supplierBills: state.supplierBills.map((item) => (item.id === id ? { ...item, status } : item)),
    });
    toast.success(`Supplier bill ${status}`);
  };

  const exportLedger = () => {
    const rows = [
      ...state.expenses.map((item) => ({
        type: 'Expense',
        id: item.id,
        date: item.date,
        party: item.department,
        category: item.category,
        description: item.description,
        amount: item.amount,
        status: item.status,
      })),
      ...state.supplierBills.map((item) => ({
        type: 'Supplier Bill',
        id: item.id,
        date: item.date,
        party: item.supplier,
        category: item.department,
        description: item.description,
        amount: item.amount,
        status: item.status,
      })),
    ];
    downloadCsv(rows, `navayu-finance-ledger-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('Finance ledger exported');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance & Expense Control</h1>
          <p className="text-sm text-muted-foreground">
            Outgoing money, pharmacy supplier bills, department approvals, and invoice generation
          </p>
        </div>
        <Button variant="outline" onClick={exportLedger}>
          <Download className="h-4 w-4 mr-1" /> Export ledger
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <IndianRupee className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{formatInr(state.expenses.reduce((sum, item) => sum + item.amount, 0))}</p>
              <p className="text-xs text-muted-foreground">Total logged spend</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Receipt className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending approvals</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{state.supplierBills.length}</p>
              <p className="text-xs text-muted-foreground">Supplier bills</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">
                {state.expenses.filter((item) => item.status === 'paid' || item.status === 'approved').length}
              </p>
              <p className="text-xs text-muted-foreground">Approved / paid</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="suppliers">Supplier Bills</TabsTrigger>
          <TabsTrigger value="invoices">Generate Invoice</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Monthly outgoing spend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthlySpend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value: number) => formatInr(value)} />
                    <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Spend by category</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={categorySpend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value: number) => formatInr(value)} />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-1" /> Add expense</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Record expense</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Category</Label>
                    <Select value={expenseForm.category} onValueChange={(value) => setExpenseForm((c) => ({ ...c, category: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Department</Label><Input value={expenseForm.department} onChange={(e) => setExpenseForm((c) => ({ ...c, department: e.target.value }))} /></div>
                  <div><Label>Amount (₹)</Label><Input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm((c) => ({ ...c, amount: e.target.value }))} /></div>
                  <div><Label>Description</Label><Textarea value={expenseForm.description} onChange={(e) => setExpenseForm((c) => ({ ...c, description: e.target.value }))} /></div>
                  <Button className="w-full" onClick={addExpense}>Submit for approval</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="p-3">ID</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {state.expenses.map((expense) => (
                    <tr key={expense.id} className="border-b last:border-0">
                      <td className="p-3 font-mono text-xs">{expense.id}</td>
                      <td className="p-3">{expense.date}</td>
                      <td className="p-3">{expense.category}</td>
                      <td className="p-3">{expense.description}</td>
                      <td className="p-3 font-medium">{formatInr(expense.amount)}</td>
                      <td className="p-3"><Badge variant="outline">{expense.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-3 mt-4">
          {[...state.expenses, ...state.supplierBills.map((bill) => ({
            id: bill.id,
            date: bill.date,
            category: bill.department,
            description: `${bill.supplier}: ${bill.description}`,
            amount: bill.amount,
            department: bill.department,
            source: 'Supplier',
            status: bill.status,
          }))]
            .filter((item) => item.status === 'pending')
            .map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{item.description}</p>
                    <p className="text-xs text-muted-foreground">{item.id} · {item.source} · {formatInr(item.amount)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => {
                      if (item.source === 'Supplier') updateSupplierStatus(item.id, 'approved');
                      else updateExpenseStatus(item.id, 'approved');
                    }}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      if (item.source === 'Supplier') updateSupplierStatus(item.id, 'rejected');
                      else updateExpenseStatus(item.id, 'rejected');
                    }}>
                      <XCircle className="h-3 w-3 mr-1" /> Reject
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => updateExpenseStatus(item.id, 'paid')}>
                      Mark paid
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          {pendingCount === 0 && (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">No pending approvals.</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Pharmacy & department supplier bills</CardTitle>
              <p className="text-xs text-muted-foreground">Bills from pharmacy purchase orders and other departments arrive here for verification.</p>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="p-3">PO</th>
                    <th className="p-3">Supplier</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {state.supplierBills.map((bill) => (
                    <tr key={bill.id} className="border-b last:border-0">
                      <td className="p-3 font-mono text-xs">{bill.id}</td>
                      <td className="p-3">{bill.supplier}</td>
                      <td className="p-3">{bill.department}</td>
                      <td className="p-3 font-medium">{formatInr(bill.amount)}</td>
                      <td className="p-3"><Badge variant="outline">{bill.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Generate supplier invoice</CardTitle></CardHeader>
            <CardContent className="space-y-3 max-w-lg">
              <div><Label>Supplier name</Label><Input value={invoiceForm.supplier} onChange={(e) => setInvoiceForm((c) => ({ ...c, supplier: e.target.value }))} /></div>
              <div><Label>Department</Label><Input value={invoiceForm.department} onChange={(e) => setInvoiceForm((c) => ({ ...c, department: e.target.value }))} /></div>
              <div><Label>Amount (₹)</Label><Input type="number" value={invoiceForm.amount} onChange={(e) => setInvoiceForm((c) => ({ ...c, amount: e.target.value }))} /></div>
              <div><Label>Line items / notes</Label><Textarea value={invoiceForm.description} onChange={(e) => setInvoiceForm((c) => ({ ...c, description: e.target.value }))} /></div>
              <Button onClick={addSupplierInvoice}>Create invoice draft</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
