import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Phone, Mail, Building2, Download, Users } from 'lucide-react';
import { useState } from 'react';

const contacts = [
  { id: 1, name: 'Dr. Rajesh Sharma', role: 'Senior Cardiologist', department: 'Cardiology', phone: '+91 98765 43210', extension: '1201', email: 'r.sharma@hospital.in', status: 'Available' },
  { id: 2, name: 'Dr. Priya Kumar', role: 'HOD Orthopedics', department: 'Orthopedics', phone: '+91 98765 43211', extension: '1302', email: 'p.kumar@hospital.in', status: 'In Surgery' },
  { id: 3, name: 'Nurse Lakshmi R.', role: 'Head Nurse', department: 'ICU', phone: '+91 98765 43212', extension: '2101', email: 'l.r@hospital.in', status: 'Available' },
  { id: 4, name: 'Mr. Suresh Patel', role: 'Lab In-Charge', department: 'Laboratory', phone: '+91 98765 43213', extension: '3001', email: 's.patel@hospital.in', status: 'Available' },
  { id: 5, name: 'Ms. Anita Desai', role: 'Pharmacy Head', department: 'Pharmacy', phone: '+91 98765 43214', extension: '3101', email: 'a.desai@hospital.in', status: 'On Leave' },
  { id: 6, name: 'Mr. Ramesh K.', role: 'Front Desk Manager', department: 'Reception', phone: '+91 98765 43215', extension: '1001', email: 'r.k@hospital.in', status: 'Available' },
  { id: 7, name: 'Dr. Sunita Mishra', role: 'Gynecologist', department: 'Gynecology', phone: '+91 98765 43216', extension: '1401', email: 's.mishra@hospital.in', status: 'In Consultation' },
  { id: 8, name: 'Mr. Vikram Singh', role: 'IT Administrator', department: 'IT', phone: '+91 98765 43217', extension: '5001', email: 'v.singh@hospital.in', status: 'Available' },
  { id: 9, name: 'Emergency Room', role: 'Department', department: 'Emergency', phone: '+91 98765 43218', extension: '1111', email: 'er@hospital.in', status: 'Available' },
  { id: 10, name: 'Blood Bank', role: 'Department', department: 'Blood Bank', phone: '+91 98765 43219', extension: '4001', email: 'bloodbank@hospital.in', status: 'Available' },
  { id: 11, name: 'Ambulance Control', role: 'Service', department: 'Emergency', phone: '108', extension: '1112', email: 'ambulance@hospital.in', status: 'Available' },
  { id: 12, name: 'Mr. Kamal Nath', role: 'Finance Manager', department: 'Finance', phone: '+91 98765 43220', extension: '6001', email: 'k.nath@hospital.in', status: 'Available' },
];

const departments = ['All', 'Cardiology', 'Orthopedics', 'ICU', 'Laboratory', 'Pharmacy', 'Reception', 'Gynecology', 'IT', 'Emergency', 'Blood Bank', 'Finance'];

export default function AdminPhonebook() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  const filtered = contacts.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.department.toLowerCase().includes(search.toLowerCase()) || c.extension.includes(search);
    const matchDept = deptFilter === 'All' || c.department === deptFilter;
    return matchSearch && matchDept;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Central Phone Book</h1>
          <p className="text-sm text-muted-foreground mt-1">Hospital-wide contact directory for all staff and departments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 text-sm"><Download className="w-4 h-4" />Export</Button>
          <Button className="gap-2 text-sm"><Plus className="w-4 h-4" />Add Contact</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Contacts', value: contacts.length.toString(), icon: Users },
          { label: 'Departments', value: '12', icon: Building2 },
          { label: 'Available Now', value: contacts.filter(c => c.status === 'Available').length.toString(), icon: Phone },
          { label: 'On Leave', value: contacts.filter(c => c.status === 'On Leave').length.toString(), icon: Mail },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <s.icon className="w-4 h-4 text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, department, or extension..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Ext.</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.role}</TableCell>
                <TableCell>{c.department}</TableCell>
                <TableCell className="font-mono text-sm">{c.phone}</TableCell>
                <TableCell className="font-mono text-sm font-bold">{c.extension}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.email}</TableCell>
                <TableCell>
                  <Badge variant={c.status === 'Available' ? 'default' : c.status === 'On Leave' ? 'secondary' : 'outline'} className="text-xs">
                    {c.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
