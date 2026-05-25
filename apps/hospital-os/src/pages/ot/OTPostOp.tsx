import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Heart, Clock, Activity, Bed, User, FileText, 
  CheckCircle2, AlertTriangle, Thermometer, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { OperationsModulePage } from '@/components/operations/OperationsModulePage';
import { InlinePlatformError } from '@/components/shared/InlinePlatformError';
import { useOtPlatformData } from '@/hooks/useOtPlatformData';

interface PostOpPatient {
  id: string;
  patient: string;
  uhid: string;
  surgery: string;
  surgeon: string;
  completedAt: string;
  room: string;
  outcome: 'successful' | 'with_complications' | 'monitoring';
  recoveryStatus: 'recovery_room' | 'ward_transfer' | 'icu_transfer' | 'discharged';
  vitals: { hr: number; bp: string; spo2: number; temp: string; pain: number };
  nurse: string;
  notes: string;
  instructions: string[];
  timeInRecovery: string;
}

const PATIENTS: PostOpPatient[] = [
  {
    id: 'PO-001', patient: 'Suresh Bhatt', uhid: 'P-2103', surgery: 'Wound Debridement',
    surgeon: 'Dr. Trivedi', completedAt: '10:15 AM', room: 'OT-4',
    outcome: 'successful', recoveryStatus: 'recovery_room',
    vitals: { hr: 76, bp: '118/72', spo2: 99, temp: '36.8°C', pain: 3 },
    nurse: 'Sr. Kavita Sharma', notes: 'Patient stable. Wound clean, no signs of infection.',
    instructions: ['Monitor wound site every 2 hours', 'IV antibiotics as prescribed', 'Oral fluids when alert'],
    timeInRecovery: '45 min'
  },
  {
    id: 'PO-002', patient: 'Kanta Desai', uhid: 'P-1089', surgery: 'Hysterectomy',
    surgeon: 'Dr. Joshi', completedAt: '11:00 AM', room: 'OT-3',
    outcome: 'successful', recoveryStatus: 'recovery_room',
    vitals: { hr: 82, bp: '126/80', spo2: 97, temp: '36.5°C', pain: 5 },
    nurse: 'Sr. Meena Kumari', notes: 'Post-spinal anesthesia recovery. Sensation returning to lower limbs.',
    instructions: ['Monitor motor recovery', 'Pain management as per protocol', 'NPO for 6 hours', 'Foley catheter monitoring'],
    timeInRecovery: '1h 20m'
  },
  {
    id: 'PO-003', patient: 'Jayesh Acharya', uhid: 'P-0784', surgery: 'Hernia Repair',
    surgeon: 'Dr. Mehta', completedAt: 'Yesterday',  room: 'OT-1',
    outcome: 'successful', recoveryStatus: 'ward_transfer',
    vitals: { hr: 70, bp: '122/76', spo2: 99, temp: '36.7°C', pain: 2 },
    nurse: 'Sr. Priya Nair', notes: 'Transferred to General Ward (GW-08). Tolerating oral fluids well.',
    instructions: ['Ambulate 6 hrs post-op', 'Paracetamol SOS for pain', 'Soft diet tomorrow'],
    timeInRecovery: 'Completed'
  },
];

const OUTCOME_CONFIG = {
  successful: { label: 'Successful', class: 'bg-success/10 text-success border-success/20' },
  with_complications: { label: 'With Complications', class: 'bg-warning/10 text-warning border-warning/20' },
  monitoring: { label: 'Close Monitoring', class: 'bg-info/10 text-info border-info/20' },
};

