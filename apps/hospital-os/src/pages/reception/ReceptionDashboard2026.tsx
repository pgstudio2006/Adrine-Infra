import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { frontDeskSpine } from '@adrine/hospital-operations';
import {
  CalendarCheck,
  Clock,
  UserCheck,
  UserPlus,
  ArrowRight,
  Activity,
  Users,
} from 'lucide-react';
import { WorkspacePage, MetricStrip, WorkflowPanel } from '@/components/shell/workspace-primitives';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InlinePlatformError } from '@/components/shared/InlinePlatformError';
import { useHospital } from '@/stores/hospitalStore';
import { useClinicalPlatformListSync } from '@/hooks/useClinicalPlatformListSync';
import { usePlatformHydration } from '@/hooks/usePlatformHydration';
import {
  averageWaitMinutes,
  formatWaitMinutes,
} from '@/lib/opd/queue-presenters';

const CORE_STEPS = ['register', 'schedule', 'checkin', 'queue'] as const;

export default function ReceptionDashboard2026() {
  const navigate = useNavigate();
  const { patients, appointments, queue } = useHospital();
  const { error: hydrationError, retry } = usePlatformHydration({});
  useClinicalPlatformListSync({
    queue: true,
    appointments: true,
    patients: true,
    departmentWorklists: false,
    ipd: true,
  });

  const todayYmd = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter((a) => a.date === todayYmd);
  const waitingQueue = queue.filter(
    (q) => q.status === 'waiting' || q.status === 'called',
  );
  const checkInsPending = todayAppointments.filter(
    (a) => a.status === 'scheduled' || a.status === 'confirmed',
  ).length;
  const avgWait = formatWaitMinutes(
    averageWaitMinutes(waitingQueue.map((q) => q.waitMinutes)),
  );

  const workflowSteps = useMemo(() => {
    const hints: Record<string, { done: boolean; hint: string }> = {
      register: {
        done: patients.length > 0,
        hint: `${patients.length} patients in context`,
      },
      schedule: {
        done: appointments.some((a) => a.status !== 'cancelled'),
        hint: `${appointments.filter((a) => a.status === 'scheduled' || a.status === 'confirmed').length} active appointments`,
      },
      checkin: {
        done: appointments.some(
          (a) => a.status === 'checked-in' || a.status === 'in-consultation',
        ),
        hint: checkInsPending > 0 ? `${checkInsPending} awaiting check-in` : 'All checked in',
      },
      queue: {
        done: queue.length > 0,
        hint: `${waitingQueue.length} in queue · avg ${avgWait}`,
      },
    };

    return frontDeskSpine.steps
      .filter((s) => CORE_STEPS.includes(s.id as (typeof CORE_STEPS)[number]))
      .map((step) => {
        const meta = hints[step.id] ?? { done: false, hint: '' };
        return {
          id: step.id,
          label: step.label,
          hint: meta.hint,
          route: step.route,
          status: meta.done ? ('done' as const) : ('pending' as const),
        };
      });
  }, [patients.length, appointments, checkInsPending, queue.length, waitingQueue.length, avgWait]);

  const activeStepIndex = workflowSteps.findIndex((s) => s.status === 'pending');

  return (
    <WorkspacePage
      title="Front desk command"
      subtitle="Registration, appointments, check-in, and queue — Adrine 2026 front desk spine."
      actions={
        <Button size="sm" className="gap-1.5" onClick={() => navigate('/reception/registration')}>
          <UserPlus className="h-3.5 w-3.5" />
          New registration
        </Button>
      }
    >
      <InlinePlatformError error={hydrationError} onRetry={retry} />

      <MetricStrip
        columns={4}
        metrics={[
          {
            id: 'appointments',
            label: "Today's appointments",
            value: todayAppointments.length,
            hint: 'Authoritative day list',
            icon: CalendarCheck,
          },
          {
            id: 'checkin',
            label: 'Check-in pending',
            value: checkInsPending,
            hint: 'Scheduled / confirmed, not tokened',
            icon: UserCheck,
            trend: checkInsPending > 8 ? { value: 'High volume', positive: false } : undefined,
          },
          {
            id: 'queue',
            label: 'Queue depth',
            value: waitingQueue.length,
            hint: `Avg wait ${avgWait}`,
            icon: Clock,
            trend: waitingQueue.length > 10 ? { value: 'Above target', positive: false } : undefined,
          },
          {
            id: 'patients',
            label: 'Patients in context',
            value: patients.length,
            hint: 'Registered today',
            icon: Users,
          },
        ]}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card
          className="cursor-pointer group overflow-hidden border-foreground/10 hover:shadow-lg transition-shadow"
          onClick={() => navigate('/reception/registration')}
        >
          <CardContent className="p-6 flex flex-col h-full min-h-[200px]">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-2">
              <UserPlus className="h-3.5 w-3.5" />
              Registration
            </div>
            <h2 className="text-lg font-semibold tracking-tight">New patient or walk-in</h2>
            <p className="text-sm text-muted-foreground mt-2 flex-1">
              Full registration or fast-path walk-in — starts the front desk spine.
            </p>
            <span className="inline-flex items-center gap-1 mt-4 text-xs font-medium group-hover:gap-2 transition-all">
              Open registration <ArrowRight className="h-3 w-3" />
            </span>
          </CardContent>
        </Card>

        <WorkflowPanel title="Today's appointments" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground">
              {todayAppointments.length} scheduled for {todayYmd}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => navigate('/reception/appointments')}
            >
              Calendar <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="divide-y max-h-56 overflow-y-auto -mx-1">
            {todayAppointments.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground text-center">
                No appointments for today.
              </p>
            ) : (
              todayAppointments.slice(0, 8).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between px-1 py-2.5 hover:bg-accent/40 rounded-md transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{a.patientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.time} · {a.doctor}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {a.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </WorkflowPanel>
      </div>

      <WorkflowPanel title="Front desk workflow">
        <ol className="space-y-3">
          {workflowSteps.map((step, i) => {
            const isActive = i === activeStepIndex;
            const isDone = step.status === 'done';
            return (
              <li key={step.id} className="flex items-center gap-3 text-sm">
                <span
                  className={
                    isDone
                      ? 'h-7 w-7 rounded-full bg-emerald-500/15 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0'
                      : isActive
                        ? 'h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold shrink-0'
                        : 'h-7 w-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs shrink-0'
                  }
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={isDone || isActive ? 'font-medium' : 'text-muted-foreground'}>
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{step.hint}</p>
                </div>
                {isActive && (
                  <Badge className="text-[10px] shrink-0">Next</Badge>
                )}
                {step.route && (
                  <Button
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    className="shrink-0 h-7 text-xs"
                    onClick={() => navigate(step.route!)}
                  >
                    Open
                  </Button>
                )}
              </li>
            );
          })}
        </ol>
      </WorkflowPanel>

      <div className="grid sm:grid-cols-3 gap-3">
        <Button
          variant="outline"
          className="h-auto py-4 flex-col items-start gap-1"
          onClick={() => navigate('/reception/checkin')}
        >
          <Activity className="h-4 w-4 mb-1" />
          <span className="font-semibold text-sm">Check-in</span>
          <span className="text-xs text-muted-foreground font-normal">
            {checkInsPending} pending
          </span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex-col items-start gap-1"
          onClick={() => navigate('/reception/queue')}
        >
          <Clock className="h-4 w-4 mb-1" />
          <span className="font-semibold text-sm">Queue board</span>
          <span className="text-xs text-muted-foreground font-normal">
            {waitingQueue.length} waiting · {avgWait}
          </span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex-col items-start gap-1"
          onClick={() => navigate('/reception/appointments')}
        >
          <CalendarCheck className="h-4 w-4 mb-1" />
          <span className="font-semibold text-sm">Appointments</span>
          <span className="text-xs text-muted-foreground font-normal">
            Schedule & confirm
          </span>
        </Button>
      </div>
    </WorkspacePage>
  );
}
