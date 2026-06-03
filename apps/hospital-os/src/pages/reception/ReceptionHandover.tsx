import { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Plus, AlertTriangle, Clock } from 'lucide-react';
import { useHospital } from '@/stores/hospitalStore';
import { useClinicalPlatformListSync } from '@/hooks/useClinicalPlatformListSync';
import { AppSelect } from '@/components/ui/app-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { allowDemoFallback } from '@/lib/platform/demo-fallback';
import { PlatformEmptyState } from '@/components/platform/PlatformEmptyState';

interface HandoverNote {
  id: string;
  counter: string;
  shift: string;
  priority: 'normal' | 'urgent';
  note: string;
  author: string;
  time: string;
}

const DEMO_HANDOVERS: HandoverNote[] = [
  {
    id: 'h1',
    counter: 'Main Counter',
    shift: 'Morning',
    priority: 'urgent',
    note: 'Patient UHID-240003 waiting for IPD bed assignment — billing deposit pending. Follow up with nursing team.',
    author: 'Reception Staff',
    time: '13:45',
  },
  {
    id: 'h2',
    counter: 'Counter 2',
    shift: 'Morning',
    priority: 'normal',
    note: 'Dr. R. Mehta unavailable afternoon — reschedule 3 appointments to tomorrow.',
    author: 'Reception Staff',
    time: '13:30',
  },
  {
    id: 'h3',
    counter: 'Main Counter',
    shift: 'Afternoon',
    priority: 'normal',
    note: 'Queue board updated for Cardiology — TV display reconnected. Token #47 last served.',
    author: 'Evening Staff',
    time: '18:00',
  },
];

const COUNTER_OPTIONS = [
  { value: 'Main Counter', label: 'Main Counter' },
  { value: 'Counter 2', label: 'Counter 2' },
  { value: 'Counter 3', label: 'Counter 3' },
];

const SHIFT_OPTIONS = [
  { value: 'Morning', label: 'Morning  7AM–2PM' },
  { value: 'Afternoon', label: 'Afternoon  2PM–9PM' },
  { value: 'Night', label: 'Night  9PM–7AM' },
];

const PRIORITY_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'urgent', label: 'Urgent' },
];

type ShiftFilter = 'all' | 'Morning' | 'Afternoon' | 'Night' | 'urgent';

export default function ReceptionHandover() {
  // Required design-rule hooks (no data used here, but kept per spec)
  useHospital();
  useClinicalPlatformListSync({ queue: false, patients: false, appointments: false, departmentWorklists: false, ipd: false });

  const [handovers, setHandovers] = useState<HandoverNote[]>(() =>
    allowDemoFallback() ? DEMO_HANDOVERS : [],
  );
  const [filter, setFilter] = useState<ShiftFilter>('all');

  // Form state
  const [counter, setCounter] = useState('Main Counter');
  const [shift, setShift] = useState('Morning');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [note, setNote] = useState('');

  const filteredHandovers = handovers.filter((h) => {
    if (filter === 'all') return true;
    if (filter === 'urgent') return h.priority === 'urgent';
    return h.shift === filter;
  });

  const handleSubmit = () => {
    if (!note.trim()) {
      toast.error('Please enter a handover note before submitting.');
      return;
    }
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newHandover: HandoverNote = {
      id: `h-${Date.now()}`,
      counter,
      shift,
      priority,
      note: note.trim(),
      author: 'Reception Staff',
      time,
    };
    setHandovers((prev) => [newHandover, ...prev]);
    setNote('');
    toast.success('Handover note submitted.', {
      description: `${counter} · ${shift} shift · ${priority === 'urgent' ? 'Urgent' : 'Normal'}`,
    });
  };

  const FILTER_TABS: { value: ShiftFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'Morning', label: 'Morning' },
    { value: 'Afternoon', label: 'Afternoon' },
    { value: 'Night', label: 'Night' },
    { value: 'urgent', label: 'Urgent' },
  ];

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Shift Handover</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Counter-to-counter notes for front desk continuity
          <Badge variant="outline" className="ml-2 text-[10px]">Preview</Badge>
        </p>
      </div>

      {/* Preview strip */}
      <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-warning flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          Preview — handover notes are stored locally. Production would persist to kernel-api shift records.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Add Handover Note form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Handover Note
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Counter</label>
              <AppSelect
                value={counter}
                onValueChange={setCounter}
                options={COUNTER_OPTIONS}
                placeholder="Select counter…"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Shift</label>
              <AppSelect
                value={shift}
                onValueChange={setShift}
                options={SHIFT_OPTIONS}
                placeholder="Select shift…"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Priority</label>
              <AppSelect
                value={priority}
                onValueChange={(v) => setPriority(v as 'normal' | 'urgent')}
                options={PRIORITY_OPTIONS}
                placeholder="Select priority…"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Note</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder="Describe what the next shift needs to know…"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <Button className="w-full gap-2" onClick={handleSubmit}>
              <ClipboardList className="w-4 h-4" />
              Submit Handover
            </Button>
          </CardContent>
        </Card>

        {/* Recent Handovers */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent Handovers
                </CardTitle>
                <Badge variant="secondary" className="text-xs">{filteredHandovers.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              {/* Filter strip */}
              <div className="flex gap-2 overflow-x-auto mb-4 pb-1">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setFilter(tab.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      filter === tab.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {filteredHandovers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No handover notes for this filter.
                  </p>
                ) : (
                  filteredHandovers.map((h, idx) => (
                    <motion.div
                      key={h.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className={`rounded-xl border p-4 space-y-2 ${
                        h.priority === 'urgent'
                          ? 'border-destructive/40 bg-destructive/5'
                          : 'bg-card'
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          {h.priority === 'urgent' && (
                            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                          )}
                          <span className="text-xs font-semibold">{h.counter}</span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              h.priority === 'urgent'
                                ? 'border-destructive/40 text-destructive'
                                : ''
                            }`}
                          >
                            {h.shift}
                          </Badge>
                          {h.priority === 'urgent' && (
                            <Badge variant="destructive" className="text-[10px]">Urgent</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {h.time}
                        </div>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{h.note}</p>
                      <p className="text-xs text-muted-foreground">— {h.author}</p>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
