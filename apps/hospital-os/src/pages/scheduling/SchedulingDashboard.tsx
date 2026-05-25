import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CalendarCheck, Clock, Users, AlertTriangle, TrendingUp, 
  Plus, UserX, Monitor, ArrowRight
} from 'lucide-react';

const stats = [
  { label: "Today's Appointments", value: '86', icon: CalendarCheck, change: '12 remaining' },
  { label: 'Avg Wait Time', value: '14m', icon: Clock, change: '↓ 3m vs yesterday' },
  { label: 'No-Shows Today', value: '4', icon: UserX, change: '4.7% rate', accent: true },
  { label: 'Teleconsults', value: '8', icon: Monitor, change: '3 in progress' },
];

const upcomingSlots = [
  { time: '11:00 AM', doctor: 'Dr. Rajesh Kumar', dept: 'Cardiology', patient: 'Amit Shah', type: 'OPD', status: 'Checked-In' },
  { time: '11:00 AM', doctor: 'Dr. Ananya Mishra', dept: 'Cardiology', patient: 'Priya Patel', type: 'Follow-up', status: 'Confirmed' },
  { time: '11:15 AM', doctor: 'Dr. Vikram Singh', dept: 'Orthopedics', patient: 'Rajesh Tiwari', type: 'OPD', status: 'Scheduled' },
  { time: '11:30 AM', doctor: 'Dr. Sharma', dept: 'General Medicine', patient: 'Fatima Begum', type: 'Teleconsult', status: 'Confirmed' },
  { time: '11:30 AM', doctor: 'Dr. Gupta', dept: 'ENT', patient: '— (Open Slot)', type: 'OPD', status: 'Available' },
  { time: '11:45 AM', doctor: 'Dr. Patel', dept: 'Dermatology', patient: 'Sunita Verma', type: 'OPD', status: 'Confirmed' },
];

const deptLoad = [
  { dept: 'Cardiology', booked: 18, capacity: 20, pct: 90 },
  { dept: 'Orthopedics', booked: 12, capacity: 15, pct: 80 },
  { dept: 'General Medicine', booked: 22, capacity: 25, pct: 88 },
  { dept: 'ENT', booked: 6, capacity: 10, pct: 60 },
  { dept: 'Dermatology', booked: 8, capacity: 10, pct: 80 },
  { dept: 'Pediatrics', booked: 14, capacity: 18, pct: 78 },
];

const STATUS_STYLE: Record<string, string> = {
  'Checked-In': 'bg-success/10 text-success',
  'Confirmed': 'bg-info/10 text-info',
  'Scheduled': 'bg-muted text-muted-foreground',
  'Available': 'bg-warning/10 text-warning',
  'In Consultation': 'bg-foreground/10 text-foreground',
};

export default function SchedulingDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Appointment Scheduling</h1>
          <p className="text-sm text-muted-foreground mt-1">Global scheduling engine & resource coordination</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" />Book Appointment</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={`p-5 ${s.accent ? 'border-destructive/30 bg-destructive/5' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <s.icon className={`w-5 h-5 ${s.accent ? 'text-destructive' : 'text-muted-foreground'}`} />
                <span className="text-[11px] text-muted-foreground">{s.change}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Upcoming Slots</h2>
            <Button variant="ghost" size="sm" className="text-xs">View All <ArrowRight className="w-3 h-3 ml-1" /></Button>
          </div>
          {upcomingSlots.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="p-3 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-14 text-center">
                      <p className="text-xs font-bold text-foreground">{s.time}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.patient}</p>
                      <p className="text-xs text-muted-foreground">{s.doctor} · {s.dept}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{s.type}</Badge>
                    <Badge className={`text-[10px] ${STATUS_STYLE[s.status] || ''}`}>{s.status}</Badge>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Department Load */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Department Load</h2>
          <Card className="p-4 space-y-3">
            {deptLoad.map(d => (
              <div key={d.dept}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-foreground font-medium">{d.dept}</span>
                  <span className="text-muted-foreground">{d.booked}/{d.capacity}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${d.pct >= 90 ? 'bg-destructive' : d.pct >= 75 ? 'bg-warning' : 'bg-foreground'}`}
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </Card>

          {/* Quick Actions */}
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h2>
            <div className="space-y-2">
              {['Book New Appointment', 'Reschedule Slot', 'Block Doctor Slots', 'View Waitlist'].map(a => (
                <Button key={a} variant="outline" size="sm" className="w-full justify-start text-xs">{a}</Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}