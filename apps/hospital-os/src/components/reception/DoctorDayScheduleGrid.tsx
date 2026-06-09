import type { HospitalAppointment } from '@/stores/hospitalStore';
import type { SeniorDoctor } from '@/lib/scheduling/senior-doctor-registry';
import { isDoctorOnLeave } from '@/lib/scheduling/senior-doctor-registry';
import {
  SLOT_INTERVAL_MINUTES,
  appointmentRange,
  appointmentsForDoctorOnDate,
  buildTimeSlots,
  timeToMinutes,
} from '@/lib/scheduling/appointment-slots';

const TIME_SLOTS = buildTimeSlots();

const STATUS_STYLES: Record<HospitalAppointment['status'], string> = {
  scheduled: 'bg-info/15 border-info/30 text-info',
  confirmed: 'bg-success/15 border-success/30 text-success',
  'checked-in': 'bg-primary/15 border-primary/30 text-primary',
  'in-consultation': 'bg-warning/15 border-warning/30 text-warning',
  completed: 'bg-muted border-border text-muted-foreground',
  cancelled: 'bg-destructive/10 border-destructive/20 text-destructive line-through',
  'no-show': 'bg-warning/10 border-warning/20 text-warning',
};

export type ScheduleGridAction = 'check-in' | 'reschedule' | 'cancel' | 'complete' | 'open';

interface Props {
  doctors: SeniorDoctor[];
  appointments: HospitalAppointment[];
  date: string;
  mode?: 'appointments' | 'check-in';
  onAction?: (action: ScheduleGridAction, appointment: HospitalAppointment) => void;
  onEmptySlotClick?: (doctor: SeniorDoctor, time: string) => void;
}

function slotCoveredByAppointment(
  doctorAppointments: HospitalAppointment[],
  slot: string,
): { appointment: HospitalAppointment; isStart: boolean } | null {
  const slotMinute = timeToMinutes(slot);
  for (const appointment of doctorAppointments) {
    const { start, end } = appointmentRange(appointment);
    if (slotMinute >= start && slotMinute < end) {
      return { appointment, isStart: appointment.time === slot };
    }
  }
  return null;
}

export function DoctorDayScheduleGrid({
  doctors,
  appointments,
  date,
  mode = 'appointments',
  onAction,
  onEmptySlotClick,
}: Props) {
  if (doctors.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
        No senior doctors configured. Add doctors in Admin → Settings → Scheduling.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div
        className="grid border-b bg-muted/30"
        style={{ gridTemplateColumns: `5rem repeat(${doctors.length}, minmax(180px, 1fr))` }}
      >
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">Time</div>
        {doctors.map((doctor) => {
          const onLeave = isDoctorOnLeave(doctor.name, date);
          return (
            <div key={doctor.id} className="px-3 py-2 border-l text-center">
              <p className="text-sm font-semibold truncate">{doctor.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{doctor.department}</p>
              {onLeave ? (
                <p className="text-[10px] text-destructive font-medium mt-0.5">On leave</p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="max-h-[70vh] overflow-auto">
        {TIME_SLOTS.map((slot) => (
          <div
            key={slot}
            className="grid min-h-[44px] border-b last:border-b-0"
            style={{ gridTemplateColumns: `5rem repeat(${doctors.length}, minmax(180px, 1fr))` }}
          >
            <div className="px-3 py-2 text-xs font-mono text-muted-foreground border-r bg-muted/10">
              {slot}
            </div>
            {doctors.map((doctor) => {
              const doctorAppointments = appointmentsForDoctorOnDate(appointments, doctor.name, date);
              const covered = slotCoveredByAppointment(doctorAppointments, slot);
              const appointment = covered?.appointment;
              const isStart = covered?.isStart ?? false;
              const onLeave = isDoctorOnLeave(doctor.name, date);

              if (appointment && !isStart) {
                return (
                  <div
                    key={doctor.id}
                    className="border-l bg-muted/10"
                    title={`${appointment.patientName} (${appointment.duration} min)`}
                  />
                );
              }

              if (appointment && isStart) {
                return (
                  <div key={doctor.id} className="border-l p-1 align-top">
                    <div
                      className={`rounded-lg border px-2 py-1.5 h-full ${STATUS_STYLES[appointment.status]}`}
                    >
                      <p className="text-xs font-semibold truncate">{appointment.patientName}</p>
                      <p className="text-[10px] opacity-80 truncate">
                        {appointment.time} · {appointment.duration}m · {appointment.uhid}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {mode === 'check-in'
                          && (appointment.status === 'scheduled' || appointment.status === 'confirmed') ? (
                            <button
                              type="button"
                              onClick={() => onAction?.('check-in', appointment)}
                              className="text-[10px] px-1.5 py-0.5 rounded border bg-background hover:bg-accent"
                            >
                              Check in
                            </button>
                          ) : null}
                        {mode === 'appointments' ? (
                          <>
                            {(appointment.status === 'scheduled' || appointment.status === 'confirmed') ? (
                              <button
                                type="button"
                                onClick={() => onAction?.('check-in', appointment)}
                                className="text-[10px] px-1.5 py-0.5 rounded border bg-background hover:bg-accent"
                              >
                                Check in
                              </button>
                            ) : null}
                            {appointment.status !== 'cancelled' && appointment.status !== 'completed' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onAction?.('reschedule', appointment)}
                                  className="text-[10px] px-1.5 py-0.5 rounded border bg-background hover:bg-accent"
                                >
                                  Reschedule
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onAction?.('cancel', appointment)}
                                  className="text-[10px] px-1.5 py-0.5 rounded border border-destructive/30 text-destructive hover:bg-destructive/10"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : null}
                            {appointment.status !== 'completed' && appointment.status !== 'cancelled' ? (
                              <button
                                type="button"
                                onClick={() => onAction?.('complete', appointment)}
                                className="text-[10px] px-1.5 py-0.5 rounded border bg-background hover:bg-accent"
                              >
                                Complete
                              </button>
                            ) : null}
                          </>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => onAction?.('open', appointment)}
                          className="text-[10px] px-1.5 py-0.5 rounded border bg-background hover:bg-accent"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={doctor.id}
                  type="button"
                  disabled={onLeave || !onEmptySlotClick}
                  onClick={() => onEmptySlotClick?.(doctor, slot)}
                  className={`border-l min-h-[44px] transition-colors ${
                    onLeave
                      ? 'bg-destructive/5 cursor-not-allowed'
                      : onEmptySlotClick
                        ? 'hover:bg-accent/40'
                        : ''
                  }`}
                  title={onLeave ? 'Doctor on leave' : 'Book this slot'}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Appointments that start within a slot window (used by legacy list helpers). */
export function appointmentStartsInSlot(appointment: HospitalAppointment, slot: string): boolean {
  return appointment.time === slot;
}

export function appointmentCoversSlot(appointment: HospitalAppointment, slot: string): boolean {
  const slotMinute = timeToMinutes(slot);
  const { start, end } = appointmentRange(appointment);
  return slotMinute >= start && slotMinute < end;
}
