import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle, ArrowRight, Droplets, Syringe, Bandage, Lock, HeartPulse,
  AlertCircle, Thermometer, Activity, Brain, BookOpen, Plus, Trash2, Check, X,
  Clock, User, Bed, Calendar, FileText, ClipboardList, Stethoscope, Pill,
  Eye, Shield, Bell, RefreshCw, GripVertical, Search, Download, Printer,
} from 'lucide-react';
import { toast } from 'sonner';
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
    { label: 'Dashboard', path: '/nurse' },
    { label: 'Ward', path: '/nurse/ward' },
    { label: 'Tasks', path: '/nurse/tasks' },
    { label: 'Vitals', path: '/nurse/vitals' },
    { label: 'Medications', path: '/nurse/medications' },
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

/* ════════════════════════════════════════════
   11 NEW NURSE SCREENS
   ════════════════════════════════════════════ */

/* ───────────────────────────────────────────
   1. NurseBloodAdmin — Blood product verification & reaction monitoring
   ─────────────────────────────────────────── */

const BLOOD_KEY = 'adrine_nurse_blood_admin';

type BloodAdmin = {
  id: string;
  patientName: string;
  uhid: string;
  product: string;
  unitNo: string;
  crossCheckBy: string;
  crossCheckDate: string;
  startTime: string;
  endTime: string;
  rate: string;
  preVitals: string;
  postVitals: string;
  reaction: 'none' | 'mild' | 'moderate' | 'severe';
  reactionNotes: string;
  status: 'pending' | 'in-progress' | 'completed' | 'stopped';
  verifiedBy: string;
  witnessedBy: string;
};

