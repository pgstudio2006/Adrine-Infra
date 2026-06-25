import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Receipt, TrendingDown } from 'lucide-react';
import { useState } from 'react';

const EXPENSES = [
  { id: 'EXP001', date: '2025-03-08', category: 'Medical Supplies', description: 'Surgical gloves & masks (bulk)', amount: '₹45,000', department: 'General Surgery', status: 'approved', approver: 'Admin' },
  { id: 'EXP002', date: '2025-03-07', category: 'Equipment Maintenance', description: 'CT Scanner annual service', amount: '₹2,50,000', department: 'Radiology', status: 'pending', approver: '' },
  { id: 'EXP003', date: '2025-03-07', category: 'Utilities', description: 'Electricity bill – March', amount: '₹1,80,000', department: 'Administration', status: 'approved', approver: 'Admin' },
  { id: 'EXP004', date: '2025-03-06', category: 'Staff Training', description: 'CPR certification course', amount: '₹35,000', department: 'Nursing', status: 'approved', approver: 'Admin' },
  { id: 'EXP005', date: '2025-03-06', category: 'Infrastructure', description: 'OPD waiting area renovation', amount: '₹5,00,000', department: 'Administration', status: 'pending', approver: '' },
  { id: 'EXP006', date: '2025-03-05', category: 'Pharmacy Purchase', description: 'Monthly drug procurement', amount: '₹6,00,000', department: 'Pharmacy', status: 'approved', approver: 'Finance Head' },
  { id: 'EXP007', date: '2025-03-05', category: 'IT Services', description: 'Server hosting – Q1', amount: '₹90,000', department: 'IT', status: 'rejected', approver: 'Admin' },
];

const CATEGORIES = ['Medical Supplies', 'Equipment Maintenance', 'Utilities', 'Staff Training', 'Infrastructure', 'Pharmacy Purchase', 'IT Services', 'Other'];

export default function AdminExpenses() {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');

  const filtered = EXPENSES.filter(e =>
    (search === '' || e.description.toLowerCase().includes(search.toLowerCase()) || e.id.toLowerCase().includes(search.toLowerCase())) &&
    (catFilter === 'all' || e.category === catFilter)
  );

  const totalApproved = EXPENSES.filter(e => e.status === 'approved').length;
  const totalPending = EXPENSES.filter(e => e.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expense Management</h1>
          <p className="text-sm text-muted-foreground">Track and approve hospital expenses</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Record Expense</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Expense</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Category</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Department</Label><Input placeholder="Department" /></div>
              <div><Label>Amount (₹)</Label><Input type="number" placeholder="Amount" /></div>
              <div><Label>Description</Label><Textarea placeholder="Expense details" /></div>
              <Button className="w-full">Submit for Approval</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Receipt className="h-5 w-5 text-primary" />
          <div><p className="text-2xl font-bold">{EXPENSES.length}</p><p className="text-xs text-muted-foreground">Total Entries</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <TrendingDown className="h-5 w-5 text-emerald-500" />
          <div><p className="text-2xl font-bold">{totalApproved}</p><p className="text-xs text-muted-foreground">Approved</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Receipt className="h-5 w-5 text-amber-500" />
          <div><p className="text-2xl font-bold">{totalPending}</p><p className="text-xs text-muted-foreground">Pending Approval</p></div>
        </CardContent></Card>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                <th className="p-3 font-medium">ID</th>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Category</th>
                <th className="p-3 font-medium">Description</th>
                <th className="p-3 font-medium">Dept</th>
                <th className="p-3 font-medium">Amount</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{e.id}</td>
                  <td className="p-3 text-muted-foreground">{e.date}</td>
                  <td className="p-3">{e.category}</td>
                  <td className="p-3">{e.description}</td>
                  <td className="p-3 text-muted-foreground">{e.department}</td>
                  <td className="p-3 font-medium">{e.amount}</td>
                  <td className="p-3">
                    <Badge variant={e.status === 'approved' ? 'default' : e.status === 'pending' ? 'secondary' : 'destructive'}>
                      {e.status}
                    </Badge>
                  </td>
                  <td className="p-3">
                    {e.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="default">Approve</Button>
                        <Button size="sm" variant="ghost" className="text-destructive">Reject</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
