import { useEffect, useMemo, useState } from 'react';
import { filterNavayuDoctorQueue } from '@/lib/navayu/navayu-queue';
import { NavayuMskWorkflowStrip } from '@/components/navayu/NavayuMskWorkflowStrip';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Play, SkipForward, Megaphone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHospital } from '@/stores/hospitalStore';
import { useDoctorScope } from '@/hooks/useDoctorScope';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicalBasePath } from '@/hooks/useClinicalBasePath';
import { PatientContextBar } from '@/components/shared/PatientContextBar';
import { useClinicalPlatformListSync } from '@/hooks/useClinicalPlatformListSync';
import { formatWaitMinutes } from '@/lib/opd/queue-presenters';
import { PlatformConnectivityStrip } from '@/components/PlatformConnectivityStrip';
import { isPlatformAuthoritative } from '@/runtime/platform-store-bridge';
import { NavayuAiSummaryPanel } from '@/components/navayu/NavayuAiSummaryPanel';
import {
  isNavayuTenant,
  isNavayuSeniorDoctor,
  loadNavayuLumbarExam,
  loadNavayuVisitMetadata,
} from '@/lib/navayu/navayu-forms';
import {
  canUseNavayuRuntime,
  platformLoadNavayuVisitBundle,
  type NavayuVisitBundle,
} from '@/lib/navayu/navayu-runtime';
import type { NavayuRegistrationMetadata } from '@/lib/navayu/navayu-forms';
import { getPlatformSession } from '@/runtime/platform-session';

const fadeIn = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.3 },
});

const statusStyle: Record<string, string> = {
  waiting: 'bg-amber-500/10 text-amber-600',
  called: 'bg-primary/15 text-primary ring-2 ring-primary/30',
  'in-consultation': 'bg-emerald-500/10 text-emerald-600',
  completed: 'bg-muted text-muted-foreground',
  skipped: 'bg-destructive/10 text-destructive',
};

