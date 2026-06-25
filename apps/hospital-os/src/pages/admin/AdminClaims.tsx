import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';

const CLAIMS = [
  { id: 'CLM001', patient: 'Amit Shah', uhid: 'UHID-1001', provider: 'Star Health', policyNo: 'SH-2024-5678', claimAmount: '₹1,85,000', approvedAmount: '₹1,60,000', type: 'IPD', status: 'settled', submittedDate: '2025-02-15', settledDate: '2025-03-05' },
  { id: 'CLM002', patient: 'Neha Patel', uhid: 'UHID-1023', provider: 'ICICI Lombard', policyNo: 'IL-2024-9012', claimAmount: '₹75,000', approvedAmount: '', type: 'IPD', status: 'submitted', submittedDate: '2025-03-02', settledDate: '' },
  { id: 'CLM003', patient: 'Rajesh Kumar', uhid: 'UHID-1045', provider: 'HDFC Ergo', policyNo: 'HE-2024-3456', claimAmount: '₹45,000', approvedAmount: '₹45,000', type: 'OPD', status: 'approved', submittedDate: '2025-03-01', settledDate: '' },
  { id: 'CLM004', patient: 'Sunita Devi', uhid: 'UHID-1067', provider: 'National Insurance', policyNo: 'NI-2024-7890', claimAmount: '₹2,20,000', approvedAmount: '', type: 'IPD', status: 'pending', submittedDate: '', settledDate: '' },
  { id: 'CLM005', patient: 'Vikram Rathod', uhid: 'UHID-1089', provider: 'Star Health', policyNo: 'SH-2024-1234', claimAmount: '₹35,000', approvedAmount: '', type: 'OPD', status: 'rejected', submittedDate: '2025-02-20', settledDate: '' },
  { id: 'CLM006', patient: 'Meera Desai', uhid: 'UHID-1102', provider: 'PMJAY', policyNo: 'PM-2024-5555', claimAmount: '₹3,50,000', approvedAmount: '₹3,50,000', type: 'IPD', status: 'approved', submittedDate: '2025-02-28', settledDate: '' },
];

export default function AdminClaims() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = CLAIMS.filter(c =>
    (search === '' || c.patient.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === 'all' || c.status === statusFilter)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Insurance Claims</h1>
        <p className="text-sm text-muted-foreground">Track and manage insurance claims across all providers</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Claims', value: CLAIMS.length, icon: FileText, color: 'text-primary' },
          { label: 'Pending', value: CLAIMS.filter(c => c.status === 'pending').length, icon: Clock, color: 'text-amber-500' },
          { label: 'Submitted', value: CLAIMS.filter(c => c.status === 'submitted').length, icon: FileText, color: 'text-blue-500' },
          { label: 'Approved', value: CLAIMS.filter(c => c.status === 'approved' || c.status === 'settled').length, icon: CheckCircle, color: 'text-emerald-500' },
          { label: 'Rejected', value: CLAIMS.filter(c => c.status === 'rejected').length, icon: XCircle, color: 'text-destructive' },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-4 flex items-center gap-3">
            <s.icon className={`h-5 w-5 ${s.color}`} />
            <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </CardContent></Card>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search claims..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {['pending', 'submitted', 'approved', 'settled', 'rejected'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                <th className="p-3 font-medium">Claim ID</th>
                <th className="p-3 font-medium">Patient</th>
                <th className="p-3 font-medium">Provider</th>
                <th className="p-3 font-medium">Type</th>
                <th className="p-3 font-medium">Claim Amount</th>
                <th className="p-3 font-medium">Approved</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{c.id}</td>
                  <td className="p-3"><div className="font-medium">{c.patient}</div><div className="text-xs text-muted-foreground">{c.uhid}</div></td>
                  <td className="p-3">{c.provider}</td>
                  <td className="p-3"><Badge variant="outline">{c.type}</Badge></td>
                  <td className="p-3 font-medium">{c.claimAmount}</td>
                  <td className="p-3">{c.approvedAmount || '—'}</td>
                  <td className="p-3">
                    <Badge variant={c.status === 'approved' || c.status === 'settled' ? 'default' : c.status === 'rejected' ? 'destructive' : 'secondary'}>
                      {c.status}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Button size="sm" variant="ghost">View</Button>
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