const RECOVERY_CONFIG = {
  recovery_room: { label: 'Recovery Room', class: 'bg-info/10 text-info border-info/20' },
  ward_transfer: { label: 'Ward Transfer', class: 'bg-success/10 text-success border-success/20' },
  icu_transfer: { label: 'ICU Transfer', class: 'bg-destructive/10 text-destructive border-destructive/20' },
  discharged: { label: 'Discharged', class: 'bg-muted text-muted-foreground' },
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function OTPostOp() {
  const { platformOn, cases, loading, error, refresh } = useOtPlatformData();
  const [selectedId, setSelectedId] = useState('');

  const postOpPatients = useMemo(() => {
    if (platformOn) {
      const recoveryCases = cases.filter((c) => ['postop_recovery', 'completed'].includes(c.state));
      if (recoveryCases.length === 0) return PATIENTS;
      return recoveryCases.map((c) => ({
        id: c.id,
        patient: c.patient?.fullName ?? '—',
        uhid: c.patient?.mrn ?? c.id,
        surgery: c.procedureName,
        surgeon: c.surgeonName ?? '—',
        completedAt: c.scheduledAt
          ? new Date(c.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
          : '—',
        room: c.otRoom?.code ?? 'TBD',
        outcome: 'successful' as const,
        recoveryStatus: c.state === 'postop_recovery' ? 'recovery_room' as const : 'ward_transfer' as const,
        vitals: { hr: 0, bp: '—', spo2: 0, temp: '—', pain: 0 },
        nurse: '—',
        notes: 'Recovery in progress.',
        instructions: ['Monitor vitals', 'Pain management as per protocol'],
        timeInRecovery: '—',
      }));
    }
    return PATIENTS;
  }, [platformOn, cases]);

  const selected = useMemo(() => {
    if (postOpPatients.length === 0) return null;
    const found = postOpPatients.find(p => p.id === selectedId);
    if (found) return found;
    setSelectedId(postOpPatients[0].id);
    return postOpPatients[0];
  }, [postOpPatients, selectedId]);

  if (!selected) {
    return (
      <OperationsModulePage module="ot" layout="list" title="Post-operative care" subtitle="Recovery monitoring and post-op documentation">
        <div className="p-10 text-center space-y-3">
          <Bed className="h-10 w-10 text-muted-foreground/40 mx-auto" strokeWidth={1} />
          <p className="text-sm text-muted-foreground">No post-op patients currently.</p>
          {platformOn && !loading && (
            <Button variant="outline" size="sm" onClick={() => void refresh()}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
            </Button>
          )}
        </div>
      </OperationsModulePage>
    );
  }

  return (
    <OperationsModulePage
      module="ot"
      layout="list"
      title="Post-operative care"
      subtitle="Recovery monitoring and post-op documentation"
    >
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'In Recovery', value: '2', icon: Bed, color: 'text-info' },
          { label: 'Ward Transfers', value: '1', icon: CheckCircle2, color: 'text-success' },
          { label: 'ICU Transfers', value: '0', icon: AlertTriangle, color: 'text-muted-foreground' },
          { label: 'Avg Recovery', value: '58 min', icon: Clock, color: 'text-foreground' },
        ].map(s => (
          <motion.div key={s.label} variants={item}>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <s.icon className={`h-4 w-4 mb-2 ${s.color}`} strokeWidth={1.5} />
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Patient List */}
        <motion.div variants={item} className="space-y-2">
          <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">Post-Op Patients</span>
          {PATIENTS.map(p => (
            <Card key={p.id} onClick={() => setSelectedId(p.id)}
              className={`border-border/60 cursor-pointer transition-all hover:shadow-md ${selectedId === p.id ? 'ring-1 ring-foreground/20 shadow-md' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold">{p.patient}</p>
                  <Badge className={`${RECOVERY_CONFIG[p.recoveryStatus].class} text-[10px]`}>
                    {RECOVERY_CONFIG[p.recoveryStatus].label}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">{p.surgery}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{p.surgeon} • Completed {p.completedAt}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Detail Panel */}
        <motion.div variants={item} className="md:col-span-2">
          <Card className="border-border/60">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-border/40">
                <div>
                  <h2 className="text-lg font-bold">{selected.patient}</h2>
                  <p className="text-sm text-muted-foreground">{selected.uhid} • {selected.surgery} • {selected.room}</p>
                </div>
                <div className="flex gap-2">
                  <Badge className={`${OUTCOME_CONFIG[selected.outcome].class} text-xs`}>{OUTCOME_CONFIG[selected.outcome].label}</Badge>
                  <Badge className={`${RECOVERY_CONFIG[selected.recoveryStatus].class} text-xs`}>{RECOVERY_CONFIG[selected.recoveryStatus].label}</Badge>
                </div>
              </div>

              {/* Vitals Grid */}
              <div className="grid grid-cols-5 gap-3 mb-5">
                <div className="p-3 rounded-lg bg-muted/50 border border-border/40 text-center">
                  <Heart className="h-3.5 w-3.5 text-destructive mx-auto mb-1" />
                  <p className="text-lg font-bold font-mono">{selected.vitals.hr}</p>
                  <p className="text-[9px] text-muted-foreground">HR</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border/40 text-center">
                  <Activity className="h-3.5 w-3.5 text-info mx-auto mb-1" />
                  <p className="text-lg font-bold font-mono">{selected.vitals.bp}</p>
                  <p className="text-[9px] text-muted-foreground">BP</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border/40 text-center">
                  <Activity className="h-3.5 w-3.5 text-info mx-auto mb-1" />
                  <p className="text-lg font-bold font-mono">{selected.vitals.spo2}%</p>
                  <p className="text-[9px] text-muted-foreground">SpO₂</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border/40 text-center">
                  <Thermometer className="h-3.5 w-3.5 text-warning mx-auto mb-1" />
                  <p className="text-lg font-bold font-mono">{selected.vitals.temp}</p>
                  <p className="text-[9px] text-muted-foreground">Temp</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border/40 text-center">
                  <Activity className="h-3.5 w-3.5 text-destructive mx-auto mb-1" />
                  <p className="text-lg font-bold font-mono">{selected.vitals.pain}/10</p>
                  <p className="text-[9px] text-muted-foreground">Pain</p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">Surgeon Notes</span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/40">
                    <p className="text-sm">{selected.notes}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-[11px] text-muted-foreground">
                    <User className="h-3 w-3" /> Attending Nurse: <span className="font-medium text-foreground">{selected.nurse}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" /> Recovery Time: <span className="font-medium text-foreground">{selected.timeInRecovery}</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">Post-Op Instructions</span>
                  </div>
                  <div className="space-y-1.5">
                    {selected.instructions.map((inst, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-muted/50 border border-border/40">
                        <span className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                        <p className="text-xs">{inst}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <Button variant="outline" size="sm">Print Report</Button>
                <Button size="sm">Transfer to Ward</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      </motion.div>
    </OperationsModulePage>
  );
}
