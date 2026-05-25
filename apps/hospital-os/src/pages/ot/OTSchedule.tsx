import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { OperationsModulePage } from '@/components/operations/OperationsModulePage';
import { InlinePlatformError } from '@/components/shared/InlinePlatformError';
import { OperationsWorklistRow } from '@/components/operations/OperationsWorklistRow';
import { IpdAdmissionPicker } from '@/components/operations/IpdAdmissionPicker';
import { useOtPlatformData } from '@/hooks/useOtPlatformData';
import { useAuth } from '@/contexts/AuthContext';
import { platformCreateOtCase } from '@/runtime/ot-runtime';
import {
  getOtNextAction,
  OT_STATE_LABELS,
  otStateBadgeClass,
} from '@/lib/operations/module-lifecycle-ui';
import { mapOtCaseToScheduleRow } from '@/lib/ot/ot-presenters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  CalendarDays, Plus, Search, Filter, Clock, User, 
  Scissors, AlertTriangle, ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';

type Priority = 'elective' | 'urgent' | 'emergency';
type SurgeryStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

interface Surgery {
  id: string;
  time: string;
  endTime: string;
  surgery: string;
  patient: string;
  uhid: string;
  surgeon: string;
  room: string;
  priority: Priority;
  status: SurgeryStatus;
  anesthesia: string;
  duration: string;
}

const DEMO_SURGERIES: Surgery[] = [
  { id: 'S-001', time: '08:00', endTime: '10:00', surgery: 'Laparoscopic Cholecystectomy', patient: 'Ramesh Patel', uhid: 'P-1024', surgeon: 'Dr. Mehta', room: 'OT-1', priority: 'elective', status: 'completed', anesthesia: 'General', duration: '2h' },
  { id: 'S-002', time: '08:30', endTime: '11:30', surgery: 'Hysterectomy', patient: 'Kanta Desai', uhid: 'P-1089', surgeon: 'Dr. Joshi', room: 'OT-3', priority: 'elective', status: 'completed', anesthesia: 'Spinal', duration: '3h' },
  { id: 'S-003', time: '09:30', endTime: '11:00', surgery: 'Wound Debridement', patient: 'Suresh Bhatt', uhid: 'P-2103', surgeon: 'Dr. Trivedi', room: 'OT-4', priority: 'urgent', status: 'completed', anesthesia: 'Local', duration: '1.5h' },
  { id: 'S-004', time: '10:00', endTime: '12:30', surgery: 'Total Knee Replacement', patient: 'Anilaben Joshi', uhid: 'P-2081', surgeon: 'Dr. Shah', room: 'OT-2', priority: 'elective', status: 'in_progress', anesthesia: 'Spinal', duration: '2.5h' },
  { id: 'S-005', time: '11:00', endTime: '12:00', surgery: 'Appendectomy', patient: 'Vishal Parmar', uhid: 'P-3011', surgeon: 'Dr. Mehta', room: 'OT-1', priority: 'emergency', status: 'scheduled', anesthesia: 'General', duration: '1h' },
  { id: 'S-006', time: '13:30', endTime: '14:30', surgery: 'Cataract Surgery', patient: 'Induben Shah', uhid: 'P-1567', surgeon: 'Dr. Desai', room: 'OT-4', priority: 'elective', status: 'scheduled', anesthesia: 'Local', duration: '1h' },
  { id: 'S-007', time: '14:00', endTime: '18:00', surgery: 'CABG', patient: 'Harishbhai Modi', uhid: 'P-0892', surgeon: 'Dr. Kapoor', room: 'OT-3', priority: 'elective', status: 'confirmed', anesthesia: 'General', duration: '4h' },
  { id: 'S-008', time: '15:00', endTime: '17:00', surgery: 'Fracture Fixation (ORIF)', patient: 'Dinesh Rana', uhid: 'P-3245', surgeon: 'Dr. Shah', room: 'OT-2', priority: 'emergency', status: 'scheduled', anesthesia: 'General', duration: '2h' },
];

const OT_ROOMS = ['All Rooms', 'OT-1', 'OT-2', 'OT-3', 'OT-4'];

