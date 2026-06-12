import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CalendarDays,
  FlaskConical,
  Building2,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  ScanLine,
  Stethoscope,
} from 'lucide-react';
import { WorkspacePage, MetricStrip, WorkflowPanel } from '@/components/shell/workspace-primitives';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useDoctorScope } from '@/hooks/useDoctorScope';
import { useClinicalBasePath } from '@/hooks/useClinicalBasePath';
import { useHospital } from '@/stores/hospitalStore';
import { cn } from '@/lib/utils';

const QUEUE_STATUS_STYLE: Record<string, string> = {
  waiting: 'bg-amber-500/10 text-amber-700',
  called: 'bg-blue-500/10 text-blue-700',
  'in-consultation': 'bg-emerald-500/10 text-emerald-700',
  completed: 'bg-muted text-muted-foreground',
  skipped: 'bg-muted text-muted-foreground',
};

const PRIORITY_STYLE: Record<string, string> = {
  emergency: 'text-rose-600 font-semibold',
  urgent: 'text-amber-600 font-semibold',
  routine: 'text-muted-foreground',
};

function formatDisplayTime(value: string) {
  const normalized = value.trim().toUpperCase();
  if (normalized.includes('AM') || normalized.includes('PM')) {
    return normalized;
  }
  const [hourRaw, minuteRaw] = normalized.split(':');
  const hour = Number(hourRaw || '0');
  const minute = Number(minuteRaw || '0');
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = ((hour + 11) % 12) + 1;
  return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`;
}

function greetingForHour() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DoctorDashboard2026() {
  const navigate = useNavigate();
  const roleBasePath = useClinicalBasePath();
  const { nursingRounds } = useHospital();
  const {
    isDoctor,
    doctorName,
    department,
    patients,
    appointments,
    queue,
    labOrders,
    radiologyOrders,
    admissions,
  } = useDoctorScope();

  const latestRoundByAdmission = useMemo(() => {
    const map = new Map<string, (typeof nursingRounds)[number]>();
    nursingRounds.forEach((round) => {
      if (!map.has(round.admissionId)) {
        map.set(round.admissionId, round);
      }
    });
    return map;
  }, [nursingRounds]);

  const activeQueue = useMemo(
    () =>
      queue
        .filter((entry) => entry.status === 'waiting' || entry.status === 'called' || entry.status === 'in-consultation')
        .slice(0, 6),
    [queue],
  );

  const waitingCount = queue.filter((entry) => entry.status === 'waiting' || entry.status === 'called').length;
  const inConsultCount = queue.filter((entry) => entry.status === 'in-consultation').length;

  const pendingLabOrders = useMemo(
    () => labOrders.filter((order) => order.stage !== 'Reported' && order.stage !== 'Validated'),
    [labOrders],
  );

  const pendingRadOrders = useMemo(
    () => radiologyOrders.filter((order) => order.status !== 'Reported'),
    [radiologyOrders],
  );

  const pendingReportsCount = pendingLabOrders.length + pendingRadOrders.length;

  const roundsDue = useMemo(() => {
    return admissions.filter((admission) => {
      const latest = latestRoundByAdmission.get(admission.id);
      return (
        admission.status === 'icu' ||
        admission.nursingPriority === 'high' ||
        !latest ||
        latest.painScore >= 4
      );
    });
  }, [admissions, latestRoundByAdmission]);

  const todayIso = new Date().toISOString().split('T')[0];
  const todayAppointmentCount = appointments.filter((appointment) => appointment.date === todayIso).length;

  const criticalLabCount = labOrders.filter((order) => order.criticalAlert).length;
  const criticalRadCount = radiologyOrders.filter((order) => order.critical).length;
  const icuCount = admissions.filter((admission) => admission.status === 'icu').length;

  const clinicalBrief = useMemo(() => {
    const lines: string[] = [];

    if (waitingCount > 0) {
      lines.push(`${waitingCount} patient${waitingCount === 1 ? '' : 's'} in OPD queue — prioritize called tokens first.`);
    } else {
      lines.push('OPD queue is clear. Review pending results and inpatient rounds.');
    }

    if (criticalLabCount + criticalRadCount > 0) {
      lines.push(
        `${criticalLabCount + criticalRadCount} critical result${criticalLabCount + criticalRadCount === 1 ? '' : 's'} need review before next consult.`,
      );
    }

    if (roundsDue.length > 0) {
      lines.push(`${roundsDue.length} inpatient round${roundsDue.length === 1 ? '' : 's'} flagged — ${icuCount} in ICU.`);
    }

    if (todayAppointmentCount > 0) {
      lines.push(`${todayAppointmentCount} scheduled appointment${todayAppointmentCount === 1 ? '' : 's'} on today's roster.`);
    }

    return lines;
  }, [criticalLabCount, criticalRadCount, icuCount, roundsDue.length, todayAppointmentCount, waitingCount]);

  const pendingDiagnostics = useMemo(() => {
    const labs = pendingLabOrders.slice(0, 4).map((order) => ({
      id: order.orderId,
      patient: order.patientName,
      study: order.tests,
      priority: order.priority.toLowerCase(),
      time: order.orderTime,
      kind: 'lab' as const,
      critical: order.criticalAlert,
    }));
    const rads = pendingRadOrders.slice(0, 4).map((order) => ({
      id: order.orderId,
      patient: order.patientName,
      study: order.study,
      priority: order.priority.toLowerCase(),
      time: order.orderTime,
      kind: 'rad' as const,
      critical: order.critical,
    }));
    return [...labs, ...rads].slice(0, 6);
  }, [pendingLabOrders, pendingRadOrders]);

  if (!isDoctor) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Access denied. Only doctor users can access the doctor dashboard.
      </div>
    );
  }

  const dateLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <WorkspacePage
      title={`${greetingForHour()}, ${doctorName}`}
      subtitle={`${dateLabel} · ${department || 'Clinical workspace'} — your command center for OPD, diagnostics, and inpatient rounds.`}
      actions={
        <Button size="sm" className="gap-1.5" onClick={() => navigate(`${roleBasePath}/queue`)}>
          <Stethoscope className="h-3.5 w-3.5" />
          Start consult
          {waitingCount > 0 ? ` (${waitingCount})` : ''}
        </Button>
      }
    >
      <MetricStrip
        columns={4}
        metrics={[
          {
            id: 'queue',
            label: 'OPD queue',
            value: activeQueue.length,
            hint: `${waitingCount} waiting · ${inConsultCount} in consult`,
            icon: CalendarDays,
          },
          {
            id: 'reports',
            label: 'Pending results',
            value: pendingReportsCount,
            hint: `${pendingLabOrders.length} lab · ${pendingRadOrders.length} radiology`,
            icon: FlaskConical,
          },
          {
            id: 'rounds',
            label: 'Rounds due',
            value: roundsDue.length,
            hint: `${icuCount} ICU · ${admissions.length} assigned`,
            icon: Building2,
          },
          {
            id: 'patients',
            label: 'Assigned patients',
            value: patients.length,
            hint: `${patients.filter((patient) => patient.patientType === 'IPD' || patient.patientType === 'ICU').length} inpatients`,
            icon: Users,
          },
        ]}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <WorkflowPanel title="OPD queue" className="lg:col-span-2">
          {activeQueue.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No active queue entries in your scope.</p>
          ) : (
            <ul className="divide-y divide-border/60 -mx-4 -mb-4">
              {activeQueue.map((entry) => (
                <li
                  key={`${entry.tokenNo}-${entry.uhid}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() => navigate(`${roleBasePath}/queue`)}
                >
                  <span className="text-xs font-mono font-semibold text-foreground/80 w-8 shrink-0">
                    #{entry.tokenNo}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{entry.patientName}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {entry.complaint || entry.department}
                      {entry.waitMinutes != null ? ` · ${entry.waitMinutes}m wait` : ''}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0',
                      QUEUE_STATUS_STYLE[entry.status] ?? QUEUE_STATUS_STYLE.waiting,
                    )}
                  >
                    {entry.status.replace('-', ' ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 gap-1 text-xs"
            onClick={() => navigate(`${roleBasePath}/queue`)}
          >
            Open full queue <ArrowRight className="h-3 w-3" />
          </Button>
        </WorkflowPanel>

        <Card className="border-foreground/10 bg-gradient-to-b from-card to-muted/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              AI clinical brief
            </div>
            <ul className="space-y-2.5 text-sm leading-relaxed">
              {clinicalBrief.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="text-foreground/30 shrink-0">·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            {(criticalLabCount > 0 || criticalRadCount > 0) && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700">
                  {criticalLabCount + criticalRadCount} critical diagnostic alert
                  {criticalLabCount + criticalRadCount === 1 ? '' : 's'} — review before discharging next patient.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <WorkflowPanel title="Pending labs & radiology">
          {pendingDiagnostics.length === 0 ? (
            <p className="text-sm text-muted-foreground">All results reviewed — no pending diagnostics.</p>
          ) : (
            <ul className="space-y-3">
              {pendingDiagnostics.map((item) => (
                <li
                  key={`${item.kind}-${item.id}`}
                  className="flex items-start gap-3 text-sm cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate(`${roleBasePath}/labs`)}
                >
                  {item.kind === 'lab' ? (
                    <FlaskConical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  ) : (
                    <ScanLine className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {item.patient}
                      {item.critical && (
                        <span className="ml-1.5 text-[10px] uppercase text-rose-600 font-semibold">critical</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{item.study}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('text-[10px] uppercase', PRIORITY_STYLE[item.priority] ?? PRIORITY_STYLE.routine)}>
                      {item.priority}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{formatDisplayTime(item.time)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </WorkflowPanel>

        <WorkflowPanel title="IPD rounds">
          {roundsDue.length === 0 ? (
            <p className="text-sm text-muted-foreground">No urgent rounds flagged in your census.</p>
          ) : (
            <ul className="space-y-3">
              {roundsDue.slice(0, 6).map((admission) => {
                const latest = latestRoundByAdmission.get(admission.id);
                return (
                  <li
                    key={admission.id}
                    className="flex items-start gap-3 text-sm cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate(`${roleBasePath}/ipd`)}
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{admission.patientName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {admission.bed} · {admission.ward}
                        {admission.primaryDiagnosis ? ` · ${admission.primaryDiagnosis}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={cn(
                          'text-[10px] uppercase font-semibold',
                          admission.status === 'icu' ? 'text-rose-600' : 'text-amber-600',
                        )}
                      >
                        {admission.status === 'icu' ? 'ICU' : admission.nursingPriority}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {admission.nextDoctorRoundAt || (latest ? `Pain ${latest.painScore}` : 'Round due')}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </WorkflowPanel>
      </div>

      <WorkflowPanel title="Quick actions">
        <div className="grid sm:grid-cols-3 gap-3">
          <Card
            className="cursor-pointer border-foreground/10 hover:border-foreground/25 hover:shadow-sm transition-all"
            onClick={() => navigate(`${roleBasePath}/queue`)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-foreground/70" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">OPD queue</p>
                <p className="text-xs text-muted-foreground">{waitingCount} waiting</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer border-foreground/10 hover:border-foreground/25 hover:shadow-sm transition-all"
            onClick={() => navigate(`${roleBasePath}/labs`)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <FlaskConical className="h-5 w-5 text-foreground/70" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Labs & results</p>
                <p className="text-xs text-muted-foreground">{pendingReportsCount} pending</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer border-foreground/10 hover:border-foreground/25 hover:shadow-sm transition-all"
            onClick={() => navigate(`${roleBasePath}/ipd`)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <Building2 className="h-5 w-5 text-foreground/70" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">IPD rounds</p>
                <p className="text-xs text-muted-foreground">{admissions.length} admissions</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      </WorkflowPanel>
    </WorkspacePage>
  );
}
