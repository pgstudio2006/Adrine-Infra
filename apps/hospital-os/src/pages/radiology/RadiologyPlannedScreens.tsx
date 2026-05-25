import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, AlertCircle, Phone, PhoneCall, CheckCircle2, XCircle, Clock, Calendar,
  FileText, FileSpreadsheet, FileCheck, FileX, Copy, Save, Search, Plus, X, Check,
  Eye, Edit3, Trash2, Printer, Download, RefreshCw, Filter, ArrowUpDown,
  Stethoscope, User, Users, Building2, Monitor, Radio, Wifi, WifiOff,
  Activity, Zap, Thermometer, Pill, Syringe, HeartPulse, ScanLine,
  BookOpen, ClipboardList, ClipboardCheck, Shield, ShieldCheck, ShieldOff,
  MessageSquare, Mail, Send, RotateCcw, CornerDownRight, ArrowRight,
  Info, Ban, Flag, Star, StarHalf, ThumbsUp, ThumbsDown,
  Image, Video, Link, ExternalLink, Grid3X3, Columns,
  List, BarChart3, TrendingUp, TrendingDown, Hash, Percent,
  Smartphone, Landmark, Handshake, CreditCard, DollarSign, Wallet,
  SlidersHorizontal, ToggleLeft, ToggleRight, Sun, Moon, Settings2,
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
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const fadeIn = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.3 },
});

function PreviewStrip({ message, docs }: { message?: string; docs?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/10 px-4 py-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <Info className="h-3.5 w-3.5 shrink-0" />
        <span>{message || "This screen is in Preview. Data is stored locally until platform EMR endpoints are connected."}</span>
      </div>
      {docs && <p className="text-[10px] mt-1 text-muted-foreground/70">{docs}</p>}
    </div>
  );
}

function QuickLinks({ links }: { links?: { label: string; path: string }[] }) {
  const navigate = useNavigate();
  const defaultLinks = [
    { label: 'Dashboard', path: '/radiology' },
    { label: 'Worklist', path: '/radiology/worklist' },
    { label: 'Orders', path: '/radiology/orders' },
    { label: 'Reports', path: '/radiology/reports' },
  ];
  const items = links || defaultLinks;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((link) => (
        <Button key={link.path} size="sm" variant="outline" onClick={() => navigate(link.path)} className="gap-1.5">
          {link.label}
        </Button>
      ))}
    </div>
  );
}

function loadJson<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}

