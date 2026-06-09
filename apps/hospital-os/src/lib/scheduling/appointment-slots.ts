import type { HospitalAppointment } from '@/stores/hospitalStore';
import { isDoctorOnLeave } from '@/lib/scheduling/senior-doctor-registry';

export const SLOT_INTERVAL_MINUTES = 15;
export const DAY_START_HOUR = 7;
export const DAY_END_HOUR = 20;

export function buildTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = DAY_START_HOUR; hour <= DAY_END_HOUR; hour++) {
    for (const minute of ['00', '15', '30', '45']) {
      slots.push(`${String(hour).padStart(2, '0')}:${minute}`);
    }
  }
  return slots;
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function appointmentRange(appointment: Pick<HospitalAppointment, 'time' | 'duration'>): {
  start: number;
  end: number;
} {
  const start = timeToMinutes(appointment.time);
  return { start, end: start + appointment.duration };
}

export function rangesOverlap(
  leftStart: number,
  leftEnd: number,
  rightStart: number,
  rightEnd: number,
): boolean {
  return leftStart < rightEnd && rightStart < leftEnd;
}

const INACTIVE_STATUSES: HospitalAppointment['status'][] = ['cancelled', 'no-show'];

export function findAppointmentConflict(
  appointments: HospitalAppointment[],
  input: {
    doctor: string;
    date: string;
    time: string;
    duration: number;
    excludeId?: string;
  },
): HospitalAppointment | null {
  const start = timeToMinutes(input.time);
  const end = start + input.duration;

  return (
    appointments.find((appointment) => {
      if (input.excludeId && appointment.id === input.excludeId) return false;
      if (appointment.doctor !== input.doctor) return false;
      if (appointment.date !== input.date) return false;
      if (INACTIVE_STATUSES.includes(appointment.status)) return false;
      const range = appointmentRange(appointment);
      return rangesOverlap(start, end, range.start, range.end);
    }) ?? null
  );
}

export function isSlotAvailable(
  appointments: HospitalAppointment[],
  doctor: string,
  date: string,
  time: string,
  duration: number,
  excludeId?: string,
): boolean {
  if (isDoctorOnLeave(doctor, date)) return false;
  return !findAppointmentConflict(appointments, { doctor, date, time, duration, excludeId });
}

export function slotBlockReason(
  appointments: HospitalAppointment[],
  doctor: string,
  date: string,
  time: string,
  duration: number,
  excludeId?: string,
): string | null {
  if (isDoctorOnLeave(doctor, date)) {
    return 'Doctor is on leave';
  }
  const conflict = findAppointmentConflict(appointments, {
    doctor,
    date,
    time,
    duration,
    excludeId,
  });
  if (conflict) {
    return `Blocked by ${conflict.patientName} (${conflict.time}, ${conflict.duration} min)`;
  }
  return null;
}

export function appointmentsForDoctorOnDate(
  appointments: HospitalAppointment[],
  doctor: string,
  date: string,
): HospitalAppointment[] {
  return appointments
    .filter(
      (appointment) =>
        appointment.doctor === doctor
        && appointment.date === date
        && !INACTIVE_STATUSES.includes(appointment.status),
    )
    .sort((left, right) => left.time.localeCompare(right.time));
}

export function slotRowSpan(durationMinutes: number): number {
  return Math.max(1, Math.ceil(durationMinutes / SLOT_INTERVAL_MINUTES));
}
