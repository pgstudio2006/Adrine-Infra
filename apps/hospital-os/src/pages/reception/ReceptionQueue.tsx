import { useEffect, useMemo, useState } from "react";
import { motion } from 'framer-motion';
import { Monitor, Users, Clock, AlertTriangle, SkipForward, Phone, Play, Megaphone, RefreshCw, ClipboardList } from 'lucide-react';
import { OPDTVDisplay } from '@/components/reception/OPDTVDisplay';
import { useHospital } from '@/stores/hospitalStore';
import { InlinePlatformError } from '@/components/opd/InlinePlatformError';
import { useReceptionPlatform } from '@/hooks/useReceptionPlatform';
import { averageWaitMinutes, formatWaitMinutes, queueEntryKey } from '@/lib/opd/queue-presenters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { isNavayuTenant } from '@/lib/navayu/navayu-forms';
import { getOpdExamStatus, setOpdExamStatus } from '@/lib/navayu/navayu-opd-journey';
import { toast } from 'sonner';

type QueueGroup = Record<string, ReturnType<typeof useHospital>['queue']>;

const statusStyles: Record<string, string> = {
  waiting: 'bg-muted text-muted-foreground border-border',
  called: 'bg-primary/15 text-primary border-primary ring-2 ring-primary/40 shadow-sm',
  'in-consultation': 'bg-success/10 text-success border-success/30',
  completed: 'bg-muted/50 text-muted-foreground border-border opacity-50',
  skipped: 'bg-warning/10 text-warning border-warning/30',
};

const statusLabels: Record<string, string> = {
  waiting: 'Waiting',
  called: 'Called — proceed to room',
  'in-consultation': 'In Consultation',
  completed: 'Completed',
  skipped: 'Skipped',
};

function fifoSort<T extends { tokenNo: number; checkedInAtIso?: string; isAppointmentPatient?: boolean }>(
  entries: T[],
): T[] {
  return [...entries].sort((left, right) => {
    if (left.tokenNo !== right.tokenNo) return left.tokenNo - right.tokenNo;
    const leftIso = left.checkedInAtIso ?? '';
    const rightIso = right.checkedInAtIso ?? '';
    return leftIso.localeCompare(rightIso);
  });
}

