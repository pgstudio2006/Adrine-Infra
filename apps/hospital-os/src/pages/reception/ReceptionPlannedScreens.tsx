import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Shield, ShieldCheck, ShieldOff, FileText, IndianRupee, Search, Plus,
  Printer, Download, Tag, CreditCard, Smartphone, Banknote, CheckCircle2,
  AlertCircle, Clock, User, X, Check, Upload, Camera, File, Image,
  Receipt, Copy, Scissors, AlertTriangle, ExternalLink, RefreshCw, Eye,
  Phone, PhoneCall, MessageSquare, Filter, Building2, MapPin, ThumbsUp,
  Star, Send, BarChart3, Store, ToggleLeft, ToggleRight, Heart, Edit3,
  Flag, Frown, Smile, Mail, PhoneForwarded, StarHalf, List, SlidersHorizontal,
  PenLine, HelpCircle, ClipboardCheck, ClipboardList, Users, Calendar, ArrowUpDown,
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

const fadeIn = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.3 },
});

function PreviewStrip() {
  return (
    <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/10 px-4 py-3 text-xs text-muted-foreground">
      This screen is in Preview. Data is stored locally until platform EMR endpoints are connected.
    </div>
  );
}

function QuickLinks() {
  const navigate = useNavigate();
  const links = [
    { label: 'Dashboard', path: '/reception' },
    { label: 'Registration', path: '/reception/registration' },
    { label: 'Queue', path: '/reception/queue' },
    { label: 'Billing', path: '/reception/billing' },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => (
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
// 1. Insurance Verification
// ════════════════════════════════════════════

const INSURANCE_KEY = 'adrine_reception_insurance';

type InsuranceRecord = {
  id: string;
  patientName: string; uhid: string; doa: string; payerName: string;
  policyNo: string; groupNo: string; memberId: string; relation: string;
  copay: number; coverage: number; preAuthReq: boolean; preAuthNo: string;
  eligibilityStatus: 'verified' | 'pending' | 'failed';
  tpaName: string; notes: string; verifiedAt: string;
};

const TPA_OPTIONS = ['MediAssist', 'Vidal Health', 'ICICI Lombard', 'Star Health', 'Apollo Munich', 'Aditya Birla', 'Niva Bupa', 'Care Health', 'Manipal Cigna', 'Other'];
const PAYERS = ['ICICI Lombard', 'Star Health', 'New India Assurance', 'Oriental Insurance', 'United India', 'National Insurance', 'Bajaj Allianz', 'HDFC Ergo', 'SBI General', 'Tata AIG', 'Other'];

export function ReceptionInsuranceVerification() {
  const [records, setRecords] = useState<InsuranceRecord[]>(() => loadJson<InsuranceRecord[]>(INSURANCE_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientName: '', uhid: '', doa: new Date().toISOString().split('T')[0],
    payerName: '', policyNo: '', groupNo: '', memberId: '', relation: 'Self',
    copay: 0, coverage: 500000, preAuthReq: false, preAuthNo: '',
    tpaName: '', notes: '', eligibilityStatus: 'pending' as InsuranceRecord['eligibilityStatus'],
  });
  const [search, setSearch] = useState('');

  const addRecord = () => {
    if (!form.patientName.trim() || !form.policyNo.trim()) return;
    const newRecord: InsuranceRecord = {
      ...form, id: crypto.randomUUID?.() ?? `${Date.now()}`,
      verifiedAt: new Date().toLocaleString('en-IN'),
    };
    const updated = [newRecord, ...records];
    setRecords(updated);
    saveJson(INSURANCE_KEY, updated);
    setForm({ patientName: '', uhid: '', doa: new Date().toISOString().split('T')[0], payerName: '', policyNo: '', groupNo: '', memberId: '', relation: 'Self', copay: 0, coverage: 500000, preAuthReq: false, preAuthNo: '', tpaName: '', notes: '', eligibilityStatus: 'pending' });
    setShowForm(false);
    toast.success('Insurance record created');
  };

  const runEligibilityCheck = (id: string) => {
    const updated = records.map(r => r.id === id ? { ...r, eligibilityStatus: 'verified' as const, verifiedAt: new Date().toLocaleString('en-IN') } : r);
    setRecords(updated);
    saveJson(INSURANCE_KEY, updated);
    toast.success('Eligibility verification completed');
  };

  const verifiedCount = records.filter(r => r.eligibilityStatus === 'verified').length;
  const pendingCount = records.filter(r => r.eligibilityStatus === 'pending').length;
  const totalCoverage = records.reduce((s, r) => s + r.coverage, 0);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter(r => r.patientName.toLowerCase().includes(q) || r.uhid.includes(q) || r.policyNo.includes(q));
  }, [records, search]);

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Insurance Verification</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time eligibility checks, copay calculation, TPA tracking, and prior authorization status.</p>
      </motion.div>
      <PreviewStrip />
      <QuickLinks />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">Verified</span></div>
          <p className="text-2xl font-bold">{verifiedCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Pending</span></div>
          <p className="text-2xl font-bold">{pendingCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><IndianRupee className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold">Total Coverage</span></div>
          <p className="text-2xl font-bold">₹{(totalCoverage / 100000).toFixed(1)}L</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Total Records</span></div>
          <p className="text-2xl font-bold">{records.length}</p>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search patient/policy..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button size="sm" className="gap-1 ml-auto" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />New Insurance Record</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.payerName} onChange={e => setForm(f => ({ ...f, payerName: e.target.value }))}>
              <option value="">Select payer</option>
              {PAYERS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <Input placeholder="Policy number" value={form.policyNo} onChange={e => setForm(f => ({ ...f, policyNo: e.target.value }))} />
            <Input placeholder="Group number" value={form.groupNo} onChange={e => setForm(f => ({ ...f, groupNo: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Member ID" value={form.memberId} onChange={e => setForm(f => ({ ...f, memberId: e.target.value }))} />
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.relation} onChange={e => setForm(f => ({ ...f, relation: e.target.value }))}>
              <option>Self</option><option>Spouse</option><option>Parent</option><option>Child</option><option>Employee</option><option>Other</option>
            </select>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.tpaName} onChange={e => setForm(f => ({ ...f, tpaName: e.target.value }))}>
              <option value="">Select TPA</option>
              {TPA_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Coverage (₹)</Label>
              <Input type="number" value={form.coverage} onChange={e => setForm(f => ({ ...f, coverage: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Copay %</Label>
              <Input type="number" min="0" max="100" value={form.copay} onChange={e => setForm(f => ({ ...f, copay: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1 flex items-end pb-2">
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={form.preAuthReq} onChange={e => setForm(f => ({ ...f, preAuthReq: e.target.checked }))} />
                Prior auth required
              </label>
            </div>
          </div>
          {form.preAuthReq && <Input placeholder="Pre-auth number" value={form.preAuthNo} onChange={e => setForm(f => ({ ...f, preAuthNo: e.target.value }))} />}
          <Textarea placeholder="Notes" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addRecord}>Save Record</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map(r => (
          <Card key={r.id} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className={`w-4 h-4 mt-0.5 shrink-0 ${r.eligibilityStatus === 'verified' ? 'text-emerald-500' : r.eligibilityStatus === 'failed' ? 'text-destructive' : 'text-amber-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-medium">{r.patientName}</p>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{r.uhid}</span>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${r.eligibilityStatus === 'verified' ? 'bg-emerald-500/10 text-emerald-600' : r.eligibilityStatus === 'failed' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-600'}`}>{r.eligibilityStatus}</span>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{r.payerName || '—'}</span>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{r.policyNo}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 mt-1">
                    <p className="text-[10px] text-muted-foreground">Coverage: <span className="font-medium">₹{r.coverage.toLocaleString('en-IN')}</span> · Copay: {r.copay}%</p>
                    <p className="text-[10px] text-muted-foreground">TPA: {r.tpaName || '—'} · Pre-auth: {r.preAuthNo || 'N/A'}</p>
                  </div>
                  {r.eligibilityStatus === 'verified' && <p className="text-[10px] text-muted-foreground">Verified: {r.verifiedAt}</p>}
                  {r.notes && <p className="text-[10px] text-muted-foreground mt-0.5">Note: {r.notes}</p>}
                </div>
                {r.eligibilityStatus === 'pending' && (
                  <Button size="sm" className="h-7 text-[10px] shrink-0" onClick={() => runEligibilityCheck(r.id)}>
                    <ShieldCheck className="w-3 h-3 mr-1" /> Verify
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No insurance records yet.</p>}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════
// 2. Discharge Clearance
// ════════════════════════════════════════════

const DISCHARGE_CLEAR_KEY = 'adrine_reception_discharge_clearance';

type DischargeClearance = {
  id: string;
  patientName: string; uhid: string; admissionDate: string; ward: string; bedNo: string;
  attendingDoctor: string; dischargeDate: string;
  finalBillAmount: number; billPaid: boolean; billBalance: number;
  bedReleased: boolean; documentsCollected: boolean; belongingsReturned: boolean;
  dischargeSummaryReady: boolean; pharmacyClearance: boolean; nursingClearance: boolean;
  clearanceStatus: 'pending' | 'in-progress' | 'cleared';
  notes: string;
};

export function ReceptionDischargeClearance() {
  const [records, setRecords] = useState<DischargeClearance[]>(() => loadJson<DischargeClearance[]>(DISCHARGE_CLEAR_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientName: '', uhid: '', admissionDate: '', ward: 'General', bedNo: '',
    attendingDoctor: '', dischargeDate: new Date().toISOString().split('T')[0],
    finalBillAmount: 0, billPaid: false, billBalance: 0, bedReleased: false,
    documentsCollected: false, belongingsReturned: false, dischargeSummaryReady: false,
    pharmacyClearance: false, nursingClearance: false, notes: '',
    clearanceStatus: 'pending' as DischargeClearance['clearanceStatus'],
  });
  const [search, setSearch] = useState('');

  const addRecord = () => {
    if (!form.patientName.trim() || !form.uhid.trim()) return;
    const newRecord: DischargeClearance = { ...form, id: crypto.randomUUID?.() ?? `${Date.now()}` };
    const updated = [newRecord, ...records];
    setRecords(updated);
    saveJson(DISCHARGE_CLEAR_KEY, updated);
    setForm({ patientName: '', uhid: '', admissionDate: '', ward: 'General', bedNo: '', attendingDoctor: '', dischargeDate: new Date().toISOString().split('T')[0], finalBillAmount: 0, billPaid: false, billBalance: 0, bedReleased: false, documentsCollected: false, belongingsReturned: false, dischargeSummaryReady: false, pharmacyClearance: false, nursingClearance: false, notes: '', clearanceStatus: 'pending' });
    setShowForm(false);
    toast.success('Discharge clearance record created');
  };

  const updateChecklist = (id: string, field: keyof DischargeClearance, value: boolean) => {
    const updated = records.map(r => r.id === id ? { ...r, [field]: value } : r);
    setRecords(updated);
    saveJson(DISCHARGE_CLEAR_KEY, updated);
  };

  const updateStatus = (id: string, status: DischargeClearance['clearanceStatus']) => {
    const updated = records.map(r => r.id === id ? { ...r, clearanceStatus: status } : r);
    setRecords(updated);
    saveJson(DISCHARGE_CLEAR_KEY, updated);
    toast.success(`Status updated to ${status}`);
  };

  const pendingCount = records.filter(r => r.clearanceStatus !== 'cleared').length;
  const clearedToday = records.filter(r => r.clearanceStatus === 'cleared').length;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter(r => r.patientName.toLowerCase().includes(q) || r.uhid.includes(q) || r.ward.toLowerCase().includes(q));
  }, [records, search]);

  const checklistItems: Array<{ key: keyof DischargeClearance; label: string }> = [
    { key: 'finalBillAmount', label: 'Final bill computed' },
    { key: 'billPaid', label: 'Bill settled' },
    { key: 'bedReleased', label: 'Bed released' },
    { key: 'documentsCollected', label: 'Documents collected' },
    { key: 'belongingsReturned', label: 'Belongings returned' },
    { key: 'dischargeSummaryReady', label: 'Discharge summary ready' },
    { key: 'pharmacyClearance', label: 'Pharmacy clearance' },
    { key: 'nursingClearance', label: 'Nursing clearance' },
  ];

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Discharge Clearance</h1>
        <p className="text-sm text-muted-foreground mt-1">Final bill reconciliation, bed release, document collection, and discharge checklist management.</p>
      </motion.div>
      <PreviewStrip />
      <QuickLinks />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Pending</span></div>
          <p className="text-2xl font-bold">{pendingCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">Cleared Today</span></div>
          <p className="text-2xl font-bold">{clearedToday}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><IndianRupee className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold">Total Bills</span></div>
          <p className="text-2xl font-bold">₹{records.reduce((s, r) => s + r.finalBillAmount, 0).toLocaleString('en-IN')}</p>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search patient/ward..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button size="sm" className="gap-1 ml-auto" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />New Discharge Record</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Ward" value={form.ward} onChange={e => setForm(f => ({ ...f, ward: e.target.value }))} />
            <Input placeholder="Bed number" value={form.bedNo} onChange={e => setForm(f => ({ ...f, bedNo: e.target.value }))} />
            <Input placeholder="Attending doctor" value={form.attendingDoctor} onChange={e => setForm(f => ({ ...f, attendingDoctor: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Admission date" type="date" value={form.admissionDate} onChange={e => setForm(f => ({ ...f, admissionDate: e.target.value }))} />
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Final bill amount</Label>
              <Input type="number" value={form.finalBillAmount} onChange={e => setForm(f => ({ ...f, finalBillAmount: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Balance due</Label>
              <Input type="number" value={form.billBalance} onChange={e => setForm(f => ({ ...f, billBalance: Number(e.target.value) }))} />
            </div>
          </div>
          <Textarea placeholder="Notes" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addRecord}>Create Record</Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {filtered.map(r => {
          const checkItems = checklistItems.filter(item => typeof r[item.key] === 'boolean');
          const doneCount = checkItems.filter(item => r[item.key] === true).length;
          const totalChecks = checkItems.length;

          return (
            <Card key={r.id} className="rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-medium">{r.patientName}</p>
                      <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{r.uhid}</span>
                      <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${r.clearanceStatus === 'cleared' ? 'bg-emerald-500/10 text-emerald-600' : r.clearanceStatus === 'in-progress' ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600'}`}>{r.clearanceStatus}</span>
                      <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{r.ward} {r.bedNo}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Bill: ₹{r.finalBillAmount.toLocaleString('en-IN')} · Balance: ₹{r.billBalance.toLocaleString('en-IN')} · Dr. {r.attendingDoctor}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 mt-2">
                      {checklistItems.map(item => (
                        <button
                          key={item.key}
                          onClick={() => updateChecklist(r.id, item.key, !r[item.key] as boolean)}
                          className={`flex items-center gap-1 text-[9px] px-1.5 py-1 rounded transition-colors ${
                            r[item.key] ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground hover:bg-accent'
                          }`}
                        >
                          {r[item.key] ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-1">{doneCount}/{totalChecks} checklist items completed</p>
                    {r.notes && <p className="text-[10px] text-muted-foreground mt-1">{r.notes}</p>}
                  </div>
                  {r.clearanceStatus !== 'cleared' && doneCount === totalChecks && (
                    <Button size="sm" className="h-7 text-[10px] shrink-0 text-emerald-600" variant="outline" onClick={() => updateStatus(r.id, 'cleared')}>
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Cleared
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No discharge clearance records yet.</p>}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════
// 3. Print Center
// ════════════════════════════════════════════

const PRINT_KEY = 'adrine_reception_print_center';

type PrintJob = {
  id: string;
  patientName: string; uhid: string; documentType: string;
  copies: number; printedAt: string; printedBy: string;
  status: 'printed' | 'pending';
};

const PRINTABLE_DOCUMENTS = [
  { value: 'OPD Slip', label: 'OPD Slip', icon: Receipt },
  { value: 'Token', label: 'Token', icon: Tag },
  { value: 'Wristband', label: 'Wristband / ID Band', icon: Tag },
  { value: 'Prescription', label: 'Prescription', icon: FileText },
  { value: 'Lab Label', label: 'Lab Label', icon: Tag },
  { value: 'Consent Form', label: 'Consent Form', icon: FileText },
  { value: 'Discharge Summary', label: 'Discharge Summary', icon: FileText },
  { value: 'Invoice', label: 'Invoice / Receipt', icon: Receipt },
  { value: 'Insurance Card', label: 'Insurance Card Copy', icon: FileText },
  { value: 'Barcode', label: 'Barcode Label', icon: Tag },
  { value: 'Referral Letter', label: 'Referral Letter', icon: FileText },
  { value: 'Other', label: 'Other', icon: FileText },
];

export function ReceptionPrintCenter() {
  const [jobs, setJobs] = useState<PrintJob[]>(() => loadJson<PrintJob[]>(PRINT_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientName: '', uhid: '', documentType: 'OPD Slip', copies: 1, printedBy: '',
  });

  const addJob = () => {
    if (!form.patientName.trim() || !form.uhid.trim()) return;
    const newJob: PrintJob = {
      ...form, id: crypto.randomUUID?.() ?? `${Date.now()}`,
      printedAt: new Date().toLocaleString('en-IN'),
      status: 'printed',
    };
    const updated = [newJob, ...jobs];
    setJobs(updated);
    saveJson(PRINT_KEY, updated);
    setForm({ patientName: '', uhid: '', documentType: 'OPD Slip', copies: 1, printedBy: '' });
    setShowForm(false);
    toast.success(`${form.documentType} print job recorded`);
  };

  const printCount = jobs.length;
  const todayCount = jobs.filter(j => j.printedAt.includes(new Date().toLocaleDateString('en-IN').split(',')[0])).length;

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Print Center</h1>
        <p className="text-sm text-muted-foreground mt-1">OPD slips, tokens, wristbands, labels, consent forms, barcodes, and receipt printing.</p>
      </motion.div>
      <PreviewStrip />
      <QuickLinks />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Printer className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold">Printed Today</span></div>
          <p className="text-2xl font-bold">{todayCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Total Documents</span></div>
          <p className="text-2xl font-bold">{printCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Copy className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Total Copies</span></div>
          <p className="text-2xl font-bold">{jobs.reduce((s, j) => s + j.copies, 0)}</p>
        </CardContent></Card>
      </div>

      <div className="flex justify-end">
        <Button size="sm" className="gap-1" onClick={() => setShowForm(!showForm)}><Printer className="w-3.5 h-3.5" />New Print Job</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.documentType} onChange={e => setForm(f => ({ ...f, documentType: e.target.value }))}>
              {PRINTABLE_DOCUMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Copies</Label>
              <Input type="number" min="1" max="10" value={form.copies} onChange={e => setForm(f => ({ ...f, copies: Number(e.target.value) }))} />
            </div>
            <Input placeholder="Printed by" value={form.printedBy} onChange={e => setForm(f => ({ ...f, printedBy: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addJob}><Printer className="w-3 h-3 mr-1" />Print</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {jobs.map(j => {
          const DocIcon = PRINTABLE_DOCUMENTS.find(d => d.value === j.documentType)?.icon || FileText;
          return (
            <Card key={j.id} className="rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <DocIcon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-medium">{j.patientName}</p>
                      <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{j.uhid}</span>
                      <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{j.documentType}</span>
                      <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{j.copies} copy{j.copies > 1 ? 'ies' : 'y'}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{j.printedAt} · by {j.printedBy || '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {jobs.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No print jobs recorded yet.</p>}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════
// 4. Document Scan
// ════════════════════════════════════════════

const DOC_SCAN_KEY = 'adrine_reception_document_scan';

type ScannedDocument = {
  id: string;
  patientName: string; uhid: string; documentType: string;
  description: string; fileName: string; dataUrl: string;
  scannedAt: string; scannedBy: string;
  status: 'indexed' | 'pending';
};

const DOCUMENT_TYPES = [
  'Aadhaar Card', 'PAN Card', 'Driving License', 'Passport', 'Voter ID',
  'Insurance Card', 'Employer ID', 'Lab Report', 'Prescription', 'Discharge Summary',
  'Referral Letter', 'Consent Form', 'Birth Certificate', 'Marriage Certificate',
  'Income Certificate', 'Other ID Proof', 'Other',
];

export function ReceptionDocumentScan() {
  const [documents, setDocuments] = useState<ScannedDocument[]>(() => loadJson<ScannedDocument[]>(DOC_SCAN_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientName: '', uhid: '', documentType: 'Aadhaar Card', description: '',
    fileName: '', dataUrl: '', scannedBy: '',
  });
  const [search, setSearch] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(f => ({ ...f, fileName: file.name, dataUrl: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const addDocument = () => {
    if (!form.patientName.trim() || !form.uhid.trim() || !form.dataUrl) return;
    const newDoc: ScannedDocument = {
      ...form, id: crypto.randomUUID?.() ?? `${Date.now()}`,
      scannedAt: new Date().toLocaleString('en-IN'),
      status: 'indexed',
    };
    const updated = [newDoc, ...documents];
    setDocuments(updated);
    saveJson(DOC_SCAN_KEY, updated);
    setForm({ patientName: '', uhid: '', documentType: 'Aadhaar Card', description: '', fileName: '', dataUrl: '', scannedBy: '' });
    setShowForm(false);
    toast.success('Document indexed successfully');
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => {
      const updated = prev.filter(d => d.id !== id);
      saveJson(DOC_SCAN_KEY, updated);
      return updated;
    });
    toast.success('Document removed');
  };

  const indexedCount = documents.filter(d => d.status === 'indexed').length;
  const pendingCount = documents.filter(d => d.status === 'pending').length;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return documents.filter(d => d.patientName.toLowerCase().includes(q) || d.uhid.includes(q) || d.documentType.toLowerCase().includes(q) || d.description.toLowerCase().includes(q));
  }, [documents, search]);

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Document Scan &amp; Index</h1>
        <p className="text-sm text-muted-foreground mt-1">Scan, upload, and index patient documents — ID proofs, insurance cards, consent forms, and medical records.</p>
      </motion.div>
      <PreviewStrip />
      <QuickLinks />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><File className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">Indexed</span></div>
          <p className="text-2xl font-bold">{indexedCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Pending</span></div>
          <p className="text-2xl font-bold">{pendingCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Image className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Total Files</span></div>
          <p className="text-2xl font-bold">{documents.length}</p>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button size="sm" className="gap-1 ml-auto" onClick={() => setShowForm(!showForm)}>
          <Upload className="w-3.5 h-3.5" />Scan / Upload Document
        </Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.documentType} onChange={e => setForm(f => ({ ...f, documentType: e.target.value }))}>
              {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <Input placeholder="Scanned by" value={form.scannedBy} onChange={e => setForm(f => ({ ...f, scannedBy: e.target.value }))} />
          </div>
          <Textarea placeholder="Description" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

          <div className="rounded-lg border border-dashed p-6 text-center">
            {form.dataUrl ? (
              <div className="space-y-2">
                <img src={form.dataUrl} alt="Preview" className="max-h-40 mx-auto rounded-lg object-contain" />
                <p className="text-xs text-muted-foreground">{form.fileName}</p>
                <Button size="sm" variant="outline" onClick={() => document.getElementById('doc-scan-input')?.click()}>
                  <RefreshCw className="w-3 h-3 mr-1" />Change File
                </Button>
              </div>
            ) : (
              <>
                <Camera className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-muted-foreground mb-1">Select a file to upload</p>
                <p className="text-xs text-muted-foreground mb-3">JPG, PNG, PDF supported</p>
                <Button size="sm" variant="outline" onClick={() => document.getElementById('doc-scan-input')?.click()}>
                  <Upload className="w-3 h-3 mr-1" />Browse Files
                </Button>
              </>
            )}
            <input id="doc-scan-input" type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileSelect} />
          </div>

          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addDocument} disabled={!form.dataUrl}>Index Document</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map(d => (
          <Card key={d.id} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <File className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-medium">{d.patientName}</p>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{d.uhid}</span>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{d.documentType}</span>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${d.status === 'indexed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>{d.status}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{d.description || d.fileName || '—'} · by {d.scannedBy || '—'}</p>
                  <p className="text-[10px] text-muted-foreground">{d.scannedAt}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {d.dataUrl && (
                    <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => window.open(d.dataUrl, '_blank')}>
                      <Eye className="w-3 h-3 mr-1" />View
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="h-7 text-[10px] text-destructive" onClick={() => deleteDocument(d.id)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No documents scanned yet.</p>}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════
// 5. Enquiries & Callbacks
// ════════════════════════════════════════════

const ENQUIRIES_KEY = 'adrine_reception_enquiries';

type EnquiryRecord = {
  id: string;
  date: string;
  patientName: string; contact: string;
  type: 'Appointment' | 'Billing' | 'Lab Result' | 'Doctor Info' | 'Insurance' | 'Feedback' | 'Complaint' | 'Other';
  notes: string;
  callbackRequired: boolean;
  callbackStatus: 'pending' | 'done';
  handledBy: string;
  source: 'walk-in' | 'phone' | 'email';
};

const ENQUIRY_TYPES: EnquiryRecord['type'][] = ['Appointment', 'Billing', 'Lab Result', 'Doctor Info', 'Insurance', 'Feedback', 'Complaint', 'Other'];
const ENQUIRY_SOURCES: EnquiryRecord['source'][] = ['walk-in', 'phone', 'email'];

export function ReceptionEnquiries() {
  const [records, setRecords] = useState<EnquiryRecord[]>(() => loadJson<EnquiryRecord[]>(ENQUIRIES_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientName: '', contact: '', type: 'Appointment' as EnquiryRecord['type'],
    notes: '', callbackRequired: false, callbackStatus: 'pending' as EnquiryRecord['callbackStatus'],
    handledBy: '', source: 'walk-in' as EnquiryRecord['source'],
  });
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [callbackFilter, setCallbackFilter] = useState<string>('all');

  const addRecord = () => {
    if (!form.patientName.trim()) return;
    const newRecord: EnquiryRecord = {
      ...form,
      id: crypto.randomUUID?.() ?? `${Date.now()}`,
      date: new Date().toLocaleString('en-IN'),
    };
    const updated = [newRecord, ...records];
    setRecords(updated);
    saveJson(ENQUIRIES_KEY, updated);
    setForm({ patientName: '', contact: '', type: 'Appointment', notes: '', callbackRequired: false, callbackStatus: 'pending', handledBy: '', source: 'walk-in' });
    setShowForm(false);
    toast.success('Enquiry logged');
  };

  const markCallbackDone = (id: string) => {
    const updated = records.map(r => r.id === id ? { ...r, callbackStatus: 'done' as const } : r);
    setRecords(updated);
    saveJson(ENQUIRIES_KEY, updated);
    toast.success('Callback marked as done');
  };

  const todayCount = records.filter(r => r.date.startsWith(new Date().toLocaleDateString('en-IN'))).length;
  const pendingCallbacks = records.filter(r => r.callbackRequired && r.callbackStatus === 'pending').length;
  const resolvedToday = records.filter(r => r.date.startsWith(new Date().toLocaleDateString('en-IN')) && !r.callbackRequired).length;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter(r => {
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      if (callbackFilter === 'pending' && (!r.callbackRequired || r.callbackStatus !== 'pending')) return false;
      if (callbackFilter === 'done' && (!r.callbackRequired || r.callbackStatus !== 'done')) return false;
      return r.patientName.toLowerCase().includes(q) || r.contact.includes(q) || r.notes.toLowerCase().includes(q);
    });
  }, [records, search, typeFilter, callbackFilter]);

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Enquiries &amp; Callbacks</h1>
        <p className="text-sm text-muted-foreground mt-1">Log walk-in questions, phone calls, and email enquiries. Track callbacks and resolution status.</p>
      </motion.div>
      <PreviewStrip />
      <QuickLinks />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold">Today</span></div>
          <p className="text-2xl font-bold">{todayCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Callbacks Pending</span></div>
          <p className="text-2xl font-bold">{pendingCallbacks}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">Resolved Today</span></div>
          <p className="text-2xl font-bold">{resolvedToday}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Total</span></div>
          <p className="text-2xl font-bold">{records.length}</p>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search patient/notes..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="all">All types</option>
          {ENQUIRY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={callbackFilter}
          onChange={e => setCallbackFilter(e.target.value)}
        >
          <option value="all">All callbacks</option>
          <option value="pending">Pending</option>
          <option value="done">Done</option>
        </select>
        <Button size="sm" className="gap-1 ml-auto" onClick={() => setShowForm(!showForm)}>
          <Phone className="w-3.5 h-3.5" />Log Enquiry
        </Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Patient / caller name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="Contact number" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as EnquiryRecord['type'] }))}>
              {ENQUIRY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value as EnquiryRecord['source'] }))}>
              {ENQUIRY_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Input placeholder="Handled by" value={form.handledBy} onChange={e => setForm(f => ({ ...f, handledBy: e.target.value }))} />
          </div>
          <Textarea placeholder="Enquiry details" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={form.callbackRequired} onChange={e => setForm(f => ({ ...f, callbackRequired: e.target.checked }))} />
            Callback required
          </label>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addRecord}><Phone className="w-3 h-3 mr-1" />Log Enquiry</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map(r => (
          <Card key={r.id} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {r.source === 'phone' ? <Phone className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" /> :
                 r.source === 'email' ? <Mail className="w-4 h-4 mt-0.5 shrink-0 text-purple-500" /> :
                 <MessageSquare className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-medium">{r.patientName}</p>
                    {r.contact && <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{r.contact}</span>}
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{r.type}</span>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded capitalize">{r.source}</span>
                    {r.callbackRequired && (
                      <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${r.callbackStatus === 'done' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                        Callback: {r.callbackStatus}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{r.notes || '—'}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{r.date} · by {r.handledBy || '—'}</p>
                </div>
                {r.callbackRequired && r.callbackStatus === 'pending' && (
                  <Button size="sm" className="h-7 text-[10px] shrink-0" variant="outline" onClick={() => markCallbackDone(r.id)}>
                    <Check className="w-3 h-3 mr-1" /> Mark Done
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No enquiries logged yet.</p>}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════
// 6. Branch / Counter Management
// ════════════════════════════════════════════

const BRANCHES_KEY = 'adrine_reception_branches';

type Counter = {
  id: string;
  name: string;
  staffAssigned: string;
  isOpen: boolean;
};

type Branch = {
  id: string;
  name: string;
  location: string;
  counters: Counter[];
  isOpen: boolean;
};

const DEFAULT_BRANCHES: Branch[] = [
  {
    id: 'branch-1',
    name: 'Main Hospital',
    location: 'Ground Floor, Block A',
    isOpen: true,
    counters: [
      { id: 'c1', name: 'Main Counter', staffAssigned: 'Staff A', isOpen: true },
      { id: 'c2', name: 'Counter 2', staffAssigned: 'Staff B', isOpen: true },
      { id: 'c3', name: 'Counter 3', staffAssigned: '', isOpen: false },
    ],
  },
  {
    id: 'branch-2',
    name: 'OPD Wing',
    location: '1st Floor, East Wing',
    isOpen: true,
    counters: [
      { id: 'c4', name: 'OPD Counter', staffAssigned: 'Staff C', isOpen: true },
      { id: 'c5', name: 'IPD Desk', staffAssigned: 'Staff D', isOpen: true },
    ],
  },
  {
    id: 'branch-3',
    name: 'Emergency Wing',
    location: 'Ground Floor, Block B',
    isOpen: false,
    counters: [
      { id: 'c6', name: 'ER Registration', staffAssigned: '', isOpen: false },
    ],
  },
];

export function ReceptionBranches() {
  const [branches, setBranches] = useState<Branch[]>(() => loadJson<Branch[]>(BRANCHES_KEY, DEFAULT_BRANCHES));
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [showCounterForm, setShowCounterForm] = useState<string | null>(null);
  const [branchForm, setBranchForm] = useState({ name: '', location: '' });
  const [counterForm, setCounterForm] = useState({ name: '', staffAssigned: '' });

  const addBranch = () => {
    if (!branchForm.name.trim()) return;
    const newBranch: Branch = {
      id: `branch-${Date.now()}`,
      name: branchForm.name.trim(),
      location: branchForm.location.trim(),
      isOpen: true,
      counters: [],
    };
    const updated = [...branches, newBranch];
    setBranches(updated);
    saveJson(BRANCHES_KEY, updated);
    setBranchForm({ name: '', location: '' });
    setShowBranchForm(false);
    toast.success('Branch added');
  };

  const addCounter = (branchId: string) => {
    if (!counterForm.name.trim()) return;
    const newCounter: Counter = {
      id: `cnt-${Date.now()}`,
      name: counterForm.name.trim(),
      staffAssigned: counterForm.staffAssigned.trim(),
      isOpen: true,
    };
    const updated = branches.map(b => {
      if (b.id !== branchId) return b;
      return { ...b, counters: [...b.counters, newCounter] };
    });
    setBranches(updated);
    saveJson(BRANCHES_KEY, updated);
    setCounterForm({ name: '', staffAssigned: '' });
    setShowCounterForm(null);
    toast.success('Counter added');
  };

  const toggleBranch = (id: string) => {
    const updated = branches.map(b =>
      b.id === id ? { ...b, isOpen: !b.isOpen, counters: b.counters.map(c => ({ ...c, isOpen: !b.isOpen })) } : b
    );
    setBranches(updated);
    saveJson(BRANCHES_KEY, updated);
  };

  const toggleCounter = (branchId: string, counterId: string) => {
    const updated = branches.map(b =>
      b.id !== branchId ? b : {
        ...b,
        counters: b.counters.map(c => c.id === counterId ? { ...c, isOpen: !c.isOpen } : c),
      }
    );
    setBranches(updated);
    saveJson(BRANCHES_KEY, updated);
  };

  const openCounters = branches.reduce((s, b) => s + b.counters.filter(c => c.isOpen).length, 0);
  const totalCounters = branches.reduce((s, b) => s + b.counters.length, 0);
  const openBranches = branches.filter(b => b.isOpen).length;

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Branch &amp; Counter Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage multi-site front desk branches and counters. Toggle open/close status and assign staff.</p>
      </motion.div>
      <PreviewStrip />
      <QuickLinks />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold">Branches</span></div>
          <p className="text-2xl font-bold">{branches.length}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Store className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">Open Now</span></div>
          <p className="text-2xl font-bold">{openBranches}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Users className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Open Counters</span></div>
          <p className="text-2xl font-bold">{openCounters}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Total Counters</span></div>
          <p className="text-2xl font-bold">{totalCounters}</p>
        </CardContent></Card>
      </div>

      <div className="flex justify-end">
        <Button size="sm" className="gap-1" onClick={() => setShowBranchForm(!showBranchForm)}>
          <Building2 className="w-3.5 h-3.5" />Add Branch
        </Button>
      </div>

      {showBranchForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Branch name" value={branchForm.name} onChange={e => setBranchForm(f => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Location / address" value={branchForm.location} onChange={e => setBranchForm(f => ({ ...f, location: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowBranchForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addBranch}>Add Branch</Button>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {branches.map((branch, bi) => (
          <motion.div key={branch.id} {...fadeIn(bi)}>
            <Card className={`rounded-xl ${!branch.isOpen ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Building2 className="w-4 h-4 text-primary" />
                      <p className="text-sm font-semibold">{branch.name}</p>
                      {branch.location && <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{branch.location}</span>}
                      <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${branch.isOpen ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
                        {branch.isOpen ? 'Open' : 'Closed'}
                      </span>
                      <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{branch.counters.length} counter{branch.counters.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="outline" className={`h-7 text-[10px] ${branch.isOpen ? 'text-destructive' : 'text-emerald-600'}`} onClick={() => toggleBranch(branch.id)}>
                      {branch.isOpen ? <ToggleRight className="w-3 h-3 mr-1" /> : <ToggleLeft className="w-3 h-3 mr-1" />}
                      {branch.isOpen ? 'Close' : 'Open'}
                    </Button>
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">Counters</p>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setShowCounterForm(showCounterForm === branch.id ? null : branch.id)}>
                      <Plus className="w-3 h-3 mr-1" />Add Counter
                    </Button>
                  </div>

                  {showCounterForm === branch.id && (
                    <div className="flex gap-2 items-end p-2 rounded-lg bg-muted/30">
                      <Input placeholder="Counter name" className="h-8 text-xs" value={counterForm.name} onChange={e => setCounterForm(f => ({ ...f, name: e.target.value }))} />
                      <Input placeholder="Staff assigned" className="h-8 text-xs" value={counterForm.staffAssigned} onChange={e => setCounterForm(f => ({ ...f, staffAssigned: e.target.value }))} />
                      <Button size="sm" className="h-8 text-xs shrink-0" onClick={() => addCounter(branch.id)}>Add</Button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {branch.counters.map(counter => (
                      <div
                        key={counter.id}
                        className={`flex items-center justify-between rounded-lg border p-2.5 transition-colors ${counter.isOpen ? 'bg-card' : 'bg-muted/30 opacity-60'}`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium">{counter.name}</p>
                          <p className="text-[9px] text-muted-foreground">{counter.staffAssigned || 'Unassigned'}</p>
                        </div>
                        <button
                          onClick={() => toggleCounter(branch.id, counter.id)}
                          className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded transition-colors ${
                            counter.isOpen
                              ? 'bg-emerald-500/10 text-emerald-600 hover:bg-destructive/10 hover:text-destructive'
                              : 'bg-destructive/10 text-destructive hover:bg-emerald-500/10 hover:text-emerald-600'
                          }`}
                        >
                          {counter.isOpen ? 'Open' : 'Closed'}
                        </button>
                      </div>
                    ))}
                    {branch.counters.length === 0 && (
                      <p className="text-[10px] text-muted-foreground col-span-full py-2 text-center">No counters configured.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════
// 7. Quick Feedback Capture
// ════════════════════════════════════════════

const FEEDBACK_KEY = 'adrine_reception_feedback';

type FeedbackRecord = {
  id: string;
  patientName: string; uhid: string;
  serviceType: string;
  rating: number;
  comments: string;
  submittedAt: string;
  submittedBy: string;
};

const SERVICE_TYPES = ['Registration', 'Queue', 'Billing', 'IPD', 'OPD', 'Pharmacy', 'Lab', 'Overall Experience'];

export function ReceptionFeedback() {
  const [records, setRecords] = useState<FeedbackRecord[]>(() => loadJson<FeedbackRecord[]>(FEEDBACK_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientName: '', uhid: '', serviceType: 'Overall Experience',
    rating: 5, comments: '', submittedBy: '',
  });
  const [serviceFilter, setServiceFilter] = useState('all');

  const addRecord = () => {
    if (!form.patientName.trim()) return;
    const newRecord: FeedbackRecord = {
      ...form, id: crypto.randomUUID?.() ?? `${Date.now()}`,
      submittedAt: new Date().toLocaleString('en-IN'),
    };
    const updated = [newRecord, ...records];
    setRecords(updated);
    saveJson(FEEDBACK_KEY, updated);
    setForm({ patientName: '', uhid: '', serviceType: 'Overall Experience', rating: 5, comments: '', submittedBy: '' });
    setShowForm(false);
    toast.success('Feedback captured');
  };

  const avgRating = records.length > 0
    ? (records.reduce((s, r) => s + r.rating, 0) / records.length).toFixed(1)
    : '—';
  const totalFeedback = records.length;
  const todayFeedback = records.filter(r => r.submittedAt.startsWith(new Date().toLocaleDateString('en-IN'))).length;
  const fiveStarCount = records.filter(r => r.rating === 5).length;

  const filtered = useMemo(() => {
    if (serviceFilter === 'all') return records;
    return records.filter(r => r.serviceType === serviceFilter);
  }, [records, serviceFilter]);

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`}
      />
    ));
  };

  const distribution = SERVICE_TYPES.map(type => ({
    type,
    count: records.filter(r => r.serviceType === type).length,
    avg: records.filter(r => r.serviceType === type).length > 0
      ? (records.filter(r => r.serviceType === type).reduce((s, r) => s + r.rating, 0) / records.filter(r => r.serviceType === type).length).toFixed(1)
      : '—',
  }));

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Patient Feedback</h1>
        <p className="text-sm text-muted-foreground mt-1">Quick exit survey — capture patient satisfaction ratings across services.</p>
      </motion.div>
      <PreviewStrip />
      <QuickLinks />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2 text-amber-500">
            {getRatingStars(Math.round(Number(avgRating) || 0))}
          </div>
          <p className="text-2xl font-bold">{avgRating}</p>
          <p className="text-[10px] text-muted-foreground">Average rating</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold">Total Responses</span></div>
          <p className="text-2xl font-bold">{totalFeedback}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Responses Today</span></div>
          <p className="text-2xl font-bold">{todayFeedback}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><ThumbsUp className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">5-Star</span></div>
          <p className="text-2xl font-bold">{fiveStarCount}</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Rating by Service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {distribution.map(d => (
              <div key={d.type} className="flex items-center gap-2">
                <span className="text-[10px] w-28 shrink-0 text-muted-foreground">{d.type}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${d.count > 0 ? Math.min(100, (Number(d.avg) / 5) * 100) : 0}%` }}
                  />
                </div>
                <span className="text-[10px] w-12 text-right font-mono">{d.avg}{d.count > 0 ? ` (${d.count})` : ''}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Capture Feedback</CardTitle>
              <Button size="sm" className="h-7 text-[10px]" onClick={() => setShowForm(!showForm)}>
                <PenLine className="w-3 h-3 mr-1" />New Response
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showForm ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
                  <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.serviceType} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))}>
                    {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <Input placeholder="Submitted by" value={form.submittedBy} onChange={e => setForm(f => ({ ...f, submittedBy: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Rating</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, rating: n }))}
                        className={`p-2 rounded-lg transition-colors ${form.rating >= n ? 'text-amber-400 bg-amber-500/10' : 'text-muted-foreground/30 bg-muted'}`}
                      >
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
                <Textarea placeholder="Comments (optional)" rows={2} value={form.comments} onChange={e => setForm(f => ({ ...f, comments: e.target.value }))} />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button size="sm" onClick={addRecord}><Send className="w-3 h-3 mr-1" />Submit Feedback</Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-4 text-center">Click "New Response" to capture patient feedback at exit.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <select
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={serviceFilter}
          onChange={e => setServiceFilter(e.target.value)}
        >
          <option value="all">All services</option>
          {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <span className="text-[10px] text-muted-foreground">{filtered.length} response{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-2">
        {filtered.map(r => (
          <Card key={r.id} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex shrink-0">{getRatingStars(r.rating)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-medium">{r.patientName}</p>
                    {r.uhid && <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{r.uhid}</span>}
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{r.serviceType}</span>
                  </div>
                  {r.comments && <p className="text-[10px] text-muted-foreground mt-1">{r.comments}</p>}
                  <p className="text-[9px] text-muted-foreground mt-0.5">{r.submittedAt} · by {r.submittedBy || '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No feedback captured yet.</p>}
      </div>
    </motion.div>
  );
}
