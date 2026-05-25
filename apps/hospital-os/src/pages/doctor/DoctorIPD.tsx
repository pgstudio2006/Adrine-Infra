import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BedDouble,
  Search,
  AlertTriangle,
  Clock,
  Activity,
  Plus,
  Building2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useHospital } from '@/stores/hospitalStore';
import { useDoctorScope } from '@/hooks/useDoctorScope';
import { canUseIpdRuntime, platformListActiveIpdCensus, platformListIpdAllowedActions } from '@/runtime/ipd-runtime';
import { PlatformConnectivityStrip } from '@/components/PlatformConnectivityStrip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const fadeIn = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.3 },
});

type RoundStatus = 'pending' | 'seen' | 'follow-up-required';

interface IPDPatient {
  id: string;
  admissionId: string;
  uhid: string;
  bed: string;
  ward: string;
  room: string;
  department: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  diagnosis: string;
  admittedOn: string;
  daysAdmitted: number;
  condition: 'stable' | 'critical' | 'improving' | 'observation';
  roundStatus: RoundStatus;
  roundsDue: boolean;
}

function toShortDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function toDaysAdmitted(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 1;
  }
  const diffMs = Date.now() - parsed.getTime();
  return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
}

function deriveRoom(ward: string, bed: string, room?: string) {
  if (room) {
    return room;
  }

  const bedNumberPart = Number.parseInt(bed.split('-').pop() || '1', 10);
  const roomNo = Number.isNaN(bedNumberPart) ? 1 : Math.max(1, Math.ceil(bedNumberPart / 2));
  if (ward === 'ICU') {
    return `ICU Bay ${roomNo}`;
  }
  return `${ward} Room ${roomNo}`;
}

const conditionStyle: Record<string, { badge: string; dot: string }> = {
  stable: { badge: 'bg-emerald-500/10 text-emerald-600', dot: 'bg-emerald-500' },
  critical: { badge: 'bg-destructive/10 text-destructive', dot: 'bg-destructive' },
  improving: { badge: 'bg-blue-500/10 text-blue-600', dot: 'bg-blue-500' },
  observation: { badge: 'bg-amber-500/10 text-amber-600', dot: 'bg-amber-500' },
};

const roundStatusStyle: Record<RoundStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-700',
  seen: 'bg-emerald-500/10 text-emerald-700',
  'follow-up-required': 'bg-destructive/10 text-destructive',
};

const roundStatusLabel: Record<RoundStatus, string> = {
  pending: 'Pending',
  seen: 'Seen',
  'follow-up-required': 'Follow-up required',
};

