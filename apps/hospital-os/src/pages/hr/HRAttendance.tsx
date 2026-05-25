import { useState } from 'react';
import { PreviewWireBanner } from '@/components/PreviewWireBanner';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

const attendanceData = [
  { id: 'STF-001', name: 'Dr. Rajesh Kumar', dept: 'Cardiology', date: '2024-03-08', checkIn: '8:02 AM', checkOut: '4:15 PM', status: 'Present', hours: '8h 13m' },
  { id: 'STF-002', name: 'Dr. Ananya Mishra', dept: 'Cardiology', date: '2024-03-08', checkIn: '7:55 AM', checkOut: '—', status: 'Present', hours: '—' },
  { id: 'STF-003', name: 'Nurse Priya Shah', dept: 'ICU', date: '2024-03-08', checkIn: '6:58 AM', checkOut: '2:10 PM', status: 'Present', hours: '7h 12m' },
  { id: 'STF-004', name: 'Amit Patel', dept: 'Pathology', date: '2024-03-08', checkIn: '8:30 AM', checkOut: '—', status: 'Late', hours: '—' },
  { id: 'STF-005', name: 'Rekha Desai', dept: 'Emergency', date: '2024-03-08', checkIn: '—', checkOut: '—', status: 'On Leave', hours: '—' },
  { id: 'STF-006', name: 'Dr. Vikram Singh', dept: 'Orthopedics', date: '2024-03-08', checkIn: '7:45 AM', checkOut: '3:50 PM', status: 'Present', hours: '8h 05m' },
  { id: 'STF-007', name: 'Sunita Verma', dept: 'Front Desk', date: '2024-03-08', checkIn: '—', checkOut: '—', status: 'Absent', hours: '—' },
  { id: 'STF-008', name: 'Mohammed Irfan', dept: 'Pharmacy', date: '2024-03-08', checkIn: '8:00 AM', checkOut: '—', status: 'Present', hours: '—' },
];

const STATUS_STYLE: Record<string, string> = {
  Present: 'bg-success/10 text-success',
  Late: 'bg-warning/10 text-warning',
  Absent: 'bg-destructive/10 text-destructive',
  'On Leave': 'bg-info/10 text-info',
};

export default function HRAttendance() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = attendanceData.filter(a => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.id.includes(search)) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  const present = attendanceData.filter(a => a.status === 'Present').length;
  const late = attendanceData.filter(a => a.status === 'Late').length;
  const absent = attendanceData.filter(a => a.status === 'Absent').length;
  const onLeave = attendanceData.filter(a => a.status === 'On Leave').length;

  return (
    <div className="space-y-6">
      <PreviewWireBanner
        title="Attendance (preview)"
        description="Shift check-in/out will connect to kernel HR attendance APIs. Until then, use Staff Profiles for live roster data and export this view for operational drills."
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Attendance</h1>
          <p className="text-sm text-muted-foreground mt-1">Daily staff attendance — demo dataset for shift planning</p>
        </div>
        <Button variant="outline" className="gap-2 text-sm"><Download className="w-4 h-4" />Export</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-4"><div className="flex items-center gap-2 mb-1"><CheckCircle className="w-4 h-4 text-success" /><span className="text-xs text-muted-foreground">Present</span></div><p className="text-xl font-bold text-foreground">{present}</p></Card>
        <Card className="p-4"><div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-warning" /><span className="text-xs text-muted-foreground">Late</span></div><p className="text-xl font-bold text-foreground">{late}</p></Card>
        <Card className="p-4"><div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-destructive" /><span className="text-xs text-muted-foreground">Absent</span></div><p className="text-xl font-bold text-foreground">{absent}</p></Card>
        <Card className="p-4"><div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-info" /><span className="text-xs text-muted-foreground">On Leave</span></div><p className="text-xl font-bold text-foreground">{onLeave}</p></Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search staff..." className="pl-9 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Present">Present</SelectItem>
            <SelectItem value="Late">Late</SelectItem>
            <SelectItem value="Absent">Absent</SelectItem>
            <SelectItem value="On Leave">On Leave</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Staff ID</TableHead>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Department</TableHead>
              <TableHead className="text-xs">Check-In</TableHead>
              <TableHead className="text-xs">Check-Out</TableHead>
              <TableHead className="text-xs">Hours</TableHead>
              <TableHead className="text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-mono text-xs">{a.id}</TableCell>
                <TableCell className="text-sm font-medium">{a.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{a.dept}</TableCell>
                <TableCell className="text-xs">{a.checkIn}</TableCell>
                <TableCell className="text-xs">{a.checkOut}</TableCell>
                <TableCell className="text-xs font-mono">{a.hours}</TableCell>
                <TableCell><Badge className={`text-[10px] ${STATUS_STYLE[a.status]}`}>{a.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}