function saveJson(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ════════════════════════════════════════════
// 1. Critical Findings Callback Log
// ════════════════════════════════════════════

const CRITICAL_KEY = 'adrine_radiology_critical';

type CriticalSeverity = 'critical' | 'urgent' | 'significant';
type CallbackStatus = 'pending' | 'attempted' | 'acknowledged' | 'escalated' | 'resolved';

type CriticalFinding = {
  id: string;
  orderId: string;
  patientName: string;
  uhid: string;
  study: string;
  modality: string;
  findingDescription: string;
  severity: CriticalSeverity;
  reportedBy: string;
  reportedAt: string;
  callbackStatus: CallbackStatus;
  callAttempts: number;
  lastCallAt: string;
  calledTo: string;
  calledBy: string;
  doctorResponse: string;
  acknowledgedAt: string;
  escalatedTo: string;
  notes: string;
};

const SEVERITIES: CriticalSeverity[] = ['critical', 'urgent', 'significant'];
const CALLBACK_STATI: CallbackStatus[] = ['pending', 'attempted', 'acknowledged', 'escalated', 'resolved'];

export function RadiologyCriticalCallback() {
  const [findings, setFindings] = useState<CriticalFinding[]>(() => loadJson<CriticalFinding[]>(CRITICAL_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    orderId: '', patientName: '', uhid: '', study: '', modality: 'CT Scan',
    findingDescription: '', severity: 'critical' as CriticalSeverity,
    reportedBy: '', calledTo: '', calledBy: '', doctorResponse: '',
    escalatedTo: '', notes: '',
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CallbackStatus | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<CriticalSeverity | 'all'>('all');

  const addFinding = () => {
    if (!form.patientName.trim() || !form.findingDescription.trim()) return;
    const newFinding: CriticalFinding = {
      ...form,
      id: crypto.randomUUID?.() ?? `CR-${Date.now()}`,
      reportedAt: new Date().toLocaleString('en-IN'),
      callbackStatus: 'pending',
      callAttempts: 0,
      lastCallAt: '',
      acknowledgedAt: '',
    };
    const updated = [newFinding, ...findings];
    setFindings(updated);
    saveJson(CRITICAL_KEY, updated);
    setForm({ orderId: '', patientName: '', uhid: '', study: '', modality: 'CT Scan', findingDescription: '', severity: 'critical', reportedBy: '', calledTo: '', calledBy: '', doctorResponse: '', escalatedTo: '', notes: '' });
    setShowForm(false);
    toast.success('Critical finding logged');
  };

  const logCallAttempt = (id: string) => {
    const updated = findings.map(f => f.id === id ? {
      ...f,
      callbackStatus: 'attempted' as CallbackStatus,
      callAttempts: f.callAttempts + 1,
      lastCallAt: new Date().toLocaleString('en-IN'),
    } : f);
    setFindings(updated);
    saveJson(CRITICAL_KEY, updated);
    toast.success('Call attempt logged');
  };

  const markAcknowledged = (id: string) => {
    const updated = findings.map(f => f.id === id ? {
      ...f,
      callbackStatus: 'acknowledged' as CallbackStatus,
      acknowledgedAt: new Date().toLocaleString('en-IN'),
    } : f);
    setFindings(updated);
    saveJson(CRITICAL_KEY, updated);
    toast.success('Doctor acknowledged');
  };

  const markResolved = (id: string) => {
    const updated = findings.map(f => f.id === id ? { ...f, callbackStatus: 'resolved' as CallbackStatus } : f);
    setFindings(updated);
    saveJson(CRITICAL_KEY, updated);
    toast.success('Finding resolved');
  };

  const pendingCount = findings.filter(f => f.callbackStatus === 'pending').length;
  const acknowledgedCount = findings.filter(f => f.callbackStatus === 'acknowledged').length;
  const criticalCount = findings.filter(f => f.severity === 'critical').length;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return findings.filter(f => {
      if (statusFilter !== 'all' && f.callbackStatus !== statusFilter) return false;
      if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
      return f.patientName.toLowerCase().includes(q) || f.uhid.includes(q) || f.study.toLowerCase().includes(q) || f.orderId.includes(q);
    });
  }, [findings, search, statusFilter, severityFilter]);

  const severityColor = (s: CriticalSeverity) => {
    const map: Record<string, string> = { critical: 'bg-destructive/10 text-destructive', urgent: 'bg-amber-500/10 text-amber-600', significant: 'bg-blue-500/10 text-blue-600' };
    return map[s] || 'bg-muted text-muted-foreground';
  };

  const statusBadge = (s: CallbackStatus) => {
    const map: Record<string, string> = { pending: 'bg-amber-500/10 text-amber-600', attempted: 'bg-purple-500/10 text-purple-600', acknowledged: 'bg-emerald-500/10 text-emerald-600', escalated: 'bg-destructive/10 text-destructive', resolved: 'bg-slate-500/10 text-slate-600' };
    return map[s] || 'bg-muted text-muted-foreground';
  };

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Critical Findings Callback Log</h1>
        <p className="text-sm text-muted-foreground mt-1">Regulatory-compliant log for critical/urgent finding callback management with phone attestation, escalation tracking, and read-back verification.</p>
      </motion.div>
      <PreviewStrip message="Callback log is local. Platform integration for SMS/email notification and escalation rules pending." docs="ACR Practice Parameter for Communication of Diagnostic Imaging Findings." />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-destructive" /><span className="text-sm font-semibold">Critical</span></div>
          <p className="text-2xl font-bold">{criticalCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Pending Callback</span></div>
          <p className="text-2xl font-bold">{pendingCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">Acknowledged</span></div>
          <p className="text-2xl font-bold">{acknowledgedCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Total Findings</span></div>
          <p className="text-2xl font-bold">{findings.length}</p>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search patient/study/order..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
          <option value="all">All severities</option>
          {SEVERITIES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {CALLBACK_STATI.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <Button size="sm" className="gap-1 ml-auto" onClick={() => setShowForm(!showForm)}><AlertCircle className="w-3.5 h-3.5" />Log Critical Finding</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed border-destructive/30">
          <Alert className="py-2 text-[10px]"><AlertCircle className="w-3 h-3" /><AlertTitle className="text-[10px]">Critical Finding</AlertTitle><AlertDescription className="text-[10px]">This finding requires verbal communication to the referring doctor per ACR practice parameter.</AlertDescription></Alert>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Study/procedure" value={form.study} onChange={e => setForm(f => ({ ...f, study: e.target.value }))} />
            <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.modality} onChange={e => setForm(f => ({ ...f, modality: e.target.value }))}>
              {['X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'Mammography', 'PET Scan', 'Fluoroscopy'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value as CriticalSeverity }))}>
              <option value="critical">Critical</option>
              <option value="urgent">Urgent</option>
              <option value="significant">Significant</option>
            </select>
          </div>
          <Textarea placeholder="Description of critical finding" rows={3} value={form.findingDescription} onChange={e => setForm(f => ({ ...f, findingDescription: e.target.value }))} />
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Reported by (radiologist)" value={form.reportedBy} onChange={e => setForm(f => ({ ...f, reportedBy: e.target.value }))} />
            <Input placeholder="Called to (doctor)" value={form.calledTo} onChange={e => setForm(f => ({ ...f, calledTo: e.target.value }))} />
            <Input placeholder="Called by" value={form.calledBy} onChange={e => setForm(f => ({ ...f, calledBy: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Doctor response / read-back" value={form.doctorResponse} onChange={e => setForm(f => ({ ...f, doctorResponse: e.target.value }))} />
            <Input placeholder="Escalated to (if applicable)" value={form.escalatedTo} onChange={e => setForm(f => ({ ...f, escalatedTo: e.target.value }))} />
          </div>
          <Textarea placeholder="Additional notes" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addFinding}><AlertCircle className="w-3 h-3 mr-1" />Log Finding</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map(f => (
          <Card key={f.id} className={`rounded-xl ${f.callbackStatus === 'pending' ? 'border-destructive/30' : f.callbackStatus === 'escalated' ? 'border-amber-500/30' : ''} ${f.callbackStatus === 'resolved' ? 'opacity-70' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {f.callbackStatus === 'pending' ? <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-destructive" /> :
                 f.callbackStatus === 'acknowledged' ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" /> :
                 <Phone className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold">{f.patientName}</p>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{f.uhid}</span>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${severityColor(f.severity)}`}>{f.severity}</span>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusBadge(f.callbackStatus)}`}>{f.callbackStatus}</span>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{f.modality}</span>
                  </div>
                  <p className="text-xs mt-0.5 line-clamp-2">{f.findingDescription}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                    <span>{f.study || f.orderId}</span>
                    <span>· Reported: {f.reportedAt}</span>
                    {f.callAttempts > 0 && <span>· Call attempts: {f.callAttempts}</span>}
                    {f.acknowledgedAt && <span>· Acknowledged: {f.acknowledgedAt}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                    <span>Radiologist: {f.reportedBy || '—'}</span>
                    <span>Doctor: {f.calledTo || '—'}</span>
                    <span>Called by: {f.calledBy || '—'}</span>
                  </div>
                  {f.doctorResponse && <p className="text-[10px] text-muted-foreground mt-0.5">Response: {f.doctorResponse}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  {f.callbackStatus === 'pending' && (
                    <Button size="sm" className="h-7 text-[10px]" onClick={() => logCallAttempt(f.id)}><Phone className="w-3 h-3 mr-1" />Call</Button>
                  )}
                  {f.callbackStatus === 'attempted' && (
                    <Button size="sm" className="h-7 text-[10px] bg-emerald-600" onClick={() => markAcknowledged(f.id)}><Check className="w-3 h-3 mr-1" />Acknowledge</Button>
                  )}
                  {(f.callbackStatus === 'acknowledged' || f.callbackStatus === 'escalated') && (
                    <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => markResolved(f.id)}><CheckCircle2 className="w-3 h-3 mr-1" />Resolve</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No critical findings logged yet.</p>}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════
// 2. Structured Report Templates
// ════════════════════════════════════════════

const TEMPLATES_KEY = 'adrine_radiology_templates';

type ReportTemplate = {
  id: string;
  name: string;
  modality: string;
  bodyRegion: string;
  category: string;
  sections: { key: string; label: string; content: string }[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  author: string;
  active: boolean;
};

const MODALITIES = ['X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'Mammography', 'PET Scan', 'Fluoroscopy', 'DEXA'];
const BODY_REGIONS = ['Chest', 'Abdomen', 'Pelvis', 'Brain', 'Spine', 'Extremity', 'Breast', 'Head & Neck', 'Whole Body', 'Vascular'];
const TEMPLATE_CATEGORIES = ['Normal', 'Common pathology', 'Emergency', 'Follow-up', 'Post-op', 'Pediatric', 'Geriatric'];

const DEFAULT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'tpl-1', name: 'Chest X-Ray Normal', modality: 'X-Ray', bodyRegion: 'Chest', category: 'Normal',
    sections: [
      { key: 'technique', label: 'Technique', content: 'PA and lateral views of the chest.' },
      { key: 'findings', label: 'Findings', content: 'Lungs: Clear and fully expanded bilaterally. No focal consolidation, pleural effusion, or pneumothorax.\nCardiac: Cardiac silhouette is within normal limits.\nMediastinum: Mediastinal contours are normal.\nBones: No acute fracture or destructive lesion.\nSoft Tissues: Unremarkable.' },
      { key: 'impression', label: 'Impression', content: 'Normal chest radiograph.' },
    ],
    tags: ['normal', 'screening', 'routine'], createdAt: '2025-01-15', updatedAt: '2026-03-01', author: 'Dr. Iyer', active: true,
  },
  {
    id: 'tpl-2', name: 'CT Chest with Contrast - Pulmonary Embolism', modality: 'CT Scan', bodyRegion: 'Chest', category: 'Emergency',
    sections: [
      { key: 'technique', label: 'Technique', content: 'CT pulmonary angiogram with IV contrast.' },
      { key: 'findings', label: 'Findings', content: 'Pulmonary Arteries: [No filling defect identified within the main, lobar, segmental or subsegmental pulmonary arteries / Filling defect identified in...]\nLungs: [Clear / Findings as below]\nHeart: [Normal cardiac size]\nPleura: [No effusion]' },
      { key: 'impression', label: 'Impression', content: '1. [Negative for pulmonary embolism / Positive for pulmonary embolism as described above]\n2. [Any additional findings]' },
      { key: 'recommendation', label: 'Recommendation', content: 'Clinical correlation advised.' },
    ],
    tags: ['PE', 'CTA', 'contrast', 'emergency'], createdAt: '2025-02-10', updatedAt: '2026-03-05', author: 'Dr. Iyer', active: true,
  },
  {
    id: 'tpl-3', name: 'MRI Brain - Normal', modality: 'MRI', bodyRegion: 'Brain', category: 'Normal',
    sections: [
      { key: 'technique', label: 'Technique', content: 'Multiplanar multisequence MRI of the brain without IV contrast.' },
      { key: 'findings', label: 'Findings', content: 'Brain Parenchyma: Normal gray-white matter differentiation. No focal signal abnormality, mass effect, or midline shift.\nVentricles: Normal size and configuration.\nVascular: Patent flow voids of major intracranial vessels.\nPituitary: Normal size and signal.\nCP Angle: Unremarkable.\nOrbits: Normal.' },
      { key: 'impression', label: 'Impression', content: 'Normal MRI of the brain.' },
    ],
    tags: ['normal', 'brain', 'routine'], createdAt: '2025-03-01', updatedAt: '2026-02-20', author: 'Dr. Mehta', active: true,
  },
];

export function RadiologyTemplates() {
  const [templates, setTemplates] = useState<ReportTemplate[]>(() => loadJson<ReportTemplate[]>(TEMPLATES_KEY, DEFAULT_TEMPLATES));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', modality: 'X-Ray', bodyRegion: 'Chest', category: 'Normal',
    sections: [{ key: 'technique', label: 'Technique', content: '' }, { key: 'findings', label: 'Findings', content: '' }, { key: 'impression', label: 'Impression', content: '' }] as { key: string; label: string; content: string }[],
    tags: '' as string, author: '',
  });
  const [search, setSearch] = useState('');
  const [modalityFilter, setModalityFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('templates');
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);

  const addTemplate = () => {
    if (!form.name.trim()) return;
    const newTemplate: ReportTemplate = {
      id: crypto.randomUUID?.() ?? `tpl-${Date.now()}`,
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: new Date().toLocaleString('en-IN'),
      updatedAt: new Date().toLocaleString('en-IN'),
      active: true,
    };
    const updated = [newTemplate, ...templates];
    setTemplates(updated);
    saveJson(TEMPLATES_KEY, updated);
    setForm({ name: '', modality: 'X-Ray', bodyRegion: 'Chest', category: 'Normal', sections: [{ key: 'technique', label: 'Technique', content: '' }, { key: 'findings', label: 'Findings', content: '' }, { key: 'impression', label: 'Impression', content: '' }], tags: '', author: '' });
    setShowForm(false);
    toast.success('Template saved');
  };

  const updateSection = (idx: number, content: string) => {
    setForm(f => ({ ...f, sections: f.sections.map((s, i) => i === idx ? { ...s, content } : s) }));
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return templates.filter(t => {
      if (modalityFilter !== 'all' && t.modality !== modalityFilter) return false;
      if (regionFilter !== 'all' && t.bodyRegion !== regionFilter) return false;
      return t.name.toLowerCase().includes(q) || t.modality.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q));
    });
  }, [templates, search, modalityFilter, regionFilter]);

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Structured Report Templates</h1>
        <p className="text-sm text-muted-foreground mt-1">Body-region and modality-specific report templates with configurable sections, normal variants, and common pathology macros.</p>
      </motion.div>
      <PreviewStrip message="Templates are stored locally. Platform sync for department-standard templates pending." docs="RSNA RadLex template integration planned for P2." />
      <QuickLinks />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="editor">Template Editor</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4 mt-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search templates..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={modalityFilter} onChange={e => setModalityFilter(e.target.value)}>
              <option value="all">All modalities</option>
              {MODALITIES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
              <option value="all">All regions</option>
              {BODY_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <Button size="sm" className="gap-1 ml-auto" onClick={() => { setShowForm(!showForm); setActiveTab('editor'); }}>
              <Plus className="w-3.5 h-3.5" />New Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(t => (
              <Card key={t.id} className="rounded-xl cursor-pointer hover:shadow-md transition-shadow" onClick={() => setPreviewTemplateId(t.id)}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground">{t.modality} · {t.bodyRegion}</p>
                    </div>
                    <Badge variant={t.active ? 'default' : 'secondary'} className="text-[9px] h-4 px-1.5">{t.active ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{t.sections.map(s => `[${s.label}] ${s.content.slice(0, 60)}...`).join(' | ')}</p>
                  <div className="flex flex-wrap gap-1">
                    {t.tags.map(tag => <span key={tag} className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{tag}</span>)}
                  </div>
                  <p className="text-[9px] text-muted-foreground">By {t.author} · Updated {t.updatedAt}</p>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && <p className="text-xs text-muted-foreground col-span-3 py-6 text-center">No templates found.</p>}
          </div>
        </TabsContent>

        <TabsContent value="editor" className="space-y-4 mt-4">
          {showForm ? (
            <Card className="rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="Template name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.modality} onChange={e => setForm(f => ({ ...f, modality: e.target.value }))}>
                  {MODALITIES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.bodyRegion} onChange={e => setForm(f => ({ ...f, bodyRegion: e.target.value }))}>
                  {BODY_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {TEMPLATE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <Input placeholder="Tags (comma-separated)" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
                <Input placeholder="Author" value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} />
              </div>
              <Separator />
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">Sections</p>
              {form.sections.map((section, idx) => (
                <div key={section.key} className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">{section.label}</Label>
                  <Textarea rows={3} value={section.content} onChange={e => updateSection(idx, e.target.value)} placeholder={`Enter ${section.label.toLowerCase()} template text...`} />
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => {
                setForm(f => ({ ...f, sections: [...f.sections, { key: `section-${f.sections.length}`, label: 'New Section', content: '' }] }));
              }}><Plus className="w-3 h-3 mr-1" />Add Section</Button>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setActiveTab('templates'); }}>Cancel</Button>
                <Button size="sm" onClick={addTemplate}><Save className="w-3 h-3 mr-1" />Save Template</Button>
              </div>
            </Card>
          ) : (
            <p className="text-xs text-muted-foreground py-4 text-center">Click "New Template" to start creating a report template.</p>
          )}
        </TabsContent>
      </Tabs>

      {/* Template Preview Dialog */}
      <Dialog open={!!previewTemplateId} onOpenChange={() => setPreviewTemplateId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {previewTemplateId && (() => {
            const t = templates.find(t => t.id === previewTemplateId);
            if (!t) return null;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {t.name}
                    <Badge variant="outline" className="text-[10px]">{t.modality}</Badge>
                    <Badge variant="outline" className="text-[10px]">{t.bodyRegion}</Badge>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  {t.sections.map(s => (
                    <div key={s.key}>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
                      <p className="text-sm whitespace-pre-wrap mt-0.5">{s.content}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {t.tags.map(tag => <span key={tag} className="text-[10px] bg-muted px-2 py-0.5 rounded">{tag}</span>)}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">By {t.author} · Created {t.createdAt} · Updated {t.updatedAt}</p>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ════════════════════════════════════════════
// 3. Modality Slot Board / Schedule
// ════════════════════════════════════════════

const SCHEDULE_KEY = 'adrine_radiology_schedule';

type SlotStatus = 'available' | 'booked' | 'in-progress' | 'completed' | 'blocked';

type TimeSlot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  modality: string;
  room: string;
  status: SlotStatus;
  patientName: string;
  uhid: string;
  study: string;
  technician: string;
  notes: string;
};

const MODALITY_ROOMS: Record<string, string[]> = {
  'X-Ray': ['X-ray Room 1', 'X-ray Room 2', 'Portable'],
  'CT Scan': ['CT Suite 1', 'CT Suite 2'],
  'MRI': ['MRI Suite 1', 'MRI Suite 2'],
  'Ultrasound': ['US Room 1', 'US Room 2', 'US Room 3'],
  'Mammography': ['Mammo Suite'],
};

const TIME_SLOTS = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

export function RadiologySchedule() {
  const [slots, setSlots] = useState<TimeSlot[]>(() => loadJson<TimeSlot[]>(SCHEDULE_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalityFilter, setModalityFilter] = useState('All');
  const [form, setForm] = useState({
    startTime: '09:00', endTime: '09:30', modality: 'X-Ray',
    room: 'X-ray Room 1', patientName: '', uhid: '', study: '',
    technician: '', notes: '',
  });
  const [search, setSearch] = useState('');

  const addSlot = () => {
    if (!form.patientName.trim() && !form.notes.trim()) return;
    const newSlot: TimeSlot = {
      ...form,
      id: crypto.randomUUID?.() ?? `slot-${Date.now()}`,
      date: selectedDate,
      status: form.patientName ? 'booked' : 'blocked',
    };
    const updated = [newSlot, ...slots];
    setSlots(updated);
    saveJson(SCHEDULE_KEY, updated);
    setForm({ startTime: '09:00', endTime: '09:30', modality: 'X-Ray', room: 'X-ray Room 1', patientName: '', uhid: '', study: '', technician: '', notes: '' });
    setShowForm(false);
    toast.success('Slot scheduled');
  };

  const updateSlotStatus = (id: string, status: SlotStatus) => {
    const updated = slots.map(s => s.id === id ? { ...s, status } : s);
    setSlots(updated);
    saveJson(SCHEDULE_KEY, updated);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return slots.filter(s => {
      if (s.date !== selectedDate) return false;
      if (modalityFilter !== 'All' && s.modality !== modalityFilter) return false;
      return s.patientName.toLowerCase().includes(q) || s.uhid.includes(q) || s.study.toLowerCase().includes(q);
    });
  }, [slots, selectedDate, modalityFilter, search]);

  const bookedToday = slots.filter(s => s.date === selectedDate && (s.status === 'booked' || s.status === 'in-progress')).length;
  const completedToday = slots.filter(s => s.date === selectedDate && s.status === 'completed').length;

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Modality Slot Board</h1>
        <p className="text-sm text-muted-foreground mt-1">Room and equipment schedule with time-slot booking, conflict detection, and status tracking for all modalities.</p>
      </motion.div>
      <PreviewStrip message="Scheduling is local only. Platform-backed slot management and DICOM MWL integration pending." docs="Wave W3 target for platform sync." />
      <QuickLinks />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold">Date</span></div>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="text-sm font-bold bg-transparent border-none p-0 focus:outline-none" />
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Booked</span></div>
          <p className="text-2xl font-bold">{bookedToday}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">Completed</span></div>
          <p className="text-2xl font-bold">{completedToday}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Monitor className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Total Slots</span></div>
          <p className="text-2xl font-bold">{slots.filter(s => s.date === selectedDate).length}</p>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search patient/study..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={modalityFilter} onChange={e => setModalityFilter(e.target.value)}>
          <option value="All">All modalities</option>
          {Object.keys(MODALITY_ROOMS).map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <Button size="sm" className="gap-1 ml-auto" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />Book Slot</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed border-primary/30">
          <div className="grid grid-cols-3 gap-2">
            <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.startTime} onChange={e => {
              const idx = TIME_SLOTS.indexOf(e.target.value);
              const end = TIME_SLOTS[idx + 1] || '17:00';
              setForm(f => ({ ...f, startTime: e.target.value, endTime: end }));
            }}>
              {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <Input value={form.endTime} readOnly placeholder="End time" className="bg-muted" />
            <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.modality} onChange={e => {
              const rooms = MODALITY_ROOMS[e.target.value] || ['Room 1'];
              setForm(f => ({ ...f, modality: e.target.value, room: rooms[0] }));
            }}>
              {Object.keys(MODALITY_ROOMS).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))}>
              {(MODALITY_ROOMS[form.modality] || ['Room 1']).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <Input placeholder="Technician" value={form.technician} onChange={e => setForm(f => ({ ...f, technician: e.target.value }))} />
          </div>
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Patient (leave blank to block slot)</p>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
            <Input placeholder="Study/procedure" value={form.study} onChange={e => setForm(f => ({ ...f, study: e.target.value }))} />
          </div>
          <Textarea placeholder="Notes / prep instructions" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addSlot}>{form.patientName ? 'Book Slot' : 'Block Slot'}</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.sort((a, b) => a.startTime.localeCompare(b.startTime)).map(s => {
          const statusColors: Record<SlotStatus, string> = {
            available: 'bg-emerald-500/10 text-emerald-600',
            booked: 'bg-blue-500/10 text-blue-600',
            'in-progress': 'bg-purple-500/10 text-purple-600',
            completed: 'bg-green-500/10 text-green-700',
            blocked: 'bg-slate-500/10 text-slate-600',
          };
          return (
            <Card key={s.id} className={`rounded-xl ${s.status === 'in-progress' ? 'border-purple-500/30' : s.status === 'blocked' ? 'border-slate-300/30' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-center w-12 shrink-0">
                    <p className="text-xs font-bold">{s.startTime}</p>
                    <p className="text-[9px] text-muted-foreground">—</p>
                    <p className="text-[9px] text-muted-foreground">{s.endTime}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-semibold">{s.patientName || '(Blocked)'}</p>
                      <Badge variant="outline" className="text-[9px] h-4 px-1.5">{s.modality}</Badge>
                      <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{s.room}</span>
                      <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusColors[s.status]}`}>{s.status}</span>
                    </div>
                    {s.study && <p className="text-[10px] text-muted-foreground mt-0.5">{s.study}</p>}
                    <div className="flex items-center gap-2 text-[9px] text-muted-foreground mt-0.5">
                      {s.uhid && <span className="font-mono">{s.uhid}</span>}
                      {s.technician && <span>Tech: {s.technician}</span>}
                    </div>
                    {s.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{s.notes}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {s.status === 'booked' && (
                      <Button size="sm" className="h-7 text-[10px]" onClick={() => updateSlotStatus(s.id, 'in-progress')}><Play className="w-3 h-3 mr-1" />Start</Button>
                    )}
                    {s.status === 'in-progress' && (
                      <Button size="sm" className="h-7 text-[10px]" onClick={() => updateSlotStatus(s.id, 'completed')}><Check className="w-3 h-3 mr-1" />Complete</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No slots scheduled for this date.</p>}
      </div>
    </motion.div>
  );
}

function Play({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>;
}

// ════════════════════════════════════════════
// 4. Contrast Administration Log
// ════════════════════════════════════════════

const CONTRAST_KEY = 'adrine_radiology_contrast';

type ContrastLog = {
  id: string;
  date: string;
  patientName: string;
  uhid: string;
  study: string;
  modality: string;
  contrastType: string;
  contrastBrand: string;
  volume: number;
  concentration: string;
  route: string;
  injectionRate: string;
  batchNo: string;
  expiryDate: string;
  creatinineResult: string;
  egfr: number;
  allergyHistory: string;
  premedication: string;
  adverseReaction: string;
  reactionSeverity: string;
  administeredBy: string;
  supervisedBy: string;
  notes: string;
};

const CONTRAST_TYPES = ['Iodinated (non-ionic)', 'Iodinated (ionic)', 'Gadolinium-based', 'Ultrasound microbubble', 'Barium sulfate'];
const CONTRAST_ROUTES = ['IV', 'Oral', 'Intrathecal', 'Intra-articular', 'Intra-cavitary', 'Rectal'];

export function RadiologyContrast() {
  const [logs, setLogs] = useState<ContrastLog[]>(() => loadJson<ContrastLog[]>(CONTRAST_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientName: '', uhid: '', study: '', modality: 'CT Scan',
    contrastType: 'Iodinated (non-ionic)', contrastBrand: '', volume: 100,
    concentration: '300 mgI/mL', route: 'IV', injectionRate: '3 mL/s',
    batchNo: '', expiryDate: '', creatinineResult: '', egfr: 60,
    allergyHistory: '', premedication: '', adverseReaction: '',
    reactionSeverity: '', administeredBy: '', supervisedBy: '', notes: '',
  });
  const [search, setSearch] = useState('');

  const addLog = () => {
    if (!form.patientName.trim() || !form.contrastType.trim()) return;
    const newLog: ContrastLog = {
      ...form,
      id: crypto.randomUUID?.() ?? `contrast-${Date.now()}`,
      date: new Date().toLocaleString('en-IN'),
    };
    const updated = [newLog, ...logs];
    setLogs(updated);
    saveJson(CONTRAST_KEY, updated);
    setForm({ patientName: '', uhid: '', study: '', modality: 'CT Scan', contrastType: 'Iodinated (non-ionic)', contrastBrand: '', volume: 100, concentration: '300 mgI/mL', route: 'IV', injectionRate: '3 mL/s', batchNo: '', expiryDate: '', creatinineResult: '', egfr: 60, allergyHistory: '', premedication: '', adverseReaction: '', reactionSeverity: '', administeredBy: '', supervisedBy: '', notes: '' });
    setShowForm(false);
    toast.success('Contrast administration logged');
  };

  const todayCount = logs.filter(l => l.date.includes(new Date().toLocaleDateString('en-IN').split(',')[0])).length;
  const reactionCount = logs.filter(l => l.adverseReaction).length;
  const totalVolume = logs.reduce((s, l) => s + l.volume, 0);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return logs.filter(l => l.patientName.toLowerCase().includes(q) || l.uhid.includes(q) || l.study.toLowerCase().includes(q) || l.contrastType.toLowerCase().includes(q));
  }, [logs, search]);

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Contrast Administration Log</h1>
        <p className="text-sm text-muted-foreground mt-1">Track contrast media administration including type, volume, route, creatinine/eGFR monitoring, and adverse reaction recording.</p>
      </motion.div>
      <PreviewStrip message="Contrast log is local. Integrate with patient allergy/creatinine alerts and ACR contrast manual guidelines." docs="ACR Manual on Contrast Media v2025 — refer for premedication protocols." />
      <QuickLinks />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Syringe className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold">Today</span></div>
          <p className="text-2xl font-bold">{todayCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" /><span className="text-sm font-semibold">Reactions</span></div>
          <p className="text-2xl font-bold">{reactionCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">Total Volume</span></div>
          <p className="text-2xl font-bold">{totalVolume} mL</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Total Logs</span></div>
          <p className="text-2xl font-bold">{logs.length}</p>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search patient/contrast..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button size="sm" className="gap-1 ml-auto" onClick={() => setShowForm(!showForm)}><Syringe className="w-3.5 h-3.5" />Log Administration</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed border-blue-500/30">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Study/procedure" value={form.study} onChange={e => setForm(f => ({ ...f, study: e.target.value }))} />
            <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.modality} onChange={e => setForm(f => ({ ...f, modality: e.target.value }))}>
              {['CT Scan', 'MRI', 'Angiography', 'Fluoroscopy', 'Ultrasound'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.contrastType} onChange={e => setForm(f => ({ ...f, contrastType: e.target.value }))}>
              {CONTRAST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Input placeholder="Brand name" value={form.contrastBrand} onChange={e => setForm(f => ({ ...f, contrastBrand: e.target.value }))} />
            <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Volume (mL)</Label><Input type="number" min={1} value={form.volume} onChange={e => setForm(f => ({ ...f, volume: Number(e.target.value) }))} /></div>
            <Input placeholder="Concentration" value={form.concentration} onChange={e => setForm(f => ({ ...f, concentration: e.target.value }))} />
            <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.route} onChange={e => setForm(f => ({ ...f, route: e.target.value }))}>
              {CONTRAST_ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Injection rate" value={form.injectionRate} onChange={e => setForm(f => ({ ...f, injectionRate: e.target.value }))} />
            <Input placeholder="Batch number" value={form.batchNo} onChange={e => setForm(f => ({ ...f, batchNo: e.target.value }))} />
            <Input placeholder="Expiry date" type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
          </div>
          <Separator />
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Safety Checks</p>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Creatinine (mg/dL)" value={form.creatinineResult} onChange={e => setForm(f => ({ ...f, creatinineResult: e.target.value }))} />
            <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">eGFR</Label><Input type="number" min={0} value={form.egfr} onChange={e => setForm(f => ({ ...f, egfr: Number(e.target.value) }))} /></div>
            <Input placeholder="Allergy history" value={form.allergyHistory} onChange={e => setForm(f => ({ ...f, allergyHistory: e.target.value }))} />
          </div>
          <Input placeholder="Premedication (if any)" value={form.premedication} onChange={e => setForm(f => ({ ...f, premedication: e.target.value }))} />
          <Separator />
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Adverse Reaction (if any)</p>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Adverse reaction" value={form.adverseReaction} onChange={e => setForm(f => ({ ...f, adverseReaction: e.target.value }))} />
            <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.reactionSeverity} onChange={e => setForm(f => ({ ...f, reactionSeverity: e.target.value }))}>
              <option value="">None</option>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Administered by" value={form.administeredBy} onChange={e => setForm(f => ({ ...f, administeredBy: e.target.value }))} />
            <Input placeholder="Supervised by" value={form.supervisedBy} onChange={e => setForm(f => ({ ...f, supervisedBy: e.target.value }))} />
          </div>
          <Textarea placeholder="Additional notes" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addLog}><Syringe className="w-3 h-3 mr-1" />Log Administration</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map(l => (
          <Card key={l.id} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Syringe className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold">{l.patientName}</p>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{l.uhid}</span>
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5">{l.contrastType}</Badge>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{l.route}</span>
                    {l.adverseReaction && <span className="text-[9px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">Reaction</span>}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                    <span>{l.volume} mL</span>
                    <span>{l.concentration}</span>
                    <span>Batch: {l.batchNo || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>eGFR: {l.egfr}</span>
                    {l.creatinineResult && <span>Cr: {l.creatinineResult}</span>}
                    {l.allergyHistory && <span>Allergy: {l.allergyHistory}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground mt-0.5">
                    <span>By: {l.administeredBy}</span>
                    <span>· {l.date}</span>
                    {l.adverseReaction && <span>· Reaction: {l.adverseReaction}</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No contrast administrations logged yet.</p>}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════
// 5. TAT / SLA Analytics
// ════════════════════════════════════════════

const TAT_KEY = 'adrine_radiology_tat';

type TATRecord = {
  id: string;
  orderId: string;
  patientName: string;
  uhid: string;
  study: string;
  modality: string;
  priority: string;
  orderedAt: string;
  imagingStartedAt: string;
  imagingCompletedAt: string;
  reportStartedAt: string;
  reportCompletedAt: string;
  tatOrderToReport: number;
  tatImagingToReport: number;
  breach: boolean;
};

export function RadiologyTAT() {
  const [records, setRecords] = useState<TATRecord[]>(() => loadJson<TATRecord[]>(TAT_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    orderId: '', patientName: '', uhid: '', study: '', modality: 'X-Ray', priority: 'Routine',
    orderedAt: new Date().toISOString().slice(0, 16), imagingStartedAt: '',
    imagingCompletedAt: '', reportStartedAt: '', reportCompletedAt: '',
  });
  const [search, setSearch] = useState('');
  const [modalityFilter, setModalityFilter] = useState<string>('all');

  const calculateTAT = () => {
    if (!form.orderedAt || !form.reportCompletedAt) return;
    const orderToReport = Math.round((new Date(form.reportCompletedAt).getTime() - new Date(form.orderedAt).getTime()) / (1000 * 60));
    const imagingToReport = form.imagingCompletedAt && form.reportCompletedAt
      ? Math.round((new Date(form.reportCompletedAt).getTime() - new Date(form.imagingCompletedAt).getTime()) / (1000 * 60))
      : 0;

    const slaMinutes = form.priority === 'Emergency' ? 60 : form.priority === 'Urgent' ? 120 : 1440;

    const newRecord: TATRecord = {
      id: crypto.randomUUID?.() ?? `tat-${Date.now()}`,
      ...form,
      tatOrderToReport: orderToReport,
      tatImagingToReport: imagingToReport,
      breach: orderToReport > slaMinutes,
    };
    const updated = [newRecord, ...records];
    setRecords(updated);
    saveJson(TAT_KEY, updated);
    setForm({ orderId: '', patientName: '', uhid: '', study: '', modality: 'X-Ray', priority: 'Routine', orderedAt: new Date().toISOString().slice(0, 16), imagingStartedAt: '', imagingCompletedAt: '', reportStartedAt: '', reportCompletedAt: '' });
    setShowForm(false);
    toast.success('TAT record added');
  };

  const breachRate = records.length > 0 ? Math.round((records.filter(r => r.breach).length / records.length) * 100) : 0;
  const avgTAT = records.length > 0 ? Math.round(records.reduce((s, r) => s + r.tatOrderToReport, 0) / records.length) : 0;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter(r => {
      if (modalityFilter !== 'all' && r.modality !== modalityFilter) return false;
      return r.patientName.toLowerCase().includes(q) || r.uhid.includes(q) || r.study.toLowerCase().includes(q);
    });
  }, [records, search, modalityFilter]);

  const tatColor = (mins: number, priority: string) => {
    const sla = priority === 'Emergency' ? 60 : priority === 'Urgent' ? 120 : 1440;
    if (mins <= sla * 0.5) return 'text-emerald-600';
    if (mins <= sla) return 'text-amber-600';
    return 'text-destructive';
  };

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">TAT / SLA Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Turnaround time monitoring with modality-level SLA tracking, breach alerts, and stat vs routine performance analytics.</p>
      </motion.div>
      <PreviewStrip message="TAT data is manually entered. Auto-capture from platform transitions (ordered→completed→reported) pending." />
      <QuickLinks />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold">Avg TAT</span></div>
          <p className="text-2xl font-bold">{avgTAT} min</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" /><span className="text-sm font-semibold">Breach Rate</span></div>
          <p className="text-2xl font-bold">{breachRate}%</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">On Time</span></div>
          <p className="text-2xl font-bold">{records.filter(r => !r.breach).length}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Total Records</span></div>
          <p className="text-2xl font-bold">{records.length}</p>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search patient/study..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={modalityFilter} onChange={e => setModalityFilter(e.target.value)}>
          <option value="all">All modalities</option>
          {MODALITIES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <Button size="sm" className="gap-1 ml-auto" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />Record TAT</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Order ID" value={form.orderId} onChange={e => setForm(f => ({ ...f, orderId: e.target.value }))} />
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Input placeholder="Study/procedure" value={form.study} onChange={e => setForm(f => ({ ...f, study: e.target.value }))} />
            <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.modality} onChange={e => setForm(f => ({ ...f, modality: e.target.value }))}>
              {MODALITIES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              <option value="Routine">Routine</option>
              <option value="Urgent">Urgent</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Ordered at</Label><input type="datetime-local" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.orderedAt} onChange={e => setForm(f => ({ ...f, orderedAt: e.target.value }))} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Imaging started</Label><input type="datetime-local" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.imagingStartedAt} onChange={e => setForm(f => ({ ...f, imagingStartedAt: e.target.value }))} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Imaging completed</Label><input type="datetime-local" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.imagingCompletedAt} onChange={e => setForm(f => ({ ...f, imagingCompletedAt: e.target.value }))} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Report completed</Label><input type="datetime-local" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.reportCompletedAt} onChange={e => setForm(f => ({ ...f, reportCompletedAt: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={calculateTAT}>Calculate & Save</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.sort((a, b) => b.tatOrderToReport - a.tatOrderToReport).map(r => (
          <Card key={r.id} className={`rounded-xl ${r.breach ? 'border-destructive/30' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Clock className={`w-4 h-4 mt-0.5 shrink-0 ${r.breach ? 'text-destructive' : 'text-emerald-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold">{r.patientName}</p>
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5">{r.modality}</Badge>
                    <Badge variant={r.priority === 'Emergency' ? 'destructive' : r.priority === 'Urgent' ? 'default' : 'secondary'} className="text-[9px] h-4 px-1.5">{r.priority}</Badge>
                    {r.breach && <span className="text-[9px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">SLA Breach</span>}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{r.study}</p>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <div>
                      <p className="text-[9px] text-muted-foreground">Order to Report</p>
                      <p className={`text-sm font-bold ${tatColor(r.tatOrderToReport, r.priority)}`}>{r.tatOrderToReport}m</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground">Imaging to Report</p>
                      <p className="text-sm font-bold">{r.tatImagingToReport}m</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground">SLA</p>
                      <p className="text-sm font-bold">{r.priority === 'Emergency' ? '60m' : r.priority === 'Urgent' ? '120m' : '24h'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No TAT records yet.</p>}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════
// 6. Addendum / Corrected Reports
// ════════════════════════════════════════════

const AMENDMENTS_KEY = 'adrine_radiology_amendments';

type AmendmentType = 'addendum' | 'correction' | 'revision' | 'clarification';
type AmendmentStatus = 'draft' | 'submitted' | 'approved' | 'appended';

type Amendment = {
  id: string;
  amendmentType: AmendmentType;
  originalOrderId: string;
  originalReportText: string;
  amendmentReason: string;
  amendmentText: string;
  status: AmendmentStatus;
  createdBy: string;
  createdAt: string;
  approvedBy: string;
  approvedAt: string;
  patientName: string;
  uhid: string;
};

const AMENDMENT_REASONS = [
  'Additional findings identified on review',
  'Correction of typographical error',
  'Revised impression after clinical correlation',
  'Clarification of terminology',
  'Comparison with prior study now available',
  'Additional imaging views reviewed',
  'Quantitative measurement added',
  'Other',
];

export function RadiologyAmendments() {
  const [amendments, setAmendments] = useState<Amendment[]>(() => loadJson<Amendment[]>(AMENDMENTS_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    amendmentType: 'addendum' as AmendmentType,
    originalOrderId: '', originalReportText: '', amendmentReason: 'Additional findings identified on review',
    amendmentText: '', createdBy: '', patientName: '', uhid: '',
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AmendmentStatus | 'all'>('all');

  const addAmendment = () => {
    if (!form.amendmentText.trim() || !form.originalOrderId.trim()) return;
    const newAmendment: Amendment = {
      ...form,
      id: crypto.randomUUID?.() ?? `amend-${Date.now()}`,
      status: 'submitted',
      createdAt: new Date().toLocaleString('en-IN'),
      approvedBy: '', approvedAt: '',
    };
    const updated = [newAmendment, ...amendments];
    setAmendments(updated);
    saveJson(AMENDMENTS_KEY, updated);
    setForm({ amendmentType: 'addendum', originalOrderId: '', originalReportText: '', amendmentReason: 'Additional findings identified on review', amendmentText: '', createdBy: '', patientName: '', uhid: '' });
    setShowForm(false);
    toast.success('Amendment submitted');
  };

  const approveAmendment = (id: string) => {
    const updated = amendments.map(a => a.id === id ? { ...a, status: 'approved' as AmendmentStatus, approvedBy: 'Dr. Reviewer', approvedAt: new Date().toLocaleString('en-IN') } : a);
    setAmendments(updated);
    saveJson(AMENDMENTS_KEY, updated);
    toast.success('Amendment approved');
  };

  const pendingCount = amendments.filter(a => a.status === 'submitted').length;
  const approvedCount = amendments.filter(a => a.status === 'approved').length;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return amendments.filter(a => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      return a.patientName.toLowerCase().includes(q) || a.originalOrderId.includes(q) || a.amendmentType.toLowerCase().includes(q);
    });
  }, [amendments, search, statusFilter]);

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Addendum &amp; Corrected Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage report amendments, corrections, and addenda with reason-coded tracking, approval workflow, and audit trail.</p>
      </motion.div>
      <PreviewStrip message="Amendments are local. ACR practice parameter requires addenda to be appended to original report — pending platform integration." docs="ACR Practice Parameter for Communication of Diagnostic Imaging Findings §Communication of Amendments." />
      <QuickLinks />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold">Addenda</span></div>
          <p className="text-2xl font-bold">{amendments.filter(a => a.amendmentType === 'addendum').length}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Corrections</span></div>
          <p className="text-2xl font-bold">{amendments.filter(a => a.amendmentType === 'correction').length}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Pending</span></div>
          <p className="text-2xl font-bold">{pendingCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">Approved</span></div>
          <p className="text-2xl font-bold">{approvedCount}</p>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search patient/order..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="appended">Appended</option>
        </select>
        <Button size="sm" className="gap-1 ml-auto" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />New Amendment</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed border-amber-500/30">
          <div className="grid grid-cols-2 gap-2">
            <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.amendmentType} onChange={e => setForm(f => ({ ...f, amendmentType: e.target.value as AmendmentType }))}>
              <option value="addendum">Addendum</option>
              <option value="correction">Correction</option>
              <option value="revision">Revision</option>
              <option value="clarification">Clarification</option>
            </select>
            <Input placeholder="Original order ID" value={form.originalOrderId} onChange={e => setForm(f => ({ ...f, originalOrderId: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-muted-foreground">Original Report (for reference)</Label>
            <Textarea rows={3} value={form.originalReportText} onChange={e => setForm(f => ({ ...f, originalReportText: e.target.value }))} placeholder="Paste original report text for context..." />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-muted-foreground">Reason for Amendment</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.amendmentReason} onChange={e => setForm(f => ({ ...f, amendmentReason: e.target.value }))}>
              {AMENDMENT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-muted-foreground">Amendment / Correction Text</Label>
            <Textarea rows={5} value={form.amendmentText} onChange={e => setForm(f => ({ ...f, amendmentText: e.target.value }))} placeholder="Enter the amended report text..." />
          </div>
          <Input placeholder="Created by" value={form.createdBy} onChange={e => setForm(f => ({ ...f, createdBy: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addAmendment}>Submit Amendment</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map(a => (
          <Card key={a.id} className={`rounded-xl ${a.status === 'submitted' ? 'border-amber-500/30' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600">{a.amendmentType}</span>
                    <p className="text-xs font-semibold">{a.patientName || 'Unknown'}</p>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">Order: {a.originalOrderId}</span>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${a.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : a.status === 'submitted' ? 'bg-amber-500/10 text-amber-600' : 'bg-muted text-muted-foreground'}`}>{a.status}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Reason: {a.amendmentReason}</p>
                  <div className="bg-muted/30 rounded-lg p-2 mt-1">
                    <p className="text-[9px] text-muted-foreground uppercase">Amendment</p>
                    <p className="text-xs mt-0.5 whitespace-pre-wrap line-clamp-2">{a.amendmentText}</p>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground mt-1">
                    <span>By: {a.createdBy || '—'}</span>
                    <span>· {a.createdAt}</span>
                    {a.approvedAt && <span>· Approved: {a.approvedAt}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {a.status === 'submitted' && (
                    <Button size="sm" className="h-7 text-[10px]" onClick={() => approveAmendment(a.id)}><Check className="w-3 h-3 mr-1" />Approve</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No amendments recorded.</p>}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════
// 7. Peer Review Queue
// ════════════════════════════════════════════

const PEER_REVIEW_KEY = 'adrine_radiology_peer_review';

type PeerReviewRecord = {
  id: string;
  orderId: string;
  patientName: string;
  uhid: string;
  study: string;
  modality: string;
  originalRadiologist: string;
  originalReport: string;
  reviewRadiologist: string;
  reviewStatus: 'pending' | 'in-review' | 'completed';
  discrepancyScore: 1 | 2 | 3 | 4;
  discrepancyCategory: string;
  reviewerComments: string;
  educationalValue: string;
  assignedAt: string;
  completedAt: string;
};

export function RadiologyPeerReview() {
  const [reviews, setReviews] = useState<PeerReviewRecord[]>(() => loadJson<PeerReviewRecord[]>(PEER_REVIEW_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    orderId: '', patientName: '', uhid: '', study: '', modality: 'CT Scan',
    originalRadiologist: '', originalReport: '', reviewRadiologist: '',
    discrepancyCategory: '', reviewerComments: '', educationalValue: '',
  });
  const [reviewForm, setReviewForm] = useState<PeerReviewRecord | null>(null);
  const [reviewScore, setReviewScore] = useState<PeerReviewRecord['discrepancyScore']>(1);
  const [reviewComments, setReviewComments] = useState('');
  const [search, setSearch] = useState('');

  const assignReview = () => {
    if (!form.patientName.trim() || !form.reviewRadiologist.trim()) return;
    const newReview: PeerReviewRecord = {
      ...form,
      id: crypto.randomUUID?.() ?? `pr-${Date.now()}`,
      reviewStatus: 'pending',
      discrepancyScore: 1,
      assignedAt: new Date().toLocaleString('en-IN'),
      completedAt: '',
    } as PeerReviewRecord;
    const updated = [newReview, ...reviews];
    setReviews(updated);
    saveJson(PEER_REVIEW_KEY, updated);
    setForm({ orderId: '', patientName: '', uhid: '', study: '', modality: 'CT Scan', originalRadiologist: '', originalReport: '', reviewRadiologist: '', discrepancyCategory: '', reviewerComments: '', educationalValue: '' });
    setShowForm(false);
    toast.success('Peer review assigned');
  };

  const completeReview = (id: string) => {
    const updated = reviews.map(r => r.id === id ? {
      ...r,
      reviewStatus: 'completed' as const,
      discrepancyScore: reviewScore,
      reviewerComments: reviewComments,
      completedAt: new Date().toLocaleString('en-IN'),
    } : r);
    setReviews(updated);
    saveJson(PEER_REVIEW_KEY, updated);
    setReviewForm(null);
    setReviewScore(1);
    setReviewComments('');
    toast.success('Review completed');
  };

  const pendingCount = reviews.filter(r => r.reviewStatus === 'pending').length;
  const completedCount = reviews.filter(r => r.reviewStatus === 'completed').length;
  const majorDiscordance = reviews.filter(r => r.discrepancyScore >= 3).length;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return reviews.filter(r => r.patientName.toLowerCase().includes(q) || r.uhid.includes(q) || r.originalRadiologist.toLowerCase().includes(q));
  }, [reviews, search]);

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Peer Review Queue</h1>
        <p className="text-sm text-muted-foreground mt-1">Second-read discrepancy tracking, RADPEER scoring, and educational feedback for quality assurance.</p>
      </motion.div>
      <PreviewStrip message="Peer review is locally tracked. ACR RADPEER scoring and multi-site review routing pending." docs="ACR RADPEER Program — 4-point scoring scale for discrepancy categorization." />
      <QuickLinks />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Pending Review</span></div>
          <p className="text-2xl font-bold">{pendingCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">Completed</span></div>
          <p className="text-2xl font-bold">{completedCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" /><span className="text-sm font-semibold">Major Discordance</span></div>
          <p className="text-2xl font-bold">{majorDiscordance}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Star className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Total Reviews</span></div>
          <p className="text-2xl font-bold">{reviews.length}</p>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search patient/radiologist..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button size="sm" className="gap-1 ml-auto" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />Assign Review</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Order ID" value={form.orderId} onChange={e => setForm(f => ({ ...f, orderId: e.target.value }))} />
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Study/procedure" value={form.study} onChange={e => setForm(f => ({ ...f, study: e.target.value }))} />
            <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.modality} onChange={e => setForm(f => ({ ...f, modality: e.target.value }))}>
              {MODALITIES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <Input placeholder="Original radiologist" value={form.originalRadiologist} onChange={e => setForm(f => ({ ...f, originalRadiologist: e.target.value }))} />
          </div>
          <Textarea placeholder="Original report text" rows={3} value={form.originalReport} onChange={e => setForm(f => ({ ...f, originalReport: e.target.value }))} />
          <Input placeholder="Review radiologist" value={form.reviewRadiologist} onChange={e => setForm(f => ({ ...f, reviewRadiologist: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={assignReview}>Assign Review</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map(r => (
          <Card key={r.id} className={`rounded-xl cursor-pointer ${r.reviewStatus === 'pending' ? 'border-amber-500/30' : ''}`} onClick={() => {
            if (r.reviewStatus !== 'completed') {
              setReviewForm(r);
              setReviewScore(r.discrepancyScore);
              setReviewComments(r.reviewerComments);
            }
          }}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Star className={`w-4 h-4 mt-0.5 shrink-0 ${r.reviewStatus === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold">{r.patientName}</p>
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5">{r.modality}</Badge>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${r.reviewStatus === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>{r.reviewStatus}</span>
                    {r.discrepancyScore > 1 && <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">Score: {r.discrepancyScore}/4</span>}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                    <span>Original: {r.originalRadiologist}</span>
                    <span>Reviewer: {r.reviewRadiologist}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground">Assigned: {r.assignedAt}</p>
                </div>
                {r.reviewStatus === 'pending' && (
                  <Button size="sm" className="h-7 text-[10px] shrink-0">Review</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No peer reviews assigned.</p>}
      </div>

      <Dialog open={!!reviewForm} onOpenChange={() => setReviewForm(null)}>
        <DialogContent className="max-w-xl">
          {reviewForm && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Star className="h-5 w-5" /> Peer Review</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <p><span className="text-muted-foreground">Patient:</span> {reviewForm.patientName} ({reviewForm.uhid})</p>
                <p><span className="text-muted-foreground">Study:</span> {reviewForm.study} · {reviewForm.modality}</p>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Original Report by {reviewForm.originalRadiologist}</p>
                  <p className="text-xs whitespace-pre-wrap">{reviewForm.originalReport}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1">RADPEER Discrepancy Score</p>
                  <div className="flex gap-2">
                    {([1, 2, 3, 4] as const).map(score => (
                      <button key={score} onClick={() => setReviewScore(score)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${reviewScore === score ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {score} - {score === 1 ? 'Concur' : score === 2 ? 'Minor' : score === 3 ? 'Moderate' : 'Major'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1">Reviewer Comments</p>
                  <Textarea rows={4} value={reviewComments} onChange={e => setReviewComments(e.target.value)} placeholder="Detailed review comments..." />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setReviewForm(null)}>Cancel</Button>
                  <Button onClick={() => completeReview(reviewForm.id)}>Complete Review</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ════════════════════════════════════════════
// 8. Radiation Dose Registry
// ════════════════════════════════════════════

const DOSE_KEY = 'adrine_radiology_dose';

type DoseRecord = {
  id: string;
  date: string;
  patientName: string;
  uhid: string;
  study: string;
  modality: string;
  bodyRegion: string;
  ctdivol: number;
  dlp: number;
  effectiveDose: number;
  totalDlpThisYear: number;
  kermaAreaProduct: number;
  fluoroscopyTime: string;
  numberAcquisitions: number;
  age: number;
  gender: string;
  protocol: string;
  notes: string;
};

export function RadiologyDoseRegistry() {
  const [records, setRecords] = useState<DoseRecord[]>(() => loadJson<DoseRecord[]>(DOSE_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientName: '', uhid: '', study: '', modality: 'CT Scan', bodyRegion: 'Chest',
    ctdivol: 0, dlp: 0, effectiveDose: 0, totalDlpThisYear: 0,
    kermaAreaProduct: 0, fluoroscopyTime: '', numberAcquisitions: 1,
    age: 40, gender: 'Male', protocol: '', notes: '',
  });
  const [search, setSearch] = useState('');

  const addRecord = () => {
    if (!form.patientName.trim() || !form.study.trim()) return;
    const newRecord: DoseRecord = {
      ...form,
      id: crypto.randomUUID?.() ?? `dose-${Date.now()}`,
      date: new Date().toLocaleString('en-IN'),
    };
    const updated = [newRecord, ...records];
    setRecords(updated);
    saveJson(DOSE_KEY, updated);
    setForm({ patientName: '', uhid: '', study: '', modality: 'CT Scan', bodyRegion: 'Chest', ctdivol: 0, dlp: 0, effectiveDose: 0, totalDlpThisYear: 0, kermaAreaProduct: 0, fluoroscopyTime: '', numberAcquisitions: 1, age: 40, gender: 'Male', protocol: '', notes: '' });
    setShowForm(false);
    toast.success('Dose record added');
  };

  const totalDLP = records.reduce((s, r) => s + r.dlp, 0);
  const totalEffDose = records.reduce((s, r) => s + r.effectiveDose, 0);
  const ctCount = records.filter(r => r.modality === 'CT Scan').length;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter(r => r.patientName.toLowerCase().includes(q) || r.uhid.includes(q) || r.study.toLowerCase().includes(q));
  }, [records, search]);

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Radiation Dose Registry</h1>
        <p className="text-sm text-muted-foreground mt-1">Track CTDIvol, DLP, effective dose, fluoroscopy time, and cumulative patient dose across modalities.</p>
      </motion.div>
      <PreviewStrip message="Dose data is manually entered. DICOM SR / RDSR auto-capture and ACR Dose Index Registry submission pending." docs="Joint Commission Diagnostic Imaging Standards — dose monitoring required for CT and fluoroscopy." />
      <QuickLinks />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Total DLP</span></div>
          <p className="text-2xl font-bold">{totalDLP.toLocaleString()} mGy·cm</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold">Eff. Dose</span></div>
          <p className="text-2xl font-bold">{totalEffDose.toFixed(1)} mSv</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><ScanLine className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">CT Studies</span></div>
          <p className="text-2xl font-bold">{ctCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Total Records</span></div>
          <p className="text-2xl font-bold">{records.length}</p>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search patient/study..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button size="sm" className="gap-1 ml-auto" onClick={() => setShowForm(!showForm)}><Zap className="w-3.5 h-3.5" />Record Dose</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed border-amber-500/30">
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
            <Input placeholder="Study/protocol" value={form.study} onChange={e => setForm(f => ({ ...f, study: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.modality} onChange={e => setForm(f => ({ ...f, modality: e.target.value }))}>
              <option value="CT Scan">CT Scan</option>
              <option value="Fluoroscopy">Fluoroscopy</option>
              <option value="Angiography">Angiography</option>
              <option value="PET-CT">PET-CT</option>
              <option value="X-Ray">X-Ray</option>
              <option value="Mammography">Mammography</option>
            </select>
            <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.bodyRegion} onChange={e => setForm(f => ({ ...f, bodyRegion: e.target.value }))}>
              {BODY_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <Input placeholder="Protocol name" value={form.protocol} onChange={e => setForm(f => ({ ...f, protocol: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">CTDIvol (mGy)</Label><Input type="number" min={0} step={0.1} value={form.ctdivol} onChange={e => setForm(f => ({ ...f, ctdivol: Number(e.target.value) }))} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">DLP (mGy·cm)</Label><Input type="number" min={0} step={1} value={form.dlp} onChange={e => setForm(f => ({ ...f, dlp: Number(e.target.value) }))} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Eff. Dose (mSv)</Label><Input type="number" min={0} step={0.1} value={form.effectiveDose} onChange={e => setForm(f => ({ ...f, effectiveDose: Number(e.target.value) }))} /></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">KAP (μGy·m²)</Label><Input type="number" min={0} step={0.1} value={form.kermaAreaProduct} onChange={e => setForm(f => ({ ...f, kermaAreaProduct: Number(e.target.value) }))} /></div>
            <Input placeholder="Fluoroscopy time" value={form.fluoroscopyTime} onChange={e => setForm(f => ({ ...f, fluoroscopyTime: e.target.value }))} />
            <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Acquisitions</Label><Input type="number" min={1} value={form.numberAcquisitions} onChange={e => setForm(f => ({ ...f, numberAcquisitions: Number(e.target.value) }))} /></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Patient Age</Label><Input type="number" min={0} value={form.age} onChange={e => setForm(f => ({ ...f, age: Number(e.target.value) }))} /></div>
            <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Cumulative DLP/yr</Label><Input type="number" min={0} value={form.totalDlpThisYear} onChange={e => setForm(f => ({ ...f, totalDlpThisYear: Number(e.target.value) }))} /></div>
          </div>
          <Textarea placeholder="Notes" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addRecord}><Zap className="w-3 h-3 mr-1" />Record Dose</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map(r => (
          <Card key={r.id} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Zap className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold">{r.patientName}</p>
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5">{r.modality}</Badge>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{r.bodyRegion}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <div><p className="text-[9px] text-muted-foreground">CTDIvol</p><p className="text-xs font-semibold">{r.ctdivol} mGy</p></div>
                    <div><p className="text-[9px] text-muted-foreground">DLP</p><p className="text-xs font-semibold">{r.dlp} mGy·cm</p></div>
                    <div><p className="text-[9px] text-muted-foreground">Eff. Dose</p><p className="text-xs font-semibold">{r.effectiveDose} mSv</p></div>
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{r.study} · {r.date}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No dose records yet.</p>}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════
// 9. Teleradiology Routing
// ════════════════════════════════════════════

const TELERAD_KEY = 'adrine_radiology_telerad';

type TeleradSite = {
  id: string;
  name: string;
  location: string;
  active: boolean;
  modalities: string[];
  slaHours: number;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
};

type TeleradQueueItem = {
  id: string;
  orderId: string;
  patientName: string;
  uhid: string;
  study: string;
  modality: string;
  assignedSite: string;
  assignedAt: string;
  slaDeadline: string;
  status: 'pending' | 'assigned' | 'in-progress' | 'completed' | 'breached';
  completedAt: string;
  reportUrl: string;
  notes: string;
};

const DEFAULT_SITES: TeleradSite[] = [
  { id: 'site-1', name: 'NightHawk Teleradiology', location: 'Mumbai, India', active: true, modalities: ['CT Scan', 'MRI', 'X-Ray'], slaHours: 2, contactPerson: 'Dr. NightHawk', contactEmail: 'nighthawk@telrad.com', contactPhone: '+91-22-40001234' },
  { id: 'site-2', name: 'RadPartners India', location: 'Bangalore, India', active: true, modalities: ['CT Scan', 'MRI', 'X-Ray', 'Ultrasound'], slaHours: 4, contactPerson: 'Dr. RadPartner', contactEmail: 'ops@radpartners.in', contactPhone: '+91-80-40005678' },
  { id: 'site-3', name: 'Global Telerad Services', location: 'Noida, India', active: false, modalities: ['MRI', 'Mammography'], slaHours: 6, contactPerson: 'Dr. Global', contactEmail: 'ops@globaltelerad.com', contactPhone: '+91-120-40009000' },
];

export function RadiologyTelerad() {
  const [sites] = useState<TeleradSite[]>(() => loadJson<TeleradSite[]>(TELERAD_KEY + '_sites', DEFAULT_SITES));
  const [queue, setQueue] = useState<TeleradQueueItem[]>(() => loadJson<TeleradQueueItem[]>(TELERAD_KEY + '_queue', []));
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('queue');
  const [form, setForm] = useState({
    orderId: '', patientName: '', uhid: '', study: '', modality: 'CT Scan',
    assignedSite: sites[0]?.id || '', notes: '',
  });
  const [search, setSearch] = useState('');

  const assignToSite = () => {
    if (!form.patientName.trim() || !form.assignedSite) return;
    const site = sites.find(s => s.id === form.assignedSite);
    const now = new Date();
    const deadline = new Date(now.getTime() + (site?.slaHours || 4) * 3600000);
    const newItem: TeleradQueueItem = {
      ...form,
      id: crypto.randomUUID?.() ?? `telerad-${Date.now()}`,
      assignedAt: now.toLocaleString('en-IN'),
      slaDeadline: deadline.toLocaleString('en-IN'),
      status: 'assigned',
      completedAt: '',
      reportUrl: '',
    };
    const updated = [newItem, ...queue];
    setQueue(updated);
    saveJson(TELERAD_KEY + '_queue', updated);
    setForm({ orderId: '', patientName: '', uhid: '', study: '', modality: 'CT Scan', assignedSite: sites[0]?.id || '', notes: '' });
    setShowForm(false);
    toast.success('Study assigned to teleradiology');
  };

  const markCompleted = (id: string) => {
    const updated = queue.map(q => q.id === id ? { ...q, status: 'completed' as const, completedAt: new Date().toLocaleString('en-IN') } : q);
    setQueue(updated);
    saveJson(TELERAD_KEY + '_queue', updated);
    toast.success('Telerad study completed');
  };

  const pendingCount = queue.filter(q => q.status === 'assigned' || q.status === 'pending').length;
  const breachedCount = queue.filter(q => q.status === 'breached').length;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (activeTab === 'queue') {
      return queue.filter(item => item.patientName.toLowerCase().includes(q) || item.uhid.includes(q) || item.study.toLowerCase().includes(q));
    }
    return [];
  }, [queue, search, activeTab]);

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Teleradiology Routing</h1>
        <p className="text-sm text-muted-foreground mt-1">Remote reading queue management with multi-site routing, SLA clocks, and report intake tracking.</p>
      </motion.div>
      <PreviewStrip message="Teleradiology routing simulation. DICOM study transfer, site-specific PACS routing, and HL7 ORU report integration pending." />
      <QuickLinks />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="queue">Study Queue</TabsTrigger>
          <TabsTrigger value="sites">Partner Sites</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
              <div className="flex items-center gap-2"><Wifi className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold">Active Sites</span></div>
              <p className="text-2xl font-bold">{sites.filter(s => s.active).length}</p>
            </CardContent></Card>
            <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Pending</span></div>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </CardContent></Card>
            <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
              <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" /><span className="text-sm font-semibold">SLA Breached</span></div>
              <p className="text-2xl font-bold">{breachedCount}</p>
            </CardContent></Card>
            <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">Completed</span></div>
              <p className="text-2xl font-bold">{queue.filter(q => q.status === 'completed').length}</p>
            </CardContent></Card>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search patient/study..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Button size="sm" className="gap-1 ml-auto" onClick={() => setShowForm(!showForm)}><Wifi className="w-3.5 h-3.5" />Route to Telerad</Button>
          </div>

          {showForm && (
            <Card className="rounded-xl p-4 space-y-3 border-dashed">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
                <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="Study/procedure" value={form.study} onChange={e => setForm(f => ({ ...f, study: e.target.value }))} />
                <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.modality} onChange={e => setForm(f => ({ ...f, modality: e.target.value }))}>
                  {MODALITIES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.assignedSite} onChange={e => setForm(f => ({ ...f, assignedSite: e.target.value }))}>
                  {sites.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name} ({s.slaHours}h SLA)</option>)}
                </select>
              </div>
              <Textarea placeholder="Routing notes / instructions" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button size="sm" onClick={assignToSite}>Route Study</Button>
              </div>
            </Card>
          )}

          <div className="space-y-2">
            {filtered.map(q => {
              const site = sites.find(s => s.id === q.assignedSite);
              return (
                <Card key={q.id} className={`rounded-xl ${q.status === 'breached' ? 'border-destructive/30' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Wifi className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-semibold">{q.patientName}</p>
                          <Badge variant="outline" className="text-[9px] h-4 px-1.5">{q.modality}</Badge>
                          <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${q.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : q.status === 'breached' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-600'}`}>{q.status}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <span>Site: {site?.name || 'Unknown'}</span>
                          <span>SLA: {site?.slaHours || '?'}h</span>
                          <span>Deadline: {q.slaDeadline}</span>
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-0.5">{q.study} · Assigned: {q.assignedAt}</p>
                      </div>
                      {q.status === 'assigned' && (
                        <Button size="sm" className="h-7 text-[10px] shrink-0" onClick={() => markCompleted(q.id)}><Check className="w-3 h-3 mr-1" />Complete</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filtered.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No studies in queue.</p>}
          </div>
        </TabsContent>

        <TabsContent value="sites" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sites.map(s => (
              <Card key={s.id} className="rounded-xl">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {s.active ? <Wifi className="w-4 h-4 text-emerald-600" /> : <WifiOff className="w-4 h-4 text-muted-foreground" />}
                      <div>
                        <p className="text-sm font-semibold">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground">{s.location}</p>
                      </div>
                    </div>
                    <Badge variant={s.active ? 'default' : 'secondary'} className="text-[9px] h-4 px-1.5">{s.active ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {s.modalities.map(m => <span key={m} className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{m}</span>)}
                  </div>
                  <div className="text-[10px] text-muted-foreground space-y-0.5">
                    <p>SLA: {s.slaHours} hours</p>
                    <p>Contact: {s.contactPerson}</p>
                    <p>{s.contactEmail} · {s.contactPhone}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

// ════════════════════════════════════════════
// 10. PACS / DICOM Study Viewer
// ════════════════════════════════════════════

const PACS_KEY = 'adrine_radiology_pacs';

type PACSStudy = {
  id: string;
  patientName: string;
  uhid: string;
  studyUid: string;
  accessionNo: string;
  studyDescription: string;
  modality: string;
  bodyPart: string;
  studyDate: string;
  numSeries: number;
  numImages: number;
  studySize: string;
  pacsUrl: string;
  orthancId: string;
  status: 'archived' | 'available' | 'in-progress' | 'failed';
  notes: string;
};

export function RadiologyPACS() {
  const [studies, setStudies] = useState<PACSStudy[]>(() => loadJson<PACSStudy[]>(PACS_KEY, []));
  const [search, setSearch] = useState('');
  const [selectedStudy, setSelectedStudy] = useState<PACSStudy | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return studies.filter(s => s.patientName.toLowerCase().includes(q) || s.uhid.includes(q) || s.studyUid.includes(q) || s.accessionNo.includes(q));
  }, [studies, search]);

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Study Viewer / PACS Link</h1>
        <p className="text-sm text-muted-foreground mt-1">DICOM study browser with PACS integration links, Orthanc viewer embed, and study metadata access.</p>
      </motion.div>
      <PreviewStrip message="Full PACS viewer is P2. This is a DICOM study metadata browser with PACS URL links. Orthanc/dcm4chee bridge integration planned." docs="DICOM PS3.17 — Web Services (WADO-RS) for image retrieval. P2 target: Orthanc embedded viewer." />
      <QuickLinks />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Image className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold">Available</span></div>
          <p className="text-2xl font-bold">{studies.filter(s => s.status === 'available').length}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Video className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">In Progress</span></div>
          <p className="text-2xl font-bold">{studies.filter(s => s.status === 'in-progress').length}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Archived</span></div>
          <p className="text-2xl font-bold">{studies.filter(s => s.status === 'archived').length}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Link className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Total Studies</span></div>
          <p className="text-2xl font-bold">{studies.length}</p>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search patient/UID/accession..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button size="sm" variant="outline" className="gap-1" onClick={() => {
          const sampleStudy: PACSStudy = {
            id: crypto.randomUUID?.() ?? `pacs-${Date.now()}`,
            patientName: 'Demo Patient',
            uhid: 'UHID-DEMO',
            studyUid: `1.2.840.113619.2.${Date.now()}`,
            accessionNo: `ACC-${Date.now().toString().slice(-8)}`,
            studyDescription: 'CT Chest with Contrast',
            modality: 'CT',
            bodyPart: 'Chest',
            studyDate: new Date().toISOString().split('T')[0],
            numSeries: 3,
            numImages: 245,
            studySize: '342 MB',
            pacsUrl: 'https://pacs.adrine-hospital.local/viewer?study=',
            orthancId: `orthanc-${Date.now().toString().slice(-6)}`,
            status: 'available',
            notes: '',
          };
          const updated = [sampleStudy, ...studies];
          setStudies(updated);
          saveJson(PACS_KEY, updated);
          toast.success('Sample study loaded');
        }}><Plus className="w-3.5 h-3.5" />Load Sample</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => (
          <Card key={s.id} className="rounded-xl cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedStudy(s)}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">{s.patientName}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{s.uhid}</p>
                </div>
                <Badge variant={s.status === 'available' ? 'default' : s.status === 'in-progress' ? 'secondary' : 'outline'} className="text-[9px] h-4 px-1.5">{s.status}</Badge>
              </div>
              <div className="space-y-1 text-[10px]">
                <p className="font-medium">{s.studyDescription}</p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Badge variant="outline" className="text-[9px] h-4 px-1.5">{s.modality}</Badge>
                  <span>{s.bodyPart}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>{s.numSeries} series</span>
                  <span>{s.numImages} images</span>
                  <span>{s.studySize}</span>
                </div>
                <p className="font-mono text-[9px] text-muted-foreground truncate">UID: {s.studyUid}</p>
              </div>
              {s.pacsUrl && (
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="h-7 text-[10px] flex-1" onClick={(e) => { e.stopPropagation(); window.open(s.pacsUrl + encodeURIComponent(s.studyUid), '_blank'); }}>
                    <ExternalLink className="w-3 h-3 mr-1" />Open in PACS
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground col-span-3 py-6 text-center">No PACS studies loaded. Click "Load Sample" to add a demo study.</p>}
      </div>

      <Dialog open={!!selectedStudy && !showViewer} onOpenChange={() => { setSelectedStudy(null); setShowViewer(false); }}>
        <DialogContent className="max-w-xl">
          {selectedStudy && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Image className="h-5 w-5" /> Study Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Patient:</span> {selectedStudy.patientName}</div>
                  <div><span className="text-muted-foreground">UHID:</span> {selectedStudy.uhid}</div>
                  <div className="col-span-2"><span className="text-muted-foreground">Study:</span> {selectedStudy.studyDescription}</div>
                  <div><span className="text-muted-foreground">Modality:</span> {selectedStudy.modality}</div>
                  <div><span className="text-muted-foreground">Body Part:</span> {selectedStudy.bodyPart}</div>
                  <div><span className="text-muted-foreground">Study Date:</span> {selectedStudy.studyDate}</div>
                  <div><span className="text-muted-foreground">Accession:</span> {selectedStudy.accessionNo}</div>
                  <div className="col-span-2"><span className="text-muted-foreground">Study UID:</span> <code className="text-[10px] bg-muted px-1 py-0.5 rounded break-all">{selectedStudy.studyUid}</code></div>
                  <div><span className="text-muted-foreground">Images:</span> {selectedStudy.numImages} ({selectedStudy.numSeries} series)</div>
                  <div><span className="text-muted-foreground">Size:</span> {selectedStudy.studySize}</div>
                </div>
                {selectedStudy.pacsUrl && (
                  <Button className="w-full" onClick={() => window.open(selectedStudy.pacsUrl + encodeURIComponent(selectedStudy.studyUid), '_blank')}>
                    <ExternalLink className="w-4 h-4 mr-2" />Open in PACS Viewer
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ════════════════════════════════════════════
// 11. Modality Worklist Board
// ════════════════════════════════════════════

const MODALITY_WL_KEY = 'adrine_radiology_modality_wl';

type ModalityWLEntry = {
  id: string;
  orderId: string;
  patientName: string;
  uhid: string;
  study: string;
  modality: string;
  room: string;
  priority: string;
  status: 'ordered' | 'arrived' | 'prepped' | 'scanning' | 'completed';
  scheduledTime: string;
  arrivalTime: string;
  checkingTech: string;
  contrastGiven: string;
  notes: string;
};

export function RadiologyModalityWorklist() {
  const [entries, setEntries] = useState<ModalityWLEntry[]>(() => loadJson<ModalityWLEntry[]>(MODALITY_WL_KEY, []));
  const [selectedModality, setSelectedModality] = useState('All');
  const [search, setSearch] = useState('');

  const modalities = ['All', 'X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'Mammography'];

  const advanceStatus = (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    const nextStatus: Record<string, ModalityWLEntry['status']> = {
      ordered: 'arrived',
      arrived: 'prepped',
      prepped: 'scanning',
      scanning: 'completed',
    };
    const next = nextStatus[entry.status];
    if (!next) return;
    const updated = entries.map(e => e.id === id ? { ...e, status: next, arrivalTime: next === 'arrived' ? new Date().toLocaleString('en-IN') : e.arrivalTime } : e);
    setEntries(updated);
    saveJson(MODALITY_WL_KEY, updated);
    toast.success(`Status: ${entry.status} → ${next}`);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return entries.filter(e => {
      if (selectedModality !== 'All' && e.modality !== selectedModality) return false;
      return e.patientName.toLowerCase().includes(q) || e.uhid.includes(q) || e.orderId.includes(q);
    }).sort((a, b) => {
      if (a.priority === 'Emergency' && b.priority !== 'Emergency') return -1;
      if (b.priority === 'Emergency' && a.priority !== 'Emergency') return 1;
      return (a.scheduledTime || '').localeCompare(b.scheduledTime || '');
    });
  }, [entries, selectedModality, search]);

  const statusStep = (s: string) => {
    const steps = ['ordered', 'arrived', 'prepped', 'scanning', 'completed'];
    return steps.indexOf(s);
  };

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Modality Worklist Board</h1>
        <p className="text-sm text-muted-foreground mt-1">Modality-specific worklist lanes for CT, MR, US, X-ray, and Mammo — with patient arrival, prep, scanning, and completion tracking.</p>
      </motion.div>
      <PreviewStrip message="Modality worklist simulation. DICOM MWL (Modality Worklist) SCU/SCP integration for modality-side pending list pending." docs="DICOM PS3.4 — Modality Worklist Information Model. Target: MWL SCP for modality modality-side pending list download." />
      <QuickLinks />

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {modalities.filter(m => m !== 'All').map(m => {
          const count = entries.filter(e => e.modality === m && e.status !== 'completed').length;
          const total = entries.filter(e => e.modality === m).length;
          return (
            <Card key={m} className={`rounded-xl cursor-pointer transition-all ${selectedModality === m ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelectedModality(m)}>
              <CardContent className="p-3 space-y-0.5 text-center">
                <p className="text-sm font-semibold">{m}</p>
                <p className="text-lg font-bold">{count}</p>
                <p className="text-[9px] text-muted-foreground">{total} total</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search patient/order..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button size="sm" variant={selectedModality === 'All' ? 'default' : 'outline'} className="text-xs" onClick={() => setSelectedModality('All')}>
          All Modalities
        </Button>
        <Button size="sm" variant="outline" className="gap-1 ml-auto" onClick={() => {
          const sampleEntry: ModalityWLEntry = {
            id: crypto.randomUUID?.() ?? `mw-${Date.now()}`,
            orderId: `RD-${Math.floor(1000 + Math.random() * 9000)}`,
            patientName: ['Rajesh Kumar', 'Priya Sharma', 'Amit Singh', 'Sneha Patel', 'Vikram Rao'][Math.floor(Math.random() * 5)],
            uhid: `UHID-${Math.floor(100000 + Math.random() * 900000)}`,
            study: ['CT Chest', 'MRI Brain', 'X-Ray Chest', 'US Abdomen', 'Mammo Bilateral'][Math.floor(Math.random() * 5)],
            modality: ['X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'Mammography'][Math.floor(Math.random() * 5)],
            room: 'Room 1',
            priority: ['Routine', 'Urgent', 'Emergency'][Math.floor(Math.random() * 3)] as string,
            status: ['ordered', 'arrived', 'prepped', 'scanning'][Math.floor(Math.random() * 4)] as ModalityWLEntry['status'],
            scheduledTime: `${String(8 + Math.floor(Math.random() * 8)).padStart(2, '0')}:${String(Math.floor(Math.random() * 4) * 15).padStart(2, '0')}`,
            arrivalTime: '',
            checkingTech: '',
            contrastGiven: Math.random() > 0.5 ? 'Yes' : 'No',
            notes: '',
          };
          const updated = [sampleEntry, ...entries];
          setEntries(updated);
          saveJson(MODALITY_WL_KEY, updated);
          toast.success('Sample patient added');
        }}><Plus className="w-3.5 h-3.5" />Add Sample</Button>
      </div>

      <div className="overflow-x-auto">
        <div className="grid grid-cols-5 gap-2 min-w-[600px]">
          {['ordered', 'arrived', 'prepped', 'scanning', 'completed'].map((stage, idx) => (
            <div key={stage}>
              <div className="text-center mb-2">
                <div className={`text-[10px] font-semibold uppercase px-2 py-1 rounded-lg ${idx < 4 ? 'bg-blue-500/10 text-blue-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                  {stage}
                </div>
                <p className="text-lg font-bold mt-1">{filtered.filter(e => e.status === stage).length}</p>
              </div>
              <div className="space-y-2">
                {filtered.filter(e => e.status === stage).map(e => (
                  <Card key={e.id} className={`rounded-lg text-[10px] ${e.priority === 'Emergency' ? 'border-destructive/30 bg-destructive/5' : ''}`}>
                    <CardContent className="p-2 space-y-1">
                      <div className="flex items-start justify-between">
                        <p className="font-semibold truncate">{e.patientName}</p>
                        {e.priority === 'Emergency' && <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />}
                      </div>
                      <div className="text-[9px] text-muted-foreground">
                        <p className="truncate">{e.study}</p>
                        <p>{e.scheduledTime || '—'} · {e.modality}</p>
                      </div>
                      {e.status !== 'completed' && (
                        <Button size="sm" className="h-5 w-full text-[8px] mt-1" onClick={() => advanceStatus(e.id)}>
                          {e.status === 'ordered' ? 'Arrived' : e.status === 'arrived' ? 'Prepped' : e.status === 'prepped' ? 'Start Scan' : 'Complete'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════
// 12. Radiology Workflow Step Strip
// ════════════════════════════════════════════
// (reusable component for worklist/reports)

export function RadiologyWorkflowStepStrip({ currentStatus }: { currentStatus: string }) {
  const steps = [
    { key: 'Ordered', label: 'Ordered' },
    { key: 'Scheduled', label: 'Schedule' },
    { key: 'In Progress', label: 'Acquire' },
    { key: 'Completed', label: 'Report' },
    { key: 'Reported', label: 'Release' },
  ];
  const currentIdx = steps.findIndex(s => s.key === currentStatus);
  return (
    <div className="flex items-center gap-1 py-2">
      {steps.map((step, idx) => {
        const completed = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={step.key} className="flex-1 flex items-center gap-1">
            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[9px] font-semibold transition-colors ${
              completed ? 'bg-emerald-500/20 text-emerald-600' :
              active ? 'bg-primary/20 text-primary ring-1 ring-primary' :
              'bg-muted text-muted-foreground'
            }`}>
              {completed ? <Check className="w-3 h-3" /> : idx + 1}
            </div>
            <span className={`text-[9px] ${active ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{step.label}</span>
            {idx < steps.length - 1 && <div className={`flex-1 h-px ${idx < currentIdx ? 'bg-emerald-500/30' : 'bg-muted'}`} />}
          </div>
        );
      })}
    </div>
  );
}