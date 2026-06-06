import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarCheck2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  canUseSchedulingRuntime,
  platformBookAppointment,
} from '@/runtime/scheduling-runtime';
import { isPlatformAuthoritative } from '@/runtime/platform-store-bridge';
import type { NavayuFollowUpHandoff } from '@/lib/navayu/navayu-protocol-engine';
import { toast } from 'sonner';

type Props = {
  patientId: string;
  patientName: string;
  visitId: string;
  defaultDays?: number;
  disabled?: boolean;
  onScheduled: (handoff: NavayuFollowUpHandoff) => void | Promise<void>;
};

function slotFromDateAndTime(date: Date, time: string): { start: Date; end: Date } {
  const [h, m] = time.split(':').map(Number);
  const start = new Date(date);
  start.setHours(h ?? 10, m ?? 0, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 30);
  return { start, end };
}

export function NavayuFollowUpHandoff({
  patientId,
  patientName,
  visitId,
  defaultDays = 14,
  disabled,
  onScheduled,
}: Props) {
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + defaultDays);

  const [date, setDate] = useState<Date | undefined>(defaultDate);
  const [time, setTime] = useState('10:00');
  const [resourceLabel, setResourceLabel] = useState('MSK follow-up');
  const [submitting, setSubmitting] = useState(false);
  const platformAuthoritative = isPlatformAuthoritative();
  const platformReady = canUseSchedulingRuntime();

  async function handleBook() {
    if (!date) {
      toast.error('Select a follow-up date.');
      return;
    }
    if (platformAuthoritative && !platformReady) {
      toast.error('Platform scheduling unavailable', {
        description: 'Sign in with platform runtime to book follow-up appointments.',
      });
      return;
    }
    setSubmitting(true);
    try {
      const { start, end } = slotFromDateAndTime(date, time);
      let appointmentId: string | undefined;
      if (platformReady) {
        const appt = await platformBookAppointment({
          patientId,
          startAt: start.toISOString(),
          endAt: end.toISOString(),
          resourceLabel,
          status: 'confirmed',
        });
        appointmentId = appt.id;
      } else if (platformAuthoritative) {
        throw new Error('Scheduling API did not return an appointment.');
      }

      const handoff: NavayuFollowUpHandoff = {
        appointmentId,
        scheduledStart: start.toISOString(),
        scheduledEnd: end.toISOString(),
        resourceLabel,
        daysFromNow: Math.max(
          0,
          Math.round((start.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
        ),
        bookedAt: new Date().toISOString(),
      };

      await onScheduled(handoff);
      toast.success(`Follow-up booked for ${patientName}`, {
        description: platformReady
          ? `${format(start, 'dd MMM yyyy')} · ${resourceLabel}`
          : 'Saved locally (platform runtime off).',
      });
    } catch (err) {
      toast.error('Could not schedule follow-up', {
        description: err instanceof Error ? err.message : 'Try again',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <p className="text-sm font-semibold flex items-center gap-2">
        <CalendarCheck2 className="w-4 h-4 text-primary" />
        Schedule follow-up
      </p>
      <p className="text-xs text-muted-foreground">
        Visit {visitId.slice(0, 8)}… · hands off to central scheduling when platform runtime is on.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={disabled}
                className={cn(
                  'w-full justify-start text-left font-normal mt-1',
                  !date && 'text-muted-foreground',
                )}
              >
                {date ? format(date, 'dd MMM yyyy') : 'Pick date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Label className="text-xs">Time</Label>
          <Input
            type="time"
            value={time}
            disabled={disabled}
            onChange={(e) => setTime(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs">Resource / reason</Label>
          <Input
            value={resourceLabel}
            disabled={disabled}
            onChange={(e) => setResourceLabel(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
      <Button
        className="w-full"
        disabled={disabled || submitting || !date}
        onClick={() => void handleBook()}
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Booking…
          </>
        ) : (
          'Confirm follow-up & close MSK visit'
        )}
      </Button>
    </div>
  );
}
