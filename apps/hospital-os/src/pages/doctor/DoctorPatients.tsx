import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Stethoscope, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDoctorScope } from '@/hooks/useDoctorScope';

const fadeIn = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.3 },
});

type PatientStatus = 'active' | 'discharged' | 'follow-up' | 'critical';

interface DoctorPatientRow {
  uhid: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  diagnosis: string;
  city: string;
  bloodGroup: string;
  visits: number;
  status: PatientStatus;
  lastVisit: string;
}

const statusStyles: Record<PatientStatus, string> = {
  active: 'bg-emerald-500/10 text-emerald-600',
  'follow-up': 'bg-blue-500/10 text-blue-600',
  critical: 'bg-destructive/10 text-destructive',
  discharged: 'bg-muted text-muted-foreground',
};

const filterOptions: Array<'All' | 'Active' | 'Follow-up' | 'Critical' | 'Discharged'> = [
  'All',
  'Active',
  'Follow-up',
  'Critical',
  'Discharged',
];

function getPatientStatus(input: {
  hasCriticalAdmission: boolean;
  hasActiveAdmission: boolean;
  hasDischargedAdmission: boolean;
  hasActiveQueue: boolean;
  hasSeenToday: boolean;
}): PatientStatus {
  if (input.hasCriticalAdmission) {
    return 'critical';
  }
  if (input.hasActiveAdmission || input.hasActiveQueue) {
    return 'active';
  }
  if (input.hasDischargedAdmission) {
    return 'discharged';
  }
  if (input.hasSeenToday) {
    return 'follow-up';
  }
  return 'follow-up';
}

export default function DoctorPatients() {
  const {
    isDoctor,
    doctorName,
    department,
    patients,
    queue,
    admissions,
    appointments,
  } = useDoctorScope();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<typeof filterOptions[number]>('All');
  const navigate = useNavigate();

  const todayIso = new Date().toISOString().split('T')[0];

  const patientRows = useMemo<DoctorPatientRow[]>(() => {
    return patients.map((patient) => {
      const patientAdmissions = admissions.filter((admission) => admission.uhid === patient.uhid);
      const patientQueue = queue.filter((entry) => entry.uhid === patient.uhid);
      const patientAppointments = appointments.filter((appointment) => appointment.uhid === patient.uhid);

      const hasCriticalAdmission = patientAdmissions.some((admission) => {
        return admission.status === 'icu' || admission.nursingPriority === 'high';
      });
      const hasActiveAdmission = patientAdmissions.some((admission) => admission.status !== 'discharged' && admission.status !== 'discharge-ready');
      const hasDischargedAdmission = patientAdmissions.some((admission) => admission.status === 'discharged');
      const hasActiveQueue = patientQueue.some((entry) => {
        return entry.status === 'waiting' || entry.status === 'called' || entry.status === 'in-consultation';
      });
      const hasSeenToday = patientAppointments.some((appointment) => {
        return appointment.date === todayIso && appointment.status === 'completed';
      });

      return {
        uhid: patient.uhid,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone,
        diagnosis: patient.chronicDiseases || patient.allergies || patient.department || 'Clinical review in progress',
        city: patient.branch,
        bloodGroup: patient.bloodGroup || '--',
        visits: patientAppointments.length,
        status: getPatientStatus({
          hasCriticalAdmission,
          hasActiveAdmission,
          hasDischargedAdmission,
          hasActiveQueue,
          hasSeenToday,
        }),
        lastVisit: patient.lastVisit || patient.registeredOn,
      };
    });
  }, [admissions, appointments, patients, queue, todayIso]);

  const filtered = patientRows.filter((patient) => {
    const query = search.toLowerCase().trim();
    const matchSearch =
      patient.name.toLowerCase().includes(query) ||
      patient.uhid.toLowerCase().includes(query) ||
      patient.diagnosis.toLowerCase().includes(query) ||
      patient.phone.includes(query);

    const matchFilter = filter === 'All' || patient.status === filter.toLowerCase();
    return matchSearch && matchFilter;
  });

  if (!isDoctor) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Access denied. Only doctor users can view assigned patients.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div {...fadeIn(0)} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Patients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {doctorName} · {department || 'All Departments'} · {patientRows.length} assigned patient(s)
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => navigate('/doctor/queue')}>
          <Stethoscope className="w-3.5 h-3.5" /> Open OPD Queue
        </Button>
      </motion.div>

      <motion.div {...fadeIn(1)} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, UHID, diagnosis, or phone..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {filterOptions.map((option) => (
            <button
              key={option}
              onClick={() => setFilter(option)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === option ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div {...fadeIn(2)} className="border rounded-xl bg-card overflow-hidden">
        <div className="divide-y">
          {filtered.map((patient) => (
            <div
              key={patient.uhid}
              onClick={() => navigate(`/doctor/patients/${patient.uhid}`)}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold">{patient.name.split(' ').map((part) => part[0]).join('')}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{patient.name}</p>
                  <span className="text-[10px] font-mono text-muted-foreground">{patient.uhid}</span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {patient.age}y/{patient.gender} · {patient.diagnosis}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  Last visit: {patient.lastVisit} · Blood group: {patient.bloodGroup}
                </p>
              </div>
              <div className="text-right shrink-0 flex items-center gap-2">
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusStyles[patient.status]}`}>
                  {patient.status}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No assigned patients match your filters.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
