/**
 * Scheduling Dashboard — Adrine 2026 experience.
 * Access operations: today's bookings, capacity posture, slot intelligence.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck2, CalendarPlus, Gauge, Hourglass } from 'lucide-react';
import {
  PageScaffold,
  MetricGrid,
  SectionPanel,
  ListRow,
  StatusChip,
  type Metric,
  type StatusTone,
} from '@/components/adrine/primitives';
import { DenseTable, type DenseColumn } from '@/components/adrine/dense-table';
import { AIInsightPanel } from '@/components/adrine/ai-panel';
import type { AIInsight } from '@/lib/adrine/ai-insights';
import { useSchedulingPlatform } from '@/hooks/useSchedulingPlatform';

type BookingRow = {
  id: string;
  time: string;
  patient: string;
  doctor: string;
  resource: string;
  status: string;
  tone: StatusTone;
};

const FALLBACK_BOOKINGS: BookingRow[] = [
  { id: 'APT-5521', time: '09:00', patient: 'Ananya Iyer', doctor: 'Dr. Rajesh Kumar', resource: 'Cardiology OPD-1', status: 'Checked in', tone: 'success' },
  { id: 'APT-5522', time: '09:20', patient: 'Vikram Singh', doctor: 'Dr. Meera Krishnan', resource: 'Ortho OPD-2', status: 'In consultation', tone: 'active' },
  { id: 'APT-5523', time: '09:40', patient: 'Fatima Sheikh', doctor: 'Dr. Nidhi Apte', resource: 'ENT OPD-1', status: 'Confirmed', tone: 'info' },
  { id: 'APT-5524', time: '10:00', patient: 'Arjun Reddy', doctor: 'Dr. Sanjay Kulkarni', resource: 'Gen Med OPD-3', status: 'Confirmed', tone: 'info' },
  { id: 'APT-5525', time: '10:20', patient: 'Rohini Patil', doctor: 'Dr. Rajesh Kumar', resource: 'Teleconsult', status: 'Scheduled', tone: 'neutral' },
  { id: 'APT-5526', time: '10:40', patient: 'Kabir Malhotra', doctor: 'Dr. Meera Krishnan', resource: 'Ortho OPD-2', status: 'No-show risk', tone: 'warning' },
];

const DEPARTMENT_LOAD = [
  { dept: 'Cardiology', note: '18 of 20 slots booked', pct: 90, tone: 'critical' as StatusTone },
  { dept: 'General Medicine', note: '22 of 25 slots booked', pct: 88, tone: 'warning' as StatusTone },
  { dept: 'Orthopaedics', note: '12 of 15 slots booked', pct: 80, tone: 'info' as StatusTone },
  { dept: 'ENT', note: '6 of 10 slots booked', pct: 60, tone: 'success' as StatusTone },
];

const SCHEDULING_INSIGHTS: AIInsight[] = [
  {
    id: 'peak-hour-slots',
    severity: 'suggestion',
    title: 'Open 4 additional peak-hour slots in Cardiology',
    recommendation: 'Add a 09:00–11:00 overflow block for Dr. Rajesh Kumar on Mon/Wed this week.',
    reasoning: [
      'Cardiology 09:00–11:00 utilisation is at 96% with 14 patients on the waitlist for this window.',
      'The 15:00–17:00 block for the same clinic runs at 54% — demand is time-skewed, not capacity-starved.',
      'Dr. Kumar\'s calendar shows no procedures on Mon/Wed mornings; a 4-slot overflow fits without overtime.',
      'Waitlist conversion drops sharply when offered slots are 3+ days out — same-week absorption protects bookings.',
    ],
    confidence: 0.79,
    action: { label: 'Open calendar', to: '/scheduling/calendar' },
  },
  {
    id: 'no-show-pattern',
    severity: 'info',
    title: 'No-show risk concentrated in late-morning teleconsults',
    recommendation: 'Send a second reminder 45 minutes before 10:00–12:00 teleconsult slots.',
    reasoning: [
      '7 of last week\'s 11 no-shows were teleconsults booked in the 10:00–12:00 band.',
      'Patients with a same-morning second reminder showed an 8-point lower no-show rate in the trial cohort.',
    ],
    confidence: 0.7,
  },
];

export default function SchedulingDashboard2026() {
  const navigate = useNavigate();
  const { platformOn, appointments, waitlist } = useSchedulingPlatform();

  const bookings: BookingRow[] = useMemo(() => {
    if (!platformOn || appointments.length === 0) return FALLBACK_BOOKINGS;
    return appointments.map((a) => {
      const status = a.status.toLowerCase();
      const tone: StatusTone =
        status.includes('check') ? 'success'
          : status.includes('progress') || status.includes('consult') ? 'active'
          : status.includes('cancel') || status.includes('no') ? 'warning'
          : 'info';
      return {
        id: a.id,
        time: new Date(a.startAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
        patient: a.patient?.fullName ?? 'Unknown patient',
        doctor: a.resourceLabel,
        resource: a.resourceLabel,
        status: a.status,
        tone,
      };
    });
  }, [platformOn, appointments]);

  const metrics: Metric[] = useMemo(() => {
    const bookedToday = platformOn && appointments.length > 0 ? appointments.length : 86;
    const waitlistCount = platformOn && waitlist.length > 0 ? waitlist.length : 14;
    return [
      { id: 'booked', label: 'Booked today', value: bookedToday, icon: CalendarCheck2, hint: '12 remaining in queue' },
      { id: 'open-slots', label: 'Open slots', value: 19, icon: CalendarPlus, hint: 'Across all clinics' },
      { id: 'waitlist', label: 'Waitlist', value: waitlistCount, icon: Hourglass, hint: 'Cardiology heaviest' },
      { id: 'utilization', label: 'Utilisation', value: '82%', icon: Gauge, hint: 'Of bookable capacity', delta: { value: '+5%', direction: 'up', positive: true } },
    ];
  }, [platformOn, appointments, waitlist]);

  const columns: DenseColumn<BookingRow>[] = [
    { key: 'time', header: 'Time', width: '64px', cell: (r) => <span className="tabular-nums font-medium">{r.time}</span> },
    { key: 'patient', header: 'Patient', cell: (r) => <span className="font-medium">{r.patient}</span>, searchText: (r) => r.patient },
    { key: 'doctor', header: 'Doctor', searchText: (r) => r.doctor },
    { key: 'resource', header: 'Resource', searchText: (r) => r.resource },
    { key: 'status', header: 'Status', cell: (r) => <StatusChip tone={r.tone} pulse={r.tone === 'active'}>{r.status}</StatusChip> },
  ];

  return (
    <PageScaffold
      eyebrow="Access"
      title="Scheduling control"
      subtitle="Bookings, capacity, and waitlist pressure across every clinic and resource."
    >
      <MetricGrid metrics={metrics} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <SectionPanel
          title="Today's bookings"
          description="All resources · chronological"
          flush
          className="xl:col-span-2"
        >
          <DenseTable
            columns={columns}
            rows={bookings}
            rowKey={(r) => r.id}
            searchable
            searchPlaceholder="Search bookings…"
            onRowClick={() => navigate('/scheduling/calendar')}
            emptyTitle="No bookings today"
          />
        </SectionPanel>

        <SectionPanel title="Clinic load" description="Booked vs capacity today">
          {DEPARTMENT_LOAD.map((row) => (
            <ListRow
              key={row.dept}
              primary={row.dept}
              secondary={row.note}
              trailing={<StatusChip tone={row.tone} className="tabular-nums">{row.pct}%</StatusChip>}
              onClick={() => navigate('/scheduling/calendar')}
            />
          ))}
        </SectionPanel>
      </div>

      <AIInsightPanel insights={SCHEDULING_INSIGHTS} />
    </PageScaffold>
  );
}