export default function DoctorIPD() {
  const { nursingRounds, refreshPlatformIpdSnapshots } = useHospital();
  const { isDoctor, doctorName, department, admissions, patients } = useDoctorScope();
  const [search, setSearch] = useState('');
  const [platformCensusCount, setPlatformCensusCount] = useState<number | null>(null);
  const [platformError, setPlatformError] = useState<string | null>(null);

  const refreshPlatformCensus = useCallback(async () => {
    if (!canUseIpdRuntime()) {
      setPlatformCensusCount(null);
      setPlatformError(null);
      return;
    }
    try {
      await refreshPlatformIpdSnapshots();
      const rows = await platformListActiveIpdCensus();
      setPlatformCensusCount(rows.length);
      setPlatformError(null);
    } catch (e) {
      setPlatformError(e instanceof Error ? e.message : 'IPD census unavailable');
      setPlatformCensusCount(null);
    }
  }, [refreshPlatformIpdSnapshots]);

  useEffect(() => {
    void refreshPlatformCensus();
    if (!canUseIpdRuntime()) return;
    const t = setInterval(() => void refreshPlatformCensus(), 25_000);
    return () => clearInterval(t);
  }, [refreshPlatformCensus]);
  const [wardFilter, setWardFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | RoundStatus>('all');
  const [bedFilter, setBedFilter] = useState('');
  const [platformHints, setPlatformHints] = useState<
    Map<string, { state: string; allowed: string[] }>
  >(new Map());
  const navigate = useNavigate();

  const refreshPlatformHints = useCallback(async () => {
    if (!canUseIpdRuntime()) {
      setPlatformHints(new Map());
      return;
    }
    const linked = admissions.filter(
      (a) => a.status !== 'discharged' && a.platformAdmissionId,
    );
    const entries = await Promise.all(
      linked.map(async (admission) => {
        try {
          const lifecycle = await platformListIpdAllowedActions(admission.platformAdmissionId!);
          return [admission.id, { state: lifecycle.state, allowed: lifecycle.allowed }] as const;
        } catch {
          return null;
        }
      }),
    );
    const next = new Map<string, { state: string; allowed: string[] }>();
    entries.forEach((entry) => {
      if (entry) next.set(entry[0], entry[1]);
    });
    setPlatformHints(next);
  }, [admissions]);

  useEffect(() => {
    void refreshPlatformHints();
    if (!canUseIpdRuntime()) return;
    const timer = setInterval(() => void refreshPlatformHints(), 25_000);
    return () => clearInterval(timer);
  }, [refreshPlatformHints]);

  const latestRoundByAdmission = useMemo(() => {
    const map = new Map<string, (typeof nursingRounds)[number]>();
    nursingRounds.forEach((round) => {
      if (!map.has(round.admissionId)) {
        map.set(round.admissionId, round);
      }
    });
    return map;
  }, [nursingRounds]);

  const ipdPatients = useMemo<IPDPatient[]>(() => {
    return admissions
      .filter((admission) => admission.status !== 'discharged')
      .map((admission) => {
        const latestRound = latestRoundByAdmission.get(admission.id);
        const patientInfo = patients.find((patient) => patient.uhid === admission.uhid);
        const condition: IPDPatient['condition'] =
          admission.status === 'icu' || (latestRound ? latestRound.spo2 < 94 : false)
            ? 'critical'
            : admission.status === 'discharge-ready'
              ? 'improving'
              : admission.nursingPriority === 'high'
                ? 'observation'
                : 'stable';

        const roundStatus = admission.doctorRoundStatus;
        const roundsDue = roundStatus !== 'seen';

        return {
          id: admission.id,
          admissionId: admission.id,
          uhid: admission.uhid,
          bed: admission.bed,
          ward: admission.ward,
          room: deriveRoom(admission.ward, admission.bed, admission.room),
          department: patientInfo?.department || admission.journeyType,
          name: admission.patientName,
          age: patientInfo?.age ?? 0,
          gender: patientInfo?.gender === 'F' ? 'F' : 'M',
          diagnosis: admission.primaryDiagnosis,
          admittedOn: toShortDate(admission.admittedAt),
          daysAdmitted: toDaysAdmitted(admission.admittedAt),
          condition,
          roundStatus,
          roundsDue,
        };
      });
  }, [admissions, latestRoundByAdmission, patients]);

  const wards = useMemo(() => ['all', ...new Set(ipdPatients.map((item) => item.ward))], [ipdPatients]);
  const rooms = useMemo(() => ['all', ...new Set(ipdPatients.map((item) => item.room))], [ipdPatients]);

  const filtered = useMemo(() => {
    return ipdPatients.filter((patient) => {
      const query = search.toLowerCase();
      const matchSearch =
        patient.name.toLowerCase().includes(query) ||
        patient.bed.toLowerCase().includes(query) ||
        patient.ward.toLowerCase().includes(query) ||
        patient.room.toLowerCase().includes(query) ||
        patient.uhid.toLowerCase().includes(query);

      const matchesWard = wardFilter === 'all' || patient.ward === wardFilter;
      const matchesRoom = roomFilter === 'all' || patient.room === roomFilter;
      const matchesStatus = statusFilter === 'all' || patient.roundStatus === statusFilter;
      const matchesBed = bedFilter.trim() === '' || patient.bed.toLowerCase().includes(bedFilter.trim().toLowerCase());
      return matchSearch && matchesWard && matchesRoom && matchesStatus && matchesBed;
    });
  }, [bedFilter, ipdPatients, roomFilter, search, statusFilter, wardFilter]);

  const groupedByDepartment = useMemo(() => {
    const grouped = new Map<string, IPDPatient[]>();
    filtered.forEach((patient) => {
      const key = patient.department || 'Unassigned Department';
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)?.push(patient);
    });
    return Array.from(grouped.entries());
  }, [filtered]);

  const summary = {
    total: ipdPatients.length,
    critical: ipdPatients.filter((patient) => patient.condition === 'critical').length,
    pending: ipdPatients.filter((patient) => patient.roundStatus === 'pending').length,
    followUp: ipdPatients.filter((patient) => patient.roundStatus === 'follow-up-required').length,
  };

  if (!isDoctor) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Access denied. Only doctor users can access IPD rounds.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {canUseIpdRuntime() && (
        <PlatformConnectivityStrip
          label="Live IPD census"
          detail={
            platformCensusCount != null
              ? `Platform active admissions: ${platformCensusCount} · local board: ${summary.total}`
              : 'Loading IPD census…'
          }
          error={platformError}
        />
      )}
      <motion.div {...fadeIn(0)} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">IPD Doctor Rounds</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {doctorName} · {department || 'All Departments'} · <span className="font-semibold text-amber-700">{summary.pending} pending</span> · <span className="font-semibold text-destructive">{summary.followUp} follow-up required</span>
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => navigate('/reception/registration')}>
          <Plus className="w-3.5 h-3.5" /> Admit Patient
        </Button>
      </motion.div>

      <motion.div {...fadeIn(1)} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Admitted', value: summary.total, icon: BedDouble, color: '' },
          { label: 'Critical', value: summary.critical, icon: AlertTriangle, color: 'text-destructive' },
          { label: 'Pending Rounds', value: summary.pending, icon: Clock, color: 'text-amber-700' },
          { label: 'Follow-up Required', value: summary.followUp, icon: Activity, color: 'text-blue-700' },
        ].map((item) => (
          <div key={item.label} className="border rounded-xl p-4 bg-card flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <item.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-[11px] text-muted-foreground">{item.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div {...fadeIn(2)} className="border rounded-xl p-4 bg-card space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient, UHID, ward, room, or bed"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <Select value={wardFilter} onValueChange={setWardFilter}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Filter by ward" />
            </SelectTrigger>
            <SelectContent portal className="z-[120]">
              <SelectItem value="all">All wards</SelectItem>
              {wards.filter((item) => item !== 'all').map((ward) => (
                <SelectItem key={ward} value={ward}>{ward}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={roomFilter} onValueChange={setRoomFilter}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Filter by room" />
            </SelectTrigger>
            <SelectContent portal className="z-[120]">
              <SelectItem value="all">All rooms</SelectItem>
              {rooms.filter((item) => item !== 'all').map((room) => (
                <SelectItem key={room} value={room}>{room}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Filter by bed"
            value={bedFilter}
            onChange={(event) => setBedFilter(event.target.value)}
            className="h-9 text-xs"
          />

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | RoundStatus)}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Round status" />
            </SelectTrigger>
            <SelectContent portal className="z-[120]">
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="seen">Seen</SelectItem>
              <SelectItem value="follow-up-required">Follow-up required</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <motion.div {...fadeIn(3)} className="space-y-4">
        {groupedByDepartment.map(([dept, deptPatients]) => (
          <div key={dept} className="space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-semibold">{dept}</p>
              <span className="text-xs text-muted-foreground">{deptPatients.length} admitted</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {deptPatients.map((patient) => {
                const cond = conditionStyle[patient.condition];
                const hint = platformHints.get(patient.admissionId);
                return (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => navigate(`/doctor/ipd/${patient.admissionId}`)}
                    className="text-left border rounded-xl p-4 bg-card hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-muted px-2 py-0.5 rounded">{patient.bed}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${roundStatusStyle[patient.roundStatus]}`}>
                          {roundStatusLabel[patient.roundStatus]}
                        </span>
                      </div>
                      <span className={`w-2 h-2 rounded-full ${cond.dot}`} />
                    </div>
                    <p className="text-sm font-semibold">{patient.name}</p>
                    <p className="text-[11px] text-muted-foreground">{patient.age}y/{patient.gender} · Day {patient.daysAdmitted} · Admitted {patient.admittedOn}</p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{patient.diagnosis}</p>
                    {hint ? (
                      <p className="text-[10px] text-violet-700 dark:text-violet-300 mt-1 truncate">
                        Platform: {hint.state.replace(/_/g, ' ')}
                        {hint.allowed.length > 0 ? ` · Next: ${hint.allowed.slice(0, 2).join(', ')}` : ''}
                      </p>
                    ) : null}
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${cond.badge}`}>
                        {patient.condition}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{patient.ward} · {patient.room}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {groupedByDepartment.length === 0 && (
          <div className="border rounded-xl bg-card py-10 text-center text-sm text-muted-foreground">
            No admitted patients found for the current filters.
          </div>
        )}
      </motion.div>
    </div>
  );
}
