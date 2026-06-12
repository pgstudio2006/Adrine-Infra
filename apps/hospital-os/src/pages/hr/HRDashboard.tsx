import { motion } from 'framer-motion';
import { isAdrine2026Experience } from '@/lib/adrine/experience';
import HRDashboard2026 from './HRDashboard2026';
import { useHrPlatform } from '@/hooks/useHrPlatform';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, Clock, CalendarCheck, AlertTriangle, TrendingUp, 
  UserPlus, FileText, ArrowRight
} from 'lucide-react';

const stats = [
  { label: 'Total Staff', value: '342', icon: Users, change: '+5 this month' },
  { label: 'On Duty Today', value: '218', icon: CalendarCheck, change: '64% workforce' },
  { label: 'On Leave', value: '18', icon: Clock, change: '5.3% absence rate' },
  { label: 'Expiring Licenses', value: '7', icon: AlertTriangle, change: 'Next 30 days', accent: true },
];

const recentActivities = [
  { action: 'New Staff Joined', detail: 'Dr. Ananya Mishra — Cardiology', time: '2 hours ago' },
  { action: 'Leave Approved', detail: 'Nurse Priya Shah — CL (3 days)', time: '3 hours ago' },
  { action: 'Shift Swap', detail: 'Amit Patel ↔ Rekha Desai — Night Shift', time: '5 hours ago' },
  { action: 'License Expiring', detail: 'Dr. Rajesh Kumar — MCI Registration (15 days)', time: 'Alert' },
  { action: 'Training Completed', detail: 'BLS Certification — 12 nurses', time: 'Yesterday' },
];

const departmentStaffing = [
  { dept: 'OPD', total: 45, present: 38, gap: 0 },
  { dept: 'Emergency', total: 32, present: 28, gap: 2 },
  { dept: 'ICU', total: 28, present: 24, gap: 1 },
  { dept: 'OT', total: 20, present: 18, gap: 0 },
  { dept: 'Laboratory', total: 15, present: 14, gap: 0 },
  { dept: 'Radiology', total: 12, present: 10, gap: 1 },
  { dept: 'Pharmacy', total: 18, present: 16, gap: 0 },
  { dept: 'Nursing', total: 85, present: 72, gap: 3 },
];

const pendingActions = [
  { type: 'Leave Requests', count: 6 },
  { type: 'Credential Renewals', count: 7 },
  { type: 'Shift Approvals', count: 4 },
  { type: 'Performance Reviews', count: 12 },
];

export default function HRDashboard() {
  if (isAdrine2026Experience()) return <HRDashboard2026 />;
  const { platformOn, staff } = useHrPlatform();
  const totalStaff = platformOn && staff.length > 0 ? String(staff.length) : stats[0].value;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">HR & Staff Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Workforce overview and staff operations</p>
        </div>
        <Button className="gap-2"><UserPlus className="w-4 h-4" />Add Staff</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={`p-5 ${s.accent ? 'border-destructive/30 bg-destructive/5' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <s.icon className={`w-5 h-5 ${s.accent ? 'text-destructive' : 'text-muted-foreground'}`} />
                <span className="text-[11px] text-muted-foreground">{platformOn && i === 0 ? 'kernel HR' : s.change}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{i === 0 ? totalStaff : s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Department Staffing */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground mb-3">Department Staffing</h2>
          <Card className="p-4">
            <div className="space-y-3">
              {departmentStaffing.map(d => (
                <div key={d.dept} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-sm font-medium text-foreground w-24">{d.dept}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-foreground rounded-full" style={{ width: `${(d.present / d.total) * 100}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className="text-xs text-muted-foreground">{d.present}/{d.total}</span>
                    {d.gap > 0 && <Badge variant="destructive" className="text-[10px]">-{d.gap} gap</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pending Actions */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Pending Actions</h2>
            <div className="space-y-2">
              {pendingActions.map(a => (
                <Card key={a.type} className="p-3 flex items-center justify-between cursor-pointer hover:shadow-sm transition-shadow">
                  <span className="text-sm text-foreground">{a.type}</span>
                  <Badge variant="secondary" className="text-xs">{a.count}</Badge>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Recent Activity</h2>
            <div className="space-y-2">
              {recentActivities.map((a, i) => (
                <Card key={i} className="p-3">
                  <p className="text-xs font-medium text-foreground">{a.action}</p>
                  <p className="text-[11px] text-muted-foreground">{a.detail}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{a.time}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}