import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { WorkspacePage, MetricStrip, WorkflowPanel } from '@/components/shell/workspace-primitives';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Activity,
  ArrowRight,
  BedDouble,
  CalendarDays,
  FlaskConical,
  IndianRupee,
  Stethoscope,
  Users,
} from 'lucide-react';

const ROLE_HUB: Record<string, { path: string; label: string }> = {
  admin: { path: '/admin', label: 'Admin command' },
  doctor: { path: '/doctor', label: 'Doctor workspace' },
  jr_doctor: { path: '/doctor', label: 'Doctor workspace' },
  receptionist: { path: '/reception', label: 'Reception desk' },
  lab_technician: { path: '/lab', label: 'Laboratory' },
  nurse: { path: '/nurse', label: 'Nursing station' },
  pharmacist: { path: '/pharmacy', label: 'Pharmacy' },
  billing: { path: '/billing', label: 'Billing' },
};

const QUICK_MODULES = [
  { label: 'LIS analysers', path: '/lab/analyzers', icon: FlaskConical },
  { label: 'Blood bank', path: '/blood-bank', icon: Activity },
  { label: 'Geo intelligence', path: '/admin/geo-intelligence', icon: Users },
];

export default function DashboardPage2026() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role ?? 'admin';
  const hub = ROLE_HUB[role] ?? ROLE_HUB.admin;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <WorkspacePage
      title={`${greeting}, ${user?.name?.split(' ')[0] ?? 'there'}`}
      subtitle={new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}
      actions={
        <Button size="sm" onClick={() => navigate(hub.path)}>
          Open {hub.label}
        </Button>
      }
    >
      <MetricStrip
        metrics={[
          { id: 'opd', label: "Today's OPD", value: 184, hint: '8 in queue', icon: Stethoscope },
          { id: 'beds', label: 'Bed occupancy', value: '78%', hint: '156 / 200', icon: BedDouble },
          { id: 'appt', label: 'Appointments', value: 94, hint: '12 pending check-in', icon: CalendarDays },
          { id: 'rev', label: 'Revenue today', value: '₹4.2L', hint: '+18% vs avg', icon: IndianRupee, trend: { value: '+18%', positive: true } },
        ]}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <WorkflowPanel title="Hospital pulse" className="lg:col-span-2">
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span>ICU bed pressure</span><span className="text-amber-600 font-medium">High</span></li>
            <li className="flex justify-between"><span>Lab TAT breaches</span><span className="text-rose-600 font-medium">3</span></li>
            <li className="flex justify-between"><span>Pending discharges</span><span>7</span></li>
            <li className="flex justify-between"><span>Insurance pre-auth queue</span><span>12</span></li>
            <li className="flex justify-between"><span>Emergency active cases</span><span>4</span></li>
          </ul>
        </WorkflowPanel>

        <WorkflowPanel title="Your workspace">
          <p className="text-sm text-muted-foreground mb-3">
            Role-optimized command center for {role.replace(/_/g, ' ')}.
          </p>
          <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => navigate(hub.path)}>
            Go to {hub.label} <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </WorkflowPanel>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {QUICK_MODULES.map((m) => (
          <Card
            key={m.path}
            className="cursor-pointer hover:border-foreground/30 transition-colors"
            onClick={() => navigate(m.path)}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <m.icon className="h-7 w-7 text-foreground/70" />
              <div className="flex-1">
                <p className="font-semibold">{m.label}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    </WorkspacePage>
  );
}
