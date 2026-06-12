import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  CalendarCheck,
  CheckCircle,
  Clock,
  UserPlus,
  Users,
} from 'lucide-react';
import { WorkspacePage, MetricStrip, WorkflowPanel } from '@/components/shell/workspace-primitives';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useHrPlatform } from '@/hooks/useHrPlatform';

const LEAVE_REQUESTS = [
  { id: 'LR-0412', staff: 'Nurse Priya Shah', dept: 'ICU', type: 'Casual Leave', status: 'Pending' as const },
  { id: 'LR-0411', staff: 'Amit Patel', dept: 'Pathology', type: 'Sick Leave', status: 'Pending' as const },
  { id: 'LR-0410', staff: 'Rekha Desai', dept: 'Emergency', type: 'Casual Leave', status: 'Approved' as const },
  { id: 'LR-0409', staff: 'Dr. Ananya Mishra', dept: 'Cardiology', type: 'Annual Leave', status: 'Pending' as const },
  { id: 'LR-0408', staff: 'Sunita Verma', dept: 'Front Desk', type: 'Emergency Leave', status: 'Approved' as const },
];

const ATTENDANCE_TODAY = [
  { name: 'Dr. Rajesh Kumar', dept: 'Cardiology', status: 'Present' as const },
  { name: 'Dr. Ananya Mishra', dept: 'Cardiology', status: 'Present' as const },
  { name: 'Nurse Priya Shah', dept: 'ICU', status: 'Present' as const },
  { name: 'Amit Patel', dept: 'Pathology', status: 'Late' as const },
  { name: 'Rekha Desai', dept: 'Emergency', status: 'On Leave' as const },
  { name: 'Dr. Vikram Singh', dept: 'Orthopedics', status: 'Present' as const },
  { name: 'Sunita Verma', dept: 'Front Desk', status: 'Absent' as const },
  { name: 'Mohammed Irfan', dept: 'Pharmacy', status: 'Present' as const },
];

const STAFFING_GAPS = [
  { dept: 'Emergency', gap: 2 },
  { dept: 'ICU', gap: 1 },
  { dept: 'Nursing', gap: 3 },
  { dept: 'Radiology', gap: 1 },
];

