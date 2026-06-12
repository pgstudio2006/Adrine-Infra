import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Bed,
  ClipboardList,
  HeartPulse,
  Pill,
  Users,
} from 'lucide-react';
import { WorkspacePage, MetricStrip, WorkflowPanel } from '@/components/shell/workspace-primitives';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useHospital } from '@/stores/hospitalStore';
import { useClinicalPlatformListSync } from '@/hooks/useClinicalPlatformListSync';
import { cn } from '@/lib/utils';

const VITALS_DUE_HOURS = 6;

function parseRecordedAt(value: string): number {
  const t = Date.parse(value);
  return Number.isNaN(t) ? 0 : t;
}

function greetingForHour() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function NurseDashboard2026() {
  const navigate = useNavigate();
  const {
    admissions,
    nursingRounds,
    admissionTasks,
    wardMedicineIssues,
  } = useHospital();
  useClinicalPlatformListSync({ ipd: true, departmentWorklists: false });

  const activeAdmissions = useMemo(
    () => admissions.filter((a) => a.status !== 'discharged'),
    [admissions],
  );

  const latestRoundByAdmission = useMemo(() => {
    const map = new Map<string, (typeof nursingRounds)[number]>();
    for (const round of nursingRounds) {
      const existing = map.get(round.admissionId);
      if (!existing || parseRecordedAt(round.recordedAt) > parseRecordedAt(existing.recordedAt)) {
        map.set(round.admissionId, round);
      }
    }
    return map;
  }, [nursingRounds]);

  const pendingTasks = useMemo(
    () => admissionTasks.filter((t) => t.status === 'Pending'),
    [admissionTasks],
  );

  const vitalsDue = useMemo(() => {
    const cutoff = Date.now() - VITALS_DUE_HOURS * 60 * 60 * 1000;
    return activeAdmissions.filter((a) => {
      const round = latestRoundByAdmission.get(a.id);
      return !round || parseRecordedAt(round.recordedAt) < cutoff;
    });
  }, [activeAdmissions, latestRoundByAdmission]);

  const medsDue = useMemo(
    () => wardMedicineIssues.filter((issue) => issue.administrationStatus === 'issued'),
    [wardMedicineIssues],
  );

  const icuCount = activeAdmissions.filter((a) => a.status === 'icu').length;
  const highAcuityCount = activeAdmissions.filter((a) => a.nursingPriority === 'high').length;

  const dateLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <WorkspacePage
      title={`${greetingForHour()}, nursing team`}
      subtitle={`${dateLabel} · Ward operations — tasks, vitals, medications, and census.`}
      actions={
        <Button size="sm" className="gap-1.5" onClick={() => navigate('/nurse/ward')}>
          <Bed className="h-3.5 w-3.5" />
          Ward board
        </Button>
      }
    >
      <MetricStrip
        columns={4}
        metrics={[
          {
            id: 'tasks',
            label: 'Ward tasks',
            value: pendingTasks.length,
            hint: pendingTasks.length ? 'Acknowledge & complete' : 'All caught up',
            icon: ClipboardList,
          },
          {
            id: 'vitals',
            label: 'Vitals due',
            value: vitalsDue.length,
            hint: `No round in ${VITALS_DUE_HOURS}h`,
            icon: Activity,
          },
          {
            id: 'meds',
            label: 'Meds due',
            value: medsDue.length,
            hint: medsDue.length ? 'Awaiting administration' : 'No pending doses',
            icon: Pill,
          },
          {
            id: 'census',
            label: 'Active admissions',
            value: activeAdmissions.length,
            hint: `${icuCount} ICU · ${highAcuityCount} high acuity`,
            icon: Users,
          },
        ]}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <WorkflowPanel title="Ward tasks" className="lg:col-span-2">
          {pendingTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No pending nursing tasks.</p>
          ) : (
            <ul className="divide-y divide-border/60 -mx-4 -mb-4">
              {pendingTasks.slice(0, 8).map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() => navigate('/nurse/tasks')}
                >
                  <ClipboardList className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.task}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {task.patientName} · {task.assignedTo || 'Unassigned'}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {task.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 gap-1 text-xs"
            onClick={() => navigate('/nurse/tasks')}
          >
            Open task workspace <ArrowRight className="h-3 w-3" />
          </Button>
        </WorkflowPanel>

        <WorkflowPanel title="Admissions census">
          {activeAdmissions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No active admissions.</p>
          ) : (
            <ul className="space-y-3">
              {activeAdmissions.slice(0, 6).map((admission) => (
                <li
                  key={admission.id}
                  className="flex items-start gap-3 text-sm cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate('/nurse/ward')}
                >
                  <Bed className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{admission.patientName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {admission.ward} · {admission.bed}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'text-[10px] uppercase font-semibold shrink-0',
                      admission.status === 'icu' ? 'text-rose-600' : 'text-muted-foreground',
                    )}
                  >
                    {admission.status === 'icu' ? 'ICU' : admission.nursingPriority}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </WorkflowPanel>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <WorkflowPanel title="Vitals due">
          {vitalsDue.length === 0 ? (
            <p className="text-sm text-muted-foreground">All patients have recent vitals rounds.</p>
          ) : (
            <ul className="space-y-3">
              {vitalsDue.slice(0, 6).map((admission) => {
                const round = latestRoundByAdmission.get(admission.id);
                return (
                  <li
                    key={admission.id}
                    className="flex items-start gap-3 text-sm cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate(`/nurse/vitals/chart/${admission.id}`)}
                  >
                    <HeartPulse className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{admission.patientName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {admission.ward} · {admission.bed}
                        {round ? ` · last ${round.recordedAt}` : ' · no round recorded'}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </WorkflowPanel>

        <WorkflowPanel title="Medications due">
          {medsDue.length === 0 ? (
            <p className="text-sm text-muted-foreground">No ward doses awaiting administration.</p>
          ) : (
            <ul className="space-y-3">
              {medsDue.slice(0, 6).map((issue) => (
                <li
                  key={issue.id}
                  className="flex items-start gap-3 text-sm cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate('/nurse/medications')}
                >
                  <Pill className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{issue.patientName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {issue.drug} · qty {issue.qty}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    issued
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </WorkflowPanel>
      </div>

      <WorkflowPanel title="Quick actions">
        <div className="grid sm:grid-cols-3 gap-3">
          <Card
            className="cursor-pointer border-foreground/10 hover:border-foreground/25 hover:shadow-sm transition-all"
            onClick={() => navigate('/nurse/tasks')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-foreground/70" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Tasks</p>
                <p className="text-xs text-muted-foreground">{pendingTasks.length} open</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer border-foreground/10 hover:border-foreground/25 hover:shadow-sm transition-all"
            onClick={() => navigate('/nurse/vitals')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <Activity className="h-5 w-5 text-foreground/70" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Vitals</p>
                <p className="text-xs text-muted-foreground">{vitalsDue.length} due</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer border-foreground/10 hover:border-foreground/25 hover:shadow-sm transition-all"
            onClick={() => navigate('/nurse/ward')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <Bed className="h-5 w-5 text-foreground/70" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Ward board</p>
                <p className="text-xs text-muted-foreground">{activeAdmissions.length} patients</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      </WorkflowPanel>
    </WorkspacePage>
  );
}