export default function ReceptionQueue() {
  const { queue, updateQueueStatus, clearCompletedFromQueue } = useHospital();
  const navayuMode = isNavayuTenant();
  const { error: platformError, loading } = useReceptionPlatform({
    queue: true,
    appointments: false,
  });
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [tvMode, setTvMode] = useState(false);
  const [errorDismissed, setErrorDismissed] = useState(false);

  useEffect(() => {
    setErrorDismissed(false);
  }, [platformError]);

  const visibleQueue = useMemo(
    () =>
      queue.filter(
        (entry) =>
          entry.opdPaymentStatus !== 'billing_pending' &&
          entry.status !== 'completed' &&
          entry.status !== 'skipped',
      ),
    [queue],
  );

  const groupKey = navayuMode ? 'doctor' : 'department';

  const queuesByGroup = useMemo<QueueGroup>(() => {
    return visibleQueue.reduce<QueueGroup>((groups, entry) => {
      const key = groupKey === 'doctor' ? entry.doctor || 'Unassigned' : entry.department;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key] = fifoSort([...groups[key], entry]);
      return groups;
    }, {});
  }, [visibleQueue, groupKey]);

  const groups = Object.keys(queuesByGroup).sort();
  const activeQueue = visibleQueue.filter((e) => e.status !== 'completed' && e.status !== 'skipped');
  const totalWaiting = visibleQueue.filter((e) => e.status === 'waiting' || e.status === 'called').length;
  const totalInConsultation = visibleQueue.filter((e) => e.status === 'in-consultation').length;
  const totalSkipped = queue.filter((e) => e.status === 'skipped').length;
  const avgWaitMin = averageWaitMinutes(
    activeQueue.filter((e) => e.status === 'waiting' || e.status === 'called').map((e) => e.waitMinutes),
  );
  const avgWait = formatWaitMinutes(avgWaitMin);

  const calledPatient = visibleQueue.find((e) => e.status === 'called');

  const startExamWorkflow = (uhid: string) => {
    setOpdExamStatus(uhid, 'in_progress');
    toast.success('Examination & history started', {
      description: 'Jr doctor / nurse can complete intake before senior consult.',
    });
  };

  if (tvMode) {
    return (
      <OPDTVDisplay
        queues={queuesByGroup}
        avgWait={avgWait}
        onClose={() => setTvMode(false)}
        groupLabel={navayuMode ? 'doctor' : 'department'}
      />
    );
  }

  return (
    <div className="space-y-6">
      <InlinePlatformError
        message={errorDismissed ? null : platformError}
        onDismiss={() => setErrorDismissed(true)}
      />

      {calledPatient ? (
        <div className="rounded-lg border-2 border-primary/50 bg-primary/10 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            Now calling: {calledPatient.patientName} · Token #{calledPatient.tokenNo}
          </p>
          <Badge variant="default" className="font-mono">
            {calledPatient.doctor} · {calledPatient.department}
          </Badge>
        </div>
      ) : null}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">OPD Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {navayuMode
              ? 'Grouped by doctor — strict FIFO by token / check-in time'
              : 'Token issue and handoff to clinical queue — one primary action per patient'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setTvMode(true)} className="gap-2">
          <Monitor className="w-4 h-4" /> TV Display
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearCompletedFromQueue}
          disabled={loading}
          className="gap-2"
          title="Remove completed patients from the board"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh board
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4 text-center">
          <Users className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-2xl font-bold">{totalWaiting}</p>
          <p className="text-xs text-muted-foreground">In Queue</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <Clock className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-2xl font-bold">{avgWait}</p>
          <p className="text-xs text-muted-foreground">Avg wait (board)</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <Users className="w-5 h-5 mx-auto text-success mb-1" />
          <p className="text-2xl font-bold">{totalInConsultation}</p>
          <p className="text-xs text-muted-foreground">Being Seen</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <AlertTriangle className="w-5 h-5 mx-auto text-warning mb-1" />
          <p className="text-2xl font-bold">{totalSkipped}</p>
          <p className="text-xs text-muted-foreground">Skipped</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setSelectedDoctor('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            selectedDoctor === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          All {navayuMode ? 'Doctors' : 'Departments'}
        </button>
        {groups.map((group) => (
          <button
            key={group}
            type="button"
            onClick={() => setSelectedDoctor(group)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedDoctor === group
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {group}
            <span className="ml-1 text-xs opacity-70">
              {
                queuesByGroup[group].filter(
                  (e) => e.status === 'waiting' || e.status === 'called',
                ).length
              }
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {groups.length === 0 && !loading && (
          <div className="rounded-xl border bg-card p-12 text-center text-sm text-muted-foreground space-y-2">
            {platformError ? (
              <p>Queue board could not be loaded. Fix the error above and refresh.</p>
            ) : (
              <>
                <p>No patients in queue.</p>
                <p className="text-xs">Complete check-in from Check-In or OPD Start from Registration.</p>
              </>
            )}
          </div>
        )}

        {groups
          .filter((group) => selectedDoctor === 'all' || selectedDoctor === group)
          .map((group) => (
            <div key={group}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">{group}</h2>
                <span className="text-xs text-muted-foreground">
                  {queuesByGroup[group].filter((e) => e.status !== 'completed').length}{' '}
                  active
                </span>
              </div>

              <div className="space-y-2">
                {queuesByGroup[group].map((entry, index) => {
                  const isCalled = entry.status === 'called';
                  const primaryWaiting = entry.status === 'waiting';
                  const primaryCalled = entry.status === 'called';
                  const primaryInConsult = entry.status === 'in-consultation';
                  const examStatus = entry.examStatus ?? getOpdExamStatus(entry.uhid);

                  return (
                    <motion.div
                      key={`${entry.tokenNo}-${entry.uhid}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`rounded-xl border p-4 flex items-center justify-between gap-4 flex-wrap ${statusStyles[entry.status]}`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                            isCalled ? 'bg-primary text-primary-foreground' : 'bg-background/70'
                          }`}
                        >
                          {entry.tokenNo}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate flex items-center gap-2">
                            {entry.patientName}
                            {entry.isAppointmentPatient ? (
                              <Badge variant="secondary" className="text-[10px]">Appointment</Badge>
                            ) : null}
                          </p>
                          <p className="text-xs opacity-70">
                            {entry.uhid} · {entry.doctor} · Checked in {entry.checkedInAt}
                          </p>
                          {entry.complaint ? (
                            <p className="text-xs opacity-70 mt-1 truncate">{entry.complaint}</p>
                          ) : null}
                          {navayuMode ? (
                            <Badge variant="outline" className="text-[10px] mt-1">
                              Exam: {examStatus.replace('_', ' ')}
                            </Badge>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap justify-end">
                        <div className="text-right">
                          <p className="text-sm font-medium">{statusLabels[entry.status]}</p>
                          {(entry.status === 'waiting' || entry.status === 'called') &&
                          entry.waitMinutes != null ? (
                            <p className="text-xs opacity-70">
                              Wait {formatWaitMinutes(entry.waitMinutes)}
                            </p>
                          ) : (
                            <p className="text-xs opacity-70">Token #{entry.tokenNo}</p>
                          )}
                        </div>

                        {navayuMode && (primaryWaiting || primaryCalled) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => {
                              startExamWorkflow(entry.uhid);
                              if (examStatus === 'in_progress') {
                                setOpdExamStatus(entry.uhid, 'done');
                                toast.success('Examination marked complete');
                              }
                            }}
                          >
                            <ClipboardList className="w-3.5 h-3.5" />
                            {examStatus === 'done' ? 'Exam done' : 'Examination & History'}
                          </Button>
                        ) : null}

                        {primaryWaiting ? (
                          <Button
                            size="sm"
                            className="gap-1.5"
                            onClick={() => updateQueueStatus(queueEntryKey(entry), 'called')}
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Call patient
                          </Button>
                        ) : null}

                        {primaryCalled ? (
                          <Button
                            size="sm"
                            className="gap-1.5"
                            onClick={() => updateQueueStatus(queueEntryKey(entry), 'in-consultation')}
                          >
                            <Play className="w-3.5 h-3.5" />
                            Hand off to doctor
                          </Button>
                        ) : null}

                        {primaryInConsult ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQueueStatus(queueEntryKey(entry), 'completed')}
                          >
                            Mark complete
                          </Button>
                        ) : null}

                        {(entry.status === 'waiting' || entry.status === 'called') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            title="Skip token"
                            onClick={() => updateQueueStatus(queueEntryKey(entry), 'skipped')}
                          >
                            <SkipForward className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
