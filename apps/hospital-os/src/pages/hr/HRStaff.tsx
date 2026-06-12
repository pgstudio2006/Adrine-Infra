import { useMemo, useState } from 'react';
import { useHrPlatform } from '@/hooks/useHrPlatform';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, UserPlus, Mail, Phone, LayoutGrid, List, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { PlatformConnectivityStrip } from '@/components/PlatformConnectivityStrip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  departmentsForStaffRole,
  STAFF_REGISTER_ROLES,
} from '@/lib/hr/staff-role-departments';
import { toast } from 'sonner';
import { isNavayuTenant } from '@/lib/navayu/navayu-forms';

const staffMembers = [
  { id: 'STF-001', name: 'Dr. Rajesh Kumar', role: 'Doctor', department: 'Cardiology', designation: 'Senior Consultant', status: 'Active', joining: '2019-03-15', email: 'rajesh.k@hospital.com', phone: '+91 98765 43210' },
  { id: 'STF-002', name: 'Dr. Ananya Mishra', role: 'Doctor', department: 'Cardiology', designation: 'Consultant', status: 'Active', joining: '2024-01-10', email: 'ananya.m@hospital.com', phone: '+91 98765 43211' },
  { id: 'STF-003', name: 'Nurse Priya Shah', role: 'Nurse', department: 'ICU', designation: 'Head Nurse', status: 'Active', joining: '2018-06-01', email: 'priya.s@hospital.com', phone: '+91 98765 43212' },
  { id: 'STF-004', name: 'Amit Patel', role: 'Lab Technician', department: 'Pathology', designation: 'Senior Technician', status: 'Active', joining: '2020-09-20', email: 'amit.p@hospital.com', phone: '+91 98765 43213' },
  { id: 'STF-005', name: 'Rekha Desai', role: 'Nurse', department: 'Emergency', designation: 'Staff Nurse', status: 'On Leave', joining: '2021-04-12', email: 'rekha.d@hospital.com', phone: '+91 98765 43214' },
  { id: 'STF-006', name: 'Dr. Vikram Singh', role: 'Doctor', department: 'Orthopedics', designation: 'HOD', status: 'Active', joining: '2015-01-05', email: 'vikram.s@hospital.com', phone: '+91 98765 43215' },
  { id: 'STF-007', name: 'Sunita Verma', role: 'Receptionist', department: 'Front Desk', designation: 'Senior Executive', status: 'Active', joining: '2022-07-18', email: 'sunita.v@hospital.com', phone: '+91 98765 43216' },
  { id: 'STF-008', name: 'Mohammed Irfan', role: 'Pharmacist', department: 'Pharmacy', designation: 'Chief Pharmacist', status: 'Active', joining: '2017-11-25', email: 'irfan.m@hospital.com', phone: '+91 98765 43217' },
];

const STATUS_STYLE: Record<string, string> = {
  Active: 'bg-success/10 text-success',
  'On Leave': 'bg-warning/10 text-warning',
  Inactive: 'bg-muted text-muted-foreground',
};

type StaffRow = (typeof staffMembers)[number];

