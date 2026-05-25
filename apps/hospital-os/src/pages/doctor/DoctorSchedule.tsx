import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CalendarClock, BedDouble, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDoctorScope } from '@/hooks/useDoctorScope';
import {
  canUseSchedulingRuntime,
  platformListAppointmentsInRange,
} from '@/runtime/scheduling-runtime';
import { PlatformConnectivityStrip } from '@/components/PlatformConnectivityStrip';

const fadeIn = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.3 },
});

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type ScheduleEventType = 'appointment' | 'round';

interface ScheduleEvent {
  id: string;
  dayIndex: number;
  title: string;
  subtitle: string;
  time: string;
  sortMinutes: number;
  type: ScheduleEventType;
}

function getStartOfWeek(offset: number) {
  const today = new Date();
  const currentDay = today.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() + mondayOffset + offset * 7);
  return monday;
}

function addDays(base: Date, days: number) {
  const date = new Date(base);
  date.setDate(base.getDate() + days);
  return date;
}

function toDateOnly(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function parseTimeToMinutes(input: string) {
  const value = input.trim().toUpperCase();

  if (value.includes('AM') || value.includes('PM')) {
    const sanitized = value.replace(/\s+/g, '');
    const isPm = sanitized.endsWith('PM');
    const [hourRaw, minuteRaw] = sanitized.replace(/AM|PM/g, '').split(':');
    const hour = Number(hourRaw) % 12 + (isPm ? 12 : 0);
    const minute = Number(minuteRaw || '0');
    return hour * 60 + minute;
  }

  const [hourRaw, minuteRaw] = value.split(':');
  const hour = Number(hourRaw || '0');
  const minute = Number(minuteRaw || '0');
  return hour * 60 + minute;
}

function toDisplayTime(input: string) {
  const minutes = parseTimeToMinutes(input);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const twelveHour = ((hours + 11) % 12) + 1;
  return `${String(twelveHour).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${ampm}`;
}

const typeStyles: Record<ScheduleEventType, string> = {
  appointment: 'bg-foreground/5 border border-foreground/20 text-foreground',
  round: 'bg-blue-500/10 border border-blue-500/30 text-blue-700',
};

export default function DoctorSchedule() {
  const { isDoctor, doctorName, department, appointments, admissions } = useDoctorScope();
  const [weekOffset, setWeekOffset] = useState(0);
  const [platformApptCount, setPlatformApptCount] = useState<number | null>(null);
  const [platformError, setPlatformError] = useState<string | null>(null);

  const weekStart = useMemo(() => getStartOfWeek(weekOffset), [weekOffset]);
  const weekDays = useMemo(() => DAYS.map((_, index) => addDays(weekStart, index)), [weekStart]);
  const weekStartMs = toDateOnly(weekDays[0]);
  const weekEndMs = toDateOnly(weekDays[6]);

  const refreshPlatformAppointments = useCallback(async () => {
    if (!canUseSchedulingRuntime()) {
      setPlatformApptCount(null);
      setPlatformError(null);
      return;
    }
    try {
      const from = weekDays[0].toISOString();
      const to = addDays(weekDays[6], 1).toISOString();
      const rows = await platformListAppointmentsInRange(from, to);
      setPlatformApptCount(rows.length);
      setPlatformError(null);
    } catch (e) {
      setPlatformError(e instanceof Error ? e.message : 'Appointments unavailable');
      setPlatformApptCount(null);
    }
  }, [weekDays]);

  useEffect(() => {
    void refreshPlatformAppointments();
  }, [refreshPlatformAppointments]);

  const events = useMemo<ScheduleEvent[]>(() => {
    const next: ScheduleEvent[] = [];

    appointments.forEach((appointment) => {
      const appointmentDate = new Date(`${appointment.date}T00:00:00`);
      const appointmentMs = toDateOnly(appointmentDate);
      if (appointmentMs < weekStartMs || appointmentMs > weekEndMs) {
        return;
      }

      const dayIndex = weekDays.findIndex((day) => toDateOnly(day) === appointmentMs);
      if (dayIndex < 0) {
        return;
      }

      next.push({
        id: appointment.id,
        dayIndex,
        title: appointment.patientName,
        subtitle: `${appointment.type} · ${appointment.status}`,
        time: toDisplayTime(appointment.time),
        sortMinutes: parseTimeToMinutes(appointment.time),
        type: 'appointment',
      });
    });

    admissions
      .filter((admission) => admission.status !== 'discharged')
      .forEach((admission) => {
        const roundTime = admission.nextDoctorRoundAt || '11:00 AM';
        if (roundTime.toLowerCase().includes('every')) {
          return;
        }

        const minutes = parseTimeToMinutes(roundTime);
        weekDays.forEach((_, dayIndex) => {
          next.push({
            id: `${admission.id}-${dayIndex}`,
            dayIndex,
            title: `IPD Round · ${admission.patientName}`,
            subtitle: `${admission.ward} · ${admission.bed}`,
            time: toDisplayTime(roundTime),
            sortMinutes: minutes,
            type: 'round',
          });
        });
      });

    return next.sort((a, b) => a.dayIndex - b.dayIndex || a.sortMinutes - b.sortMinutes);
  }, [admissions, appointments, weekDays, weekEndMs, weekStartMs]);

  const eventsByDay = useMemo(() => {
    return DAYS.map((_, dayIndex) => events.filter((event) => event.dayIndex === dayIndex));
  }, [events]);

  const weekAppointments = events.filter((event) => event.type === 'appointment');
  const completedAppointments = weekAppointments.filter((event) => event.subtitle.includes('completed')).length;
  const pendingAppointments = weekAppointments.length - completedAppointments;
  const roundsPlanned = events.filter((event) => event.type === 'round').length;
  const availableSlots = Math.max(0, 70 - weekAppointments.length);

  if (!isDoctor) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Access denied. Only doctor users can view schedules.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {canUseSchedulingRuntime() && (
        <PlatformConnectivityStrip
          label="Live appointments"
          detail={
            platformApptCount != null
              ? `Platform appointments this week: ${platformApptCount} · local calendar events: ${weekAppointments.length}`
              : 'Loading appointment range…'
          }
          error={platformError}
        />
      )}
      <motion.div {...fadeIn(0)} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Weekly Schedule</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {doctorName} · {department || 'All Departments'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset((prev) => prev - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <button
            onClick={() => setWeekOffset(0)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-muted hover:bg-accent transition-colors"
          >
            This Week
          </button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset((prev) => prev + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      <motion.div {...fadeIn(1)} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-xl p-4 bg-card">
          <p className="text-xl font-bold">{weekAppointments.length}</p>
          <p className="text-xs text-muted-foreground">Appointments</p>
        </div>
        <div className="border rounded-xl p-4 bg-card">
          <p className="text-xl font-bold text-emerald-600">{completedAppointments}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
        <div className="border rounded-xl p-4 bg-card">
          <p className="text-xl font-bold text-amber-600">{pendingAppointments}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
        <div className="border rounded-xl p-4 bg-card">
          <p className="text-xl font-bold text-blue-700">{availableSlots}</p>
          <p className="text-xs text-muted-foreground">Available Slots</p>
        </div>
      </motion.div>

      <motion.div {...fadeIn(2)} className="grid grid-cols-1 lg:grid-cols-7 gap-3">
        {weekDays.map((day, index) => {
          const dayEvents = eventsByDay[index];
          const isToday = toDateOnly(day) === toDateOnly(new Date());

          return (
            <div key={day.toISOString()} className={`border rounded-xl bg-card min-h-[360px] ${isToday ? 'ring-1 ring-foreground/20' : ''}`}>
              <div className="p-3 border-b">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{DAYS[index].slice(0, 3)}</p>
                <p className="text-sm font-semibold">
                  {day.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </p>
              </div>

              <div className="p-2 space-y-2 max-h-[300px] overflow-y-auto">
                {dayEvents.length === 0 && (
                  <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                    No slots planned
                  </div>
                )}

                {dayEvents.map((event) => (
                  <div key={event.id} className={`rounded-lg p-2 ${typeStyles[event.type]}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold leading-tight">{event.title}</p>
                      <span className="text-[10px] font-semibold whitespace-nowrap">{event.time}</span>
                    </div>
                    <p className="text-[11px] mt-1 opacity-80">{event.subtitle}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </motion.div>

      <motion.div {...fadeIn(3)} className="flex items-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-foreground/5 border border-foreground/20" />
          <User className="w-3 h-3" /> OPD Appointment
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-500/10 border border-blue-500/30" />
          <BedDouble className="w-3 h-3" /> IPD Round
        </span>
        <span className="flex items-center gap-1.5">
          <CalendarClock className="w-3 h-3" /> {roundsPlanned} round slot(s)
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" /> Week starts Monday
        </span>
      </motion.div>
    </div>
  );
}
