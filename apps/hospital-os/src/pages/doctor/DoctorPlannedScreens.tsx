import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle, ArrowRight, ClipboardList, FileText, HeartPulse, Mail, ShieldAlert, Stethoscope,
  Phone, Video, Calendar, Clock, Users, BookTemplate, Scissors, Syringe, FileSpreadsheet,
  Hospital, Ambulance, Shield, Activity, Brain, Bot, UserCheck, Award, ScrollText,
  Plus, Trash2, Check, X, Edit3, Eye, Search, Download, Printer, Share2,
  Mic, MessageSquare, RefreshCw, ChevronRight, ChevronLeft, MoreHorizontal,
  Pill, Beaker, Microscope, Bone, Bandage, Stethoscope as StethoscopeIcon,
  FlaskConical, Notebook, ClipboardPen, ListChecks, GripVertical,
  Building, UserRound, Star, CreditCard, FileCheck, FileX,
  Skull, Scale, Fingerprint, GraduationCap, BadgeCheck,
  Lightbulb, Sparkles, Loader2, BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useDoctorScope } from '@/hooks/useDoctorScope';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/* ───────────────────────────────────────────
   Shared helpers & components
   ─────────────────────────────────────────── */

const fadeIn = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.3 },
});

function PreviewShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </motion.div>
      <p className="text-xs text-muted-foreground border border-dashed rounded-lg px-3 py-2">
        This screen is in Preview. It is safe to navigate and review data, but workflows may be partial until platform EMR endpoints are connected.
      </p>
      {children}
    </div>
  );
}

function QuickLinks() {
  const navigate = useNavigate();
  const links = [
    { label: 'OPD Queue', path: '/doctor/queue' },
    { label: 'Patients', path: '/doctor/patients' },
    { label: 'Labs', path: '/doctor/labs' },
    { label: 'Radiology', path: '/doctor/radiology' },
    { label: 'IPD', path: '/doctor/ipd' },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Button key={link.path} size="sm" variant="outline" onClick={() => navigate(link.path)} className="gap-1.5">
          {link.label}
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      ))}
    </div>
  );
}

/* ───────────────────────────────────────────
   localStorage helpers
   ─────────────────────────────────────────── */

function loadJson<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}

function saveJson(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data));
}

type IDrug = { name: string; dose: string; route: string; frequency: string; duration: string };

const EMPTY_DRUG: IDrug = { name: '', dose: '', route: 'Oral', frequency: 'OD', duration: '7 days' };

/* ───────────────────────────────────────────
   COSIGN / REFILL (shared by DoctorInbox)
   ─────────────────────────────────────────── */

const COSIGN_KEY = 'adrine_cosign_queue';
const REFILL_KEY = 'adrine_refill_requests';

type CosignItem = { id: string; patientName: string; uhid: string; noteType: string; noteSnippet: string; authoredBy: string; date: string };
type RefillItem = { id: string; patientName: string; uhid: string; drug: string; dosage: string; requestedBy: string; date: string; status: 'pending' | 'approved' | 'denied' };

/* ───────────────────────────────────────────
   DoctorInbox — Real implementation (already existed)
   ─────────────────────────────────────────── */