export default function HRStaff() {
  const navayuMode = isNavayuTenant();
  const { platformOn, loading, error, staff: platformStaff, departments } = useHrPlatform();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [registerOpen, setRegisterOpen] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [newDepartment, setNewDepartment] = useState('');

  const departmentChoices = newRole ? departmentsForStaffRole(newRole) : [];

  const roster = useMemo((): StaffRow[] => {
    if (platformOn && platformStaff.length > 0) {
      return platformStaff.map((s) => {
        const assignment = s.assignments[0];
        const dept =
          assignment?.departmentCode ??
          assignment?.roleTemplate?.label ??
          s.role;
        return {
          id: s.id,
          name: s.fullName,
          role: assignment?.roleTemplate?.label ?? s.role,
          department: dept,
          designation: assignment?.roleTemplate?.label ?? s.role,
          status: 'Active',
          joining: new Date(s.createdAt).toISOString().slice(0, 10),
          email: s.email,
          phone: '—',
        };
      });
    }
    return staffMembers;
  }, [platformOn, platformStaff]);

  const departmentOptions = useMemo(() => {
    const fromApi = departments.map((d) => d.name ?? d.code).filter(Boolean);
    const fromRoster = [...new Set(roster.map((s) => s.department))];
    return [...new Set([...fromApi, ...fromRoster])].sort();
  }, [departments, roster]);

  const roles = [...new Set(roster.map((s) => s.role))].sort();

  const filtered = roster
    .filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.id.includes(search)) {
        return false;
      }
      if (deptFilter !== 'all' && s.department !== deptFilter) return false;
      if (roleFilter !== 'all' && s.role !== roleFilter) return false;
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Staff Profiles</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kernel <span className="font-mono text-xs">GET /hr/staff</span> roster with department filters
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as 'cards' | 'table')}>
            <TabsList>
              <TabsTrigger value="cards" className="gap-1.5 text-xs">
                <LayoutGrid className="h-3.5 w-3.5" />
                Cards
              </TabsTrigger>
              <TabsTrigger value="table" className="gap-1.5 text-xs">
                <List className="h-3.5 w-3.5" />
                Table
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {navayuMode && (
          <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="w-4 h-4" />
                Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register New Staff</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Full Name</Label>
                    <Input placeholder="Enter name" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" placeholder="email@hospital.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Phone</Label>
                    <Input placeholder="Phone number" />
                  </div>
                  <div>
                    <Label>License No.</Label>
                    <Input placeholder="Optional" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Role</Label>
                    <Select
                      value={newRole}
                      onValueChange={(value) => {
                        setNewRole(value);
                        setNewDepartment('');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STAFF_REGISTER_ROLES).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Department</Label>
                    <Select
                      value={newDepartment}
                      onValueChange={setNewDepartment}
                      disabled={!newRole}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={newRole ? 'Select department' : 'Select role first'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentChoices.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  className="w-full"
                  disabled={!newRole || !newDepartment}
                  onClick={() => {
                    toast.success('Staff account created (demo)');
                    setRegisterOpen(false);
                    setNewRole('');
                    setNewDepartment('');
                  }}
                >
                  Create Account
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      {platformOn && (
        <PlatformConnectivityStrip
          label="HR staff"
          detail={
            loading
              ? 'Loading kernel /hr/staff…'
              : `${roster.length} staff · ${departmentOptions.length} department(s)`
          }
          error={error}
        />
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or ID..."
            className="pl-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departmentOptions.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="text-xs">
          {filtered.length} shown
        </Badge>
      </div>

      {loading && platformOn && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading staff roster…
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <Card className="p-8 text-center text-sm text-muted-foreground">No staff match your filters.</Card>
      )}

      {view === 'table' && !loading && filtered.length > 0 && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.id}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.role}</TableCell>
                  <TableCell>{s.department}</TableCell>
                  <TableCell className="text-xs">{s.email}</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] ${STATUS_STYLE[s.status] || ''}`}>{s.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.joining}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {view === 'cards' && !loading && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-2 border-l-primary/30">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {s.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <Badge className={`text-[10px] ${STATUS_STYLE[s.status] || ''}`}>{s.status}</Badge>
                </div>
                <h3 className="font-medium text-sm text-foreground">{s.name}</h3>
                <p className="text-xs text-muted-foreground">{s.designation}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">
                    {s.role}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    {s.department}
                  </Badge>
                </div>
                <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
                  <p className="flex items-center gap-1">
                    <Mail className="w-3 h-3 shrink-0" />
                    {s.email}
                  </p>
                  <p className="flex items-center gap-1">
                    <Phone className="w-3 h-3 shrink-0" />
                    {s.phone}
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 font-mono">
                  {s.id} · joined {s.joining}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
