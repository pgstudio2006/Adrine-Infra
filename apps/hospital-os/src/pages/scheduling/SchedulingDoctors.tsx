import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Clock, Calendar, Ban, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const doctorSchedules = [
  { id: 'DOC-001', name: 'Dr. Rajesh Kumar', dept: 'Cardiology', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], hours: '9:00 AM – 4:00 PM', slotDuration: 15, breakTime: '12:00 – 1:00 PM', totalSlots: 24, bookedToday: 18, status: 'Available' },
  { id: 'DOC-002', name: 'Dr. Ananya Mishra', dept: 'Cardiology', days: ['Mon', 'Tue', 'Thu', 'Sat'], hours: '9:00 AM – 2:00 PM', slotDuration: 20, breakTime: '11:30 – 12:00 PM', totalSlots: 14, bookedToday: 10, status: 'Available' },
  { id: 'DOC-003', name: 'Dr. Vikram Singh', dept: 'Orthopedics', days: ['Mon', 'Wed', 'Fri'], hours: '10:00 AM – 4:00 PM', slotDuration: 20, breakTime: '1:00 – 2:00 PM', totalSlots: 15, bookedToday: 12, status: 'Available' },
  { id: 'DOC-004', name: 'Dr. Sharma', dept: 'General Medicine', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], hours: '8:30 AM – 5:00 PM', slotDuration: 15, breakTime: '12:30 – 1:30 PM', totalSlots: 30, bookedToday: 22, status: 'Available' },
  { id: 'DOC-005', name: 'Dr. Gupta', dept: 'ENT', days: ['Tue', 'Thu', 'Sat'], hours: '10:00 AM – 2:00 PM', slotDuration: 20, breakTime: 'None', totalSlots: 12, bookedToday: 6, status: 'On Leave' },
  { id: 'DOC-006', name: 'Dr. Patel', dept: 'Dermatology', days: ['Mon', 'Wed', 'Fri'], hours: '9:00 AM – 1:00 PM', slotDuration: 15, breakTime: 'None', totalSlots: 16, bookedToday: 8, status: 'Available' },
];

export default function SchedulingDoctors() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  const departments = [...new Set(doctorSchedules.map(d => d.dept))];
  const filtered = doctorSchedules.filter(d => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (deptFilter !== 'all' && d.dept !== deptFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Doctor Availability</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage doctor schedules, slots, and availability</p>
        </div>
        <Button className="gap-2"><Calendar className="w-4 h-4" />Configure Slots</Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search doctors..." className="pl-9 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Departments" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Doctor Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((d, i) => (
          <motion.div key={d.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card className="p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{d.name}</p>
                    <Badge variant={d.status === 'Available' ? 'default' : 'destructive'} className="text-[10px]">{d.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{d.dept} · {d.id}</p>
                </div>
                <Button variant="outline" size="sm" className="text-xs">
                  <Ban className="w-3 h-3 mr-1" />Block Slots
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground mb-1">Working Days</p>
                  <div className="flex flex-wrap gap-1">
                    {d.days.map(day => <Badge key={day} variant="secondary" className="text-[10px]">{day}</Badge>)}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Hours</p>
                  <p className="text-foreground font-medium flex items-center gap-1"><Clock className="w-3 h-3" />{d.hours}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Slot Duration</p>
                  <p className="text-foreground font-medium">{d.slotDuration} min</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Break</p>
                  <p className="text-foreground font-medium">{d.breakTime}</p>
                </div>
              </div>

              {/* Slot Utilization */}
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Today's slots</span>
                  <span className="font-medium text-foreground">{d.bookedToday}/{d.totalSlots}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-foreground rounded-full" style={{ width: `${(d.bookedToday / d.totalSlots) * 100}%` }} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}