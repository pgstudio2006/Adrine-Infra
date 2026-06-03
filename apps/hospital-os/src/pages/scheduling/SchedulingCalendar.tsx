import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlatformConnectivityStrip } from '@/components/PlatformConnectivityStrip';
import { useSchedulingPlatform } from '@/hooks/useSchedulingPlatform';
import type { PlatformAppointment } from '@/runtime/scheduling-runtime';
import { pickPlatformRows } from '@/lib/platform/demo-fallback';
import { PlatformEmptyState } from '@/components/platform/PlatformEmptyState';
import {
  WEEK_DAY_LABELS,
  addDays,
  formatTimeFromIso,
  formatWeekRangeLabel,
  getStartOfWeek,
  toDateOnlyMs,
} from '@/lib/scheduling/week-range';

const STATUS_STYLE: Record<string, string> = {
  confirmed: 'bg-info/10 text-info border-info/30',
  checked_in: 'bg-success/10 text-success border-success/30',
  completed: 'bg-muted text-muted-foreground border-border',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
  no_show: 'bg-warning/10 text-warning border-warning/30',
  scheduled: 'bg-foreground/5 text-foreground border-border',
};

function statusLabel(status: string): string {
  return status.replace(/_/g, ' ');
}

type CalendarEvent = {
  id: string;
  dayIndex: number;
  title: string;
  subtitle: string;
  time: string;
  sortMs: number;
  status: string;
};

function mapPlatformAppointment(appt: PlatformAppointment, weekDays: Date[]): CalendarEvent | null {
  const start = new Date(appt.startAt);
  const dayMs = toDateOnlyMs(start);
  const dayIndex = weekDays.findIndex((d) => toDateOnlyMs(d) === dayMs);
  if (dayIndex < 0) return null;

  const patientName = appt.patient?.fullName ?? `Patient ${appt.patientId.slice(0, 8)}`;
  return {
    id: appt.id,
    dayIndex,
    title: patientName,
    subtitle: `${appt.resourceLabel} · ${statusLabel(appt.status)}`,
    time: formatTimeFromIso(appt.startAt),
    sortMs: start.getTime(),
    status: appt.status,
  };
}

const DEMO_EVENTS: CalendarEvent[] = [
  { id: 'd1', dayIndex: 0, title: 'Amit Shah', subtitle: 'Cardiology · confirmed', time: '10:00 AM', sortMs: 0, status: 'confirmed' },
  { id: 'd2', dayIndex: 1, title: 'Priya Patel', subtitle: 'Follow-up · scheduled', time: '11:30 AM', sortMs: 0, status: 'scheduled' },
  { id: 'd3', dayIndex: 2, title: 'Rajesh T.', subtitle: 'Orthopedics · confirmed', time: '2:00 PM', sortMs: 0, status: 'confirmed' },
  { id: 'd4', dayIndex: 4, title: 'Fatima B.', subtitle: 'Teleconsult · confirmed', time: '9:00 AM', sortMs: 0, status: 'confirmed' },
];

export default function SchedulingCalendar() {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = useMemo(() => getStartOfWeek(weekOffset), [weekOffset]);
  const weekDays = useMemo(() => WEEK_DAY_LABELS.map((_, i) => addDays(weekStart, i)), [weekStart]);

  const rangeFrom = weekDays[0].toISOString();
  const rangeTo = addDays(weekDays[6], 1).toISOString();

  const { platformOn, loading, error, appointments } = useSchedulingPlatform(rangeFrom, rangeTo);

  const events = useMemo(() => {
    const platformEvents = appointments
      .map((a) => mapPlatformAppointment(a, weekDays))
      .filter((e): e is CalendarEvent => e != null)
      .sort((a, b) => a.dayIndex - b.dayIndex || a.sortMs - b.sortMs);
    return pickPlatformRows(platformOn && appointments.length > 0, platformEvents, DEMO_EVENTS);
  }, [platformOn, appointments, weekDays]);

  const eventsByDay = useMemo(
    () => WEEK_DAY_LABELS.map((_, dayIndex) => events.filter((e) => e.dayIndex === dayIndex)),
    [events],
  );

  const todayMs = toDateOnlyMs(new Date());

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Central Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Week grid from scheduling range API — all resources and branches on one board
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((p) => p - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <button
            type="button"
            onClick={() => setWeekOffset(0)}
            className="text-sm font-medium text-foreground px-3 py-1.5 rounded-lg bg-muted hover:bg-accent transition-colors min-w-[180px] text-center"
          >
            {formatWeekRangeLabel(weekStart)}
          </button>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((p) => p + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {platformOn && (
        <PlatformConnectivityStrip
          label="Scheduling range"
          detail={
            loading
              ? 'Loading GET /scheduling/appointments/range…'
              : `${appointments.length} appointment(s) in this week`
          }
          error={error}
        />
      )}

      {!platformOn && events.length === 0 && (
        <PlatformEmptyState message="Enable platform runtime to load live appointments from domain-api scheduling range." />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">This week</p>
          <p className="text-2xl font-bold">{events.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Confirmed / checked-in</p>
          <p className="text-2xl font-bold text-emerald-600">
            {events.filter((e) => e.status === 'confirmed' || e.status === 'checked_in').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Cancelled / no-show</p>
          <p className="text-2xl font-bold text-amber-600">
            {events.filter((e) => e.status === 'cancelled' || e.status === 'no_show').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Unique resources</p>
          <p className="text-2xl font-bold">
            {new Set(events.map((e) => e.subtitle.split(' · ')[0])).size}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {weekDays.map((day, index) => {
          const dayEvents = eventsByDay[index];
          const isToday = toDateOnlyMs(day) === todayMs;

          return (
            <Card
              key={day.toISOString()}
              className={`min-h-[320px] flex flex-col ${isToday ? 'ring-1 ring-primary/30' : ''}`}
            >
              <div className="p-3 border-b">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {WEEK_DAY_LABELS[index]}
                </p>
                <p className="text-sm font-semibold">
                  {day.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </p>
                {isToday && (
                  <Badge variant="outline" className="mt-1 text-[10px]">
                    Today
                  </Badge>
                )}
              </div>
              <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[280px]">
                {dayEvents.length === 0 && (
                  <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                    No appointments
                  </div>
                )}
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`rounded-lg border p-2 text-left ${STATUS_STYLE[event.status] ?? STATUS_STYLE.scheduled}`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-xs font-semibold leading-tight">{event.title}</p>
                      <span className="text-[10px] font-medium whitespace-nowrap">{event.time}</span>
                    </div>
                    <p className="text-[10px] mt-1 opacity-80">{event.subtitle}</p>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
