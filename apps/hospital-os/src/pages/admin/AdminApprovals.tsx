import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

const APPROVALS = [
  { id: 'APR001', type: 'Discount', description: 'Discount of 15% on IPD bill #INV-2024-089', requestedBy: 'Kavita Joshi', amount: '₹12,500', date: '2025-03-08', status: 'pending', rule: 'Discount >10% requires admin approval' },
  { id: 'APR002', type: 'Refund', description: 'Refund for cancelled lab test – patient UHID-4521', requestedBy: 'Billing Desk', amount: '₹8,500', date: '2025-03-08', status: 'pending', rule: 'Refund >₹5000 requires finance approval' },
  { id: 'APR003', type: 'Expense', description: 'CT Scanner annual maintenance', requestedBy: 'Radiology Dept', amount: '₹2,50,000', date: '2025-03-07', status: 'pending', rule: 'Expense >₹1,00,000 requires admin approval' },
  { id: 'APR004', type: 'Write-Off', description: 'Bad debt write-off – patient UHID-3201', requestedBy: 'Finance Team', amount: '₹45,000', date: '2025-03-07', status: 'pending', rule: 'All write-offs require admin approval' },
  { id: 'APR005', type: 'Bill Cancel', description: 'Cancel invoice INV-2024-076 (duplicate)', requestedBy: 'Kavita Joshi', amount: '₹3,200', date: '2025-03-06', status: 'approved', rule: '' },
  { id: 'APR006', type: 'Discount', description: 'Charity discount 50% – patient UHID-5102', requestedBy: 'Reception', amount: '₹25,000', date: '2025-03-06', status: 'approved', rule: '' },
  { id: 'APR007', type: 'Refund', description: 'Duplicate payment refund', requestedBy: 'Billing Desk', amount: '₹1,500', date: '2025-03-05', status: 'rejected', rule: '' },
];

export default function AdminApprovals() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = APPROVALS.filter(a =>
    (typeFilter === 'all' || a.type === typeFilter) &&
    (statusFilter === 'all' || a.status === statusFilter)
  );

  const pending = APPROVALS.filter(a => a.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Approval Workflows</h1>
        <p className="text-sm text-muted-foreground">Review and approve pending requests across the system</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-amber-500" />
          <div><p className="text-2xl font-bold">{pending}</p><p className="text-xs text-muted-foreground">Pending</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-500" />
          <div><p className="text-2xl font-bold">{APPROVALS.filter(a => a.status === 'approved').length}</p><p className="text-xs text-muted-foreground">Approved</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <XCircle className="h-5 w-5 text-destructive" />
          <div><p className="text-2xl font-bold">{APPROVALS.filter(a => a.status === 'rejected').length}</p><p className="text-xs text-muted-foreground">Rejected</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-primary" />
          <div><p className="text-2xl font-bold">{APPROVALS.length}</p><p className="text-xs text-muted-foreground">Total</p></div>
        </CardContent></Card>
      </div>

      <div className="flex gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {['Discount', 'Refund', 'Expense', 'Write-Off', 'Bill Cancel'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map(a => (
          <Card key={a.id} className={a.status === 'pending' ? 'border-amber-200 dark:border-amber-900' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{a.type}</Badge>
                    <span className="font-mono text-xs text-muted-foreground">{a.id}</span>
                    <Badge variant={a.status === 'pending' ? 'secondary' : a.status === 'approved' ? 'default' : 'destructive'}>
                      {a.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">{a.description}</p>
                  <p className="text-xs text-muted-foreground">Requested by: {a.requestedBy} • {a.date}</p>
                  {a.rule && <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{a.rule}</p>}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{a.amount}</p>
                  {a.status === 'pending' && (
                    <div className="flex gap-2 mt-2">
                      <Button size="sm">Approve</Button>
                      <Button size="sm" variant="destructive">Reject</Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
