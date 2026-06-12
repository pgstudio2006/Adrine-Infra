import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Building2, Plus, Users, UserCheck } from 'lucide-react';

const DEPARTMENTS = [
  { id: 'D001', name: 'Cardiology', head: 'Dr. Rajesh Mehta', doctors: 5, nurses: 8, staff: 3, status: 'active' },
  { id: 'D002', name: 'Pediatrics', head: 'Dr. Priya Sharma', doctors: 4, nurses: 6, staff: 2, status: 'active' },
  { id: 'D003', name: 'Orthopedics', head: 'Dr. Anil Kumar', doctors: 3, nurses: 5, staff: 2, status: 'active' },
  { id: 'D004', name: 'General Medicine', head: 'Dr. Sunita Patel', doctors: 6, nurses: 10, staff: 4, status: 'active' },
  { id: 'D005', name: 'General Surgery', head: 'Dr. Vikram Rathod', doctors: 4, nurses: 7, staff: 3, status: 'active' },
  { id: 'D006', name: 'Radiology', head: 'Dr. Vikram Singh', doctors: 2, nurses: 1, staff: 4, status: 'active' },
  { id: 'D007', name: 'Laboratory', head: 'Dr. Nisha Jain', doctors: 1, nurses: 0, staff: 6, status: 'active' },
  { id: 'D008', name: 'Pharmacy', head: 'Suresh Kumar', doctors: 0, nurses: 0, staff: 5, status: 'active' },
  { id: 'D009', name: 'ICU', head: 'Dr. Meera Desai', doctors: 3, nurses: 12, staff: 4, status: 'active' },
  { id: 'D010', name: 'Emergency', head: 'Dr. Kiran Shah', doctors: 4, nurses: 8, staff: 3, status: 'active' },
];

export default function AdminDepartments() {
  const totalStaff = DEPARTMENTS.reduce((s, d) => s + d.doctors + d.nurses + d.staff, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Department Management</h1>
          <p className="text-sm text-muted-foreground">Manage hospital departments and staff allocation</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Add Department</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Department</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Department Name</Label><Input placeholder="e.g. Neurology" /></div>
              <div><Label>Department Head</Label><Input placeholder="Select doctor" /></div>
              <div><Label>Description</Label><Input placeholder="Brief description" /></div>
              <Button className="w-full">Create Department</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Building2 className="h-5 w-5 text-primary" />
          <div><p className="text-2xl font-bold">{DEPARTMENTS.length}</p><p className="text-xs text-muted-foreground">Departments</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Users className="h-5 w-5 text-blue-500" />
          <div><p className="text-2xl font-bold">{totalStaff}</p><p className="text-xs text-muted-foreground">Total Staff</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <UserCheck className="h-5 w-5 text-emerald-500" />
          <div><p className="text-2xl font-bold">{DEPARTMENTS.reduce((s, d) => s + d.doctors, 0)}</p><p className="text-xs text-muted-foreground">Doctors</p></div>
        </CardContent></Card>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEPARTMENTS.map(d => (
          <Card key={d.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{d.name}</CardTitle>
                <Badge variant="default">{d.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Head: {d.head}</p>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 text-sm">
                <div><span className="font-bold">{d.doctors}</span> <span className="text-muted-foreground">Doctors</span></div>
                <div><span className="font-bold">{d.nurses}</span> <span className="text-muted-foreground">Nurses</span></div>
                <div><span className="font-bold">{d.staff}</span> <span className="text-muted-foreground">Staff</span></div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" className="flex-1">Edit</Button>
                <Button size="sm" variant="ghost">Manage Staff</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
