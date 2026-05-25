import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, CalendarCheck2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  canUseSchedulingRuntime,
  platformBookAppointment,
} from '@/runtime/scheduling-runtime';
import { toast } from 'sonner';

export type ScheduleLeadTarget = {
  id: string;
  fullName: string;
  patientId?: string | null;
  specialty?: string | null;
  packageName?: string | null;
};

type Props = {
  lead: ScheduleLeadTarget;
  triggerLabel?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm';
  onBooked?: () => void;
};

function defaultSlotTimes(): { start: Date; end: Date } {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(10, 0, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 30);
  return { start, end };
}

export function ScheduleFromLeadDialog({
  lead,
  triggerLabel = 'Book appointment',
  variant = 'outline',
  size = 'sm',
  onBooked,
}: Props) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(() => defaultSlotTimes().start);
  const [time, setTime] = useState('10:00');
  const [resourceLabel, setResourceLabel] = useState(
    lead.specialty ? `${lead.specialty} consult` : 'OPD Consultation',
  );
  const [submitting, setSubmitting] = useState(false);

  const platformReady = canUseSchedulingRuntime();

  async function handleBook() {
    if (!lead.patientId) {
      toast.error('Link a patient record to this lead before booking (registration → CRM).');
      return;
    }
    if (!date) {
      toast.error('Select an appointment date.');
      return;
    }
    if (!platformReady) {
      toast.message('Platform runtime off', {
        description: 'Enable VITE_PLATFORM_RUNTIME and domain API to persist appointments.',
      });
      return;
    }

    const [h, m] = time.split(':').map(Number);
    const startAt = new Date(date);
    startAt.setHours(h || 10, m || 0, 0, 0);
    const endAt = new Date(startAt);
    endAt.setMinutes(endAt.getMinutes() + 30);

    setSubmitting(true);
    try {
      await platformBookAppointment({
        patientId: lead.patientId,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        resourceLabel,
        status: 'confirmed',
      });
      toast.success(`Appointment booked for ${lead.fullName}`);
      setOpen(false);
      onBooked?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="gap-1.5">
          <CalendarCheck2 className="h-3.5 w-3.5" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule from lead</DialogTitle>
          <DialogDescription>
            Creates an appointment via <span className="font-mono text-xs">POST /scheduling/appointments</span>{' '}
            for {lead.fullName}
            {lead.packageName ? ` · ${lead.packageName}` : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!lead.patientId && (
            <p className="text-xs text-destructive rounded-md border border-destructive/20 bg-destructive/5 p-3">
              No patient UUID on this lead. Register the patient in reception, then attach{' '}
              <span className="font-mono">patientId</span> on the CRM lead before booking.
            </p>
          )}

          <div className="space-y-2">
            <Label className="text-xs">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Pick date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Start time (24h)</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Resource / slot label</Label>
            <Input value={resourceLabel} onChange={(e) => setResourceLabel(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleBook()} disabled={submitting || !lead.patientId}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Book appointment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