const PRIORITY_CONFIG: Record<Priority, { label: string; class: string }> = {
  elective: { label: 'Elective', class: 'bg-muted text-muted-foreground' },
  urgent: { label: 'Urgent', class: 'bg-warning/10 text-warning border-warning/20' },
  emergency: { label: 'Emergency', class: 'bg-destructive/10 text-destructive border-destructive/20' },
};

const STATUS_CONFIG: Record<SurgeryStatus, { label: string; class: string }> = {
  scheduled: { label: 'Scheduled', class: 'bg-info/10 text-info border-info/20' },
  confirmed: { label: 'Confirmed', class: 'bg-success/10 text-success border-success/20' },
  in_progress: { label: 'In Progress', class: 'bg-warning/10 text-warning border-warning/20' },
  completed: { label: 'Completed', class: 'bg-muted text-muted-foreground' },
  cancelled: { label: 'Cancelled', class: 'bg-destructive/10 text-destructive border-destructive/20' },
};

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 7 AM to 6 PM

const container = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function OTSchedule() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('All Rooms');
  const [view, setView] = useState<'timeline' | 'list'>('timeline');
  const [showCreate, setShowCreate] = useState(false);
  const [procedureName, setProcedureName] = useState('');
  const [surgeonName, setSurgeonName] = useState('');
  const [ipdAdmissionId, setIpdAdmissionId] = useState<string>();
  const [syncBilling, setSyncBilling] = useState(false);
  const { platformOn, loading, cases, error, refresh } = useOtPlatformData();
  const surgeries = useMemo(
    () => (platformOn ? cases.map(mapOtCaseToScheduleRow) : DEMO_SURGERIES),
    [platformOn, cases],
  );

  const filtered = surgeries.filter(s => {
    const matchSearch = s.surgery.toLowerCase().includes(search.toLowerCase()) || s.patient.toLowerCase().includes(search.toLowerCase());
    const matchRoom = selectedRoom === 'All Rooms' || s.room === selectedRoom;
    return matchSearch && matchRoom;
  });

  const rooms = ['OT-1', 'OT-2', 'OT-3', 'OT-4'];

  const platformCases = platformOn ? cases : [];

  return (
    <OperationsModulePage
      module="ot"
      layout="list"
      title="Surgery schedule"
      subtitle={`${filtered.length} case(s) • ${new Date().toLocaleDateString('en-IN')}`}
      actions={
        <>
          <Button variant="outline" size="sm" asChild>
            <Link to="/ot/board">Today board</Link>
          </Button>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Schedule surgery
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Schedule OT case</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 mt-2">
                <div>
                  <Label>Procedure</Label>
                  <Input className="mt-1" value={procedureName} onChange={(e) => setProcedureName(e.target.value)} />
                </div>
                <div>
                  <Label>Surgeon</Label>
                  <Input className="mt-1" value={surgeonName} onChange={(e) => setSurgeonName(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sync-billing"
                    checked={syncBilling}
                    onCheckedChange={(v) => setSyncBilling(v === true)}
                  />
                  <Label htmlFor="sync-billing" className="text-sm font-normal">
                    Sync charges to IPD billing
                  </Label>
                </div>
                {syncBilling ? (
                  <IpdAdmissionPicker value={ipdAdmissionId} onChange={(id) => setIpdAdmissionId(id)} />
                ) : null}
                <Button
                  size="sm"
                  onClick={async () => {
                    if (!procedureName.trim()) {
                      toast.error('Procedure name required');
                      return;
                    }
                    if (syncBilling && !ipdAdmissionId) {
                      toast.error('Select IPD admission for billing sync');
                      return;
                    }
                    if (platformOn && platformCases[0]?.patient?.id) {
                      await platformCreateOtCase({
                        patientId: platformCases[0].patient!.id,
                        procedureName: procedureName.trim(),
                        surgeonName: surgeonName.trim() || undefined,
                        ipdAdmissionId: syncBilling ? ipdAdmissionId : undefined,
                        syncBilling,
                        scheduledAt: new Date().toISOString(),
                      });
                      await refresh();
                    }
                    toast.success('Case scheduled');
                    setShowCreate(false);
                  }}
                >
                  Save case
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      }
    >        <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Platform error banner */}
      {platformOn && error && (
        <InlinePlatformError error={error} onRetry={() => void refresh()} />
      )}

      {platformOn && !loading && !error && surgeries.length === 0 && (
        <Card className="border-dashed border-border/60">
          <CardContent className="p-8 flex flex-col items-center gap-3 text-center">
            <Scissors className="h-10 w-10 text-muted-foreground/40" strokeWidth={1} />
            <div>
              <p className="text-sm font-medium text-muted-foreground">No surgeries scheduled</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Create a new OT case to get started.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void refresh()}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <motion.div variants={item} className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search surgery or patient..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <div className="flex gap-1 bg-muted p-0.5 rounded-lg">
          {OT_ROOMS.map(r => (
            <button key={r} onClick={() => setSelectedRoom(r)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${selectedRoom === r ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-0.5 bg-muted p-0.5 rounded-lg">
          <button onClick={() => setView('timeline')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === 'timeline' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>Timeline</button>
          <button onClick={() => setView('list')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === 'list' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>List</button>
        </div>
      </motion.div>

      {view === 'timeline' ? (
        <motion.div variants={item}>
          <Card className="border-border/60 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                  {/* Time header */}
                  <div className="flex border-b border-border/60">
                    <div className="w-24 shrink-0 p-3 text-xs font-medium text-muted-foreground border-r border-border/40">Room</div>
                    <div className="flex-1 flex">
                      {HOURS.map(h => (
                        <div key={h} className="flex-1 p-3 text-xs font-mono text-muted-foreground text-center border-r border-border/20 last:border-0">
                          {h > 12 ? `${h - 12}PM` : h === 12 ? '12PM' : `${h}AM`}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Room rows */}
                  {rooms.filter(r => selectedRoom === 'All Rooms' || r === selectedRoom).map(room => {
                    const roomSurgeries = SURGERIES.filter(s => s.room === room);
                    return (
                      <div key={room} className="flex border-b border-border/40 last:border-0 min-h-[72px]">
                        <div className="w-24 shrink-0 p-3 flex items-center border-r border-border/40">
                          <div className="w-7 h-7 rounded-md bg-foreground text-background flex items-center justify-center text-[10px] font-bold">
                            {room}
                          </div>
                        </div>
                        <div className="flex-1 relative py-2">
                          {roomSurgeries.map(s => {
                            const [sh, sm] = s.time.split(':').map(Number);
                            const [eh, em] = s.endTime.split(':').map(Number);
                            const startMin = (sh - 7) * 60 + sm;
                            const endMin = (eh - 7) * 60 + em;
                            const totalMin = 12 * 60;
                            const left = `${(startMin / totalMin) * 100}%`;
                            const width = `${((endMin - startMin) / totalMin) * 100}%`;
                            const bgColor = s.status === 'completed' ? 'bg-muted' 
                              : s.status === 'in_progress' ? 'bg-success/15 border-success/30' 
                              : s.priority === 'emergency' ? 'bg-destructive/10 border-destructive/30'
                              : 'bg-info/10 border-info/30';
                            return (
                              <div key={s.id} className={`absolute top-2 bottom-2 rounded-md border px-2 py-1 cursor-pointer hover:shadow-sm transition-shadow overflow-hidden ${bgColor}`}
                                style={{ left, width, minWidth: '80px' }}>
                                <p className="text-[10px] font-semibold truncate">{s.surgery}</p>
                                <p className="text-[9px] text-muted-foreground truncate">{s.surgeon} • {s.duration}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={item} className="space-y-2">
          {filtered.map((s) => {
            const platformCase = platformCases.find((c) => c.id === s.id);
            const state = platformCase?.state ?? 'scheduled';
            return (
              <OperationsWorklistRow
                key={s.id}
                primary={s.surgery}
                secondary={`${s.patient} (${s.uhid}) • ${s.surgeon} • ${s.room}`}
                meta={s.time}
                stateLabel={OT_STATE_LABELS[state] ?? STATUS_CONFIG[s.status].label}
                stateClassName={otStateBadgeClass(state)}
                nextAction={getOtNextAction(state, user.role)}
              />
            );
          })}
        </motion.div>
      )}
      </motion.div>
    </OperationsModulePage>
  );
}
