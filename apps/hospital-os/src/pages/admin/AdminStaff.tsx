import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Users, Plus, Search, UserCheck, UserX } from 'lucide-react';
import { useState } from 'react';

const STAFF = [
  { id: 'S001', name: 'Dr. Rajesh Mehta', role: 'doctor', department: 'Cardiology', email: 'rajesh@hospital.com', phone: '9876543210', license: 'MCI-12345', status: 'active' },
  { id: 'S002', name: 'Dr. Priya Sharma', role: 'doctor', department: 'Pediatrics', email: 'priya@hospital.com', phone: '9876543211', license: 'MCI-12346', status: 'active' },
  { id: 'S003', name: 'Nurse Anjali', role: 'nurse', department: 'ICU', email: 'anjali@hospital.com', phone: '9876543212', license: 'NMC-5678', status: 'active' },
  { id: 'S004', name: 'Ramesh Patel', role: 'lab_technician', department: 'Laboratory', email: 'ramesh@hospital.com', phone: '9876543213', license: 'LT-9012', status: 'active' },
  { id: 'S005', name: 'Suresh Kumar', role: 'pharmacist', department: 'Pharmacy', email: 'suresh@hospital.com', phone: '9876543214', license: 'PC-3456', status: 'inactive' },
  { id: 'S006', name: 'Meena Devi', role: 'receptionist', department: 'Front Desk', email: 'meena@hospital.com', phone: '9876543215', license: '', status: 'active' },
  { id: 'S007', name: 'Dr. Vikram Singh', role: 'radiologist', department: 'Radiology', email: 'vikram@hospital.com', phone: '9876543216', license: 'MCI-12347', status: 'active' },
  { id: 'S008', name: 'Kavita Joshi', role: 'billing', department: 'Finance', email: 'kavita@hospital.com', phone: '9876543217', license: '', status: 'active' },
];

const ROLE_LABELS: Record<string, string> = {
  doctor: 'Doctor', nurse: 'Nurse', receptionist: 'Receptionist', lab_technician: 'Lab Tech',
  pharmacist: 'Pharmacist', billing: 'Billing', radiologist: 'Radiologist', admin: 'Admin',
};

export default function AdminStaff() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = STAFF.filter(s =>
    (search === '' || s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase())) &&
    (roleFilter === 'all' || s.role === roleFilter) &&
    (statusFilter === 'all' || s.status === statusFilter)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-sm text-muted-foreground">Manage all hospital users and staff accounts</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Add Staff</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Register New Staff</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Full Name</Label><Input placeholder="Enter name" /></div>
                <div><Label>Email</Label><Input type="email" placeholder="email@hospital.com" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Phone</Label><Input placeholder="Phone number" /></div>
                <div><Label>License No.</Label><Input placeholder="Optional" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Role</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Department</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select dept" /></SelectTrigger>
                    <SelectContent>
                      {['Cardiology', 'Pediatrics', 'ICU', 'Laboratory', 'Pharmacy', 'Radiology', 'Finance', 'Front Desk'].map(d =>
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full">Create Account</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Users className="h-5 w-5 text-primary" />
          <div><p className="text-2xl font-bold">{STAFF.length}</p><p className="text-xs text-muted-foreground">Total Staff</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <UserCheck className="h-5 w-5 text-emerald-500" />
          <div><p className="text-2xl font-bold">{STAFF.filter(s => s.status === 'active').length}</p><p className="text-xs text-muted-foreground">Active</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <UserX className="h-5 w-5 text-destructive" />
          <div><p className="text-2xl font-bold">{STAFF.filter(s => s.status === 'inactive').length}</p><p className="text-xs text-muted-foreground">Inactive</p></div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {Object.entries(ROLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                  <th className="p-3 font-medium">ID</th>
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium">Role</th>
                  <th className="p-3 font-medium">Department</th>
                  <th className="p-3 font-medium">Email</th>
                  <th className="p-3 font-medium">Phone</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs">{s.id}</td>
                    <td className="p-3 font-medium">{s.name}</td>
                    <td className="p-3"><Badge variant="outline">{ROLE_LABELS[s.role]}</Badge></td>
                    <td className="p-3 text-muted-foreground">{s.department}</td>
                    <td className="p-3 text-muted-foreground">{s.email}</td>
                    <td className="p-3 text-muted-foreground">{s.phone}</td>
                    <td className="p-3">
                      <Badge variant={s.status === 'active' ? 'default' : 'secondary'}>{s.status}</Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost">Edit</Button>
                        <Button size="sm" variant="ghost" className="text-destructive">
                          {s.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
