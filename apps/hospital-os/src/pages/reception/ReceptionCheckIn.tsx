import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useHospital } from '@/stores/hospitalStore';
import { InlinePlatformError } from '@/components/opd/InlinePlatformError';
import { useReceptionPlatform } from '@/hooks/useReceptionPlatform';
import { listSeniorDoctors } from '@/lib/scheduling/senior-doctor-registry';
import {
  DoctorDayScheduleGrid,
  type ScheduleGridAction,
} from '@/components/reception/DoctorDayScheduleGrid';
import type { HospitalAppointment } from '@/stores/hospitalStore';
import type { SeniorDoctor } from '@/lib/scheduling/senior-doctor-registry';

function toYmd(date: Date) {
  return date.toISOString().split('T')[0];
}

const TODAY = toYmd(new Date());

export default function ReceptionCheckIn() {
  const {
    appointments,
    checkInPatient,
  } = useHospital();
  const { error: platformError, loading } = useReceptionPlatform({
    queue: true,
    appointments: true,
  });
  const [errorDismissed, setErrorDismissed] = useState(false);
  const [search, setSearch] = useState('');
  const [seniorDoctors, setSeniorDoctors] = useState<SeniorDoctor[]>(() => listSeniorDoctors());

  useEffect(() => {
    setErrorDismissed(false);
  }, [platformError]);

  useEffect(() => {
    setSeniorDoctors(listSeniorDoctors());
  }, []);

  const seniorDoctorNames = useMemo(
    () => new Set(seniorDoctors.map((doctor) => doctor.name)),
    [seniorDoctors],
  );

  const todaysAppointments = useMemo(() => {
    const query = search.toLowerCase();
    return appointments
      .filter((appointment) => appointment.date === TODAY)
      .filter((appointment) => seniorDoctorNames.has(appointment.doctor))
      .filter((appointment) => {
        if (!query) return true;
        return (
          appointment.patientName.toLowerCase().includes(query)
          || appointment.id.toLowerCase().includes(query)
          || appointment.uhid.toLowerCase().includes(query)
          || appointment.phone.includes(search)
          || appointment.doctor.toLowerCase().includes(query)
        );
      })
      .filter(
        (appointment) =>
          appointment.status !== 'cancelled' && appointment.status !== 'no-show',
      );
  }, [appointments, search, seniorDoctorNames]);

  const stats = {
    scheduled: todaysAppointments.filter(
      (appointment) => appointment.status === 'scheduled' || appointment.status === 'confirmed',
    ).length,
    checkedIn: todaysAppointments.filter(
      (appointment) =>
        appointment.status === 'checked-in' || appointment.status === 'in-consultation',
    ).length,
    completed: todaysAppointments.filter((appointment) => appointment.status === 'completed').length,
  };

  const handleGridAction = (action: ScheduleGridAction, appointment: HospitalAppointment) => {
    if (action === 'check-in') {
      checkInPatient(appointment.id, appointment.notes);
    }
  };

  return (
    <div className="space-y-6">
      <InlinePlatformError
        message={errorDismissed ? null : platformError}
        onDismiss={() => setErrorDismissed(true)}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Patient Check-In</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Today&apos;s appointments only — check in patients with a scheduled senior-doctor visit
          </p>
        </div>
        <div className="text-sm text-muted-foreground font-medium px-3 py-2 rounded-lg border bg-card">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-xl font-bold">{stats.scheduled}</p>
          <p className="text-xs text-muted-foreground">Awaiting check-in</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-xl font-bold">{stats.checkedIn}</p>
          <p className="text-xs text-muted-foreground">Checked in / with doctor</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-xl font-bold">{stats.completed}</p>
          <p className="text-xs text-muted-foreground">Completed today</p>
        </div>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl border bg-card text-sm"
          placeholder="Search patient, UHID, doctor, or phone"
        />
      </div>

      <DoctorDayScheduleGrid
        doctors={seniorDoctors}
        appointments={todaysAppointments}
        date={TODAY}
        mode="check-in"
        onAction={handleGridAction}
      />

      {todaysAppointments.length === 0 && !loading && (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          {platformError && !errorDismissed
            ? 'Appointments could not sync from the platform. Fix the error above and retry.'
            : 'No appointments scheduled for today with senior doctors.'}
        </div>
      )}
    </div>
  );
}
