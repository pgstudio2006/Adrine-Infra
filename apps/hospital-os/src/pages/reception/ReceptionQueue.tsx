import { useEffect, useMemo, useState } from "react";
import { motion } from 'framer-motion';
import { Monitor, Users, Clock, AlertTriangle, SkipForward, Phone, Play, Megaphone, RefreshCw } from 'lucide-react';
import { OPDTVDisplay } from '@/components/reception/OPDTVDisplay';
import { useHospital } from '@/stores/hospitalStore';
import { InlinePlatformError } from '@/components/opd/InlinePlatformError';
import { useReceptionPlatform } from '@/hooks/useReceptionPlatform';
import { averageWaitMinutes, formatWaitMinutes, queueEntryKey } from '@/lib/opd/queue-presenters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlatformConnectivityStrip } from '@/components/PlatformConnectivityStrip';
import { isPlatformAuthoritative } from '@/runtime/platform-store-bridge';

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

export default function ReceptionQueue() {
  const { queue, updateQueueStatus } = useHospital();
  const { error: platformError, loading, refresh, platformOn } = useReceptionPlatform({
    queue: true,
    appointments: false,
  });
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [tvMode, setTvMode] = useState(false);
  const [errorDismissed, setErrorDismissed] = useState(false);

  useEffect(() => {
    setErrorDismissed(false);
  }, [platformError]);

  const queuesByDepartment = useMemo<QueueGroup>(() => {
    return queue.reduce<QueueGroup>((groups, entry) => {
      if (!groups[entry.department]) {
        groups[entry.department] = [];
      }
      groups[entry.department] = [...groups[entry.department], entry].sort(
        (left, right) => left.tokenNo - right.tokenNo,
      );
      return groups;
    }, {});
  }, [queue]);

  const departments = Object.keys(queuesByDepartment);
  const activeQueue = queue.filter((e) => e.status !== 'completed' && e.status !== 'skipped');
  const totalWaiting = queue.filter((e) => e.status === 'waiting' || e.status === 'called').length;
  const totalInConsultation = queue.filter((e) => e.status === 'in-consultation').length;
  const totalSkipped = queue.filter((e) => e.status === 'skipped').length;
  const avgWaitMin = averageWaitMinutes(
    activeQueue.filter((e) => e.status === 'waiting' || e.status === 'called').map((e) => e.waitMinutes),
  );
  const avgWait = formatWaitMinutes(avgWaitMin);

  const calledPatient = queue.find((e) => e.status === 'called');

  if (tvMode) {
    return (
      <OPDTVDisplay
        queues={queuesByDepartment}
        avgWait={avgWait}
        onClose={() => setTvMode(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {isPlatformAuthoritative() ? (
        <PlatformConnectivityStrip
          detail="Queue hydrated from GET /opd/board/visits · wait times from visit createdAt"
        />
      ) : null}

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
            {calledPatient.department} · {calledPatient.doctor}
          </Badge>
        </div>
      ) : null}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">OPD Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Token issue and handoff to clinical queue — one primary action per patient
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setTvMode(true)} className="gap-2">
          <Monitor className="w-4 h-4" /> TV Display
        </Button>
        {platformOn ? (
          <Button variant="ghost" size="sm" onClick={() => void refresh()} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh board
          </Button>
        ) : null}
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
          onClick={() => setSelectedDept('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            selectedDept === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          All Departments
        </button>
        {departments.map((department) => (
          <button
            key={department}
            type="button"
            onClick={() => setSelectedDept(department)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedDept === department
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {department}
            <span className="ml-1 text-xs opacity-70">
              {
                queuesByDepartment[department].filter(
                  (e) => e.status === 'waiting' || e.status === 'called',
                ).length
              }
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {departments.length === 0 && !loading && (
          <div className="rounded-xl border bg-card p-12 text-center text-sm text-muted-foreground space-y-2">
            {platformError ? (
              <p>Queue board could not be loaded. Fix the error above and refresh.</p>
            ) : (
              <>
                <p>No patients in queue.</p>
                <p className="text-xs">Complete check-in from Check-In to issue tokens — they appear here automatically.</p>
              </>
            )}
          </div>
        )}

        {departments
          .filter((department) => selectedDept === 'all' || selectedDept === department)
          .map((department) => (
            <div key={department}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">{department}</h2>
                <span className="text-xs text-muted-foreground">
                  {queuesByDepartment[department].filter((e) => e.status !== 'completed').length}{' '}
                  active
                </span>
              </div>

              <div className="space-y-2">
                {queuesByDepartment[department].map((entry, index) => {
                  const isCalled = entry.status === 'called';
                  const primaryWaiting = entry.status === 'waiting';
                  const primaryCalled = entry.status === 'called';
                  const primaryInConsult = entry.status === 'in-consultation';

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
                          <p className="text-sm font-semibold truncate">{entry.patientName}</p>
                          <p className="text-xs opacity-70">
                            {entry.uhid} · {entry.doctor} · Checked in {entry.checkedInAt}
                          </p>
                          {entry.complaint ? (
                            <p className="text-xs opacity-70 mt-1 truncate">{entry.complaint}</p>
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