export function DoctorInbox() {
  const navigate = useNavigate();
  const { labOrders, radiologyOrders, admissions } = useDoctorScope();
  const criticalCount = useMemo(() => {
    return (labOrders.filter((o) => o.criticalAlert).length) +
      (radiologyOrders.filter((o) => o.critical).length) +
      (admissions.filter((a) => a.status === 'icu').length);
  }, [admissions, labOrders, radiologyOrders]);

  const [cosignItems, setCosignItems] = useState<CosignItem[]>(() => loadJson<CosignItem[]>(COSIGN_KEY, []));
  const cosignPending = cosignItems.filter(i => !i.id.startsWith('cosigned-'));

  const handleCosign = (id: string) => {
    const item = cosignItems.find(i => i.id === id);
    if (!item) return;
    const updated = cosignItems.map(i => i.id === id ? { ...i, id: `cosigned-${i.id}` } : i);
    setCosignItems(updated);
    saveJson(COSIGN_KEY, updated);
    toast.success('Note cosigned', { description: 'Cosign recorded for ' + item.patientName });
  };

  const [refillRequests, setRefillRequests] = useState<RefillItem[]>(() => loadJson<RefillItem[]>(REFILL_KEY, []));
  const pendingRefills = refillRequests.filter(r => r.status === 'pending');

  const handleRefillAction = (id: string, action: 'approved' | 'denied') => {
    const updated = refillRequests.map(r => r.id === id ? { ...r, status: action } : r);
    setRefillRequests(updated);
    saveJson(REFILL_KEY, updated);
    toast.success(action === 'approved' ? 'Refill approved' : 'Refill denied');
  };

  return (
    <PreviewShell title="Clinical Inbox" subtitle="Critical alerts, cosign queue, refill requests, and quick handoffs.">
      <QuickLinks />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="rounded-xl">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-destructive" />
              <span className="text-sm font-semibold">Critical results</span>
              <Badge variant="secondary" className="ml-auto text-[10px]">{criticalCount}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Review and acknowledge critical labs, imaging, and ICU flags.</p>
            <Button size="sm" className="gap-1.5" onClick={() => navigate('/doctor/critical')}>
              Open critical inbox <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Templates</span>
            </div>
            <p className="text-xs text-muted-foreground">Save and reuse SOAP note macros and order sets.</p>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate('/doctor/templates')}>
              Manage templates <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold">EMR chart</span>
            </div>
            <p className="text-xs text-muted-foreground">Open longitudinal chart: problems, allergies, meds, vitals.</p>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate('/doctor/emr')}>
              Open EMR picker <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl">
        <CardContent className="p-0">
          <div className="p-4 border-b flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold">Cosign Queue</span>
            <Badge variant="secondary" className="ml-auto text-[10px]">{cosignPending.length} pending</Badge>
          </div>
          <div className="divide-y">
            {cosignPending.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No notes pending cosignature.</div>
            ) : (
              cosignPending.map(item => (
                <div key={item.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium">{item.patientName}</p>
                      <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{item.uhid}</span>
                      <span className="text-[10px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded">{item.noteType}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 italic">&ldquo;{item.noteSnippet}&rdquo;</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">Authored by {item.authoredBy} · {item.date}</p>
                  </div>
                  <Button size="sm" className="shrink-0" onClick={() => handleCosign(item.id)}>Cosign</Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardContent className="p-0">
          <div className="p-4 border-b flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold">Refill Requests</span>
            <Badge variant="secondary" className="ml-auto text-[10px]">{pendingRefills.length} pending</Badge>
          </div>
          <div className="divide-y">
            {pendingRefills.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No pending refill requests.</div>
            ) : (
              pendingRefills.map(req => (
                <div key={req.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium">{req.patientName}</p>
                      <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{req.uhid}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{req.drug} · {req.dosage}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">Requested by {req.requestedBy} · {req.date}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" className="shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleRefillAction(req.id, 'denied')}>Deny</Button>
                    <Button size="sm" className="shrink-0" onClick={() => handleRefillAction(req.id, 'approved')}>Approve</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </PreviewShell>
  );
}

/* ───────────────────────────────────────────
   DoctorCritical — Real implementation (already existed)
   ─────────────────────────────────────────── */

const ACK_KEY = 'adrine_critical_acknowledgements';

export function DoctorCritical() {
  const { labOrders, radiologyOrders, admissions } = useDoctorScope();
  const { user } = useAuth();
  const [acks, setAcks] = useState<Record<string, { acknowledgedAt: string; acknowledgedBy: string }>>(() => loadJson(ACK_KEY, {}));

  const items = useMemo(() => {
    const list: Array<{ key: string; patient: string; detail: string; severity: 'critical' | 'warning'; acknowledged: boolean }> = [];
    admissions.forEach(a => {
      if (a.status === 'icu') {
        list.push({ key: `icu-${a.id}`, patient: `${a.bed} · ${a.patientName}`, detail: 'ICU admission flagged for high-frequency review.', severity: 'critical', acknowledged: !!acks[`icu-${a.id}`] });
      }
    });
    labOrders.forEach(o => {
      if (o.criticalAlert) {
        list.push({ key: `lab-${o.orderId}`, patient: o.patientName, detail: `Critical lab alert for ${o.tests}.`, severity: 'critical', acknowledged: !!acks[`lab-${o.orderId}`] });
      }
    });
    radiologyOrders.forEach(o => {
      if (o.critical) {
        list.push({ key: `rad-${o.orderId}`, patient: o.patientName, detail: `Critical imaging flagged for ${o.study}.`, severity: 'warning', acknowledged: !!acks[`rad-${o.orderId}`] });
      }
    });
    return list.slice(0, 20);
  }, [admissions, labOrders, radiologyOrders, acks]);

  const handleAck = (key: string) => {
    const name = user?.name || 'Unknown Doctor';
    const ack = { acknowledgedAt: new Date().toISOString(), acknowledgedBy: name };
    const updated = { ...acks, [key]: ack };
    setAcks(updated);
    saveJson(ACK_KEY, updated);
    toast.success('Critical result acknowledged', { description: `Acknowledged by ${name} at ${new Date().toLocaleTimeString('en-IN')}` });
  };

  const pendingItems = items.filter(i => !i.acknowledged);
  const ackedItems = items.filter(i => i.acknowledged);

  return (
    <PreviewShell title="Critical Results" subtitle="Acknowledge critical labs/radiology and inpatient high-risk flags.">
      <QuickLinks />
      <Card className="rounded-xl">
        <CardContent className="p-0">
          <div className="p-4 border-b flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span className="text-sm font-semibold">Pending acknowledgement</span>
            <Badge variant="secondary" className="ml-auto text-[10px]">{pendingItems.length}</Badge>
          </div>
          <div className="divide-y">
            {pendingItems.map(item => (
              <div key={item.key} className="px-4 py-3 flex items-start gap-3">
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${item.severity === 'critical' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-600'}`}>{item.severity}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{item.patient}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{item.detail}</p>
                </div>
                <Button size="sm" variant="outline" className="shrink-0" onClick={() => handleAck(item.key)}>Acknowledge</Button>
              </div>
            ))}
            {pendingItems.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No pending critical items.</div>}
          </div>
        </CardContent>
      </Card>
      {ackedItems.length > 0 && (
        <Card className="rounded-xl">
          <CardContent className="p-0">
            <div className="p-4 border-b flex items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">Previously acknowledged</span>
              <Badge variant="secondary" className="ml-auto text-[10px]">{ackedItems.length}</Badge>
            </div>
            <div className="divide-y">
              {ackedItems.map(item => {
                const ack = acks[item.key];
                return (
                  <div key={item.key} className="px-4 py-3 flex items-start gap-3 opacity-60">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600">Acknowledged</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{item.patient}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{item.detail}</p>
                      {ack && <p className="text-[10px] text-muted-foreground/60 mt-1">By {ack.acknowledgedBy} · {new Date(ack.acknowledgedAt).toLocaleString('en-IN')}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </PreviewShell>
  );
}

/* ───────────────────────────────────────────
   DoctorEMR / DoctorEMRPatient — Real (already existed)
   ─────────────────────────────────────────── */

export function DoctorEMR() {
  const navigate = useNavigate();
  const { patients } = useDoctorScope();
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients.slice(0, 20);
    return patients.filter(p => `${p.uhid} ${p.name}`.toLowerCase().includes(q)).slice(0, 20);
  }, [patients, query]);

  return (
    <PreviewShell title="EMR Chart" subtitle="Pick a patient to open longitudinal chart (problems, allergies, meds, vitals, documents).">
      <QuickLinks />
      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Search by UHID or name…" className="w-72 max-w-full" value={query} onChange={e => setQuery(e.target.value)} />
        <Badge variant="secondary" className="text-[10px]">{patients.length} scoped</Badge>
      </div>
      <Card className="rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="divide-y">
            {results.map(p => (
              <button key={p.uhid} className="w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors flex items-center gap-3" onClick={() => navigate(`/doctor/emr/${p.uhid}`)}>
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold">{p.name.split(' ').map(part => part[0]).join('').slice(0, 2)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{p.uhid} · {p.age}y · {p.gender}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
            {results.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No patients found.</div>}
          </div>
        </CardContent>
      </Card>
    </PreviewShell>
  );
}

export function DoctorEMRPatient() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { getPatient, labOrders, radiologyOrders, admissions, prescriptions } = useDoctorScope();
  const patient = patientId ? getPatient(patientId) : undefined;
  const patientLabs = useMemo(() => labOrders.filter(o => o.uhid === patientId).slice(0, 5), [labOrders, patientId]);
  const patientRad = useMemo(() => radiologyOrders.filter(o => o.uhid === patientId).slice(0, 5), [radiologyOrders, patientId]);
  const patientRx = useMemo(() => prescriptions.filter(o => o.uhid === patientId).slice(0, 5), [prescriptions, patientId]);
  const patientAdmissions = useMemo(() => admissions.filter(a => a.uhid === patientId), [admissions, patientId]);

  if (!patientId) return <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Missing patient id.</div>;
  if (!patient) return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Patient not in doctor scope.</div>
      <Button size="sm" variant="outline" onClick={() => navigate('/doctor/emr')}>Back to EMR picker</Button>
    </div>
  );

  return (
    <PreviewShell title={`EMR · ${patient.name}`} subtitle={`${patient.uhid} · ${patient.age}y · ${patient.gender}`}>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => navigate(`/doctor/patients/${patient.uhid}`)} className="gap-1.5">Open profile <ArrowRight className="w-3.5 h-3.5" /></Button>
        <Button size="sm" variant="outline" onClick={() => navigate(`/doctor/consultation/${patient.uhid}`)} className="gap-1.5">Open consultation <ArrowRight className="w-3.5 h-3.5" /></Button>
        {patientAdmissions[0] && (
          <Button size="sm" variant="outline" onClick={() => navigate(`/doctor/ipd/${patient.uhid}`)} className="gap-1.5">Open IPD <ArrowRight className="w-3.5 h-3.5" /></Button>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="rounded-xl"><CardContent className="p-5 space-y-2">
          <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Recent labs</span></div>
          <div className="space-y-2">{patientLabs.map(o => (
            <div key={o.orderId} className="text-xs"><p className="font-medium">{o.tests}</p><p className="text-[11px] text-muted-foreground">{o.stage} · {o.orderTime}</p></div>
          ))}{patientLabs.length === 0 && <p className="text-xs text-muted-foreground">No labs in scope.</p>}</div>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-5 space-y-2">
          <div className="flex items-center gap-2"><Stethoscope className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Recent radiology</span></div>
          <div className="space-y-2">{patientRad.map(o => (
            <div key={o.orderId} className="text-xs"><p className="font-medium">{o.study}</p><p className="text-[11px] text-muted-foreground">{o.status} · {o.orderTime}</p></div>
          ))}{patientRad.length === 0 && <p className="text-xs text-muted-foreground">No radiology in scope.</p>}</div>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-5 space-y-2">
          <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Active prescriptions</span></div>
          <div className="space-y-2">{patientRx.map(o => (
            <div key={o.id} className="text-xs"><p className="font-medium">{o.meds[0]?.drug ?? 'Prescription'}</p><p className="text-[11px] text-muted-foreground">{o.status} · {o.date}</p></div>
          ))}{patientRx.length === 0 && <p className="text-xs text-muted-foreground">No prescriptions in scope.</p>}</div>
        </CardContent></Card>
      </div>

      {/* EMR Depth: Problem List, Longitudinal Meds, Vitals, Documents — tabs */}
      <Tabs defaultValue="problems">
        <TabsList className="gap-1">
          <TabsTrigger value="problems" className="gap-1.5"><ListChecks className="w-3.5 h-3.5" />Problems</TabsTrigger>
          <TabsTrigger value="medications" className="gap-1.5"><Pill className="w-3.5 h-3.5" />Medications</TabsTrigger>
          <TabsTrigger value="vitals" className="gap-1.5"><Activity className="w-3.5 h-3.5" />Vitals</TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5"><FileText className="w-3.5 h-3.5" />Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="problems">
          <ProblemListPanel patientId={patient.uhid} />
        </TabsContent>
        <TabsContent value="medications">
          <LongitudinalMedsPanel patientId={patient.uhid} />
        </TabsContent>
        <TabsContent value="vitals">
          <VitalsTimelinePanel patientId={patient.uhid} />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentStorePanel patientId={patient.uhid} />
        </TabsContent>
      </Tabs>
    </PreviewShell>
  );
}

/* ════════════════════════════════════════════
   EMR DEPTH COMPONENTS
   ════════════════════════════════════════════ */

/* ── Problem List ── */
const PROBLEMS_KEY = 'adrine_emr_problems';

type Problem = { id: string; patientId: string; problem: string; icdCode: string; onset: string; status: 'active' | 'chronic' | 'resolved'; notes: string };

function getProblems(patientId: string): Problem[] {
  return loadJson<Problem[]>(PROBLEMS_KEY, []).filter(p => p.patientId === patientId);
}

function saveProblems(patientId: string, list: Problem[]) {
  const all = loadJson<Problem[]>(PROBLEMS_KEY, []).filter(p => p.patientId !== patientId);
  saveJson(PROBLEMS_KEY, [...all, ...list]);
}

function ProblemListPanel({ patientId }: { patientId: string }) {
  const [problems, setProblems] = useState<Problem[]>(() => getProblems(patientId));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Problem, 'id' | 'patientId'>>({ problem: '', icdCode: '', onset: '', status: 'active', notes: '' });

  const addProblem = () => {
    if (!form.problem.trim()) return;
    const newProblem: Problem = { ...form, id: crypto.randomUUID?.() ?? `${Date.now()}`, patientId };
    const updated = [...problems, newProblem];
    setProblems(updated);
    saveProblems(patientId, updated);
    setForm({ problem: '', icdCode: '', onset: '', status: 'active', notes: '' });
    setShowForm(false);
    toast.success('Problem added');
  };

  const resolveProblem = (id: string) => {
    const updated = problems.map(p => p.id === id ? { ...p, status: 'resolved' as const } : p);
    setProblems(updated);
    saveProblems(patientId, updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Problem List ({problems.filter(p => p.status !== 'resolved').length} active)</span>
        <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />Add Problem</Button>
      </div>
      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <Input placeholder="Problem name" value={form.problem} onChange={e => setForm(p => ({ ...p, problem: e.target.value }))} />
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="ICD-10 code" value={form.icdCode} onChange={e => setForm(p => ({ ...p, icdCode: e.target.value }))} />
            <Input placeholder="Onset date" type="date" value={form.onset} onChange={e => setForm(p => ({ ...p, onset: e.target.value }))} />
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Problem['status'] }))}>
              <option value="active">Active</option>
              <option value="chronic">Chronic</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <Textarea placeholder="Notes (optional)" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addProblem}>Save Problem</Button>
          </div>
        </Card>
      )}
      <div className="space-y-1.5">
        {problems.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No problems recorded.</p>}
        {problems.map(p => (
          <div key={p.id} className="flex items-start gap-3 px-3 py-2 rounded-lg border bg-card">
            <span className={`text-[10px] font-semibold uppercase mt-0.5 px-1.5 py-0.5 rounded ${p.status === 'resolved' ? 'bg-muted text-muted-foreground' : p.status === 'chronic' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'}`}>{p.status}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">{p.problem}{p.icdCode && <span className="text-[10px] text-muted-foreground ml-1 font-mono">({p.icdCode})</span>}</p>
              {p.onset && <p className="text-[10px] text-muted-foreground">Onset: {p.onset}{p.notes && ` · ${p.notes}`}</p>}
            </div>
            {p.status !== 'resolved' && (
              <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => resolveProblem(p.id)}>Resolve</Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Longitudinal Medications ── */
const MEDS_KEY = 'adrine_emr_medications';

type MedItem = { id: string; patientId: string; drug: string; dose: string; route: string; frequency: string; startDate: string; endDate: string; status: 'active' | 'discontinued' | 'completed'; prescribedBy: string };

function getMeds(patientId: string): MedItem[] {
  return loadJson<MedItem[]>(MEDS_KEY, []).filter(m => m.patientId === patientId);
}

function saveMeds(patientId: string, list: MedItem[]) {
  const all = loadJson<MedItem[]>(MEDS_KEY, []).filter(m => m.patientId !== patientId);
  saveJson(MEDS_KEY, [...all, ...list]);
}

function LongitudinalMedsPanel({ patientId }: { patientId: string }) {
  const [meds, setMeds] = useState<MedItem[]>(() => getMeds(patientId));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ drug: '', dose: '', route: 'Oral', frequency: 'OD', startDate: '', endDate: '' });

  const addMed = () => {
    if (!form.drug.trim()) return;
    const newMed: MedItem = { ...form, id: crypto.randomUUID?.() ?? `${Date.now()}`, patientId, status: 'active', prescribedBy: 'Current Doctor' };
    const updated = [...meds, newMed];
    setMeds(updated);
    saveMeds(patientId, updated);
    setForm({ drug: '', dose: '', route: 'Oral', frequency: 'OD', startDate: '', endDate: '' });
    setShowForm(false);
    toast.success('Medication added');
  };

  const stopMed = (id: string) => {
    const updated = meds.map(m => m.id === id ? { ...m, status: 'discontinued' as const, endDate: new Date().toISOString().split('T')[0] } : m);
    setMeds(updated);
    saveMeds(patientId, updated);
  };

  const activeMeds = meds.filter(m => m.status === 'active');
  const historyMeds = meds.filter(m => m.status !== 'active');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Medication List ({activeMeds.length} active)</span>
        <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />Add Medication</Button>
      </div>
      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Drug name" value={form.drug} onChange={e => setForm(f => ({ ...f, drug: e.target.value }))} />
            <Input placeholder="Dose (e.g. 500mg)" value={form.dose} onChange={e => setForm(f => ({ ...f, dose: e.target.value }))} />
          </div>
          <div className="grid grid-cols-4 gap-2">
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.route} onChange={e => setForm(f => ({ ...f, route: e.target.value }))}>
              <option>Oral</option><option>IV</option><option>IM</option><option>SC</option><option>Topical</option><option>Inhalation</option>
            </select>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}>
              <option>OD</option><option>BD</option><option>TDS</option><option>QID</option><option>HS</option><option>PRN</option><option>STAT</option>
            </select>
            <Input placeholder="Start" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            <Input placeholder="End" type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addMed}>Save</Button>
          </div>
        </Card>
      )}
      <div className="space-y-1">
        {activeMeds.map(m => (
          <div key={m.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-card">
            <Pill className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">{m.drug} <span className="text-muted-foreground font-normal">{m.dose} · {m.route} · {m.frequency}</span></p>
              <p className="text-[10px] text-muted-foreground">Started {m.startDate} · Prescribed by {m.prescribedBy}</p>
            </div>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-destructive" onClick={() => stopMed(m.id)}>D/C</Button>
          </div>
        ))}
      </div>
      {historyMeds.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground font-medium">Discontinued / Completed ({historyMeds.length})</summary>
          <div className="mt-2 space-y-1">
            {historyMeds.map(m => (
              <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-muted/30">
                <span className="text-[10px] text-muted-foreground font-medium uppercase">{m.status === 'discontinued' ? 'D/C' : 'Completed'}</span>
                <span className="text-xs">{m.drug} {m.dose}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{m.startDate} → {m.endDate}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

/* ── Vitals Timeline ── */
const VITALS_KEY = 'adrine_emr_vitals';

type VitalsEntry = { id: string; patientId: string; date: string; bp: string; pulse: number; spo2: number; temp: number; rr: number; recordedBy: string };

function getVitals(patientId: string): VitalsEntry[] {
  return loadJson<VitalsEntry[]>(VITALS_KEY, []).filter(v => v.patientId === patientId).sort((a, b) => a.date.localeCompare(b.date));
}

function VitalsTimelinePanel({ patientId }: { patientId: string }) {
  const [vitals, setVitals] = useState<VitalsEntry[]>(() => getVitals(patientId));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vitals Timeline ({vitals.length} entries)</span>
      </div>
      {vitals.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">No vitals recorded. Vitals captured during consults and nurse rounds will appear here.</p>
      ) : (
        <div className="space-y-1">
          {vitals.map(v => (
            <div key={v.id} className="flex items-center gap-4 px-3 py-2 rounded-lg border bg-card">
              <span className="text-[10px] text-muted-foreground w-24 shrink-0">{new Date(v.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              <div className="flex gap-3 text-xs flex-wrap">
                <span><span className="text-muted-foreground">BP</span> {v.bp}</span>
                <span><span className="text-muted-foreground">Pulse</span> {v.pulse}</span>
                <span><span className="text-muted-foreground">SpO₂</span> {v.spo2}%</span>
                <span><span className="text-muted-foreground">Temp</span> {v.temp}°F</span>
                <span><span className="text-muted-foreground">RR</span> {v.rr}</span>
              </div>
              <span className="text-[10px] text-muted-foreground ml-auto">by {v.recordedBy}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Document Store ── */
const DOCS_KEY = 'adrine_emr_documents';

type DocItem = { id: string; patientId: string; title: string; type: string; date: string; content: string; signedBy: string; signedAt: string };

function getDocs(patientId: string): DocItem[] {
  return loadJson<DocItem[]>(DOCS_KEY, []).filter(d => d.patientId === patientId).sort((a, b) => b.date.localeCompare(a.date));
}

function saveDocs(patientId: string, list: DocItem[]) {
  const all = loadJson<DocItem[]>(DOCS_KEY, []).filter(d => d.patientId !== patientId);
  saveJson(DOCS_KEY, [...all, ...list]);
}

function DocumentStorePanel({ patientId }: { patientId: string }) {
  const { user } = useAuth();
  const [docs, setDocs] = useState<DocItem[]>(() => getDocs(patientId));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'Clinical Note', content: '' });

  const addDoc = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    const now = new Date().toISOString();
    const newDoc: DocItem = { ...form, id: crypto.randomUUID?.() ?? `${Date.now()}`, patientId, date: now, signedBy: '', signedAt: '' };
    const updated = [newDoc, ...docs];
    setDocs(updated);
    saveDocs(patientId, updated);
    setForm({ title: '', type: 'Clinical Note', content: '' });
    setShowForm(false);
    toast.success('Document saved');
  };

  const signDoc = (id: string) => {
    const name = user?.name || 'Current Doctor';
    const updated = docs.map(d => d.id === id ? { ...d, signedBy: name, signedAt: new Date().toISOString() } : d);
    setDocs(updated);
    saveDocs(patientId, updated);
    toast.success('Document e-signed');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Clinical Documents ({docs.length})</span>
        <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />New Document</Button>
      </div>
      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Document title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option>Clinical Note</option><option>Procedure Note</option><option>Discharge Summary</option><option>Referral Letter</option><option>Consent Form</option><option>Other</option>
            </select>
          </div>
          <Textarea placeholder="Document content…" rows={6} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addDoc}>Save Document</Button>
          </div>
        </Card>
      )}
      <div className="space-y-1.5">
        {docs.map(d => (
          <div key={d.id} className="px-3 py-2.5 rounded-lg border bg-card">
            <div className="flex items-start gap-3">
              <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium">{d.title}</p>
                  <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{d.type}</span>
                  {d.signedBy ? (
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-600 font-semibold uppercase px-1.5 py-0.5 rounded">Signed</span>
                  ) : (
                    <span className="text-[9px] bg-amber-500/10 text-amber-600 font-semibold uppercase px-1.5 py-0.5 rounded">Unsigned</span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{d.content}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">{new Date(d.date).toLocaleString('en-IN')}{d.signedBy && ` · Signed by ${d.signedBy} ${d.signedAt ? `· ${new Date(d.signedAt).toLocaleString('en-IN')}` : ''}`}</p>
              </div>
              {!d.signedBy && (
                <Button size="sm" variant="outline" className="shrink-0 h-7 text-[10px]" onClick={() => signDoc(d.id)}><Check className="w-3 h-3 mr-1" />E-Sign</Button>
              )}
            </div>
          </div>
        ))}
        {docs.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No documents yet.</p>}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   12 NEW SCREENS — Real implementations
   ════════════════════════════════════════════ */

/* ───────────────────────────────────────────
   1. DoctorOnCall — Coverage roster & shift calendar
   ─────────────────────────────────────────── */

const ONCALL_KEY = 'adrine_oncall_schedule';

type OnCallShift = { id: string; doctor: string; department: string; date: string; type: 'primary' | 'backup' | 'escalation'; contact: string };

function loadOnCallShifts(): OnCallShift[] {
  return loadJson<OnCallShift[]>(ONCALL_KEY, [
    { id: '1', doctor: 'Dr. Sharma', department: 'Emergency', date: new Date(Date.now() + 864e5).toISOString().split('T')[0], type: 'primary', contact: '+91-98765-43210' },
    { id: '2', doctor: 'Dr. Patel', department: 'Emergency', date: new Date(Date.now() + 864e5).toISOString().split('T')[0], type: 'backup', contact: '+91-98765-43211' },
    { id: '3', doctor: 'Dr. Verma', department: 'Medicine', date: new Date(Date.now() + 2 * 864e5).toISOString().split('T')[0], type: 'primary', contact: '+91-98765-43212' },
    { id: '4', doctor: 'Dr. Singh', department: 'Cardiology', date: new Date(Date.now() + 3 * 864e5).toISOString().split('T')[0], type: 'primary', contact: '+91-98765-43213' },
    { id: '5', doctor: 'Dr. Gupta', department: 'Pediatrics', date: new Date(Date.now() + 4 * 864e5).toISOString().split('T')[0], type: 'backup', contact: '+91-98765-43214' },
  ]);
}

export function DoctorOnCall() {
  const [shifts, setShifts] = useState<OnCallShift[]>(() => loadOnCallShifts());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ doctor: '', department: '', date: '', type: 'primary' as OnCallShift['type'], contact: '' });

  const addShift = () => {
    if (!form.doctor.trim() || !form.date) return;
    const newShift: OnCallShift = { ...form, id: crypto.randomUUID?.() ?? `${Date.now()}` };
    const updated = [...shifts, newShift];
    setShifts(updated);
    saveJson(ONCALL_KEY, updated);
    setForm({ doctor: '', department: '', date: '', type: 'primary', contact: '' });
    setShowForm(false);
    toast.success('On-call shift added');
  };

  const deleteShift = (id: string) => {
    const updated = shifts.filter(s => s.id !== id);
    setShifts(updated);
    saveJson(ONCALL_KEY, updated);
  };

  const today = new Date().toISOString().split('T')[0];
  const todayShifts = shifts.filter(s => s.date === today);
  const upcomingShifts = shifts.filter(s => s.date > today).sort((a, b) => a.date.localeCompare(b.date));
  const departments = [...new Set(shifts.map(s => s.department))];

  return (
    <PreviewShell title="On-Call Coverage" subtitle="Cross-department coverage roster, shift calendar, and escalation matrix.">
      <QuickLinks />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />Add Shift</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <Input placeholder="Doctor name" value={form.doctor} onChange={e => setForm(f => ({ ...f, doctor: e.target.value }))} />
            <Input placeholder="Department" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as OnCallShift['type'] }))}>
              <option value="primary">Primary</option><option value="backup">Backup</option><option value="escalation">Escalation</option>
            </select>
            <Input placeholder="Contact" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addShift}>Save Shift</Button>
          </div>
        </Card>
      )}

      {/* Today's coverage */}
      <Card className="rounded-xl">
        <CardContent className="p-0">
          <div className="p-4 border-b flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold">Today's Coverage</span>
            <Badge variant="secondary" className="ml-auto text-[10px]">{todayShifts.length} on-call</Badge>
          </div>
          <div className="divide-y">
            {todayShifts.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">No coverage scheduled for today.</div>
            ) : (
              todayShifts.map(s => (
                <div key={s.id} className="px-4 py-3 flex items-center gap-3">
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${s.type === 'primary' ? 'bg-emerald-500/10 text-emerald-600' : s.type === 'backup' ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600'}`}>{s.type}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{s.doctor}</p>
                    <p className="text-[10px] text-muted-foreground">{s.department} · {s.contact}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => deleteShift(s.id)}><Trash2 className="w-3 h-3 text-muted-foreground" /></Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming schedule */}
      <Card className="rounded-xl">
        <CardContent className="p-0">
          <div className="p-4 border-b flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Upcoming Shifts</span>
            <Badge variant="secondary" className="ml-auto text-[10px]">{upcomingShifts.length}</Badge>
          </div>
          <div className="divide-y">
            {upcomingShifts.map(s => (
              <div key={s.id} className="px-4 py-2.5 flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground w-20">{new Date(s.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${s.type === 'primary' ? 'bg-emerald-500/10 text-emerald-600' : s.type === 'backup' ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600'}`}>{s.type}</span>
                <span className="text-xs font-medium">{s.doctor}</span>
                <span className="text-[10px] text-muted-foreground">{s.department}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Department coverage matrix */}
      <Card className="rounded-xl">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Department Coverage</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {departments.map(dept => {
              const deptShifts = shifts.filter(s => s.department === dept && s.date >= today);
              return (
                <div key={dept} className="px-3 py-2 rounded-lg border bg-card">
                  <p className="text-xs font-medium">{dept}</p>
                  <p className="text-[10px] text-muted-foreground">{deptShifts.filter(s => s.type === 'primary').length} primary · {deptShifts.filter(s => s.type === 'backup').length} backup</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </PreviewShell>
  );
}

/* ───────────────────────────────────────────
   2. DoctorTeleconsult — Teleconsult queue & session shell
   ─────────────────────────────────────────── */

const TELECONSULT_KEY = 'adrine_teleconsult_queue';

type TeleconsultSession = { id: string; patientName: string; uhid: string; scheduledTime: string; status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'; doctor: string; department: string };

export function DoctorTeleconsult() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<TeleconsultSession[]>(() => loadJson<TeleconsultSession[]>(TELECONSULT_KEY, [
    { id: '1', patientName: 'Rajesh Kumar', uhid: 'UHID001', scheduledTime: new Date(Date.now() + 3600e3).toISOString(), status: 'scheduled', doctor: 'Dr. Sharma', department: 'Medicine' },
    { id: '2', patientName: 'Anita Desai', uhid: 'UHID042', scheduledTime: new Date(Date.now() + 7200e3).toISOString(), status: 'scheduled', doctor: 'Dr. Verma', department: 'Cardiology' },
    { id: '3', patientName: 'Priya Singh', uhid: 'UHID018', scheduledTime: new Date(Date.now() - 1800e3).toISOString(), status: 'in-progress', doctor: 'Dr. Sharma', department: 'Medicine' },
  ]));

  const updateStatus = (id: string, status: TeleconsultSession['status']) => {
    const updated = sessions.map(s => s.id === id ? { ...s, status } : s);
    setSessions(updated);
    saveJson(TELECONSULT_KEY, updated);
    toast.success(`Teleconsult ${status}`);
  };

  const scheduledCount = sessions.filter(s => s.status === 'scheduled').length;
  const inProgress = sessions.filter(s => s.status === 'in-progress');

  return (
    <PreviewShell title="Teleconsult Queue" subtitle="Deep link from scheduling teleconsult and session shell.">
      <QuickLinks />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold">Scheduled</span></div>
          <p className="text-2xl font-bold">{scheduledCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Video className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">In Progress</span></div>
          <p className="text-2xl font-bold">{inProgress.length}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">This Week</span></div>
          <p className="text-2xl font-bold">{sessions.length}</p>
        </CardContent></Card>
      </div>

      <Card className="rounded-xl">
        <CardContent className="p-0">
          <div className="p-4 border-b flex items-center gap-2">
            <Video className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Teleconsult Sessions</span>
          </div>
          <div className="divide-y">
            {sessions.map(s => (
              <div key={s.id} className="px-4 py-3 flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${s.status === 'in-progress' ? 'bg-emerald-500' : s.status === 'completed' ? 'bg-muted' : s.status === 'cancelled' ? 'bg-destructive' : 'bg-blue-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium">{s.patientName}</p>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{s.uhid}</span>
                    <Badge variant="secondary" className="text-[9px]">{s.status}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.doctor} · {s.department} · {new Date(s.scheduledTime).toLocaleString('en-IN')}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {s.status === 'scheduled' && (
                    <Button size="sm" className="gap-1" onClick={() => updateStatus(s.id, 'in-progress')}>
                      <Video className="w-3.5 h-3.5" />Start
                    </Button>
                  )}
                  {s.status === 'in-progress' && (
                    <Button size="sm" className="gap-1" onClick={() => updateStatus(s.id, 'completed')}>
                      <Check className="w-3.5 h-3.5" />Complete
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => navigate(`/doctor/consultation/${s.uhid}`)}>
                    Consult
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Video session placeholder */}
      <Card className="rounded-xl bg-muted/30 border-dashed">
        <CardContent className="p-8 text-center">
          <Video className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium">Video Session Shell</p>
          <p className="text-xs text-muted-foreground mt-1">Click "Start" on a scheduled teleconsult to launch the session. Video integration with Jitsi/WebRTC is pending platform wiring.</p>
        </CardContent>
      </Card>
    </PreviewShell>
  );
}

/* ───────────────────────────────────────────
   3. DoctorTemplates — SOAP macros, Rx templates
   ─────────────────────────────────────────── */

const TEMPLATES_KEY = 'adrine_doctor_templates';

type SoapTemplate = { id: string; name: string; category: 'SOAP' | 'Rx' | 'Note' | 'Macro'; subjective: string; objective: string; assessment: string; plan: string; drugs: IDrug[] };

export function DoctorTemplates() {
  const [templates, setTemplates] = useState<SoapTemplate[]>(() => loadJson<SoapTemplate[]>(TEMPLATES_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SoapTemplate>({ id: '', name: '', category: 'SOAP', subjective: '', objective: '', assessment: '', plan: '', drugs: [] });
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return templates.filter(t => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
  }, [templates, search]);

  const saveTemplate = () => {
    if (!form.name.trim()) return;
    const newTemplate: SoapTemplate = { ...form, id: crypto.randomUUID?.() ?? `${Date.now()}` };
    const updated = [...templates, newTemplate];
    setTemplates(updated);
    saveJson(TEMPLATES_KEY, updated);
    setForm({ id: '', name: '', category: 'SOAP', subjective: '', objective: '', assessment: '', plan: '', drugs: [] });
    setShowForm(false);
    toast.success('Template saved');
  };

  const deleteTemplate = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    saveJson(TEMPLATES_KEY, updated);
  };

  const addDrugToForm = () => {
    setForm(f => ({ ...f, drugs: [...f.drugs, { ...EMPTY_DRUG }] }));
  };

  const updateFormDrug = (idx: number, field: keyof IDrug, value: string) => {
    setForm(f => ({ ...f, drugs: f.drugs.map((d, i) => i === idx ? { ...d, [field]: value } : d) }));
  };

  const removeFormDrug = (idx: number) => {
    setForm(f => ({ ...f, drugs: f.drugs.filter((_, i) => i !== idx) }));
  };

  const applyTemplate = (t: SoapTemplate) => {
    navigator.clipboard.writeText(
      `SUBJECTIVE:\n${t.subjective}\n\nOBJECTIVE:\n${t.objective}\n\nASSESSMENT:\n${t.assessment}\n\nPLAN:\n${t.plan}${t.drugs.length ? '\n\nRx:\n' + t.drugs.map(d => `- ${d.name} ${d.dose} ${d.route} ${d.frequency} ${d.duration}`).join('\n') : ''}`
    );
    toast.success('Template copied to clipboard');
  };

  const categoryCounts = { SOAP: templates.filter(t => t.category === 'SOAP').length, Rx: templates.filter(t => t.category === 'Rx').length, Note: templates.filter(t => t.category === 'Note').length, Macro: templates.filter(t => t.category === 'Macro').length };

  return (
    <PreviewShell title="Note Templates" subtitle="SOAP macros, Rx templates, and reusable snippets for rapid charting.">
      <QuickLinks />
      <div className="flex items-center gap-2 flex-wrap">
        <Input placeholder="Search templates…" className="w-60 max-w-full" value={search} onChange={e => setSearch(e.target.value)} />
        <Button size="sm" className="gap-1" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />New Template</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {Object.entries(categoryCounts).map(([cat, count]) => (
          <Badge key={cat} variant="secondary">{cat} ({count})</Badge>
        ))}
        <Badge variant="outline">{templates.length} total</Badge>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Template name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as SoapTemplate['category'] }))}>
              <option value="SOAP">SOAP</option><option value="Rx">Rx</option><option value="Note">Note</option><option value="Macro">Macro</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Subjective</Label>
              <Textarea rows={3} value={form.subjective} onChange={e => setForm(f => ({ ...f, subjective: e.target.value }))} placeholder="Chief complaints, HPI…" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Objective</Label>
              <Textarea rows={3} value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))} placeholder="Vitals, exam findings…" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Assessment</Label>
              <Textarea rows={3} value={form.assessment} onChange={e => setForm(f => ({ ...f, assessment: e.target.value }))} placeholder="Diagnosis, differentials…" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Plan</Label>
              <Textarea rows={3} value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))} placeholder="Treatment plan, follow-up…" />
            </div>
          </div>

          {/* Drugs in template */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase text-muted-foreground">Medications</Label>
              <Button size="sm" variant="ghost" className="h-6 gap-1 text-[10px]" onClick={addDrugToForm}><Plus className="w-3 h-3" />Add Drug</Button>
            </div>
            {form.drugs.map((d, i) => (
              <div key={i} className="flex gap-1.5 items-center">
                <Input className="h-8 text-xs w-28" placeholder="Drug" value={d.name} onChange={e => updateFormDrug(i, 'name', e.target.value)} />
                <Input className="h-8 text-xs w-20" placeholder="Dose" value={d.dose} onChange={e => updateFormDrug(i, 'dose', e.target.value)} />
                <select className="h-8 text-xs rounded-md border border-input bg-background px-2" value={d.route} onChange={e => updateFormDrug(i, 'route', e.target.value)}>
                  <option>Oral</option><option>IV</option><option>IM</option><option>SC</option><option>Topical</option>
                </select>
                <select className="h-8 text-xs rounded-md border border-input bg-background px-2" value={d.frequency} onChange={e => updateFormDrug(i, 'frequency', e.target.value)}>
                  <option>OD</option><option>BD</option><option>TDS</option><option>QID</option><option>HS</option><option>PRN</option>
                </select>
                <Input className="h-8 text-xs w-24" placeholder="Duration" value={d.duration} onChange={e => updateFormDrug(i, 'duration', e.target.value)} />
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => removeFormDrug(i)}><X className="w-3 h-3" /></Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={saveTemplate}>Save Template</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map(t => (
          <Card key={t.id} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <BookTemplate className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{t.name}</p>
                    <Badge variant="secondary" className="text-[9px]">{t.category}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] text-muted-foreground">
                    <div><span className="font-medium">S:</span> {t.subjective.slice(0, 80)}{t.subjective.length > 80 ? '…' : ''}</div>
                    <div><span className="font-medium">O:</span> {t.objective.slice(0, 80)}{t.objective.length > 80 ? '…' : ''}</div>
                    <div><span className="font-medium">A:</span> {t.assessment.slice(0, 80)}{t.assessment.length > 80 ? '…' : ''}</div>
                    <div><span className="font-medium">P:</span> {t.plan.slice(0, 80)}{t.plan.length > 80 ? '…' : ''}</div>
                  </div>
                  {t.drugs.length > 0 && <p className="text-[10px] text-muted-foreground mt-1">{t.drugs.length} medication(s)</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => applyTemplate(t)}><CopyIcon className="w-3 h-3 mr-1" />Copy</Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => deleteTemplate(t.id)}><Trash2 className="w-3 h-3 text-muted-foreground" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No templates yet. Create your first template above.</p>}
      </div>
    </PreviewShell>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

/* ───────────────────────────────────────────
   4. DoctorOrderSets — Lab panels, admission bundles
   ─────────────────────────────────────────── */

const ORDERSETS_KEY = 'adrine_order_sets';

type OrderSet = { id: string; name: string; category: 'Lab Panel' | 'Admission Bundle' | 'Imaging' | 'Medication Set' | 'Custom'; items: string[] };

export function DoctorOrderSets() {
  const [sets, setSets] = useState<OrderSet[]>(() => loadJson<OrderSet[]>(ORDERSETS_KEY, [
    { id: '1', name: 'Basic Metabolic Panel', category: 'Lab Panel', items: ['Na', 'K', 'Cl', 'HCO3', 'BUN', 'Cr', 'Glucose', 'Ca'] },
    { id: '2', name: 'CBC with Differential', category: 'Lab Panel', items: ['WBC', 'RBC', 'Hb', 'Hct', 'MCV', 'MCH', 'MCHC', 'RDW', 'PLT', 'Neutrophils', 'Lymphocytes', 'Monocytes', 'Eosinophils', 'Basophils'] },
    { id: '3', name: 'Admission Starter Bundle', category: 'Admission Bundle', items: ['CBC', 'BMP', 'PT/PTT/INR', 'Chest X-ray', 'EKG', 'Urinalysis', 'Blood culture x2'] },
    { id: '4', name: 'MI Workup', category: 'Custom', items: ['Troponin I', 'CK-MB', 'BNP', 'EKG', 'Chest X-ray', 'Echocardiogram'] },
    { id: '5', name: 'Chest X-ray PA & Lateral', category: 'Imaging', items: ['Chest X-ray PA view', 'Chest X-ray Lateral view'] },
    { id: '6', name: 'Pneumonia Order Set', category: 'Medication Set', items: ['Ceftriaxone 1g IV BD', 'Azithromycin 500mg PO OD', 'Paracetamol 650mg PO PRN', 'IV fluids NS 100ml/hr'] },
  ]));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<OrderSet, 'id'>>({ name: '', category: 'Custom', items: [''] });
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sets.filter(s => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.items.some(i => i.toLowerCase().includes(q)));
  }, [sets, search]);

  const saveSet = () => {
    if (!form.name.trim() || form.items.every(i => !i.trim())) return;
    const newSet: OrderSet = { ...form, id: crypto.randomUUID?.() ?? `${Date.now()}`, items: form.items.filter(i => i.trim()) };
    const updated = [...sets, newSet];
    setSets(updated);
    saveJson(ORDERSETS_KEY, updated);
    setForm({ name: '', category: 'Custom', items: [''] });
    setShowForm(false);
    toast.success('Order set saved');
  };

  const deleteSet = (id: string) => {
    const updated = sets.filter(s => s.id !== id);
    setSets(updated);
    saveJson(ORDERSETS_KEY, updated);
  };

  const addItemToForm = () => setForm(f => ({ ...f, items: [...f.items, ''] }));
  const updateFormItem = (idx: number, val: string) => setForm(f => ({ ...f, items: f.items.map((i, n) => n === idx ? val : i) }));
  const removeFormItem = (idx: number) => setForm(f => ({ ...f, items: f.items.filter((_, n) => n !== idx) }));

  const applyOrderSet = (s: OrderSet) => {
    const text = `${s.name}:\n${s.items.map(i => `- ${i}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    toast.success('Order set copied');
  };

  const categories = ['Lab Panel', 'Admission Bundle', 'Imaging', 'Medication Set', 'Custom'] as const;
  const catCounts = categories.reduce((acc, cat) => { acc[cat] = sets.filter(s => s.category === cat).length; return acc; }, {} as Record<string, number>);

  return (
    <PreviewShell title="Order Sets" subtitle="Favorite lab panels, admission bundles, one-click orders, and custom order sets.">
      <QuickLinks />
      <div className="flex items-center gap-2 flex-wrap">
        <Input placeholder="Search order sets…" className="w-60 max-w-full" value={search} onChange={e => setSearch(e.target.value)} />
        <Button size="sm" className="gap-1" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />New Order Set</Button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {Object.entries(catCounts).map(([cat, count]) => (
          <Badge key={cat} variant="secondary">{cat} ({count})</Badge>
        ))}
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Order set name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as OrderSet['category'] }))}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase text-muted-foreground">Order Items</Label>
              <Button size="sm" variant="ghost" className="h-6 gap-1 text-[10px]" onClick={addItemToForm}><Plus className="w-3 h-3" />Add Item</Button>
            </div>
            {form.items.map((item, i) => (
              <div key={i} className="flex gap-1.5 items-center">
                <Input className="h-8 text-xs flex-1" placeholder="Order item" value={item} onChange={e => updateFormItem(i, e.target.value)} />
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => removeFormItem(i)}><X className="w-3 h-3" /></Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={saveSet}>Save Order Set</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(s => (
          <Card key={s.id} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <ClipboardPen className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{s.name}</p>
                    <Badge variant="secondary" className="text-[9px]">{s.category}</Badge>
                  </div>
                  <div className="mt-2 space-y-0.5">
                    {s.items.map((item, i) => (
                      <p key={i} className="text-[11px] text-muted-foreground">· {item}</p>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => applyOrderSet(s)}><CopyIcon className="w-3 h-3 mr-1" />Copy</Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => deleteSet(s.id)}><Trash2 className="w-3 h-3 text-muted-foreground" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <div className="col-span-2 py-8 text-center text-sm text-muted-foreground">No order sets found. Create one above.</div>}
      </div>
    </PreviewShell>
  );
}

/* ───────────────────────────────────────────
   5. DoctorProcedures — Procedure notes library
   ─────────────────────────────────────────── */

const PROCEDURES_KEY = 'adrine_procedures';

type Procedure = { id: string; name: string; specialty: string; indications: string; steps: string; complications: string; consentRequired: boolean };

export function DoctorProcedures() {
  const [procedures, setProcedures] = useState<Procedure[]>(() => loadJson<Procedure[]>(PROCEDURES_KEY, [
    { id: '1', name: 'Central Line Insertion', specialty: 'Critical Care', indications: 'CVP monitoring, TPN, vasopressor therapy', steps: '1. Consent 2. USG guidance 3. Seldinger technique 4. CXR confirmation', complications: 'Pneumothorax, arterial puncture, infection', consentRequired: true },
    { id: '2', name: 'Lumbar Puncture', specialty: 'Neurology', indications: 'Meningitis workup, CSF analysis', steps: '1. Lateral decubitus 2. L3-L4/L4-L5 3. Sterile prep 4. CSF collection', complications: 'Post-LP headache, bleeding, infection', consentRequired: true },
    { id: '3', name: 'Pleural Aspiration', specialty: 'Pulmonology', indications: 'Pleural effusion diagnosis/therapy', steps: '1. USG marking 2. Sterile prep 3. Needle aspiration', complications: 'Pneumothorax, bleeding, re-expansion edema', consentRequired: true },
    { id: '4', name: 'Joint Aspiration (Knee)', specialty: 'Orthopedics', indications: 'Septic arthritis rule out, effusion relief', steps: '1. Sterile prep 2. Lateral approach 3. Aspiration', complications: 'Infection, bleeding', consentRequired: false },
  ]));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Procedure, 'id'>>({ name: '', specialty: '', indications: '', steps: '', complications: '', consentRequired: false });
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return procedures.filter(p => p.name.toLowerCase().includes(q) || p.specialty.toLowerCase().includes(q));
  }, [procedures, search]);

  const saveProcedure = () => {
    if (!form.name.trim()) return;
    const newProc: Procedure = { ...form, id: crypto.randomUUID?.() ?? `${Date.now()}` };
    const updated = [...procedures, newProc];
    setProcedures(updated);
    saveJson(PROCEDURES_KEY, updated);
    setForm({ name: '', specialty: '', indications: '', steps: '', complications: '', consentRequired: false });
    setShowForm(false);
    toast.success('Procedure saved');
  };

  const deleteProcedure = (id: string) => {
    const updated = procedures.filter(p => p.id !== id);
    setProcedures(updated);
    saveJson(PROCEDURES_KEY, updated);
  };

  return (
    <PreviewShell title="Procedures" subtitle="Procedure note library, surgeon OP notes, and reference guides.">
      <QuickLinks />
      <div className="flex items-center gap-2 flex-wrap">
        <Input placeholder="Search procedures…" className="w-60 max-w-full" value={search} onChange={e => setSearch(e.target.value)} />
        <Button size="sm" className="gap-1" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />New Procedure</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Procedure name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Specialty" value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} />
          </div>
          <Textarea placeholder="Indications" rows={2} value={form.indications} onChange={e => setForm(f => ({ ...f, indications: e.target.value }))} />
          <Textarea placeholder="Steps (one per line or numbered)" rows={3} value={form.steps} onChange={e => setForm(f => ({ ...f, steps: e.target.value }))} />
          <Textarea placeholder="Complications / Risks" rows={2} value={form.complications} onChange={e => setForm(f => ({ ...f, complications: e.target.value }))} />
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={form.consentRequired} onChange={e => setForm(f => ({ ...f, consentRequired: e.target.checked }))} />
            Consent required
          </label>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={saveProcedure}>Save</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map(p => (
          <Card key={p.id} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Scissors className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{p.name}</p>
                    <Badge variant="secondary" className="text-[9px]">{p.specialty}</Badge>
                    {p.consentRequired && <span className="text-[9px] bg-amber-500/10 text-amber-600 font-semibold uppercase px-1.5 py-0.5 rounded">Consent</span>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-[11px] text-muted-foreground">
                    <div><span className="font-medium">Indications:</span> {p.indications}</div>
                    <div><span className="font-medium">Steps:</span> {p.steps.slice(0, 100)}{p.steps.length > 100 ? '…' : ''}</div>
                    <div><span className="font-medium">Risks:</span> {p.complications}</div>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 shrink-0" onClick={() => deleteProcedure(p.id)}><Trash2 className="w-3 h-3 text-muted-foreground" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No procedures in library.</p>}
      </div>
    </PreviewShell>
  );
}

/* ───────────────────────────────────────────
   6. DoctorReferrals — Outbound/inbound referral tracking
   ─────────────────────────────────────────── */

const REFERRALS_KEY = 'adrine_referrals';

type Referral = { id: string; patientName: string; uhid: string; fromDepartment: string; toDepartment: string; toDoctor: string; reason: string; priority: 'routine' | 'urgent' | 'emergency'; status: 'pending' | 'accepted' | 'completed' | 'declined'; date: string; notes: string };

export function DoctorReferrals() {
  const [referrals, setReferrals] = useState<Referral[]>(() => loadJson<Referral[]>(REFERRALS_KEY, [
    { id: '1', patientName: 'Ravi Shankar', uhid: 'UHID010', fromDepartment: 'Medicine', toDepartment: 'Cardiology', toDoctor: 'Dr. Mehta', reason: 'Chest pain evaluation', priority: 'urgent', status: 'pending', date: new Date().toISOString(), notes: '' },
    { id: '2', patientName: 'Sunita Agarwal', uhid: 'UHID023', fromDepartment: 'Medicine', toDepartment: 'Surgery', toDoctor: 'Dr. Khan', reason: 'Cholecystectomy consult', priority: 'routine', status: 'accepted', date: new Date(Date.now() - 864e5).toISOString(), notes: 'Surgery scheduled for next week' },
  ]));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Referral, 'id' | 'date' | 'status'>>({ patientName: '', uhid: '', fromDepartment: '', toDepartment: '', toDoctor: '', reason: '', priority: 'routine', notes: '' });
  const [activeTab, setActiveTab] = useState<'outbound' | 'inbound'>('outbound');

  const outbound = referrals.filter(r => r.fromDepartment === 'Medicine' || r.fromDepartment === 'Cardiology');
  const inbound = referrals.filter(r => r.toDepartment === 'Medicine' || r.toDepartment === 'Cardiology');

  const saveReferral = () => {
    if (!form.patientName.trim() || !form.toDoctor.trim()) return;
    const newRef: Referral = { ...form, id: crypto.randomUUID?.() ?? `${Date.now()}`, status: 'pending', date: new Date().toISOString() };
    const updated = [...referrals, newRef];
    setReferrals(updated);
    saveJson(REFERRALS_KEY, updated);
    setForm({ patientName: '', uhid: '', fromDepartment: '', toDepartment: '', toDoctor: '', reason: '', priority: 'routine', notes: '' });
    setShowForm(false);
    toast.success('Referral sent');
  };

  const updateStatus = (id: string, status: Referral['status']) => {
    const updated = referrals.map(r => r.id === id ? { ...r, status } : r);
    setReferrals(updated);
    saveJson(REFERRALS_KEY, updated);
    toast.success(`Referral ${status}`);
  };

  const statusBadge = (s: Referral['status']) => {
    const map: Record<string, string> = { pending: 'bg-amber-500/10 text-amber-600', accepted: 'bg-blue-500/10 text-blue-600', completed: 'bg-emerald-500/10 text-emerald-600', declined: 'bg-destructive/10 text-destructive' };
    return <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${map[s] || 'bg-muted text-muted-foreground'}`}>{s}</span>;
  };

  return (
    <PreviewShell title="Referrals" subtitle="Outbound referral letters, inbound requests, and specialist handoffs.">
      <QuickLinks />
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="outbound" className="gap-1"><SendIcon className="w-3.5 h-3.5" />Outbound ({outbound.length})</TabsTrigger>
            <TabsTrigger value="inbound" className="gap-1"><InboxIcon className="w-3.5 h-3.5" />Inbound ({inbound.length})</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button size="sm" className="gap-1" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />New Referral</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="From department" value={form.fromDepartment} onChange={e => setForm(f => ({ ...f, fromDepartment: e.target.value }))} />
            <Input placeholder="To department" value={form.toDepartment} onChange={e => setForm(f => ({ ...f, toDepartment: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="To doctor" value={form.toDoctor} onChange={e => setForm(f => ({ ...f, toDoctor: e.target.value }))} />
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Referral['priority'] }))}>
              <option value="routine">Routine</option><option value="urgent">Urgent</option><option value="emergency">Emergency</option>
            </select>
          </div>
          <Textarea placeholder="Reason for referral" rows={2} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
          <Textarea placeholder="Additional notes" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={saveReferral}>Send Referral</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {(activeTab === 'outbound' ? outbound : inbound).map(r => (
          <Card key={r.id} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Share2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-medium">{r.patientName}</p>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{r.uhid}</span>
                    {statusBadge(r.status)}
                    <Badge variant="secondary" className={`text-[9px] ${r.priority === 'emergency' ? 'text-destructive' : r.priority === 'urgent' ? 'text-amber-600' : ''}`}>{r.priority}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{activeTab === 'outbound' ? `To: ${r.toDoctor} (${r.toDepartment})` : `From: ${r.fromDepartment}`} · {r.reason}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">{new Date(r.date).toLocaleString('en-IN')}{r.notes && ` · ${r.notes}`}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {r.status === 'pending' && activeTab === 'outbound' && (
                    <Button size="sm" variant="ghost" className="h-7 text-[10px] text-destructive" onClick={() => updateStatus(r.id, 'declined')}>Recall</Button>
                  )}
                  {r.status === 'pending' && activeTab === 'inbound' && (
                    <>
                      <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => updateStatus(r.id, 'declined')}>Decline</Button>
                      <Button size="sm" className="h-7 text-[10px]" onClick={() => updateStatus(r.id, 'accepted')}>Accept</Button>
                    </>
                  )}
                  {r.status === 'accepted' && (
                    <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => updateStatus(r.id, 'completed')}>Complete</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(activeTab === 'outbound' ? outbound : inbound).length === 0 && (
          <p className="text-xs text-muted-foreground py-6 text-center">No {activeTab} referrals.</p>
        )}
      </div>
    </PreviewShell>
  );
}

function SendIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" /></svg>;
}
function InboxIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2" /><path d="M2 12h5l2 3h6l2-3h5" /></svg>;
}

/* ───────────────────────────────────────────
   7. DoctorDischarge — Structured discharge summary
   ─────────────────────────────────────────── */

const DISCHARGE_KEY = 'adrine_discharge_summaries';

export function DoctorDischarge() {
  const [summaries, setSummaries] = useState<Array<{ id: string; patientName: string; uhid: string; admissionDate: string; dischargeDate: string; diagnosis: string; summary: string; medications: string; followUp: string; status: 'draft' | 'completed' | 'signed' }>>(() => loadJson(DISCHARGE_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patientName: '', uhid: '', admissionDate: '', dischargeDate: new Date().toISOString().split('T')[0], diagnosis: '', summary: '', medications: '', followUp: '' });

  const saveSummary = () => {
    if (!form.patientName.trim()) return;
    const newSummary = { ...form, id: crypto.randomUUID?.() ?? `${Date.now()}`, status: 'draft' as const };
    const updated = [newSummary, ...summaries];
    setSummaries(updated);
    saveJson(DISCHARGE_KEY, updated);
    setForm({ patientName: '', uhid: '', admissionDate: '', dischargeDate: new Date().toISOString().split('T')[0], diagnosis: '', summary: '', medications: '', followUp: '' });
    setShowForm(false);
    toast.success('Discharge summary saved');
  };

  const signSummary = (id: string) => {
    const updated = summaries.map(s => s.id === id ? { ...s, status: 'signed' as const } : s);
    setSummaries(updated);
    saveJson(DISCHARGE_KEY, updated);
    toast.success('Discharge summary signed');
  };

  const deleteSummary = (id: string) => {
    const updated = summaries.filter(s => s.id !== id);
    setSummaries(updated);
    saveJson(DISCHARGE_KEY, updated);
  };

  return (
    <PreviewShell title="Discharge Summary" subtitle="Author structured discharge summaries with diagnosis, medications, and follow-up plan.">
      <QuickLinks />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{summaries.filter(s => s.status === 'draft').length} drafts · {summaries.filter(s => s.status === 'signed').length} signed</span>
        <Button size="sm" className="gap-1" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />New Summary</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Admission date</Label>
              <Input type="date" value={form.admissionDate} onChange={e => setForm(f => ({ ...f, admissionDate: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Discharge date</Label>
              <Input type="date" value={form.dischargeDate} onChange={e => setForm(f => ({ ...f, dischargeDate: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-muted-foreground">Final Diagnosis</Label>
            <Textarea rows={2} value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} placeholder="Primary and secondary diagnoses…" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-muted-foreground">Discharge Summary</Label>
            <Textarea rows={4} value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} placeholder="Hospital course, procedures, significant findings…" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Medications at Discharge</Label>
              <Textarea rows={3} value={form.medications} onChange={e => setForm(f => ({ ...f, medications: e.target.value }))} placeholder="Drug, dose, frequency, duration…" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Follow-up Plan</Label>
              <Textarea rows={3} value={form.followUp} onChange={e => setForm(f => ({ ...f, followUp: e.target.value }))} placeholder="Follow-up doctor, date, tests…" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={saveSummary}>Save Draft</Button>
          </div>
        </Card>
      )}

      <div className="divide-y rounded-xl border">
        {summaries.map(s => (
          <div key={s.id} className="px-4 py-3 flex items-start gap-3">
            <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium">{s.patientName}</p>
                <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{s.uhid}</span>
                <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${s.status === 'signed' ? 'bg-emerald-500/10 text-emerald-600' : s.status === 'completed' ? 'bg-blue-500/10 text-blue-600' : 'bg-muted text-muted-foreground'}`}>{s.status}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{s.diagnosis}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">{s.admissionDate} → {s.dischargeDate}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              {s.status === 'draft' && (
                <>
                  <Button size="sm" className="h-7 text-[10px]" onClick={() => signSummary(s.id)}><Check className="w-3 h-3 mr-1" />Sign</Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => deleteSummary(s.id)}><Trash2 className="w-3 h-3" /></Button>
                </>
              )}
            </div>
          </div>
        ))}
        {summaries.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No discharge summaries yet.</div>}
      </div>
    </PreviewShell>
  );
}

/* ───────────────────────────────────────────
   8. DoctorOT — OT requests & preference cards
   ─────────────────────────────────────────── */

const OT_KEY = 'adrine_ot_requests';

type OtRequest = { id: string; patientName: string; uhid: string; procedure: string; surgeon: string; anesthetist: string; priority: 'elective' | 'urgent' | 'emergency'; status: 'requested' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled'; requestedDate: string; scheduledDate: string; notes: string };

export function DoctorOT() {
  const [requests, setRequests] = useState<OtRequest[]>(() => loadJson<OtRequest[]>(OT_KEY, [
    { id: '1', patientName: 'Mohan Lal', uhid: 'UHID005', procedure: 'Laparoscopic Cholecystectomy', surgeon: 'Dr. Khan', anesthetist: 'Dr. Iyer', priority: 'elective', status: 'scheduled', requestedDate: new Date(Date.now() - 2 * 864e5).toISOString(), scheduledDate: new Date(Date.now() + 3 * 864e5).toISOString().split('T')[0], notes: 'NBM after midnight' },
    { id: '2', patientName: 'Geeta Reddy', uhid: 'UHID015', procedure: 'Emergency Appendectomy', surgeon: 'Dr. Khan', anesthetist: 'Dr. Iyer', priority: 'emergency', status: 'requested', requestedDate: new Date().toISOString(), scheduledDate: '', notes: 'Acute abdomen' },
  ]));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patientName: '', uhid: '', procedure: '', surgeon: '', anesthetist: '', priority: 'elective' as OtRequest['priority'], scheduledDate: '', notes: '' });

  const saveRequest = () => {
    if (!form.patientName.trim() || !form.procedure.trim()) return;
    const newReq: OtRequest = { ...form, id: crypto.randomUUID?.() ?? `${Date.now()}`, status: 'requested', requestedDate: new Date().toISOString() };
    const updated = [newReq, ...requests];
    setRequests(updated);
    saveJson(OT_KEY, updated);
    setForm({ patientName: '', uhid: '', procedure: '', surgeon: '', anesthetist: '', priority: 'elective', scheduledDate: '', notes: '' });
    setShowForm(false);
    toast.success('OT request created');
  };

  const updateStatus = (id: string, status: OtRequest['status']) => {
    const updated = requests.map(r => r.id === id ? { ...r, status } : r);
    setRequests(updated);
    saveJson(OT_KEY, updated);
    toast.success(`OT request ${status}`);
  };

  const statusBadge = (s: OtRequest['status']) => {
    const map: Record<string, string> = { requested: 'bg-amber-500/10 text-amber-600', scheduled: 'bg-blue-500/10 text-blue-600', 'in-progress': 'bg-emerald-500/10 text-emerald-600', completed: 'bg-muted text-muted-foreground', cancelled: 'bg-destructive/10 text-destructive' };
    return <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${map[s] || ''}`}>{s}</span>;
  };

  return (
    <PreviewShell title="OT Requests" subtitle="Create and track OT handoff requests, preference cards, and scheduling.">
      <QuickLinks />
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Badge variant="secondary">{requests.filter(r => r.status === 'requested').length} requested</Badge>
          <Badge variant="secondary">{requests.filter(r => r.status === 'scheduled').length} scheduled</Badge>
        </div>
        <Button size="sm" className="gap-1" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />New OT Request</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
          </div>
          <Input placeholder="Procedure" value={form.procedure} onChange={e => setForm(f => ({ ...f, procedure: e.target.value }))} />
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Surgeon" value={form.surgeon} onChange={e => setForm(f => ({ ...f, surgeon: e.target.value }))} />
            <Input placeholder="Anesthetist" value={form.anesthetist} onChange={e => setForm(f => ({ ...f, anesthetist: e.target.value }))} />
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as OtRequest['priority'] }))}>
              <option value="elective">Elective</option><option value="urgent">Urgent</option><option value="emergency">Emergency</option>
            </select>
          </div>
          <Input type="date" placeholder="Scheduled date" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} />
          <Textarea placeholder="Notes / preference card" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={saveRequest}>Create Request</Button>
          </div>
        </Card>
      )}

      <div className="divide-y rounded-xl border">
        {requests.map(r => (
          <div key={r.id} className="px-4 py-3 flex items-start gap-3">
            <Hospital className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-medium">{r.patientName}</p>
                <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{r.uhid}</span>
                {statusBadge(r.status)}
                <Badge variant="secondary" className={`text-[9px] ${r.priority === 'emergency' ? 'text-destructive' : r.priority === 'urgent' ? 'text-amber-600' : ''}`}>{r.priority}</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{r.procedure} · Surgeon: {r.surgeon} · Anesthetist: {r.anesthetist}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">{r.scheduledDate ? `Scheduled: ${new Date(r.scheduledDate).toLocaleDateString('en-IN')}` : `Requested: ${new Date(r.requestedDate).toLocaleDateString('en-IN')}`}{r.notes && ` · ${r.notes}`}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              {r.status === 'requested' && <Button size="sm" className="h-7 text-[10px]" onClick={() => updateStatus(r.id, 'scheduled')}>Schedule</Button>}
              {r.status === 'scheduled' && <Button size="sm" className="h-7 text-[10px]" onClick={() => updateStatus(r.id, 'in-progress')}>Start</Button>}
              {r.status === 'in-progress' && <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => updateStatus(r.id, 'completed')}>Complete</Button>}
              {r.status !== 'completed' && r.status !== 'cancelled' && (
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => updateStatus(r.id, 'cancelled')}><X className="w-3 h-3" /></Button>
              )}
            </div>
          </div>
        ))}
        {requests.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No OT requests.</div>}
      </div>
    </PreviewShell>
  );
}

/* ───────────────────────────────────────────
   9. DoctorPriorAuth — Insurance prior-auth tracking
   ─────────────────────────────────────────── */

const PRIORAUTH_KEY = 'adrine_prior_auth';

export function DoctorPriorAuth() {
  const [auths, setAuths] = useState<Array<{ id: string; patientName: string; uhid: string; insuranceProvider: string; policyNumber: string; procedure: string; status: 'pending' | 'approved' | 'denied' | 'expired'; requestedDate: string; responseDate: string; notes: string }>>(() => loadJson(PRIORAUTH_KEY, [
    { id: '1', patientName: 'Amit Shah', uhid: 'UHID008', insuranceProvider: 'ICICI Lombard', policyNumber: 'POL-12345', procedure: 'CABG', status: 'approved', requestedDate: new Date(Date.now() - 7 * 864e5).toISOString(), responseDate: new Date(Date.now() - 3 * 864e5).toISOString(), notes: 'Approved for 14 days admission' },
    { id: '2', patientName: 'Deepa Nair', uhid: 'UHID012', insuranceProvider: 'Star Health', policyNumber: 'POL-67890', procedure: 'Total Knee Replacement', status: 'pending', requestedDate: new Date(Date.now() - 2 * 864e5).toISOString(), responseDate: '', notes: 'Awaiting documents' },
  ]));

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { approved: 'bg-emerald-500/10 text-emerald-600', denied: 'bg-destructive/10 text-destructive', pending: 'bg-amber-500/10 text-amber-600', expired: 'bg-muted text-muted-foreground' };
    return <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${map[s] || ''}`}>{s}</span>;
  };

  return (
    <PreviewShell title="Prior Authorization" subtitle="Insurance prior-auth status for procedures, admissions, and high-cost orders.">
      <QuickLinks />
      <div className="flex gap-2">
        <Badge variant="secondary">{auths.filter(a => a.status === 'pending').length} pending</Badge>
        <Badge variant="secondary">{auths.filter(a => a.status === 'approved').length} approved</Badge>
        <Badge variant="secondary">{auths.filter(a => a.status === 'denied').length} denied</Badge>
      </div>

      <div className="divide-y rounded-xl border">
        {auths.map(a => (
          <div key={a.id} className="px-4 py-3 flex items-start gap-3">
            <CreditCard className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-medium">{a.patientName}</p>
                <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{a.uhid}</span>
                {statusBadge(a.status)}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{a.procedure} · {a.insuranceProvider} ({a.policyNumber})</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">Requested: {new Date(a.requestedDate).toLocaleDateString('en-IN')}{a.responseDate ? ` · Response: ${new Date(a.responseDate).toLocaleDateString('en-IN')}` : ''}{a.notes && ` · ${a.notes}`}</p>
            </div>
            <Badge variant={a.status === 'approved' ? 'success' : a.status === 'denied' ? 'destructive' : 'secondary'} className="text-[9px]">{a.status === 'approved' ? '✅' : a.status === 'denied' ? '❌' : '⏳'} {a.status}</Badge>
          </div>
        ))}
        {auths.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No prior auth records.</div>}
      </div>

      <Alert>
        <Shield className="w-4 h-4" />
        <AlertTitle>Order Gating</AlertTitle>
        <AlertDescription>High-cost procedures and admissions may require prior auth. This screen will integrate with the billing/insurance module for real-time eligibility checks when platform runtime is connected.</AlertDescription>
      </Alert>
    </PreviewShell>
  );
}

/* ───────────────────────────────────────────
   10. DoctorDeathMLC — Death certificate & MLC management
   ─────────────────────────────────────────── */

const DEATHMLC_KEY = 'adrine_death_mlc';

export function DoctorDeathMLC() {
  const [cases, setCases] = useState<Array<{ id: string; patientName: string; uhid: string; dateOfDeath: string; causeOfDeath: string; type: 'natural' | 'medicolegal' | 'unascertained'; status: 'pending' | 'certificate-issued' | 'mlc-filed' | 'closed'; mlcNumber: string; policeStation: string; certifyingDoctor: string; notes: string }>>(() => loadJson(DEATHMLC_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patientName: '', uhid: '', dateOfDeath: new Date().toISOString().split('T')[0], causeOfDeath: '', type: 'natural' as 'natural' | 'medicolegal' | 'unascertained', mlcNumber: '', policeStation: '', notes: '' });

  const saveCase = () => {
    if (!form.patientName.trim() || !form.causeOfDeath.trim()) return;
    const newCase = { ...form, id: crypto.randomUUID?.() ?? `${Date.now()}`, status: 'pending' as const, certifyingDoctor: 'Current Doctor' };
    const updated = [newCase, ...cases];
    setCases(updated);
    saveJson(DEATHMLC_KEY, updated);
    setForm({ patientName: '', uhid: '', dateOfDeath: new Date().toISOString().split('T')[0], causeOfDeath: '', type: 'natural', mlcNumber: '', policeStation: '', notes: '' });
    setShowForm(false);
    toast.success('Death case recorded');
  };

  const updateStatus = (id: string, status: string) => {
    const updated = cases.map(c => c.id === id ? { ...c, status: status as typeof c.status } : c);
    setCases(updated);
    saveJson(DEATHMLC_KEY, updated);
    toast.success(`Case updated to ${status}`);
  };

  return (
    <PreviewShell title="Death Certificate / MLC" subtitle="Death certification, medicolegal case tracking, and police coordination.">
      <QuickLinks />
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Badge variant="secondary">{cases.filter(c => c.status === 'pending').length} pending</Badge>
          <Badge variant="secondary">{cases.filter(c => c.type === 'medicolegal').length} MLC</Badge>
        </div>
        <Button size="sm" className="gap-1" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />New Case</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Date of death</Label>
              <Input type="date" value={form.dateOfDeath} onChange={e => setForm(f => ({ ...f, dateOfDeath: e.target.value }))} />
            </div>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as typeof form.type }))}>
              <option value="natural">Natural</option><option value="medicolegal">Medicolegal</option><option value="unascertained">Unascertained</option>
            </select>
          </div>
          <Textarea placeholder="Cause of death" rows={2} value={form.causeOfDeath} onChange={e => setForm(f => ({ ...f, causeOfDeath: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="MLC number (if applicable)" value={form.mlcNumber} onChange={e => setForm(f => ({ ...f, mlcNumber: e.target.value }))} />
            <Input placeholder="Police station" value={form.policeStation} onChange={e => setForm(f => ({ ...f, policeStation: e.target.value }))} />
          </div>
          <Textarea placeholder="Additional notes" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={saveCase}>Record Case</Button>
          </div>
        </Card>
      )}

      <div className="divide-y rounded-xl border">
        {cases.map(c => (
          <div key={c.id} className="px-4 py-3 flex items-start gap-3">
            <Skull className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-medium">{c.patientName}</p>
                <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{c.uhid}</span>
                <Badge variant={c.type === 'medicolegal' ? 'destructive' : c.type === 'unascertained' ? 'warning' : 'secondary'} className="text-[9px]">{c.type}</Badge>
                <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${c.status === 'closed' ? 'bg-emerald-500/10 text-emerald-600' : c.status === 'certificate-issued' ? 'bg-blue-500/10 text-blue-600' : c.status === 'mlc-filed' ? 'bg-amber-500/10 text-amber-600' : 'bg-muted text-muted-foreground'}`}>{c.status}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{c.causeOfDeath} · {c.dateOfDeath}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                {c.certifyingDoctor}{c.mlcNumber ? ` · MLC: ${c.mlcNumber}` : ''}{c.policeStation ? ` · PS: ${c.policeStation}` : ''}{c.notes && ` · ${c.notes}`}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              {c.status === 'pending' && (
                <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => updateStatus(c.id, 'certificate-issued')}>Issue Certificate</Button>
              )}
              {(c.status === 'pending' || c.status === 'certificate-issued') && c.type === 'medicolegal' && (
                <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => updateStatus(c.id, 'mlc-filed')}>File MLC</Button>
              )}
              {c.status !== 'closed' && (
                <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => updateStatus(c.id, 'closed')}>Close</Button>
              )}
            </div>
          </div>
        ))}
        {cases.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No death/MLC cases recorded.</div>}
      </div>
    </PreviewShell>
  );
}

/* ───────────────────────────────────────────
   11. DoctorCredentials — Credentials & CME tracking
   ─────────────────────────────────────────── */

const CREDENTIALS_KEY = 'adrine_credentials';

export function DoctorCredentials() {
  const [credentials] = useState<Array<{ id: string; degree: string; institution: string; year: string; expiryDate: string; type: 'degree' | 'license' | 'certification' | 'cme' }>>(() => loadJson(CREDENTIALS_KEY, [
    { id: '1', degree: 'MBBS', institution: 'AIIMS Delhi', year: '2010', expiryDate: '', type: 'degree' },
    { id: '2', degree: 'MD Internal Medicine', institution: 'PGIMER Chandigarh', year: '2014', expiryDate: '', type: 'degree' },
    { id: '3', degree: 'DM Cardiology', institution: 'CMC Vellore', year: '2018', expiryDate: '', type: 'degree' },
    { id: '4', degree: 'State Medical License', institution: 'Maharashtra Medical Council', year: '2014', expiryDate: '2026-12-31', type: 'license' },
    { id: '5', degree: 'NMC Registration', institution: 'National Medical Commission', year: '2014', expiryDate: '2027-06-30', type: 'license' },
    { id: '6', degree: 'BLS/ACLS Certified', institution: 'American Heart Association', year: '2023', expiryDate: '2025-12-31', type: 'certification' },
    { id: '7', degree: 'Advanced Echocardiography CME', institution: 'ACC', year: '2024', expiryDate: '', type: 'cme' },
    { id: '8', degree: 'Annual CME — Cardiology Update', institution: 'CSI', year: '2024', expiryDate: '', type: 'cme' },
  ]));

  const isExpiringSoon = (expiry: string) => {
    if (!expiry) return false;
    const days = (new Date(expiry).getTime() - Date.now()) / 864e5;
    return days < 90 && days > 0;
  };

  const isExpired = (expiry: string) => {
    if (!expiry) return false;
    return new Date(expiry) < new Date();
  };

  return (
    <PreviewShell title="Credentials & CME" subtitle="Degrees, licenses, certifications, and continuing medical education tracking.">
      <QuickLinks />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold">Degrees</span></div>
          <p className="text-2xl font-bold">{credentials.filter(c => c.type === 'degree').length}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">Licenses</span></div>
          <p className="text-2xl font-bold">{credentials.filter(c => c.type === 'license').length}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Award className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Certifications</span></div>
          <p className="text-2xl font-bold">{credentials.filter(c => c.type === 'certification').length}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-purple-600" /><span className="text-sm font-semibold">CME Credits</span></div>
          <p className="text-2xl font-bold">{credentials.filter(c => c.type === 'cme').length}</p>
        </CardContent></Card>
      </div>

      <div className="divide-y rounded-xl border">
        {credentials.map(c => (
          <div key={c.id} className="px-4 py-3 flex items-start gap-3">
            {c.type === 'degree' ? <GraduationCap className="w-4 h-4 text-muted-foreground mt-0.5" /> :
             c.type === 'license' ? <BadgeCheck className="w-4 h-4 text-muted-foreground mt-0.5" /> :
             c.type === 'certification' ? <Award className="w-4 h-4 text-muted-foreground mt-0.5" /> :
             <BookOpen className="w-4 h-4 text-muted-foreground mt-0.5" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium">{c.degree}</p>
                <Badge variant="secondary" className="text-[9px]">{c.type}</Badge>
                {c.expiryDate && isExpired(c.expiryDate) && <Badge variant="destructive" className="text-[9px]">Expired</Badge>}
                {c.expiryDate && isExpiringSoon(c.expiryDate) && <span className="text-[9px] bg-amber-500/10 text-amber-600 font-semibold uppercase px-1.5 py-0.5 rounded">Expiring Soon</span>}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{c.institution} · {c.year}</p>
              {c.expiryDate && <p className="text-[10px] text-muted-foreground/60">Expires: {new Date(c.expiryDate).toLocaleDateString('en-IN')}</p>}
            </div>
          </div>
        ))}
      </div>
    </PreviewShell>
  );
}

/* ───────────────────────────────────────────
   12. DoctorAI — Governed AI assist hub
   ─────────────────────────────────────────── */

export function DoctorAI() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user' as const, content: input.trim(), timestamp: new Date().toISOString() };
    setHistory(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Simulated AI response (no external API call to avoid PHI exposure)
    setTimeout(() => {
      const responses: Record<string, string> = {
        'summarize': '**Summary**\n\nBased on the available data:\n- The patient presents with symptoms consistent with the working diagnosis.\n- Key vitals are within acceptable ranges.\n- Recommended: Continue current management and monitor response.\n\n*This is a simulated AI response. Real PHI should not be sent to external AI APIs without a governed PHI agreement.*',
        'draft': '**Draft Note**\n\n**Subjective:** Patient reports improvement in symptoms since last visit.\n\n**Objective:** Vitals stable. Examination within normal limits.\n\n**Assessment:** Condition improving as expected.\n\n**Plan:** Continue medications. Follow up in 2 weeks.',
        'help': '**Available AI Tools**\n\n1. **Summarize** — Summarize the current patient case\n2. **Draft Note** — Generate a draft clinical note\n3. **Suggest Orders** — Suggest relevant orders based on diagnosis\n4. **Check Interactions** — Check drug-drug interactions\n5. **ICD-10 Suggest** — Suggest ICD-10 codes for a diagnosis\n\nType one of these commands to use the tool.',
      };

      const matchedKey = Object.keys(responses).find(k => userMsg.content.toLowerCase().includes(k));
      const response = matchedKey ? responses[matchedKey] : responses['help'];

      setHistory(prev => [...prev, { role: 'assistant', content: response, timestamp: new Date().toISOString() }]);
      setLoading(false);
    }, 1000);
  };

  return (
    <PreviewShell title="AI Assist Hub" subtitle="Governed summarization, drafting, and clinical decision support tools.">
      <QuickLinks />
      <Alert className="mb-2">
        <Shield className="w-4 h-4" />
        <AlertTitle>PHI Protection</AlertTitle>
        <AlertDescription>This hub uses simulated responses. No patient data is sent to external AI services. Real AI integration requires a governed PHI agreement with OpenRouter/Azure OpenAI per hospital policy.</AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setInput('summarize the current case')}><Brain className="w-3.5 h-3.5" />Summarize</Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setInput('draft a clinical note')}><FileText className="w-3.5 h-3.5" />Draft Note</Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setInput('suggest orders for hypertension')}><ClipboardList className="w-3.5 h-3.5" />Suggest Orders</Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setInput('help')}><Lightbulb className="w-3.5 h-3.5" />Help</Button>
      </div>

      <Card className="rounded-xl">
        <CardContent className="p-0">
          <ScrollArea className="h-80">
            <div className="p-4 space-y-4">
              {history.length === 0 && (
                <div className="text-center py-8">
                  <Bot className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Select a tool above or type a command to get started.</p>
                </div>
              )}
              {history.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && <Bot className="w-6 h-6 text-muted-foreground shrink-0 mt-0.5" />}
                  <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${msg.role === 'user' ? 'bg-foreground text-background' : 'bg-muted'}`}>
                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{msg.content}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{new Date(msg.timestamp).toLocaleTimeString('en-IN')}</p>
                  </div>
                  {msg.role === 'user' && <UserRound className="w-6 h-6 text-muted-foreground shrink-0 mt-0.5" />}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <Bot className="w-6 h-6 text-muted-foreground shrink-0" />
                  <div className="bg-muted rounded-xl px-4 py-2.5">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <Separator />
          <div className="p-3 flex gap-2">
            <Input
              placeholder="Ask AI to summarize, draft, or suggest..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="flex-1"
            />
            <Button size="sm" onClick={handleSubmit} disabled={loading || !input.trim()}>
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </PreviewShell>
  );
}
