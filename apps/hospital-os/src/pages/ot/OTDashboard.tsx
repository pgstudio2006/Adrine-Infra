import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { isAdrine2026Experience } from '@/lib/adrine/experience';
import OTDashboard2026 from '@/pages/ot/OTDashboard2026';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OperationsModulePage } from '@/components/operations/OperationsModulePage';
import { InlinePlatformError } from '@/components/shared/InlinePlatformError';
import { useOtPlatformData } from '@/hooks/useOtPlatformData';
import { mapOtCaseToRoomCard } from '@/lib/ot/ot-presenters';
import { Badge } from '@/components/ui/badge';
import { 
  Scissors, Clock, Activity, Users, AlertTriangle, CheckCircle2, 
  Timer, Bed, ArrowRight, Zap, Heart, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { allowDemoFallback, pickPlatformRows } from '@/lib/platform/demo-fallback';
import { PlatformEmptyState } from '@/components/platform/PlatformEmptyState';

const STATUS_CONFIG = {
  in_progress: { label: 'In Progress', class: 'bg-success/10 text-success border-success/20' },
  preparing: { label: 'Preparing', class: 'bg-warning/10 text-warning border-warning/20' },
  available: { label: 'Available', class: 'bg-info/10 text-info border-info/20' },
  cleaning: { label: 'Turnover', class: 'bg-muted text-muted-foreground border-border' },
};

const PRIORITY_BADGE = {
  elective: 'bg-muted text-muted-foreground',
  urgent: 'bg-warning/10 text-warning border-warning/20',
  emergency: 'bg-destructive/10 text-destructive border-destructive/20',
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const DEMO_LIVE_OT_STATUS = [
  { room: 'OT-1', label: 'Main Theatre', status: 'in_progress' as const, surgery: 'Laparoscopic Cholecystectomy', surgeon: 'Dr. Mehta', patient: 'Ramesh Patel (P-1024)', startedAt: '09:30 AM', elapsed: '1h 20m', progress: 65, team: 4 },
  { room: 'OT-2', label: 'Ortho Theatre', status: 'preparing' as const, surgery: 'Total Knee Replacement', surgeon: 'Dr. Shah', patient: 'Anilaben Joshi (P-2081)', startedAt: '11:00 AM', elapsed: 'Prep', progress: 15, team: 5 },
  { room: 'OT-3', label: 'Cardiac Theatre', status: 'available' as const, surgery: '—', surgeon: '—', patient: '—', startedAt: '—', elapsed: '—', progress: 0, team: 0 },
  { room: 'OT-4', label: 'Minor Procedures', status: 'cleaning' as const, surgery: 'Wound Debridement', surgeon: 'Dr. Trivedi', patient: 'Completed', startedAt: '—', elapsed: '—', progress: 100, team: 0 },
];

const DEMO_STATS = [
  { label: 'Scheduled', value: '8', icon: Clock, color: 'text-info' },
  { label: 'Completed', value: '3', icon: CheckCircle2, color: 'text-success' },
  { label: 'In Progress', value: '1', icon: Activity, color: 'text-warning' },
  { label: 'Emergency', value: '1', icon: AlertTriangle, color: 'text-destructive' },
];

const DEMO_UPCOMING: { time: string; surgery: string; surgeon: string; room: string; priority: 'elective' | 'urgent' | 'emergency' }[] = [
  { time: '11:00 AM', surgery: 'Total Knee Replacement', surgeon: 'Dr. Shah', room: 'OT-2', priority: 'elective' },
  { time: '01:30 PM', surgery: 'Appendectomy', surgeon: 'Dr. Mehta', room: 'OT-1', priority: 'urgent' },
  { time: '02:00 PM', surgery: 'Cataract Surgery', surgeon: 'Dr. Desai', room: 'OT-4', priority: 'elective' },
  { time: '03:30 PM', surgery: 'CABG', surgeon: 'Dr. Kapoor', room: 'OT-3', priority: 'elective' },
  { time: '04:00 PM', surgery: 'Fracture Fixation', surgeon: 'Dr. Shah', room: 'OT-2', priority: 'emergency' },
];

const DEMO_RECOVERY = [
  { name: 'Suresh Bhatt', surgery: 'Hernia Repair', vitals: 'Stable', time: '45 min', nurse: 'Sr. Priya' },
  { name: 'Kanta Desai', surgery: 'Hysterectomy', vitals: 'Monitoring', time: '1h 20m', nurse: 'Sr. Meena' },
];

export default function OTDashboard() {
  if (isAdrine2026Experience()) {
    return <OTDashboard2026 />;
  }

  const { platformOn, cases, rooms, loading, error, refresh } = useOtPlatformData();

  const hasLiveData = platformOn && cases.length > 0;

  const liveOtStatus = useMemo(() => {
    if (platformOn) {
      if (rooms.length === 0) return [];
      return rooms.map((room) => {
        const active = cases.find((c) => c.otRoomId === room.id);
        return mapOtCaseToRoomCard(room, active);
      });
    }
    return pickPlatformRows(false, [], DEMO_LIVE_OT_STATUS);
  }, [platformOn, cases, rooms]);

  const todayStats = useMemo(() => {
    if (hasLiveData) {
      const scheduled = cases.filter((c) => ['scheduled', 'confirmed'].includes(c.state)).length;
      const completed = cases.filter((c) => c.state === 'completed').length;
      const inProgress = cases.filter((c) => c.state === 'in_progress').length;
      const emergencyCount = cases.filter((c) => c.priority === 'emergency').length;
      return [
        { label: 'Scheduled', value: String(scheduled), icon: Clock, color: 'text-info' },
        { label: 'Completed', value: String(completed), icon: CheckCircle2, color: 'text-success' },
        { label: 'In Progress', value: String(inProgress), icon: Activity, color: 'text-warning' },
        { label: 'Emergency', value: String(emergencyCount), icon: AlertTriangle, color: 'text-destructive' },
      ];
    }
    if (allowDemoFallback()) return DEMO_STATS;
    return DEMO_STATS.map((s) => ({ ...s, value: '0' }));
  }, [hasLiveData, cases]);

  const upcoming = useMemo(() => {
    if (hasLiveData) {
      return cases
        .filter((c) => !['completed', 'cancelled'].includes(c.state))
        .slice(0, 5)
        .map((c) => ({
          time: c.scheduledAt
            ? new Date(c.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
            : '—',
          surgery: c.procedureName,
          surgeon: c.surgeonName ?? '—',
          room: c.otRoom?.code ?? 'TBD',
          priority: (['emergency', 'urgent'].includes(c.priority) ? c.priority : 'elective') as 'elective' | 'urgent' | 'emergency',
        }));
    }
    return pickPlatformRows(false, [], DEMO_UPCOMING);
  }, [hasLiveData, cases]);

  const recoveryPatients = allowDemoFallback() ? DEMO_RECOVERY : [];

  return (
    <OperationsModulePage
      module="ot"
      layout="dashboard"
      title="Operation Theatre"
      subtitle="Live surgical operations and OT management"
      actions={
        <>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-medium text-success">Live</span>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link to="/ot/board">Today&apos;s board</Link>
          </Button>
        </>
      }
    >
      {/* Platform errors */}
      {platformOn && error && (
        <InlinePlatformError error={error} onRetry={() => void refresh()} />
      )}

      {platformOn && !loading && !error && cases.length === 0 && rooms.length === 0 && (
        <Card className="border-dashed border-border/60">
          <CardContent className="p-8 flex flex-col items-center gap-3 text-center">
            <Scissors className="h-10 w-10 text-muted-foreground/40" strokeWidth={1} />
            <div>
              <p className="text-sm font-medium text-muted-foreground">No OT cases today</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Platform is connected but no cases or rooms found for this branch.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void refresh()}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      )}

      {(!platformOn || hasLiveData || rooms.length > 0) && (
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {todayStats.map(s => (
          <motion.div key={s.label} variants={item}>
            <Card className="border-border/60 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <s.icon className={`h-5 w-5 mb-3 ${s.color}`} strokeWidth={1.5} />
                <p className="text-3xl font-bold tracking-tight">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label} Today</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Live OT Room Status */}
      <motion.div variants={item}>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">Live OT Status</span>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {liveOtStatus.map(ot => (
            <Card key={ot.room} className={`border-border/60 hover:shadow-md transition-all cursor-pointer group ${ot.status === 'in_progress' ? 'ring-1 ring-success/30' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center text-xs font-bold shrink-0">
                      {ot.room}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{ot.label}</p>
                      <p className="text-[11px] text-muted-foreground">{ot.surgery}</p>
                    </div>
                  </div>
                  <Badge className={`${STATUS_CONFIG[ot.status].class} text-[10px]`}>
                    {STATUS_CONFIG[ot.status].label}
                  </Badge>
                </div>
                {ot.status === 'in_progress' && (
                  <>
                    <div className="w-full h-1.5 rounded-full bg-muted mb-3">
                      <div className="h-full rounded-full bg-success transition-all" style={{ width: `${ot.progress}%` }} />
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-[11px]">
                      <div>
                        <p className="text-muted-foreground">Surgeon</p>
                        <p className="font-medium">{ot.surgeon}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Elapsed</p>
                        <p className="font-medium">{ot.elapsed}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Team</p>
                        <p className="font-medium flex items-center gap-1"><Users className="h-3 w-3" /> {ot.team}</p>
                      </div>
                    </div>
                  </>
                )}
                {ot.status === 'preparing' && (
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <p className="text-muted-foreground">Surgeon</p>
                      <p className="font-medium">{ot.surgeon}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Patient</p>
                      <p className="font-medium">{ot.patient}</p>
                    </div>
                  </div>
                )}
                {ot.status === 'available' && (
                  <p className="text-xs text-muted-foreground">Ready for next surgery</p>
                )}
                {ot.status === 'cleaning' && (
                  <p className="text-xs text-muted-foreground">Turnover in progress — est. 20 min</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Upcoming Surgeries */}
        <motion.div variants={item} className="md:col-span-2">
          <Card className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                  <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">Upcoming Surgeries</span>
                </div>
                <Link to="/ot/board" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                  View board <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="space-y-3">
                {upcoming.map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                    <div className="flex items-center gap-4">
                      <div className="w-16 text-right">
                        <p className="text-sm font-mono font-semibold">{s.time}</p>
                      </div>
                      <div className="w-px h-8 bg-border" />
                      <div>
                        <p className="text-sm font-semibold">{s.surgery}</p>
                        <p className="text-[11px] text-muted-foreground">{s.surgeon} • {s.room}</p>
                      </div>
                    </div>
                    <Badge className={`${PRIORITY_BADGE[s.priority]} text-[10px] capitalize`}>{s.priority}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recovery Room */}
        <motion.div variants={item}>
          <Card className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">Recovery Room</span>
              </div>
              <div className="space-y-4">
                {recoveryPatients.length === 0 ? (
                  <PlatformEmptyState message="Recovery room patients appear when OT platform cases are in post-op recovery." />
                ) : (
                recoveryPatients.map((p, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border/40">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold">{p.name}</p>
                      <Badge className={`text-[10px] ${p.vitals === 'Stable' ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
                        {p.vitals}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{p.surgery}</p>
                    <div className="flex items-center justify-between mt-2 text-[11px]">
                      <span className="text-muted-foreground flex items-center gap-1"><Timer className="h-3 w-3" /> {p.time}</span>
                      <span className="font-medium">{p.nurse}</span>
                    </div>
                  </div>
                ))
                )}
              </div>
              {recoveryPatients.length > 0 && (
              <div className="mt-4 p-3 rounded-lg border border-dashed border-border flex items-center justify-center">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Bed className="h-3.5 w-3.5" />
                  <span>{recoveryPatients.length} recovery patient(s)</span>
                </div>
              </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      </motion.div>
      )}
    </OperationsModulePage>
  );
}
