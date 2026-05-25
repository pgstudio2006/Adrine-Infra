import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Clock, Users, Plus, Sun, Moon, Sunset } from 'lucide-react';

const SHIFT_ICONS: Record<string, React.ElementType> = { Morning: Sun, Evening: Sunset, Night: Moon };
const SHIFT_TIMES: Record<string, string> = { Morning: '7:00 AM – 2:00 PM', Evening: '2:00 PM – 9:00 PM', Night: '9:00 PM – 7:00 AM' };

const todaySchedule = [
  { shift: 'Morning', department: 'Emergency', staff: ['Dr. Sharma', 'Nurse Priya', 'Nurse Rekha', 'Tech. Amit'], coverage: 'Full' },
  { shift: 'Morning', department: 'ICU', staff: ['Dr. Patel', 'Nurse Geeta', 'Nurse Kavita'], coverage: 'Full' },
  { shift: 'Morning', department: 'OPD', staff: ['Dr. Mishra', 'Dr. Gupta', 'Sunita (Recep.)'], coverage: 'Full' },
  { shift: 'Evening', department: 'Emergency', staff: ['Dr. Desai', 'Nurse Fatima', 'Tech. Ravi'], coverage: '-1 Nurse' },
  { shift: 'Evening', department: 'ICU', staff: ['Dr. Nair', 'Nurse Deepa'], coverage: '-1 Nurse' },
  { shift: 'Night', department: 'Emergency', staff: ['Dr. Singh', 'Nurse Meera', 'Tech. Jayesh'], coverage: 'Full' },
  { shift: 'Night', department: 'ICU', staff: ['Dr. Kumar (On-Call)', 'Nurse Lata'], coverage: 'Minimal' },
];

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const onCallDoctors = [
  { name: 'Dr. Rajesh Kumar', specialty: 'Cardiology', phone: '+91 98765 43210' },
  { name: 'Dr. Vikram Singh', specialty: 'Orthopedics', phone: '+91 98765 43215' },
];

export default function HRScheduling() {
  const [shiftFilter, setShiftFilter] = useState('all');

  const filtered = shiftFilter === 'all' ? todaySchedule : todaySchedule.filter(s => s.shift === shiftFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Staff Scheduling</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage shifts, duty rosters, and on-call assignments</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" />Create Shift</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(SHIFT_TIMES).map(([shift, time]) => {
          const Icon = SHIFT_ICONS[shift];
          const count = todaySchedule.filter(s => s.shift === shift).flatMap(s => s.staff).length;
          return (
            <Card key={shift} className="p-4 cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setShiftFilter(shift)}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">{shift} Shift</span>
              </div>
              <p className="text-xs text-muted-foreground">{time}</p>
              <p className="text-lg font-bold text-foreground mt-1">{count} staff</p>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">Today's Schedule</TabsTrigger>
          <TabsTrigger value="oncall">On-Call</TabsTrigger>
          <TabsTrigger value="week">Weekly View</TabsTrigger>
        </TabsList>

        <div className="mt-2">
          <Select value={shiftFilter} onValueChange={setShiftFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Shifts" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shifts</SelectItem>
              <SelectItem value="Morning">Morning</SelectItem>
              <SelectItem value="Evening">Evening</SelectItem>
              <SelectItem value="Night">Night</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="today" className="mt-4 space-y-3">
          {filtered.map((s, i) => {
            const Icon = SHIFT_ICONS[s.shift];
            return (
              <Card key={i} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                      <Icon className="w-4 h-4 text-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{s.department}</span>
                        <Badge variant="outline" className="text-[10px]">{s.shift}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {s.staff.map(name => (
                          <Badge key={name} variant="secondary" className="text-[10px]">{name}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Badge variant={s.coverage === 'Full' ? 'default' : 'destructive'} className="text-[10px]">
                    {s.coverage}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="oncall" className="mt-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">On-Call Doctors Today</h3>
          {onCallDoctors.map(d => (
            <Card key={d.name} className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{d.name}</p>
                <p className="text-xs text-muted-foreground">{d.specialty} · {d.phone}</p>
              </div>
              <Badge variant="outline" className="text-[10px]">On-Call</Badge>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="week" className="mt-4">
          <Card className="p-4">
            <div className="grid grid-cols-7 gap-2 text-center">
              {weekDays.map(d => (
                <div key={d} className="space-y-2">
                  <p className="text-xs font-semibold text-foreground">{d}</p>
                  <div className="space-y-1">
                    {['M', 'E', 'N'].map(s => (
                      <div key={s} className="h-6 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                        {s}: {Math.floor(Math.random() * 5) + 8}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">M = Morning, E = Evening, N = Night (staff count)</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}