export default function DoctorQueue() {
  const { updateQueueStatus, nextQueuePatient, patients } = useHospital();
  const { isDoctor, doctorName, department, queue } = useDoctorScope();
  const { user } = useAuth();
  const roleBasePath = useClinicalBasePath();
  const navayuMode = isNavayuTenant();
  const navayuSenior = isNavayuSeniorDoctor(
    getPlatformSession()?.email ?? user?.email,
    user?.role,
    user?.name,
  );
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  useClinicalPlatformListSync({
    queue: true,
    patients: true,
    departmentWorklists: false,
    ipd: false,
  });

  const myQueue = useMemo(() => {
    const sorted = [...queue].sort((a, b) => a.tokenNo - b.tokenNo);
    if (!navayuMode) return sorted;
    return filterNavayuDoctorQueue(sorted, navayuSenior);
  }, [queue, navayuMode, navayuSenior]);
  const waiting = myQueue.filter((q) => q.status === 'waiting').length;
  const completed = myQueue.filter((q) => q.status === 'completed').length;
  const current = myQueue.find((q) => q.status === 'in-consultation');
  const called = myQueue.find((q) => q.status === 'called');

  const activePatient = useMemo(
    () =>
      current
        ? patients.find((p) => p.uhid === current.uhid)
        : called
          ? patients.find((p) => p.uhid === called.uhid)
          : undefined,
    [called, current, patients],
  );

  const [navayuBundle, setNavayuBundle] = useState<NavayuVisitBundle>({});

  useEffect(() => {
    if (!activePatient?.uhid) {
      setNavayuBundle({});
      return;
    }
    const localReg =
      (activePatient.visitMetadata?.navayu as NavayuRegistrationMetadata | undefined) ??
      loadNavayuVisitMetadata(activePatient.uhid) ??
      undefined;
    const localExam = loadNavayuLumbarExam(activePatient.uhid);
    const queueState = activePatient.uhid
      ? queue.find((entry) => entry.uhid === activePatient.uhid)?.mskLifecycleState
      : undefined;

    if (canUseNavayuRuntime() && activePatient.platformOpdVisitId) {
      void platformLoadNavayuVisitBundle(activePatient.platformOpdVisitId).then((bundle) => {
        setNavayuBundle({
          registration: bundle?.registration ?? localReg,
          intake: bundle?.intake,
          lumbarExam: bundle?.lumbarExam ?? localExam,
          mskLifecycleState: bundle?.mskLifecycleState ?? queueState,
        });
      });
    } else {
      setNavayuBundle({
        registration: localReg,
        lumbarExam: localExam,
        mskLifecycleState: queueState,
      });
    }
  }, [activePatient?.uhid, activePatient?.platformOpdVisitId, activePatient?.visitMetadata, queue]);

  const handleNext = () => {
    const next = myQueue.find((q) => q.status === 'waiting');
    if (next) {
      handleStart(next);
      return;
    }
    if (doctorName) nextQueuePatient(doctorName);
  };

  const handleStart = (entry: (typeof myQueue)[number]) => {
    const currentEntry = myQueue.find((q) => q.status === 'in-consultation');
    if (currentEntry && currentEntry.platformOpdVisitId !== entry.platformOpdVisitId) {
      updateQueueStatus(
        {
          platformOpdVisitId: currentEntry.platformOpdVisitId,
          tokenNo: currentEntry.tokenNo,
          uhid: currentEntry.uhid,
        },
        'completed',
      );
    }
    updateQueueStatus(
      {
        platformOpdVisitId: entry.platformOpdVisitId,
        tokenNo: entry.tokenNo,
        uhid: entry.uhid,
      },
      'in-consultation',
    );
    navigate(`${roleBasePath}/consultation/${entry.uhid}`);
  };

  const filtered = myQueue.filter(
    (p) =>
      p.patientName.toLowerCase().includes(search.toLowerCase()) ||
      String(p.tokenNo).includes(search),
  );

  if (!isDoctor) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Access denied. Only doctor users can access the OPD queue.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activePatient ? (
        <PatientContextBar
          uhid={activePatient.uhid}
          name={activePatient.name}
          visitState={activePatient.opdState}
          patientType={activePatient.patientType}
          platformPatientId={activePatient.platformPatientId}
          platformOpdVisitId={activePatient.platformOpdVisitId}
          department={activePatient.department}
          compact
        />
      ) : null}

      {isPlatformAuthoritative() ? (
        <PlatformConnectivityStrip detail="Branch-scoped OPD board from domain-api — no demo seed patients when platform runtime is on." />
      ) : null}

      {navayuMode && activePatient && navayuBundle.mskLifecycleState ? (
        <NavayuMskWorkflowStrip
          state={navayuBundle.mskLifecycleState}
          seniorView={navayuSenior}
        />
      ) : null}

      {navayuMode && navayuSenior && filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
          Senior MSK queue is empty until junior completes the MSK exam and AI summary is ready.
        </div>
      ) : null}

      {navayuMode && navayuSenior && activePatient ? (
        <NavayuAiSummaryPanel
          seniorQueue
          registration={navayuBundle.registration}
          intake={navayuBundle.intake}
          lumbarExam={navayuBundle.lumbarExam}
        />
      ) : null}

      {called ? (
        <div className="rounded-lg border-2 border-primary/40 bg-primary/10 px-4 py-2.5 flex items-center gap-2 text-sm">
          <Megaphone className="h-4 w-4 text-primary shrink-0" />
          <span>
            <strong>{called.patientName}</strong> called · Token #{called.tokenNo}
            {called.waitMinutes != null ? ` · waited ${formatWaitMinutes(called.waitMinutes)}` : ''}
          </span>
        </div>
      ) : null}

      <motion.div {...fadeIn(0)} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">OPD Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {doctorName} · {department || 'All Departments'}
            {navayuMode ? (navayuSenior ? ' · Senior MSK queue' : ' · Junior MSK queue') : ''} ·{' '}
            <span className="font-semibold text-foreground">{waiting}</span> waiting ·{' '}
            <span className="font-semibold text-foreground">{completed}</span> completed · Token{' '}
            {current?.tokenNo ?? '—'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleNext} className="gap-1.5">
          <SkipForward className="w-3.5 h-3.5" /> Call next
        </Button>
      </motion.div>

      <motion.div {...fadeIn(1)} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: myQueue.length, color: '' },
          { label: 'Waiting', value: waiting, color: 'text-amber-600' },
          {
            label: 'In Consult',
            value: myQueue.filter((q) => q.status === 'in-consultation').length,
            color: 'text-emerald-600',
          },
          { label: 'Completed', value: completed, color: 'text-muted-foreground' },
        ].map((s) => (
          <div key={s.label} className="border rounded-xl p-4 bg-card text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </motion.div>

      <motion.div {...fadeIn(2)} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or token..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </motion.div>

      <motion.div {...fadeIn(3)} className="border rounded-xl bg-card overflow-hidden">
        <div className="divide-y">
          {filtered.map((p, index) => {
            const isCalled = p.status === 'called';
            const isActive = p.status === 'waiting' || isCalled || p.status === 'in-consultation';
            const queueRank = myQueue.indexOf(p) + 1;
            const displayToken = p.tokenNo > 0 ? p.tokenNo : queueRank;

            return (
              <div
                key={p.platformOpdVisitId ?? `${p.uhid}-${p.tokenNo}-${index}`}
                className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${
                  !isActive ? 'opacity-50' : ''
                } ${isCalled ? 'bg-primary/5' : ''}`}
              >
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded w-14 text-center shrink-0 ${
                    isCalled ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}
                >
                  #{displayToken}
                </span>
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold">
                    {p.patientName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold truncate">{p.patientName}</p>
                    <span className="text-[10px] font-mono text-muted-foreground">{p.uhid}</span>
                    {p.waitMinutes != null && (p.status === 'waiting' || p.status === 'called') ? (
                      <Badge variant="outline" className="text-[9px]">
                        {formatWaitMinutes(p.waitMinutes)}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {p.department} · {p.doctor} · {p.checkedInAt}
                    {p.complaint ? ` · ${p.complaint}` : ''}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span
                    className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusStyle[p.status]}`}
                  >
                    {p.status.replace('-', ' ')}
                  </span>
                  {p.status === 'waiting' || p.status === 'called' ? (
                    <Button size="sm" onClick={() => handleStart(p)} className="gap-1 text-xs h-8">
                      <Play className="w-3 h-3" />
                      {p.status === 'called' ? 'Start consult' : 'Call & start'}
                    </Button>
                  ) : null}
                  {p.status === 'in-consultation' ? (
                    <Button
                      size="sm"
                      onClick={() => navigate(`${roleBasePath}/consultation/${p.uhid}`)}
                      className="gap-1 text-xs h-8"
                    >
                      <Play className="w-3 h-3" /> Continue
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No patients in your queue. Patients appear after reception check-in.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