export function NurseBloodAdmin() {
  const [records, setRecords] = useState<BloodAdmin[]>(() => loadJson<BloodAdmin[]>(BLOOD_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientName: '', uhid: '', product: 'Packed RBC', unitNo: '', crossCheckBy: '',
    crossCheckDate: new Date().toISOString().split('T')[0], startTime: '', rate: '10 ml/min',
    preVitals: '', verifiedBy: '', witnessedBy: '',
  });

  const addRecord = () => {
    if (!form.patientName.trim() || !form.unitNo.trim()) return;
    const newRecord: BloodAdmin = {
      ...form, id: crypto.randomUUID?.() ?? `${Date.now()}`,
      endTime: '', postVitals: '', reaction: 'none', reactionNotes: '', status: 'pending',
    };
    const updated = [newRecord, ...records];
    setRecords(updated);
    saveJson(BLOOD_KEY, updated);
    setForm({ patientName: '', uhid: '', product: 'Packed RBC', unitNo: '', crossCheckBy: '', crossCheckDate: new Date().toISOString().split('T')[0], startTime: '', rate: '10 ml/min', preVitals: '', verifiedBy: '', witnessedBy: '' });
    setShowForm(false);
    toast.success('Blood transfusion record created');
  };

  const updateStatus = (id: string, status: BloodAdmin['status']) => {
    const now = new Date().toISOString();
    const updated = records.map(r => r.id === id ? { ...r, status, endTime: status === 'completed' || status === 'stopped' ? now : r.endTime } : r);
    setRecords(updated);
    saveJson(BLOOD_KEY, updated);
    toast.success(`Transfusion ${status}`);
  };

  const recordReaction = (id: string, reaction: BloodAdmin['reaction'], notes: string) => {
    const updated = records.map(r => r.id === id ? { ...r, reaction, reactionNotes: notes } : r);
    setRecords(updated);
    saveJson(BLOOD_KEY, updated);
    toast.success('Reaction recorded');
  };

  const activeCount = records.filter(r => r.status === 'in-progress').length;
  const pendingCount = records.filter(r => r.status === 'pending').length;

  const statusBadge = (s: BloodAdmin['status']) => {
    const map: Record<string, string> = { pending: 'bg-amber-500/10 text-amber-600', 'in-progress': 'bg-blue-500/10 text-blue-600', completed: 'bg-emerald-500/10 text-emerald-600', stopped: 'bg-destructive/10 text-destructive' };
    return <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${map[s] || ''}`}>{s}</span>;
  };

  const reactionBadge = (r: BloodAdmin['reaction']) => {
    const map: Record<string, string> = { none: 'bg-emerald-500/10 text-emerald-600', mild: 'bg-amber-500/10 text-amber-600', moderate: 'bg-orange-500/10 text-orange-600', severe: 'bg-destructive/10 text-destructive' };
    return r !== 'none' ? <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${map[r] || ''}`}>{r}</span> : null;
  };

  return (
    <PreviewShell title="Blood Administration" subtitle="Blood product verification, cross-check, infusion monitoring, and transfusion reaction tracking.">
      <QuickLinks />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Droplets className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold">Active</span></div>
          <p className="text-2xl font-bold">{activeCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Pending</span></div>
          <p className="text-2xl font-bold">{pendingCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">Completed</span></div>
          <p className="text-2xl font-bold">{records.filter(r => r.status === 'completed').length}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" /><span className="text-sm font-semibold">Reactions</span></div>
          <p className="text-2xl font-bold">{records.filter(r => r.reaction !== 'none').length}</p>
        </CardContent></Card>
      </div>

      <div className="flex justify-end">
        <Button size="sm" className="gap-1" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />New Transfusion</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))}>
              <option>Packed RBC</option><option>FFP</option><option>Platelets</option><option>Cryoprecipitate</option><option>Whole Blood</option><option>Albumin</option>
            </select>
            <Input placeholder="Unit/Bag number" value={form.unitNo} onChange={e => setForm(f => ({ ...f, unitNo: e.target.value }))} />
            <Input placeholder="Rate (e.g. 10 ml/min)" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Cross-check by</Label>
              <Input placeholder="Nurse name" value={form.crossCheckBy} onChange={e => setForm(f => ({ ...f, crossCheckBy: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Witnessed by</Label>
              <Input placeholder="Second nurse" value={form.witnessedBy} onChange={e => setForm(f => ({ ...f, witnessedBy: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Verified by</Label>
              <Input placeholder="Doctor/charge" value={form.verifiedBy} onChange={e => setForm(f => ({ ...f, verifiedBy: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addRecord}>Create Record</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {records.map(r => (
          <Card key={r.id} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Droplets className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-medium">{r.patientName}</p>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{r.uhid}</span>
                    {statusBadge(r.status)}
                    {reactionBadge(r.reaction)}
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{r.product}</span>
                    <span className="text-[9px] font-mono text-muted-foreground">Unit: {r.unitNo}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Cross-check: {r.crossCheckBy || '—'} · Verified: {r.verifiedBy || '—'} · Rate: {r.rate}</p>
                  {r.reaction !== 'none' && <p className="text-[10px] text-amber-600 mt-1">Reaction: {r.reactionNotes}</p>}
                </div>
                <div className="flex gap-1 shrink-0 flex-wrap">
                  {r.status === 'pending' && <Button size="sm" className="h-7 text-[10px]" onClick={() => updateStatus(r.id, 'in-progress')}>Start</Button>}
                  {r.status === 'in-progress' && (
                    <>
                      <Button size="sm" variant="outline" className="h-7 text-[10px] text-emerald-600" onClick={() => updateStatus(r.id, 'completed')}>Complete</Button>
                      <Button size="sm" variant="outline" className="h-7 text-[10px] text-destructive" onClick={() => updateStatus(r.id, 'stopped')}>Stop</Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {records.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No blood transfusion records yet.</p>}
      </div>
    </PreviewShell>
  );
}

/* ───────────────────────────────────────────
   2. NurseIVTherapy — IV start/dc, site assessment
   ─────────────────────────────────────────── */

const IV_KEY = 'adrine_nurse_iv_therapy';

type IVRecord = {
  id: string;
  patientName: string; uhid: string; site: string; lineType: string; gauge: string;
  startDate: string; startedBy: string; dressing: string; flush: string;
  siteCondition: string; complications: string; nextChange: string; status: 'active' | 'discontinued';
};

export function NurseIVTherapy() {
  const [records, setRecords] = useState<IVRecord[]>(() => loadJson<IVRecord[]>(IV_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientName: '', uhid: '', site: 'Left forearm', lineType: 'Peripheral IV', gauge: '20G',
    startDate: new Date().toISOString().split('T')[0], startedBy: '', dressing: 'Transparent',
    flush: 'NS 5ml', siteCondition: 'Clean, no redness', complications: '', nextChange: '',
  });

  const addRecord = () => {
    if (!form.patientName.trim() || !form.uhid.trim()) return;
    const newRecord: IVRecord = { ...form, id: crypto.randomUUID?.() ?? `${Date.now()}`, status: 'active' };
    const updated = [newRecord, ...records];
    setRecords(updated);
    saveJson(IV_KEY, updated);
    setForm({ patientName: '', uhid: '', site: 'Left forearm', lineType: 'Peripheral IV', gauge: '20G', startDate: new Date().toISOString().split('T')[0], startedBy: '', dressing: 'Transparent', flush: 'NS 5ml', siteCondition: 'Clean, no redness', complications: '', nextChange: '' });
    setShowForm(false);
    toast.success('IV line recorded');
  };

  const discontinue = (id: string) => {
    const updated = records.map(r => r.id === id ? { ...r, status: 'discontinued' as const } : r);
    setRecords(updated);
    saveJson(IV_KEY, updated);
    toast.success('IV line discontinued');
  };

  const activeCount = records.filter(r => r.status === 'active').length;

  return (
    <PreviewShell title="IV Therapy" subtitle="IV line start/discontinue, site assessment, infusion pump tracking, and complication monitoring.">
      <QuickLinks />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Syringe className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold">Active Lines</span></div>
          <p className="text-2xl font-bold">{activeCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><X className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Discontinued</span></div>
          <p className="text-2xl font-bold">{records.length - activeCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Complications</span></div>
          <p className="text-2xl font-bold">{records.filter(r => r.complications).length}</p>
        </CardContent></Card>
      </div>

      <div className="flex justify-end">
        <Button size="sm" className="gap-1" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />New IV Line</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.site} onChange={e => setForm(f => ({ ...f, site: e.target.value }))}>
              <option>Left forearm</option><option>Right forearm</option><option>Left hand</option><option>Right hand</option><option>Left AC</option><option>Right AC</option><option>Left foot</option><option>Right foot</option><option>SC</option><option>IJ</option><option>Femoral</option>
            </select>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.lineType} onChange={e => setForm(f => ({ ...f, lineType: e.target.value }))}>
              <option>Peripheral IV</option><option>Central Line</option><option>PICC</option><option>Midline</option><option>Port-a-Cath</option>
            </select>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.gauge} onChange={e => setForm(f => ({ ...f, gauge: e.target.value }))}>
              <option>14G</option><option>16G</option><option>18G</option><option>20G</option><option>22G</option><option>24G</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Started by" value={form.startedBy} onChange={e => setForm(f => ({ ...f, startedBy: e.target.value }))} />
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.dressing} onChange={e => setForm(f => ({ ...f, dressing: e.target.value }))}>
              <option>Transparent</option><option>Gauze</option><option>Securement device</option>
            </select>
            <Input placeholder="Next change date" type="date" value={form.nextChange} onChange={e => setForm(f => ({ ...f, nextChange: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Site condition</Label>
              <Textarea rows={2} value={form.siteCondition} onChange={e => setForm(f => ({ ...f, siteCondition: e.target.value }))} placeholder="Clean, dry, intact…" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Complications (if any)</Label>
              <Textarea rows={2} value={form.complications} onChange={e => setForm(f => ({ ...f, complications: e.target.value }))} placeholder="Phlebitis, infiltration, occlusion…" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addRecord}>Save IV Line</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {records.map(r => (
          <Card key={r.id} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Syringe className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-medium">{r.patientName}</p>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{r.uhid}</span>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${r.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>{r.status}</span>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{r.lineType} {r.gauge}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{r.site} · Started {r.startDate} by {r.startedBy} · Next change: {r.nextChange || '—'}</p>
                  <p className="text-[10px] text-muted-foreground">Site: {r.siteCondition}{r.complications && ` · ⚠️ ${r.complications}`}</p>
                </div>
                {r.status === 'active' && (
                  <Button size="sm" variant="outline" className="h-7 text-[10px] text-destructive shrink-0" onClick={() => discontinue(r.id)}>D/C</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {records.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No IV lines recorded.</p>}
      </div>
    </PreviewShell>
  );
}

/* ───────────────────────────────────────────
   3. NurseWoundCare — Wound staging, dressing
   ─────────────────────────────────────────── */

const WOUND_KEY = 'adrine_nurse_wound_care';

type Wound = {
  id: string;
  patientName: string; uhid: string; woundType: string; location: string;
  stage: string; dimensions: string; appearance: string; exudate: string;
  dressing: string; painLevel: number; lastChanged: string; nextChange: string;
  notes: string; status: 'active' | 'healing' | 'healed';
};

export function NurseWoundCare() {
  const [wounds, setWounds] = useState<Wound[]>(() => loadJson<Wound[]>(WOUND_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientName: '', uhid: '', woundType: 'Pressure injury', location: 'Sacrum',
    stage: 'Stage 2', dimensions: '', appearance: '', exudate: 'None',
    dressing: 'Hydrocolloid', painLevel: 0, lastChanged: new Date().toISOString().split('T')[0],
    nextChange: '', notes: '',
  });

  const addWound = () => {
    if (!form.patientName.trim()) return;
    const newWound: Wound = { ...form, id: crypto.randomUUID?.() ?? `${Date.now()}`, painLevel: Number(form.painLevel), status: 'active' };
    const updated = [newWound, ...wounds];
    setWounds(updated);
    saveJson(WOUND_KEY, updated);
    setForm({ patientName: '', uhid: '', woundType: 'Pressure injury', location: 'Sacrum', stage: 'Stage 2', dimensions: '', appearance: '', exudate: 'None', dressing: 'Hydrocolloid', painLevel: 0, lastChanged: new Date().toISOString().split('T')[0], nextChange: '', notes: '' });
    setShowForm(false);
    toast.success('Wound record created');
  };

  const updateStatus = (id: string, status: Wound['status']) => {
    const updated = wounds.map(w => w.id === id ? { ...w, status } : w);
    setWounds(updated);
    saveJson(WOUND_KEY, updated);
    toast.success(`Wound marked as ${status}`);
  };

  const activeCount = wounds.filter(w => w.status !== 'healed').length;

  return (
    <PreviewShell title="Wound Care" subtitle="Wound staging, dressing changes, photo documentation, and healing progress tracking.">
      <QuickLinks />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Bandage className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Active Wounds</span></div>
          <p className="text-2xl font-bold">{activeCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">Healed</span></div>
          <p className="text-2xl font-bold">{wounds.filter(w => w.status === 'healed').length}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-destructive" /><span className="text-sm font-semibold">Due Today</span></div>
          <p className="text-2xl font-bold">{wounds.filter(w => w.nextChange === new Date().toISOString().split('T')[0] && w.status !== 'healed').length}</p>
        </CardContent></Card>
      </div>

      <div className="flex justify-end">
        <Button size="sm" className="gap-1" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />New Wound Record</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.woundType} onChange={e => setForm(f => ({ ...f, woundType: e.target.value }))}>
              <option>Pressure injury</option><option>Surgical wound</option><option>Diabetic ulcer</option><option>Venous ulcer</option><option>Arterial ulcer</option><option>Traumatic wound</option><option>Burn</option>
            </select>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}>
              <option>Sacrum</option><option>Heel</option><option>Ankle</option><option>Elbow</option><option>Shoulder</option><option>Hip</option><option>Foot</option><option>Leg</option><option>Abdomen</option><option>Chest</option><option>Other</option>
            </select>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}>
              <option>Stage 1</option><option>Stage 2</option><option>Stage 3</option><option>Stage 4</option><option>Unstageable</option><option>Deep Tissue</option><option>Surgical</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Dimensions (cm)" value={form.dimensions} onChange={e => setForm(f => ({ ...f, dimensions: e.target.value }))} />
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.exudate} onChange={e => setForm(f => ({ ...f, exudate: e.target.value }))}>
              <option>None</option><option>Scant</option><option>Small</option><option>Moderate</option><option>Large</option>
            </select>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.dressing} onChange={e => setForm(f => ({ ...f, dressing: e.target.value }))}>
              <option>Hydrocolloid</option><option>Foam</option><option>Alginate</option><option>Hydrogel</option><option>Silver</option><option>Gauze</option><option>Film</option>
            </select>
          </div>
          <Textarea placeholder="Appearance description" rows={2} value={form.appearance} onChange={e => setForm(f => ({ ...f, appearance: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Next change date" type="date" value={form.nextChange} onChange={e => setForm(f => ({ ...f, nextChange: e.target.value }))} />
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Pain level (0-10)</Label>
              <input type="range" min="0" max="10" value={form.painLevel} onChange={e => setForm(f => ({ ...f, painLevel: Number(e.target.value) }))} className="w-full" />
              <span className="text-xs">{form.painLevel}/10</span>
            </div>
          </div>
          <Textarea placeholder="Additional notes" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addWound}>Save Wound Record</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {wounds.map(w => (
          <Card key={w.id} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Bandage className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-medium">{w.patientName}</p>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{w.uhid}</span>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${w.status === 'active' ? 'bg-amber-500/10 text-amber-600' : w.status === 'healing' ? 'bg-blue-500/10 text-blue-600' : 'bg-emerald-500/10 text-emerald-600'}`}>{w.status}</span>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{w.woundType}</span>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{w.stage}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{w.location} · {w.dimensions} · Exudate: {w.exudate} · Pain: {w.painLevel}/10</p>
                  <p className="text-[10px] text-muted-foreground">Dressing: {w.dressing} · Last changed: {w.lastChanged} · Next: {w.nextChange || '—'}</p>
                  {(w.appearance || w.notes) && <p className="text-[10px] text-muted-foreground mt-0.5">{w.appearance}{w.notes && ` — ${w.notes}`}</p>}
                </div>
                {w.status !== 'healed' && (
                  <div className="flex gap-1 shrink-0">
                    {w.status === 'active' && <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => updateStatus(w.id, 'healing')}>Healing</Button>}
                    <Button size="sm" variant="outline" className="h-7 text-[10px] text-emerald-600" onClick={() => updateStatus(w.id, 'healed')}>Healed</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {wounds.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No wound care records yet.</p>}
      </div>
    </PreviewShell>
  );
}

/* ───────────────────────────────────────────
   4. NurseRestraints — Restraint order & monitoring
   ─────────────────────────────────────────── */

const RESTRAINTS_KEY = 'adrine_nurse_restraints';

type Restraint = {
  id: string;
  patientName: string; uhid: string; type: string; reason: string; orderedBy: string;
  startTime: string; reviewInterval: string; behaviorNoted: string;
  checks: Array<{ time: string; finding: string; by: string }>;
  status: 'active' | 'discontinued';
};

export function NurseRestraints() {
  const [restraints, setRestraints] = useState<Restraint[]>(() => loadJson<Restraint[]>(RESTRAINTS_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientName: '', uhid: '', type: 'Wrist', reason: 'Agitation', orderedBy: '',
    startTime: new Date().toISOString().split('T')[0], reviewInterval: '2 hours', behaviorNoted: '',
  });

  const addRestraint = () => {
    if (!form.patientName.trim() || !form.orderedBy.trim()) return;
    const newRestraint: Restraint = { ...form, id: crypto.randomUUID?.() ?? `${Date.now()}`, checks: [], status: 'active' };
    const updated = [newRestraint, ...restraints];
    setRestraints(updated);
    saveJson(RESTRAINTS_KEY, updated);
    setForm({ patientName: '', uhid: '', type: 'Wrist', reason: 'Agitation', orderedBy: '', startTime: new Date().toISOString().split('T')[0], reviewInterval: '2 hours', behaviorNoted: '' });
    setShowForm(false);
    toast.success('Restraint record created');
  };

  const addCheck = (id: string) => {
    const now = new Date().toLocaleString('en-IN');
    const finding = prompt('Check finding (e.g., "Circulation intact, repositioned"):');
    if (!finding) return;
    const updated = restraints.map(r => r.id === id ? { ...r, checks: [...r.checks, { time: now, finding, by: 'Current Nurse' }] } : r);
    setRestraints(updated);
    saveJson(RESTRAINTS_KEY, updated);
    toast.success('Check recorded');
  };

  const discontinue = (id: string) => {
    const updated = restraints.map(r => r.id === id ? { ...r, status: 'discontinued' as const } : r);
    setRestraints(updated);
    saveJson(RESTRAINTS_KEY, updated);
    toast.success('Restraint discontinued');
  };

  const activeCount = restraints.filter(r => r.status === 'active').length;
  const overdueChecks = restraints.filter(r => r.status === 'active' && r.checks.length === 0);

  return (
    <PreviewShell title="Restraints" subtitle="Restraint order documentation, regular checks, and discontinuation tracking.">
      <QuickLinks />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Lock className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Active</span></div>
          <p className="text-2xl font-bold">{activeCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-destructive" /><span className="text-sm font-semibold">No Checks Yet</span></div>
          <p className="text-2xl font-bold">{overdueChecks.length}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Check className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Total Checks</span></div>
          <p className="text-2xl font-bold">{restraints.reduce((sum, r) => sum + r.checks.length, 0)}</p>
        </CardContent></Card>
      </div>

      <div className="flex justify-end">
        <Button size="sm" className="gap-1" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />New Restraint Order</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option>Wrist</option><option>Ankle</option><option>Waist</option><option>Mittens</option><option>Full body</option>
            </select>
            <Input placeholder="Ordered by" value={form.orderedBy} onChange={e => setForm(f => ({ ...f, orderedBy: e.target.value }))} />
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.reviewInterval} onChange={e => setForm(f => ({ ...f, reviewInterval: e.target.value }))}>
              <option>1 hour</option><option>2 hours</option><option>4 hours</option><option>Q shift</option>
            </select>
          </div>
          <Textarea placeholder="Reason for restraint" rows={2} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
          <Textarea placeholder="Behavior noted" rows={2} value={form.behaviorNoted} onChange={e => setForm(f => ({ ...f, behaviorNoted: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addRestraint}>Save Order</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {restraints.map(r => (
          <Card key={r.id} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Lock className={`w-4 h-4 mt-0.5 shrink-0 ${r.status === 'active' ? 'text-amber-500' : 'text-muted-foreground'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-medium">{r.patientName}</p>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{r.uhid}</span>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${r.status === 'active' ? 'bg-amber-500/10 text-amber-600' : 'bg-muted text-muted-foreground'}`}>{r.status}</span>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{r.type}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Ordered by {r.orderedBy} · {r.reason} · Review: {r.reviewInterval}</p>
                  <p className="text-[10px] text-muted-foreground">{r.checks.length} checks recorded · Last: {r.checks[r.checks.length - 1]?.finding || 'No checks yet'}</p>
                  <details className="text-xs mt-1">
                    <summary className="cursor-pointer text-muted-foreground">Check history ({r.checks.length})</summary>
                    <div className="mt-1 space-y-0.5">
                      {r.checks.map((c, i) => (
                        <p key={i} className="text-[9px] text-muted-foreground">{c.time} — {c.finding} (by {c.by})</p>
                      ))}
                    </div>
                  </details>
                </div>
                <div className="flex gap-1 shrink-0">
                  {r.status === 'active' && (
                    <>
                      <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => addCheck(r.id)}>+ Check</Button>
                      <Button size="sm" variant="outline" className="h-7 text-[10px] text-destructive" onClick={() => discontinue(r.id)}>D/C</Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {restraints.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No restraint orders recorded.</p>}
      </div>
    </PreviewShell>
  );
}

/* ───────────────────────────────────────────
   5. NurseCodeBlue — Code Blue documentation
   ─────────────────────────────────────────── */

const CODE_BLUE_KEY = 'adrine_nurse_code_blue';

type CodeBlue = {
  id: string;
  patientName: string; uhid: string; location: string; date: string;
  calledBy: string; teamLead: string; codeDuration: string;
  events: Array<{ time: string; action: string; by: string }>;
  meds: Array<{ time: string; drug: string; dose: string; route: string }>;
  outcome: 'ROSC' | 'Expired' | 'Transferred' | 'Ongoing';
  rhythm: string; notes: string;
};

export function NurseCodeBlue() {
  const [codes, setCodes] = useState<CodeBlue[]>(() => loadJson<CodeBlue[]>(CODE_BLUE_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientName: '', uhid: '', location: '', date: new Date().toISOString(), calledBy: '',
    teamLead: '', rhythm: 'VT', outcome: 'ROSC' as CodeBlue['outcome'], notes: '',
  });

  const addCode = () => {
    if (!form.patientName.trim()) return;
    const newCode: CodeBlue = {
      ...form, id: crypto.randomUUID?.() ?? `${Date.now()}`, codeDuration: '',
      events: [{ time: new Date().toLocaleTimeString('en-IN'), action: 'Code called', by: form.calledBy }],
      meds: [],
    };
    const updated = [newCode, ...codes];
    setCodes(updated);
    saveJson(CODE_BLUE_KEY, updated);
    setForm({ patientName: '', uhid: '', location: '', date: new Date().toISOString(), calledBy: '', teamLead: '', rhythm: 'VT', outcome: 'ROSC' as CodeBlue['outcome'], notes: '' });
    setShowForm(false);
    toast.success('Code Blue documentation created');
  };

  const addEvent = (id: string) => {
    const action = prompt('Event description:');
    if (!action) return;
    const updated = codes.map(c => c.id === id ? { ...c, events: [...c.events, { time: new Date().toLocaleTimeString('en-IN'), action, by: 'Current Nurse' }] } : c);
    setCodes(updated);
    saveJson(CODE_BLUE_KEY, updated);
  };

  const addMed = (id: string) => {
    const drug = prompt('Drug:');
    if (!drug) return;
    const dose = prompt('Dose:') || '';
    const route = prompt('Route (IV/IO/ET):') || 'IV';
    const updated = codes.map(c => c.id === id ? { ...c, meds: [...c.meds, { time: new Date().toLocaleTimeString('en-IN'), drug, dose, route }] } : c);
    setCodes(updated);
    saveJson(CODE_BLUE_KEY, updated);
  };

  const rhythmOptions = ['VT', 'VF', 'PEA', 'Asystole', 'Sinus', 'Unknown'];

  return (
    <PreviewShell title="Code Blue" subtitle="Code event documentation, medication log, timing log, and outcome recording.">
      <QuickLinks />
      <div className="flex justify-end">
        <Button size="sm" className="gap-1" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />New Code Documentation</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Location (e.g. Ward 3B)" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            <Input placeholder="Called by" value={form.calledBy} onChange={e => setForm(f => ({ ...f, calledBy: e.target.value }))} />
            <Input placeholder="Team lead" value={form.teamLead} onChange={e => setForm(f => ({ ...f, teamLead: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.rhythm} onChange={e => setForm(f => ({ ...f, rhythm: e.target.value }))}>
              {rhythmOptions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value as CodeBlue['outcome'] }))}>
              <option value="ROSC">ROSC</option><option value="Expired">Expired</option><option value="Transferred">Transferred</option><option value="Ongoing">Ongoing</option>
            </select>
          </div>
          <Textarea placeholder="Notes" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addCode}>Create Documentation</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {codes.map(c => (
          <Card key={c.id} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <HeartPulse className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-medium">{c.patientName}</p>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{c.uhid}</span>
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">{c.outcome}</span>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{c.rhythm}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{c.location} · Called by {c.calledBy} · Lead: {c.teamLead}</p>
                  <p className="text-[10px] text-muted-foreground">{c.events.length} events · {c.meds.length} medications</p>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground">Event Log ({c.events.length})</summary>
                      <div className="mt-1 space-y-0.5">
                        {c.events.map((e, i) => (
                          <p key={i} className="text-[9px] text-muted-foreground">{e.time} — {e.action} ({e.by})</p>
                        ))}
                      </div>
                    </details>
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground">Med Log ({c.meds.length})</summary>
                      <div className="mt-1 space-y-0.5">
                        {c.meds.map((m, i) => (
                          <p key={i} className="text-[9px] text-muted-foreground">{m.time} — {m.drug} {m.dose} {m.route}</p>
                        ))}
                      </div>
                    </details>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => addEvent(c.id)}>+ Event</Button>
                  <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => addMed(c.id)}>+ Med</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {codes.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No code blue events recorded.</p>}
      </div>
    </PreviewShell>
  );
}

/* ───────────────────────────────────────────
   6. NurseFallRisk — Fall risk assessment
   ─────────────────────────────────────────── */

const FALL_RISK_KEY = 'adrine_nurse_fall_risk';

type FallRiskAssessment = {
  id: string;
  patientName: string; uhid: string; date: string;
  age: number; fallHistory: boolean; mobility: string; mentalStatus: string;
  elimination: string; meds: string; score: number; risk: 'Low' | 'Medium' | 'High';
  interventions: string; reassessDate: string; status: 'active' | 'completed';
};

export function NurseFallRisk() {
  const [assessments, setAssessments] = useState<FallRiskAssessment[]>(() => loadJson<FallRiskAssessment[]>(FALL_RISK_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientName: '', uhid: '', date: new Date().toISOString().split('T')[0],
    age: 60, fallHistory: false, mobility: 'Independent', mentalStatus: 'Alert',
    elimination: 'Independent', meds: 'None', interventions: '', reassessDate: '',
  });

  const calculateScore = (f: typeof form): { score: number; risk: FallRiskAssessment['risk'] } => {
    let score = 0;
    if (f.age >= 65) score += 2;
    else if (f.age >= 50) score += 1;
    if (f.fallHistory) score += 3;
    if (f.mobility === 'Walker/Cane') score += 2;
    else if (f.mobility === 'Bedridden') score += 3;
    else if (f.mobility === 'Unsteady') score += 1;
    if (f.mentalStatus === 'Confused') score += 2;
    else if (f.mentalStatus === 'Agitated') score += 3;
    if (f.elimination === 'Assisted') score += 1;
    else if (f.elimination === 'Incontinent') score += 2;
    if (f.meds !== 'None') score += 1;
    const risk: FallRiskAssessment['risk'] = score >= 7 ? 'High' : score >= 4 ? 'Medium' : 'Low';
    return { score, risk };
  };

  const addAssessment = () => {
    if (!form.patientName.trim()) return;
    const { score, risk } = calculateScore(form);
    const newAssessment: FallRiskAssessment = { ...form, id: crypto.randomUUID?.() ?? `${Date.now()}`, score, risk, status: 'active' };
    const updated = [newAssessment, ...assessments];
    setAssessments(updated);
    saveJson(FALL_RISK_KEY, updated);
    setForm({ patientName: '', uhid: '', date: new Date().toISOString().split('T')[0], age: 60, fallHistory: false, mobility: 'Independent', mentalStatus: 'Alert', elimination: 'Independent', meds: 'None', interventions: '', reassessDate: '' });
    setShowForm(false);
    toast.success(`Fall risk assessment saved: ${risk} risk (score: ${score})`);
  };

  const highRiskCount = assessments.filter(a => a.risk === 'High').length;

  return (
    <PreviewShell title="Fall Risk Assessment" subtitle="Morse/STRATIFY-style fall risk scoring, post-fall documentation, and prevention interventions.">
      <QuickLinks />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" /><span className="text-sm font-semibold">High Risk</span></div>
          <p className="text-2xl font-bold">{highRiskCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Medium Risk</span></div>
          <p className="text-2xl font-bold">{assessments.filter(a => a.risk === 'Medium').length}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">Low Risk</span></div>
          <p className="text-2xl font-bold">{assessments.filter(a => a.risk === 'Low').length}</p>
        </CardContent></Card>
      </div>

      <div className="flex justify-end">
        <Button size="sm" className="gap-1" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />New Assessment</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Age</Label>
              <Input type="number" min="0" max="120" value={form.age} onChange={e => setForm(f => ({ ...f, age: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Fall history</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.fallHistory ? 'yes' : 'no'} onChange={e => setForm(f => ({ ...f, fallHistory: e.target.value === 'yes' }))}>
                <option value="no">No</option><option value="yes">Yes</option>
              </select>
            </div>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.mobility} onChange={e => setForm(f => ({ ...f, mobility: e.target.value }))}>
              <option>Independent</option><option>Unsteady</option><option>Walker/Cane</option><option>Bedridden</option>
            </select>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.mentalStatus} onChange={e => setForm(f => ({ ...f, mentalStatus: e.target.value }))}>
              <option>Alert</option><option>Confused</option><option>Agitated</option><option>Sedated</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.elimination} onChange={e => setForm(f => ({ ...f, elimination: e.target.value }))}>
              <option>Independent</option><option>Assisted</option><option>Incontinent</option><option>Bedpan/Urinal</option>
            </select>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.meds} onChange={e => setForm(f => ({ ...f, meds: e.target.value }))}>
              <option>None</option><option>Sedatives</option><option>Diuretics</option><option>Antihypertensives</option><option>Opioids</option><option>Multiple</option>
            </select>
            <Input placeholder="Reassessment date" type="date" value={form.reassessDate} onChange={e => setForm(f => ({ ...f, reassessDate: e.target.value }))} />
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm font-medium">Estimated Score: {calculateScore(form).score} — {calculateScore(form).risk} Risk</p>
          </div>
          <Textarea placeholder="Prevention interventions (e.g., bed alarm, non-slip socks, hourly rounding)" rows={2} value={form.interventions} onChange={e => setForm(f => ({ ...f, interventions: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addAssessment}>Save Assessment</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {assessments.map(a => (
          <Card key={a.id} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${a.risk === 'High' ? 'text-destructive' : a.risk === 'Medium' ? 'text-amber-500' : 'text-emerald-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-medium">{a.patientName}</p>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{a.uhid}</span>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${a.risk === 'High' ? 'bg-destructive/10 text-destructive' : a.risk === 'Medium' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>{a.risk}</span>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">Score: {a.score}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Age: {a.age} · Mobility: {a.mobility} · Mental: {a.mentalStatus} · Fall Hx: {a.fallHistory ? 'Yes' : 'No'}</p>
                  {a.interventions && <p className="text-[10px] text-muted-foreground">Interventions: {a.interventions}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {assessments.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No fall risk assessments recorded.</p>}
      </div>
    </PreviewShell>
  );
}

/* ───────────────────────────────────────────
   7. NursePressureInjury — Braden score & turn schedule
   ─────────────────────────────────────────── */

const PI_KEY = 'adrine_nurse_pressure_injury';

type PressureInjury = {
  id: string;
  patientName: string; uhid: string; date: string;
  sensory: number; moisture: number; activity: number; mobility: number;
  nutrition: number; frictionShear: number; totalScore: number;
  risk: 'Low' | 'Moderate' | 'High' | 'Very High';
  turnSchedule: string; supportSurface: string; interventions: string;
  status: 'active' | 'completed';
};

export function NursePressureInjury() {
  const [injuries, setInjuries] = useState<PressureInjury[]>(() => loadJson<PressureInjury[]>(PI_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientName: '', uhid: '', date: new Date().toISOString().split('T')[0],
    sensory: 4, moisture: 4, activity: 4, mobility: 4, nutrition: 4, frictionShear: 3,
    turnSchedule: 'Q2H', supportSurface: 'Standard mattress', interventions: '',
  });

  const calculateBraden = (f: typeof form) => {
    const total = f.sensory + f.moisture + f.activity + f.mobility + f.nutrition + f.frictionShear;
    const risk: PressureInjury['risk'] = total <= 9 ? 'Very High' : total <= 12 ? 'High' : total <= 15 ? 'Moderate' : 'Low';
    return { totalScore: total, risk };
  };

  const addInjury = () => {
    if (!form.patientName.trim()) return;
    const { totalScore, risk } = calculateBraden(form);
    const newPI: PressureInjury = { ...form, id: crypto.randomUUID?.() ?? `${Date.now()}`, totalScore, risk, status: 'active' };
    const updated = [newPI, ...injuries];
    setInjuries(updated);
    saveJson(PI_KEY, updated);
    setForm({ patientName: '', uhid: '', date: new Date().toISOString().split('T')[0], sensory: 4, moisture: 4, activity: 4, mobility: 4, nutrition: 4, frictionShear: 3, turnSchedule: 'Q2H', supportSurface: 'Standard mattress', interventions: '' });
    setShowForm(false);
    toast.success(`Braden score saved: ${totalScore} — ${risk} risk`);
  };

  const bradenOptions = [
    { label: 'Sensory Perception', key: 'sensory' as const, desc: ['1: Completely limited', '2: Very limited', '3: Slightly limited', '4: No impairment'] },
    { label: 'Moisture', key: 'moisture' as const, desc: ['1: Constantly moist', '2: Very moist', '3: Occasionally moist', '4: Rarely moist'] },
    { label: 'Activity', key: 'activity' as const, desc: ['1: Bedfast', '2: Chairfast', '3: Walks occasionally', '4: Walks frequently'] },
    { label: 'Mobility', key: 'mobility' as const, desc: ['1: Completely immobile', '2: Very limited', '3: Slightly limited', '4: No limitations'] },
    { label: 'Nutrition', key: 'nutrition' as const, desc: ['1: Very poor', '2: Probably inadequate', '3: Adequate', '4: Excellent'] },
    { label: 'Friction/Shear', key: 'frictionShear' as const, desc: ['1: Problem', '2: Potential problem', '3: No apparent problem'] },
  ];

  return (
    <PreviewShell title="Pressure Injury Prevention" subtitle="Braden scale scoring, turn schedule, support surface tracking, and wound staging.">
      <QuickLinks />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-destructive">Very High</span><span className="text-2xl font-bold">{injuries.filter(i => i.risk === 'Very High').length}</span></div>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-orange-500">High</span><span className="text-2xl font-bold">{injuries.filter(i => i.risk === 'High').length}</span></div>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-amber-500">Moderate</span><span className="text-2xl font-bold">{injuries.filter(i => i.risk === 'Moderate').length}</span></div>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-emerald-500">Low</span><span className="text-2xl font-bold">{injuries.filter(i => i.risk === 'Low').length}</span></div>
        </CardContent></Card>
      </div>

      <div className="flex justify-end">
        <Button size="sm" className="gap-1" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />New Braden Score</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {bradenOptions.map(opt => (
              <div key={opt.key} className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">{opt.label}</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form[opt.key]} onChange={e => setForm(f => ({ ...f, [opt.key]: Number(e.target.value) }))}>
                  {opt.desc.map(d => (
                    <option key={d[0]} value={Number(d[0])}>{d}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.turnSchedule} onChange={e => setForm(f => ({ ...f, turnSchedule: e.target.value }))}>
              <option>Q2H</option><option>Q1H</option><option>Q4H</option><option>PRN</option>
            </select>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.supportSurface} onChange={e => setForm(f => ({ ...f, supportSurface: e.target.value }))}>
              <option>Standard mattress</option><option>Pressure relief mattress</option><option>Air fluidized</option><option>Low air loss</option><option>Alternating pressure</option>
            </select>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm font-medium">Braden Score: {calculateBraden(form).totalScore} — {calculateBraden(form).risk} Risk</p>
          </div>
          <Textarea placeholder="Prevention interventions" rows={2} value={form.interventions} onChange={e => setForm(f => ({ ...f, interventions: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addInjury}>Save Braden Score</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {injuries.map(i => (
          <Card key={i.id} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-medium">{i.patientName}</p>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{i.uhid}</span>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${i.risk === 'Very High' ? 'bg-destructive/10 text-destructive' : i.risk === 'High' ? 'bg-orange-500/10 text-orange-600' : i.risk === 'Moderate' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>{i.risk}</span>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">Braden: {i.totalScore}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    S:{i.sensory} M:{i.moisture} A:{i.activity} Mo:{i.mobility} N:{i.nutrition} F:{i.frictionShear} ·
                    Turn: {i.turnSchedule} · Surface: {i.supportSurface}
                  </p>
                  {i.interventions && <p className="text-[10px] text-muted-foreground">{i.interventions}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {injuries.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No Braden scores recorded.</p>}
      </div>
    </PreviewShell>
  );
}

/* ───────────────────────────────────────────
   8. NurseSepsis — qSOFA/SIRS screening
   ─────────────────────────────────────────── */

const SEPSIS_KEY = 'adrine_nurse_sepsis';

type SepsisScreen = {
  id: string;
  patientName: string; uhid: string; date: string;
  temp: number; hr: number; rr: number; wbc: string; alteredMent: boolean;
  sbp: number; glucose: string; lactate: string;
  qsofaScore: number; sirsScore: number;
  risk: 'Low' | 'Sepsis' | 'Septic Shock';
  protocolActivated: boolean; interventions: string;
};

export function NurseSepsis() {
  const [screens, setScreens] = useState<SepsisScreen[]>(() => loadJson<SepsisScreen[]>(SEPSIS_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientName: '', uhid: '', date: new Date().toISOString().split('T')[0],
    temp: 37, hr: 80, rr: 16, wbc: '10', alteredMent: false,
    sbp: 120, glucose: '140', lactate: '1.5',
    interventions: '',
  });

  const calculate = (f: typeof form) => {
    let qsofa = 0;
    if (f.rr >= 22) qsofa++;
    if (f.alteredMent) qsofa++;
    if (f.sbp <= 100) qsofa++;

    let sirs = 0;
    if (f.temp > 38 || f.temp < 36) sirs++;
    if (f.hr > 90) sirs++;
    if (f.rr > 20) sirs++;
    if (Number(f.wbc) > 12 || Number(f.wbc) < 4) sirs++;

    let risk: SepsisScreen['risk'] = 'Low';
    if (qsofa >= 2 && f.sbp < 90) risk = 'Septic Shock';
    else if (qsofa >= 2) risk = 'Sepsis';
    else if (sirs >= 2) risk = 'Sepsis';

    return { qsofaScore: qsofa, sirsScore: sirs, risk };
  };

  const addScreen = () => {
    if (!form.patientName.trim()) return;
    const { qsofaScore, sirsScore, risk } = calculate(form);
    const newScreen: SepsisScreen = {
      ...form, id: crypto.randomUUID?.() ?? `${Date.now()}`,
      qsofaScore, sirsScore, risk, protocolActivated: risk !== 'Low',
    };
    const updated = [newScreen, ...screens];
    setScreens(updated);
    saveJson(SEPSIS_KEY, updated);
    setForm({ patientName: '', uhid: '', date: new Date().toISOString().split('T')[0], temp: 37, hr: 80, rr: 16, wbc: '10', alteredMent: false, sbp: 120, glucose: '140', lactate: '1.5', interventions: '' });
    setShowForm(false);
    toast.success(`Sepsis screen: ${risk} (qSOFA: ${qsofaScore}, SIRS: ${sirsScore})`);
  };

  const sepsisCount = screens.filter(s => s.risk === 'Sepsis').length;
  const shockCount = screens.filter(s => s.risk === 'Septic Shock').length;

  return (
    <PreviewShell title="Sepsis Screening" subtitle="qSOFA/SIRS scoring, lactate monitoring, protocol activation, and early intervention tracking.">
      <QuickLinks />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><HeartPulse className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">Low Risk</span></div>
          <p className="text-2xl font-bold">{screens.filter(s => s.risk === 'Low').length}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Sepsis Alert</span></div>
          <p className="text-2xl font-bold">{sepsisCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" /><span className="text-sm font-semibold">Septic Shock</span></div>
          <p className="text-2xl font-bold">{shockCount}</p>
        </CardContent></Card>
      </div>

      <div className="flex justify-end">
        <Button size="sm" className="gap-1" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />New Sepsis Screen</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Temp (°C)</Label>
              <Input type="number" step="0.1" value={form.temp} onChange={e => setForm(f => ({ ...f, temp: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">HR</Label>
              <Input type="number" value={form.hr} onChange={e => setForm(f => ({ ...f, hr: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">RR</Label>
              <Input type="number" value={form.rr} onChange={e => setForm(f => ({ ...f, rr: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">SBP</Label>
              <Input type="number" value={form.sbp} onChange={e => setForm(f => ({ ...f, sbp: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">WBC (k/µL)</Label>
              <Input value={form.wbc} onChange={e => setForm(f => ({ ...f, wbc: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Glucose (mg/dL)</Label>
              <Input value={form.glucose} onChange={e => setForm(f => ({ ...f, glucose: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Lactate (mmol/L)</Label>
              <Input value={form.lactate} onChange={e => setForm(f => ({ ...f, lactate: e.target.value }))} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={form.alteredMent} onChange={e => setForm(f => ({ ...f, alteredMent: e.target.checked }))} />
            Altered mental status (GCS &lt; 15)
          </label>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm font-medium">
              qSOFA: {calculate(form).qsofaScore}/3 · SIRS: {calculate(form).sirsScore}/4 · Risk: <span className={calculate(form).risk === 'Septic Shock' ? 'text-destructive' : calculate(form).risk === 'Sepsis' ? 'text-amber-600' : 'text-emerald-600'}>{calculate(form).risk}</span>
            </p>
          </div>
          <Textarea placeholder="Interventions performed" rows={2} value={form.interventions} onChange={e => setForm(f => ({ ...f, interventions: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addScreen}>Save Screen</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {screens.map(s => (
          <Card key={s.id} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Thermometer className={`w-4 h-4 mt-0.5 shrink-0 ${s.risk === 'Septic Shock' ? 'text-destructive' : s.risk === 'Sepsis' ? 'text-amber-500' : 'text-emerald-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-medium">{s.patientName}</p>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{s.uhid}</span>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${s.risk === 'Septic Shock' ? 'bg-destructive/10 text-destructive' : s.risk === 'Sepsis' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>{s.risk}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">qSOFA: {s.qsofaScore}/3 · SIRS: {s.sirsScore}/4</p>
                  <p className="text-[10px] text-muted-foreground">T: {s.temp}°C HR: {s.hr} RR: {s.rr} SBP: {s.sbp} WBC: {s.wbc} Lac: {s.lactate}</p>
                  <p className="text-[10px] text-muted-foreground">{s.protocolActivated ? 'Protocol activated' : 'No protocol'} · {s.interventions || 'No interventions recorded'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {screens.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No sepsis screens recorded.</p>}
      </div>
    </PreviewShell>
  );
}

/* ───────────────────────────────────────────
   9. NursePain — Pain assessment & management
   ─────────────────────────────────────────── */

const PAIN_KEY = 'adrine_nurse_pain';

type PainRecord = {
  id: string;
  patientName: string; uhid: string; date: string;
  painScale: number; painLocation: string; painQuality: string;
  onset: string; duration: string; aggravating: string; alleviating: string;
  intervention: string; reassessment: string; reassessedScale: number;
  status: 'initial' | 'reassessed';
};

export function NursePain() {
  const [records, setRecords] = useState<PainRecord[]>(() => loadJson<PainRecord[]>(PAIN_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientName: '', uhid: '', date: new Date().toISOString(),
    painScale: 5, painLocation: '', painQuality: 'Aching', onset: 'Sudden',
    duration: '', aggravating: '', alleviating: '', intervention: '',
    reassessment: '', reassessedScale: 0,
  });

  const addRecord = () => {
    if (!form.patientName.trim()) return;
    const newRecord: PainRecord = { ...form, id: crypto.randomUUID?.() ?? `${Date.now()}`, status: !form.intervention ? 'initial' : 'reassessed' };
    const updated = [newRecord, ...records];
    setRecords(updated);
    saveJson(PAIN_KEY, updated);
    setForm({ patientName: '', uhid: '', date: new Date().toISOString(), painScale: 5, painLocation: '', painQuality: 'Aching', onset: 'Sudden', duration: '', aggravating: '', alleviating: '', intervention: '', reassessment: '', reassessedScale: 0 });
    setShowForm(false);
    toast.success('Pain assessment recorded');
  };

  const severeCount = records.filter(r => r.painScale >= 7 && r.status === 'initial').length;

  return (
    <PreviewShell title="Pain Management" subtitle="Pain assessment scales (0-10), location/quality documentation, intervention tracking, and reassessment.">
      <QuickLinks />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">Mild (0-3)</span></div>
          <p className="text-2xl font-bold">{records.filter(r => r.painScale <= 3).length}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Moderate (4-6)</span></div>
          <p className="text-2xl font-bold">{records.filter(r => r.painScale >= 4 && r.painScale <= 6).length}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" /><span className="text-sm font-semibold">Severe (7+)</span></div>
          <p className="text-2xl font-bold">{severeCount}</p>
        </CardContent></Card>
      </div>

      <div className="flex justify-end">
        <Button size="sm" className="gap-1" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />New Pain Assessment</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Pain Scale (0-10)</Label>
              <input type="range" min="0" max="10" value={form.painScale} onChange={e => setForm(f => ({ ...f, painScale: Number(e.target.value) }))} className="w-full" />
              <span className="text-xs font-bold">{form.painScale}/10</span>
            </div>
            <Input placeholder="Location" value={form.painLocation} onChange={e => setForm(f => ({ ...f, painLocation: e.target.value }))} />
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.painQuality} onChange={e => setForm(f => ({ ...f, painQuality: e.target.value }))}>
              <option>Aching</option><option>Sharp</option><option>Burning</option><option>Throbbing</option><option>Stabbing</option><option>Cramping</option><option>Numbness</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Aggravating factors</Label>
              <Input value={form.aggravating} onChange={e => setForm(f => ({ ...f, aggravating: e.target.value }))} placeholder="Movement, breathing…" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Alleviating factors</Label>
              <Input value={form.alleviating} onChange={e => setForm(f => ({ ...f, alleviating: e.target.value }))} placeholder="Rest, medication…" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-muted-foreground">Intervention</Label>
            <Textarea rows={2} value={form.intervention} onChange={e => setForm(f => ({ ...f, intervention: e.target.value }))} placeholder="Medication, positioning, heat/ice…" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Reassessment time</Label>
              <Input type="datetime-local" value={form.reassessment} onChange={e => setForm(f => ({ ...f, reassessment: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Reassessed scale (0-10)</Label>
              <input type="range" min="0" max="10" value={form.reassessedScale} onChange={e => setForm(f => ({ ...f, reassessedScale: Number(e.target.value) }))} className="w-full" />
              <span className="text-xs">{form.reassessedScale}/10</span>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addRecord}>Save Assessment</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {records.map(r => (
          <Card key={r.id} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Activity className={`w-4 h-4 mt-0.5 shrink-0 ${r.painScale >= 7 ? 'text-destructive' : r.painScale >= 4 ? 'text-amber-500' : 'text-emerald-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-medium">{r.patientName}</p>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{r.uhid}</span>
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-muted">{r.status}</span>
                    <span className="text-[10px] font-bold">{r.painScale}/10</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{r.painLocation || '—'} · {r.painQuality} · {r.onset} onset</p>
                  {r.intervention && <p className="text-[10px] text-muted-foreground">Intervention: {r.intervention} · Reassessed: {r.reassessedScale}/10</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {records.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No pain assessments recorded.</p>}
      </div>
    </PreviewShell>
  );
}

/* ───────────────────────────────────────────
   10. NurseBehavior — Behavior monitoring & aggression scale
   ─────────────────────────────────────────── */

const BEHAVIOR_KEY = 'adrine_nurse_behavior';

type BehaviorRecord = {
  id: string;
  patientName: string; uhid: string; date: string;
  behavior: string; aggressionLevel: number; orientation: string;
  hallucinations: string; mood: string; intervention: string;
  response: string; staffSafety: string; status: 'active' | 'resolved';
};

export function NurseBehavior() {
  const [records, setRecords] = useState<BehaviorRecord[]>(() => loadJson<BehaviorRecord[]>(BEHAVIOR_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientName: '', uhid: '', date: new Date().toISOString(),
    behavior: 'Agitated', aggressionLevel: 0, orientation: 'Alert x 3',
    hallucinations: '', mood: 'Anxious', intervention: '', response: '', staffSafety: '',
  });

  const addRecord = () => {
    if (!form.patientName.trim()) return;
    const newRecord: BehaviorRecord = { ...form, id: crypto.randomUUID?.() ?? `${Date.now()}`, status: 'active' };
    const updated = [newRecord, ...records];
    setRecords(updated);
    saveJson(BEHAVIOR_KEY, updated);
    setForm({ patientName: '', uhid: '', date: new Date().toISOString(), behavior: 'Agitated', aggressionLevel: 0, orientation: 'Alert x 3', hallucinations: '', mood: 'Anxious', intervention: '', response: '', staffSafety: '' });
    setShowForm(false);
    toast.success('Behavior observation recorded');
  };

  const resolveRecord = (id: string) => {
    const updated = records.map(r => r.id === id ? { ...r, status: 'resolved' as const } : r);
    setRecords(updated);
    saveJson(BEHAVIOR_KEY, updated);
    toast.success('Behavior observation resolved');
  };

  return (
    <PreviewShell title="Behavioral Monitoring" subtitle="Behavior observation, aggression scale, orientation status, intervention tracking, and staff safety documentation.">
      <QuickLinks />
      <div className="flex justify-end">
        <Button size="sm" className="gap-1" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />New Observation</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.behavior} onChange={e => setForm(f => ({ ...f, behavior: e.target.value }))}>
              <option>Agitated</option><option>Aggressive</option><option>Withdrawn</option><option>Confused</option><option>Wandering</option><option>Combative</option><option>Calm</option><option>Cooperative</option>
            </select>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.orientation} onChange={e => setForm(f => ({ ...f, orientation: e.target.value }))}>
              <option>Alert x 3</option><option>Alert x 2</option><option>Alert x 1</option><option>Disoriented</option><option>Unresponsive</option>
            </select>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.mood} onChange={e => setForm(f => ({ ...f, mood: e.target.value }))}>
              <option>Anxious</option><option>Depressed</option><option>Euphoric</option><option>Irritable</option><option>Labile</option><option>Flat</option><option>Appropriate</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Aggression Level (0-5)</Label>
              <input type="range" min="0" max="5" value={form.aggressionLevel} onChange={e => setForm(f => ({ ...f, aggressionLevel: Number(e.target.value) }))} className="w-full" />
              <span className="text-xs">{form.aggressionLevel}/5</span>
            </div>
            <Input placeholder="Hallucinations / delusions" value={form.hallucinations} onChange={e => setForm(f => ({ ...f, hallucinations: e.target.value }))} />
          </div>
          <Textarea placeholder="Intervention / de-escalation" rows={2} value={form.intervention} onChange={e => setForm(f => ({ ...f, intervention: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <Textarea placeholder="Patient response" rows={2} value={form.response} onChange={e => setForm(f => ({ ...f, response: e.target.value }))} />
            <Textarea placeholder="Staff safety concerns" rows={2} value={form.staffSafety} onChange={e => setForm(f => ({ ...f, staffSafety: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addRecord}>Save Observation</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {records.map(r => (
          <Card key={r.id} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Brain className={`w-4 h-4 mt-0.5 shrink-0 ${r.aggressionLevel >= 3 ? 'text-destructive' : r.aggressionLevel >= 1 ? 'text-amber-500' : 'text-emerald-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-medium">{r.patientName}</p>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{r.uhid}</span>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${r.status === 'active' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>{r.status}</span>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{r.behavior}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Aggression: {r.aggressionLevel}/5 · Orientation: {r.orientation} · Mood: {r.mood}
                    {r.hallucinations && ` · ${r.hallucinations}`}
                  </p>
                  {r.intervention && <p className="text-[10px] text-muted-foreground">Intervention: {r.intervention}</p>}
                </div>
                {r.status === 'active' && (
                  <Button size="sm" variant="outline" className="h-7 text-[10px] text-emerald-600 shrink-0" onClick={() => resolveRecord(r.id)}>Resolve</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {records.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No behavior observations recorded.</p>}
      </div>
    </PreviewShell>
  );
}

/* ───────────────────────────────────────────
   11. NurseEducation — Patient education library & teach-back
   ─────────────────────────────────────────── */

const EDU_KEY = 'adrine_nurse_education';

type EducationRecord = {
  id: string;
  patientName: string; uhid: string; date: string;
  topic: string; category: string; method: string;
  teachBack: 'excellent' | 'good' | 'partial' | 'needs_repeat';
  notes: string; materialsProvided: string;
  status: 'planned' | 'completed';
};

export function NurseEducation() {
  const [records, setRecords] = useState<EducationRecord[]>(() => loadJson<EducationRecord[]>(EDU_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientName: '', uhid: '', date: new Date().toISOString(),
    topic: '', category: 'Medication', method: 'Verbal discussion',
    teachBack: 'good' as EducationRecord['teachBack'],
    notes: '', materialsProvided: '',
  });

  const addRecord = () => {
    if (!form.patientName.trim() || !form.topic.trim()) return;
    const newRecord: EducationRecord = { ...form, id: crypto.randomUUID?.() ?? `${Date.now()}`, status: 'completed' };
    const updated = [newRecord, ...records];
    setRecords(updated);
    saveJson(EDU_KEY, updated);
    setForm({ patientName: '', uhid: '', date: new Date().toISOString(), topic: '', category: 'Medication', method: 'Verbal discussion', teachBack: 'good' as EducationRecord['teachBack'], notes: '', materialsProvided: '' });
    setShowForm(false);
    toast.success('Education session recorded');
  };

  const categories = ['Medication', 'Diagnosis', 'Procedure', 'Discharge', 'Diet', 'Exercise', 'Wound Care', 'Fall Prevention', 'Advanced Directive', 'Other'];
  const methods = ['Verbal discussion', 'Pamphlet', 'Video', 'Demonstration', 'Teach-back', 'Group session', 'Interpreter-assisted'];

  return (
    <PreviewShell title="Patient Education" subtitle="Education topic library, teaching methods, teach-back validation, and materials tracking.">
      <QuickLinks />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold">Completed</span></div>
          <p className="text-2xl font-bold">{records.filter(r => r.status === 'completed').length}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">Excellent/Good</span></div>
          <p className="text-2xl font-bold">{records.filter(r => r.teachBack === 'excellent' || r.teachBack === 'good').length}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Needs Repeat</span></div>
          <p className="text-2xl font-bold">{records.filter(r => r.teachBack === 'needs_repeat').length}</p>
        </CardContent></Card>
      </div>

      <div className="flex justify-end">
        <Button size="sm" className="gap-1" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />New Education Session</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Topic (e.g. Insulin administration)" value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} />
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
              {methods.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.teachBack} onChange={e => setForm(f => ({ ...f, teachBack: e.target.value as EducationRecord['teachBack'] }))}>
              <option value="excellent">Excellent — Independently explains</option>
              <option value="good">Good — Explains with prompts</option>
              <option value="partial">Partial — Unable to explain</option>
              <option value="needs_repeat">Needs Repeat — Requires re-education</option>
            </select>
          </div>
          <Textarea placeholder="Education notes & patient response" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-muted-foreground">Materials provided</Label>
            <Input placeholder="Pamphlet name, video link, etc." value={form.materialsProvided} onChange={e => setForm(f => ({ ...f, materialsProvided: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addRecord}>Save Education</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {records.map(r => (
          <Card key={r.id} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <BookOpen className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-medium">{r.patientName}</p>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{r.uhid}</span>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{r.category}</span>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${r.teachBack === 'excellent' ? 'bg-emerald-500/10 text-emerald-600' : r.teachBack === 'good' ? 'bg-blue-500/10 text-blue-600' : r.teachBack === 'partial' ? 'bg-amber-500/10 text-amber-600' : 'bg-destructive/10 text-destructive'}`}>{r.teachBack.replace('_', ' ')}</span>
                  </div>
                  <p className="text-xs font-medium mt-1">{r.topic}</p>
                  <p className="text-[10px] text-muted-foreground">{r.method} · {r.materialsProvided || 'No materials'}</p>
                  {r.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{r.notes}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {records.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No education sessions recorded.</p>}
      </div>
    </PreviewShell>
  );
}