function greetingForHour() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HRDashboard2026() {
  const navigate = useNavigate();
  const { platformOn, staff, departments } = useHrPlatform();

  const pendingLeave = useMemo(
    () => LEAVE_REQUESTS.filter((l) => l.status === 'Pending'),
    [],
  );

  const attendanceStats = useMemo(() => {
    const present = ATTENDANCE_TODAY.filter((a) => a.status === 'Present').length;
    const late = ATTENDANCE_TODAY.filter((a) => a.status === 'Late').length;
    const absent = ATTENDANCE_TODAY.filter((a) => a.status === 'Absent').length;
    const onLeave = ATTENDANCE_TODAY.filter((a) => a.status === 'On Leave').length;
    return { present, late, absent, onLeave, total: ATTENDANCE_TODAY.length };
  }, []);

  const staffByDept = useMemo(() => {
    if (!platformOn || staff.length === 0) return [];
    const map = new Map<string, number>();
    for (const member of staff) {
      const dept =
        member.assignments[0]?.departmentCode ??
        member.assignments[0]?.roleTemplate?.label ??
        'Unassigned';
      map.set(dept, (map.get(dept) ?? 0) + 1);
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [platformOn, staff]);

  const totalStaff = platformOn && staff.length > 0 ? staff.length : ATTENDANCE_TODAY.length;
  const onDutyToday = platformOn && staff.length > 0 ? staff.length : attendanceStats.present + attendanceStats.late;
  const openPositions = STAFFING_GAPS.reduce((sum, d) => sum + d.gap, 0);

  const dateLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <WorkspacePage
      title={`${greetingForHour()}, HR team`}
      subtitle={`${dateLabel} · Staff on duty, leave requests, open positions, and attendance.`}
      actions={
        <Button size="sm" className="gap-1.5" onClick={() => navigate('/hr/staff')}>
          <UserPlus className="h-3.5 w-3.5" />
          Staff roster
        </Button>
      }
    >
      <MetricStrip
        columns={4}
        metrics={[
          {
            id: 'staff',
            label: 'Total staff',
            value: totalStaff,
            hint: platformOn ? 'Kernel HR roster' : 'Branch workforce',
            icon: Users,
          },
          {
            id: 'duty',
            label: 'On duty today',
            value: onDutyToday,
            hint: `${Math.round((onDutyToday / Math.max(totalStaff, 1)) * 100)}% workforce`,
            icon: CalendarCheck,
          },
          {
            id: 'leave',
            label: 'Leave requests',
            value: pendingLeave.length,
            hint: pendingLeave.length ? 'Awaiting approval' : 'Queue clear',
            icon: Clock,
          },
          {
            id: 'open',
            label: 'Open positions',
            value: openPositions,
            hint: `${STAFFING_GAPS.length} departments with gaps`,
            icon: Briefcase,
          },
        ]}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <WorkflowPanel title="Staff on duty" className="lg:col-span-2">
          {platformOn && staffByDept.length > 0 ? (
            <ul className="space-y-3">
              {staffByDept.map(([dept, count]) => (
                <li key={dept}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{dept}</span>
                    <span className="text-muted-foreground text-xs">{count} assigned</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground/60 transition-all"
                      style={{ width: `${Math.min(100, (count / Math.max(totalStaff, 1)) * 100 * 4)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="divide-y divide-border/60 -mx-4 -mb-4">
              {ATTENDANCE_TODAY.filter((a) => a.status === 'Present' || a.status === 'Late').map((a) => (
                <li
                  key={a.name}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() => navigate('/hr/attendance')}
                >
                  <CheckCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{a.dept}</p>
                  </div>
                  <Badge variant={a.status === 'Late' ? 'outline' : 'secondary'} className="text-[10px] shrink-0">
                    {a.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 gap-1 text-xs"
            onClick={() => navigate('/hr/staff')}
          >
            View full roster <ArrowRight className="h-3 w-3" />
          </Button>
        </WorkflowPanel>

        <WorkflowPanel title="Open positions">
          {STAFFING_GAPS.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No staffing gaps flagged.</p>
          ) : (
            <ul className="space-y-3">
              {STAFFING_GAPS.map((d) => (
                <li
                  key={d.dept}
                  className="flex items-center justify-between text-sm cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate('/hr/scheduling')}
                >
                  <span className="font-medium">{d.dept}</span>
                  <Badge variant="destructive" className="text-[10px]">
                    {d.gap} open
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          {platformOn && departments.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3">
              {departments.length} departments in branch kernel
            </p>
          )}
        </WorkflowPanel>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <WorkflowPanel title="Leave requests">
          {pendingLeave.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending leave requests.</p>
          ) : (
            <ul className="space-y-3">
              {pendingLeave.map((l) => (
                <li
                  key={l.id}
                  className="flex items-start gap-3 text-sm cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate('/hr/leave')}
                >
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{l.staff}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {l.dept} · {l.type}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    Pending
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </WorkflowPanel>

        <WorkflowPanel title="Attendance today">
          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
              <p className="text-xs text-muted-foreground">Present</p>
              <p className="text-lg font-semibold">{attendanceStats.present}</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
              <p className="text-xs text-muted-foreground">Late</p>
              <p className="text-lg font-semibold">{attendanceStats.late}</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
              <p className="text-xs text-muted-foreground">Absent</p>
              <p className="text-lg font-semibold">{attendanceStats.absent}</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
              <p className="text-xs text-muted-foreground">On leave</p>
              <p className="text-lg font-semibold">{attendanceStats.onLeave}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs"
            onClick={() => navigate('/hr/attendance')}
          >
            Open attendance <ArrowRight className="h-3 w-3" />
          </Button>
        </WorkflowPanel>
      </div>

      <WorkflowPanel title="Quick actions">
        <div className="grid sm:grid-cols-3 gap-3">
          <Card
            className="cursor-pointer border-foreground/10 hover:border-foreground/25 hover:shadow-sm transition-all"
            onClick={() => navigate('/hr/leave')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-foreground/70" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Leave</p>
                <p className="text-xs text-muted-foreground">{pendingLeave.length} pending</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer border-foreground/10 hover:border-foreground/25 hover:shadow-sm transition-all"
            onClick={() => navigate('/hr/attendance')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <CalendarCheck className="h-5 w-5 text-foreground/70" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Attendance</p>
                <p className="text-xs text-muted-foreground">{attendanceStats.present} present</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer border-foreground/10 hover:border-foreground/25 hover:shadow-sm transition-all"
            onClick={() => navigate('/hr/scheduling')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-foreground/70" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Scheduling</p>
                <p className="text-xs text-muted-foreground">{openPositions} gaps</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      </WorkflowPanel>
    </WorkspacePage>
  );
}
