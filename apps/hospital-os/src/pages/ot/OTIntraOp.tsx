import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, Clock, Droplets, Heart, Thermometer, User,
  AlertTriangle, FileText, Plus, Package, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { OperationsModulePage } from '@/components/operations/OperationsModulePage';
import { InlinePlatformError } from '@/components/shared/InlinePlatformError';
import { useOtPlatformData } from '@/hooks/useOtPlatformData';

interface LiveSurgery {
  id: string;
  room: string;
  surgery: string;
  patient: string;
  uhid: string;
  surgeon: string;
  anesthesiologist: string;
  anesthesiaType: string;
  startTime: string;
  elapsed: string;
  estimatedEnd: string;
  bloodLoss: string;
  vitals: { hr: number; bp: string; spo2: number; temp: string; etco2: number };
  steps: { step: string; time: string; done: boolean }[];
  implants: { name: string; manufacturer: string; batch: string }[];
  complications: string[];
}

const LIVE_SURGERIES: LiveSurgery[] = [
  {
    id: 'LS-001', room: 'OT-1', surgery: 'Laparoscopic Cholecystectomy',
    patient: 'Ramesh Patel', uhid: 'P-1024', surgeon: 'Dr. Mehta',
    anesthesiologist: 'Dr. Vikram Patel', anesthesiaType: 'General Anesthesia',
    startTime: '09:30 AM', elapsed: '1h 35m', estimatedEnd: '11:30 AM',
    bloodLoss: '150 ml', 
    vitals: { hr: 72, bp: '120/78', spo2: 99, temp: '36.6°C', etco2: 35 },
    steps: [
      { step: 'Induction & Intubation', time: '09:30', done: true },
      { step: 'Port Placement (4 ports)', time: '09:45', done: true },
      { step: 'Calot Triangle Dissection', time: '10:05', done: true },
      { step: 'Clipping Cystic Duct & Artery', time: '10:30', done: true },
      { step: 'Gallbladder Dissection from Liver Bed', time: '10:45', done: false },
      { step: 'Extraction & Port Closure', time: '—', done: false },
      { step: 'Reversal & Extubation', time: '—', done: false },
    ],
    implants: [],
    complications: []
  },
  {
    id: 'LS-002', room: 'OT-2', surgery: 'Total Knee Replacement',
    patient: 'Anilaben Joshi', uhid: 'P-2081', surgeon: 'Dr. Shah',
    anesthesiologist: 'Dr. Sunita Joshi', anesthesiaType: 'Spinal Anesthesia',
    startTime: '10:00 AM', elapsed: '1h 05m', estimatedEnd: '12:30 PM',
    bloodLoss: '280 ml',
    vitals: { hr: 78, bp: '134/82', spo2: 98, temp: '36.4°C', etco2: 0 },
    steps: [
      { step: 'Spinal Block Administered', time: '10:00', done: true },
      { step: 'Medial Parapatellar Approach', time: '10:20', done: true },
      { step: 'Femoral & Tibial Cuts', time: '10:40', done: true },
      { step: 'Trial Component Fitting', time: '11:00', done: false },
      { step: 'Cement & Final Implant', time: '—', done: false },
      { step: 'Closure & Drain Placement', time: '—', done: false },
    ],
    implants: [
      { name: 'Femoral Component', manufacturer: 'Zimmer Biomet', batch: 'ZB-2026-4421' },
      { name: 'Tibial Baseplate', manufacturer: 'Zimmer Biomet', batch: 'ZB-2026-4422' },
      { name: 'Polyethylene Insert', manufacturer: 'Zimmer Biomet', batch: 'ZB-2026-4423' },
    ],
    complications: ['Mild hypotension post-spinal — managed with fluids']
  },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function OTIntraOp() {
  const { platformOn, cases, loading, error, refresh } = useOtPlatformData();

  const liveCases = useMemo(() => {
    if (!platformOn) return null;
    return cases.filter((c) => ['in_progress'].includes(c.state));
  }, [platformOn, cases]);

  const surgeries = useMemo(() => {
    if (platformOn && liveCases) {
      return liveCases.length > 0
        ? liveCases.map((c) => ({
            id: c.id,
            room: c.otRoom?.code ?? 'TBD',
            surgery: c.procedureName,
            patient: c.patient?.fullName ?? '—',
            uhid: c.patient?.mrn ?? c.id,
            surgeon: c.surgeonName ?? '—',
            anesthesiologist: '—',
            anesthesiaType: 'General',
            startTime: c.scheduledAt
              ? new Date(c.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
              : '—',
            elapsed: '—',
            estimatedEnd: '—',
            bloodLoss: '—',
            vitals: { hr: 0, bp: '—', spo2: 0, temp: '—', etco2: 0 },
            steps: [{ step: 'In Progress', time: new Date().toLocaleTimeString(), done: true }],
            implants: [],
            complications: [],
          }))
        : [];
    }
    return LIVE_SURGERIES;
  }, [platformOn, liveCases]);

  const activeCount = surgeries.length;

  return (
    <OperationsModulePage
      module="ot"
      layout="list"
      title="Intraoperative documentation"
      subtitle="Live surgical procedures and real-time monitoring"
      actions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-medium text-success">{activeCount} active</span>
          </div>
          {platformOn && error && (
            <InlinePlatformError error={error} onRetry={() => void refresh()} />
          )}
        </div>
      }
    >
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">

      {platformOn && !loading && surgeries.length === 0 && (
        <div className="p-10 text-center space-y-3">
          <Activity className="h-10 w-10 text-muted-foreground/40 mx-auto" strokeWidth={1} />
          <p className="text-sm text-muted-foreground">No active surgeries in progress.</p>
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
        </div>
      )}

      {surgeries.length === 0 && !platformOn && (
        <div className="p-10 text-center">
          <p className="text-sm text-muted-foreground">No live surgeries to display.</p>
        </div>
      )}

      {surgeries.map(surgery => (
        <motion.div key={surgery.id} variants={item}>
          <Card className="border-border/60 ring-1 ring-success/20">
            <CardContent className="p-0">
              {/* Surgery Header */}
              <div className="p-5 border-b border-border/40 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-foreground text-background flex items-center justify-center text-sm font-bold">
                      {surgery.room}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">{surgery.surgery}</h2>
                      <p className="text-sm text-muted-foreground">{surgery.patient} ({surgery.uhid}) • {surgery.surgeon}</p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-mono font-bold">{surgery.elapsed}</span>
                      <span className="text-muted-foreground">elapsed</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Started {surgery.startTime} • Est. end {surgery.estimatedEnd}</p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 divide-x divide-border/40">
                {/* Left: Vitals */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="h-4 w-4 text-success" />
                    <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">Live Vitals</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50 border border-border/40">
                      <Heart className="h-3.5 w-3.5 text-destructive mb-1" />
                      <p className="text-xl font-bold font-mono">{surgery.vitals.hr}</p>
                      <p className="text-[10px] text-muted-foreground">Heart Rate</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border border-border/40">
                      <Activity className="h-3.5 w-3.5 text-info mb-1" />
                      <p className="text-xl font-bold font-mono">{surgery.vitals.bp}</p>
                      <p className="text-[10px] text-muted-foreground">Blood Pressure</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border border-border/40">
                      <Droplets className="h-3.5 w-3.5 text-info mb-1" />
                      <p className="text-xl font-bold font-mono">{surgery.vitals.spo2}%</p>
                      <p className="text-[10px] text-muted-foreground">SpO₂</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border border-border/40">
                      <Thermometer className="h-3.5 w-3.5 text-warning mb-1" />
                      <p className="text-xl font-bold font-mono">{surgery.vitals.temp}</p>
                      <p className="text-[10px] text-muted-foreground">Temperature</p>
                    </div>
                  </div>
                  <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border/40 flex items-center justify-between">
                    <div>
                      <Droplets className="h-3.5 w-3.5 text-destructive mb-1" />
                      <p className="text-[10px] text-muted-foreground">Blood Loss</p>
                    </div>
                    <p className="text-lg font-bold font-mono text-destructive">{surgery.bloodLoss}</p>
                  </div>
                  <div className="mt-3 p-2 rounded-lg bg-accent/50 text-[11px]">
                    <p className="text-muted-foreground"><User className="h-3 w-3 inline mr-1" />{surgery.anesthesiologist}</p>
                    <p className="font-medium mt-0.5">{surgery.anesthesiaType}</p>
                  </div>
                </div>

                {/* Center: Surgical Steps */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">Surgical Steps</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {surgery.steps.filter(s => s.done).length}/{surgery.steps.length}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {surgery.steps.map((step, i) => (
                      <div key={i} className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors ${step.done ? 'bg-success/5' : i === surgery.steps.findIndex(s => !s.done) ? 'bg-info/5 border border-info/20' : ''}`}>
                        <div className="mt-0.5">
                          {step.done ? (
                            <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
                              <span className="text-[10px] text-success-foreground font-bold">✓</span>
                            </div>
                          ) : i === surgery.steps.findIndex(s => !s.done) ? (
                            <div className="w-5 h-5 rounded-full border-2 border-info animate-pulse" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-border" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`text-xs font-medium ${step.done ? 'text-muted-foreground' : ''}`}>{step.step}</p>
                          {step.time !== '—' && <p className="text-[10px] text-muted-foreground font-mono">{step.time}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-3 text-xs gap-1">
                    <Plus className="h-3 w-3" /> Add Step Note
                  </Button>
                </div>

                {/* Right: Implants & Complications */}
                <div className="p-5">
                  {/* Implants */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">Implants & Devices</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1"><Plus className="h-3 w-3" /> Add</Button>
                    </div>
                    {surgery.implants.length > 0 ? (
                      <div className="space-y-2">
                        {surgery.implants.map((imp, i) => (
                          <div key={i} className="p-2.5 rounded-lg border border-border/60 bg-muted/30">
                            <p className="text-xs font-semibold">{imp.name}</p>
                            <p className="text-[10px] text-muted-foreground">{imp.manufacturer}</p>
                            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Batch: {imp.batch}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg border border-dashed border-border text-center">
                        <p className="text-xs text-muted-foreground">No implants recorded</p>
                      </div>
                    )}
                  </div>

                  {/* Complications */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">Complications</span>
                    </div>
                    {surgery.complications.length > 0 ? (
                      <div className="space-y-2">
                        {surgery.complications.map((c, i) => (
                          <div key={i} className="p-2.5 rounded-lg bg-warning/5 border border-warning/20">
                            <p className="text-xs text-warning">{c}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-success/5 border border-success/20 text-center">
                        <p className="text-xs text-success">No complications reported</p>
                      </div>
                    )}
                    <Button variant="outline" size="sm" className="w-full mt-3 text-xs gap-1">
                      <Plus className="h-3 w-3" /> Report Complication
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
      </motion.div>
    </OperationsModulePage>
  );
}
