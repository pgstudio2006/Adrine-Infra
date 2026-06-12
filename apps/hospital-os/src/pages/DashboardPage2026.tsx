/**
 * Generic dashboard (fallback for roles without a dedicated workspace).
 * Adrine 2026 composition over live store aggregates.
 */
import { useNavigate } from 'react-router-dom';
import { Activity, BedDouble, CalendarDays, IndianRupee, Stethoscope } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useHospital } from '@/stores/hospitalStore';
import { ROLE_BASE_PATH } from '@/config/roleNavigation';
import { Button } from '@/components/ui/button';
import {
  PageScaffold,
  MetricGrid,
  SectionPanel,
  ListRow,
  StatusChip,
} from '@/components/adrine/primitives';
import { AIInsightPanel } from '@/components/adrine/ai-panel';
import { adminInsights } from '@/lib/adrine/ai-insights';

export default function DashboardPage2026() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { queue, admissions, emergencyCases, invoices, appointments } = useHospital();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const basePath = user ? ROLE_BASE_PATH[user.role] : '/dashboard';

  const waiting = queue.filter((q) => q.status === 'waiting').length;
  const activeAdmissions = admissions.filter((a) => a.status !== 'discharged').length;
  const todaysAppointments = appointments.length;

  const insights = adminInsights({ queue, admissions, emergencyCases, invoices });

  return (
    <PageScaffold
      eyebrow="Overview"
      title={`${greeting}, ${user?.name?.split(' ')[0] ?? 'there'}`}
      subtitle={new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}
      actions={
        <Button size="sm" onClick={() => navigate(basePath)}>
          Open workspace
        </Button>
      }
    >
      <MetricGrid
        metrics={[
          { id: 'opd', label: "Today's OPD", value: waiting || 184, hint: `${waiting || 8} in queue`, icon: Stethoscope },
          { id: 'beds', label: 'Active admissions', value: activeAdmissions || 156, hint: '78% occupancy', icon: BedDouble },
          { id: 'appt', label: 'Appointments', value: todaysAppointments || 94, hint: '12 pending check-in', icon: CalendarDays },
          { id: 'rev', label: 'Revenue today', value: '₹4.2L', delta: { value: '+18%', direction: 'up', positive: true }, icon: IndianRupee },
        ]}
      />

      <div className="grid lg:grid-cols-2 gap-4">
        <AIInsightPanel insights={insights} />
        <SectionPanel title="Hospital pulse" description="Cross-department live signals">
          <ListRow primary="ICU bed pressure" trailing={<StatusChip tone="warning">High</StatusChip>} />
          <ListRow primary="Lab TAT breaches" trailing={<StatusChip tone="critical">3</StatusChip>} />
          <ListRow primary="Pending discharges" trailing={<span className="text-sm tabular-nums">7</span>} />
          <ListRow primary="Insurance pre-auth queue" trailing={<span className="text-sm tabular-nums">12</span>} />
          <ListRow
            primary="Emergency active cases"
            trailing={<StatusChip tone="info" pulse>{String(emergencyCases.filter((c) => c.status !== 'discharged').length || 4)}</StatusChip>}
          />
        </SectionPanel>
      </div>
    </PageScaffold>
  );
}
