import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Pill, PillBottle, ClipboardList, ClipboardCheck, FlaskConical,
  Thermometer, Barcode, CreditCard, AlertTriangle, AlertCircle,
  Search, Plus, Check, X, Clock, Calendar, User, FileText,
  IndianRupee, Printer, Download, RefreshCw, Eye, Edit3, Trash2,
  Shield, ShieldCheck, ShieldOff, FlaskRound, ThermometerSnowflake,
  ArrowUpDown, Filter, SlidersHorizontal, List, BookOpen,
  Beaker, TestTube, Syringe, Stethoscope, Activity, HeartPulse,
  Hospital, Building2, Package, PackageCheck, PackageX,
  CheckCircle2, XCircle, PenLine, Send, RotateCcw, BarChart3,
  ToggleLeft, ToggleRight, Users, FileSearch, Fingerprint,
  ScanLine, ScanBarcode, Speech, MessagesSquare, Hash,
  Tally1, Tally2, Tally3, Tally4, Tally5, Star, StarHalf,
  HelpCircle, Flag, ThumbsUp, Copy, Scissors, Wand2,
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

function QuickLinks({ links }: { links?: { label: string; path: string }[] }) {
  const navigate = useNavigate();
  const defaultLinks = [
    { label: 'Dashboard', path: '/pharmacy' },
    { label: 'Prescriptions', path: '/pharmacy/prescriptions' },
    { label: 'Drugs', path: '/pharmacy/drugs' },
    { label: 'Inventory', path: '/pharmacy/inventory' },
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
// 1. Formulary & Substitution Rules
// ════════════════════════════════════════════

const FORMULARY_KEY = 'adrine_pharmacy_formulary';

type FormularyStatus = 'active' | 'restricted' | 'non-formulary';

type FormularyDrug = {
  id: string;
  genericName: string;
  brandNames: string[];
  therapeuticCategory: string;
  dosageForm: string;
  strength: string;
  manufacturer: string;
  formularyStatus: FormularyStatus;
  tier: 1 | 2 | 3 | 4;
  priorAuthRequired: boolean;
  substitutionAllowed: boolean;
  substituteGeneric: string;
  restrictionNotes: string;
  maxQtyPerRx: number;
  createdAt: string;
};

const THERAPEUTIC_CATEGORIES = [
  'Antibiotics', 'Antivirals', 'Antifungals', 'Cardiovascular', 'CNS',
  'Respiratory', 'GI', 'Endocrine', 'Pain Management', 'Psychiatric',
  'Oncology', 'Immunology', 'Dermatology', 'Ophthalmology', 'ENT',
  'Vitamins & Supplements', 'Electrolytes', 'Vaccines', 'Anaesthesia', 'Other',
];

const DOSAGE_FORMS = [
  'Tablet', 'Capsule', 'Injection', 'Syrup', 'Suspension', 'Cream',
  'Ointment', 'Eye Drops', 'Inhaler', 'Nebulization', 'IV Fluid',
  'Patch', 'Suppository', 'Lotion', 'Gel', 'Powder', 'Other',
];

export function PharmacyFormulary() {
  const [drugs, setDrugs] = useState<FormularyDrug[]>(() => loadJson<FormularyDrug[]>(FORMULARY_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    genericName: '', brandNameInput: '', therapeuticCategory: 'Other',
    dosageForm: 'Tablet', strength: '', manufacturer: '',
    formularyStatus: 'active' as FormularyStatus, tier: 2 as 1 | 2 | 3 | 4,
    priorAuthRequired: false, substitutionAllowed: true, substituteGeneric: '',
    restrictionNotes: '', maxQtyPerRx: 30,
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const addDrug = () => {
    if (!form.genericName.trim()) return;
    const brands = form.brandNameInput.split(',').map(b => b.trim()).filter(Boolean);
    const newDrug: FormularyDrug = {
      ...form,
      id: crypto.randomUUID?.() ?? `${Date.now()}`,
      brandNames: brands,
      brandNameInput: undefined as unknown as string,
      createdAt: new Date().toLocaleString('en-IN'),
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { brandNameInput, ...rest } = newDrug;
    const updated = [rest, ...drugs];
    setDrugs(updated);
    saveJson(FORMULARY_KEY, updated);
    setForm({ genericName: '', brandNameInput: '', therapeuticCategory: 'Other', dosageForm: 'Tablet', strength: '', manufacturer: '', formularyStatus: 'active', tier: 2, priorAuthRequired: false, substitutionAllowed: true, substituteGeneric: '', restrictionNotes: '', maxQtyPerRx: 30 });
    setShowForm(false);
    toast.success('Formulary drug added');
  };

  const updateStatus = (id: string, status: FormularyStatus) => {
    const updated = drugs.map(d => d.id === id ? { ...d, formularyStatus: status } : d);
    setDrugs(updated);
    saveJson(FORMULARY_KEY, updated);
    toast.success(`Status changed to ${status}`);
  };

  const activeCount = drugs.filter(d => d.formularyStatus === 'active').length;
  const restrictedCount = drugs.filter(d => d.formularyStatus === 'restricted').length;
  const nonFormularyCount = drugs.filter(d => d.formularyStatus === 'non-formulary').length;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return drugs.filter(d => {
      if (statusFilter !== 'all' && d.formularyStatus !== statusFilter) return false;
      if (categoryFilter !== 'all' && d.therapeuticCategory !== categoryFilter) return false;
      return d.genericName.toLowerCase().includes(q) ||
        d.brandNames.some(b => b.toLowerCase().includes(q)) ||
        d.manufacturer.toLowerCase().includes(q);
    });
  }, [drugs, search, statusFilter, categoryFilter]);

  const statusIcon = (s: FormularyStatus) => {
    if (s === 'active') return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
    if (s === 'restricted') return <Shield className="w-4 h-4 text-amber-600" />;
    return <ShieldOff className="w-4 h-4 text-destructive" />;
  };

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Formulary &amp; Substitution Rules</h1>
        <p className="text-sm text-muted-foreground mt-1">Master drug formulary with therapeutic categorization, substitution rules, formulary tiering, and prior-authorization management.</p>
      </motion.div>
      <PreviewStrip />
      <QuickLinks />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">Active</span></div>
          <p className="text-2xl font-bold">{activeCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Restricted</span></div>
          <p className="text-2xl font-bold">{restrictedCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><ShieldOff className="w-4 h-4 text-destructive" /><span className="text-sm font-semibold">Non-Formulary</span></div>
          <p className="text-2xl font-bold">{nonFormularyCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Pill className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Total Drugs</span></div>
          <p className="text-2xl font-bold">{drugs.length}</p>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by generic/brand/manufacturer..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="restricted">Restricted</option>
          <option value="non-formulary">Non-Formulary</option>
        </select>
        <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="all">All categories</option>
          {THERAPEUTIC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <Button size="sm" className="gap-1 ml-auto" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />Add Formulary Drug</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Generic name" value={form.genericName} onChange={e => setForm(f => ({ ...f, genericName: e.target.value }))} />
            <Input placeholder="Brand names (comma-separated)" value={form.brandNameInput} onChange={e => setForm(f => ({ ...f, brandNameInput: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.therapeuticCategory} onChange={e => setForm(f => ({ ...f, therapeuticCategory: e.target.value }))}>
              {THERAPEUTIC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.dosageForm} onChange={e => setForm(f => ({ ...f, dosageForm: e.target.value }))}>
              {DOSAGE_FORMS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <Input placeholder="Strength (e.g. 500mg)" value={form.strength} onChange={e => setForm(f => ({ ...f, strength: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Manufacturer" value={form.manufacturer} onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))} />
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.tier} onChange={e => setForm(f => ({ ...f, tier: Number(e.target.value) as 1|2|3|4 }))}>
              <option value={1}>Tier 1 (Lowest copay)</option>
              <option value={2}>Tier 2 (Medium copay)</option>
              <option value={3}>Tier 3 (High copay)</option>
              <option value={4}>Tier 4 (Specialty)</option>
            </select>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Max Qty/Rx</Label>
              <Input type="number" min={1} value={form.maxQtyPerRx} onChange={e => setForm(f => ({ ...f, maxQtyPerRx: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.substitutionAllowed} onChange={e => setForm(f => ({ ...f, substitutionAllowed: e.target.checked }))} />Substitution allowed</label>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.priorAuthRequired} onChange={e => setForm(f => ({ ...f, priorAuthRequired: e.target.checked }))} />Prior auth required</label>
            {form.substitutionAllowed && (
              <Input placeholder="Substitute generic" className="flex-1 max-w-xs h-8 text-xs" value={form.substituteGeneric} onChange={e => setForm(f => ({ ...f, substituteGeneric: e.target.value }))} />
            )}
          </div>
          <Textarea placeholder="Restriction notes / criteria" rows={2} value={form.restrictionNotes} onChange={e => setForm(f => ({ ...f, restrictionNotes: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addDrug}>Add to Formulary</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map(d => (
          <Card key={d.id} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {statusIcon(d.formularyStatus)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{d.genericName}</p>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{d.strength}</span>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{d.dosageForm}</span>
                    <Badge variant={d.formularyStatus === 'active' ? 'default' : d.formularyStatus === 'restricted' ? 'secondary' : 'destructive'} className="text-[9px] h-4 px-1.5">
                      {d.formularyStatus}
                    </Badge>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">Tier {d.tier}</span>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{d.therapeuticCategory}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    {d.brandNames.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">Brands: {d.brandNames.join(', ')}</span>
                    )}
                    <span className="text-[10px] text-muted-foreground">· {d.manufacturer}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {d.substitutionAllowed && d.substituteGeneric && (
                      <span className="text-[10px] text-blue-600">Substitute: {d.substituteGeneric}</span>
                    )}
                    {d.priorAuthRequired && (
                      <span className="text-[10px] text-amber-600 font-semibold">Prior auth required</span>
                    )}
                    <span className="text-[10px] text-muted-foreground">Max: {d.maxQtyPerRx} per Rx</span>
                  </div>
                  {d.restrictionNotes && <p className="text-[10px] text-muted-foreground mt-0.5">{d.restrictionNotes}</p>}
                  <p className="text-[9px] text-muted-foreground mt-0.5">Added: {d.createdAt}</p>
                </div>
                <select
                  className="h-7 text-[10px] rounded-md border border-input bg-background px-2"
                  value={d.formularyStatus}
                  onChange={e => updateStatus(d.id, e.target.value as FormularyStatus)}
                >
                  <option value="active">Active</option>
                  <option value="restricted">Restricted</option>
                  <option value="non-formulary">Non-Formulary</option>
                </select>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No formulary drugs yet. Add your first drug above.</p>}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════
// 2. IPD Ward Indent / Floor Stock
// ════════════════════════════════════════════

const INDENT_KEY = 'adrine_pharmacy_indent';

type IndentItem = {
  drugName: string;
  strength: string;
  dosageForm: string;
  qtyRequested: number;
  qtyApproved: number;
  qtyIssued: number;
};

type IndentRecord = {
  id: string;
  wardName: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'partial' | 'issued' | 'rejected';
  items: IndentItem[];
  notes: string;
  approvedBy: string;
  approvedAt: string;
};

const WARDS = ['General Ward', 'ICU', 'NICU', 'PICU', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Surgery', 'Gynecology', 'Oncology', 'Emergency', 'OPD'];

export function PharmacyIndent() {
  const [records, setRecords] = useState<IndentRecord[]>(() => loadJson<IndentRecord[]>(INDENT_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    wardName: 'General Ward', requestedBy: '', notes: '',
    itemDrug: '', itemStrength: '', itemForm: 'Tablet', itemQty: 10,
    items: [] as IndentItem[],
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const addItemToList = () => {
    if (!form.itemDrug.trim() || form.itemQty < 1) return;
    const newItem: IndentItem = {
      drugName: form.itemDrug.trim(),
      strength: form.itemStrength.trim(),
      dosageForm: form.itemForm,
      qtyRequested: form.itemQty,
      qtyApproved: 0,
      qtyIssued: 0,
    };
    setForm(f => ({ ...f, items: [...f.items, newItem], itemDrug: '', itemStrength: '', itemQty: 10 }));
  };

  const removeItem = (idx: number) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const submitIndent = () => {
    if (!form.requestedBy.trim() || form.items.length === 0) return;
    const newRecord: IndentRecord = {
      id: crypto.randomUUID?.() ?? `${Date.now()}`,
      wardName: form.wardName,
      requestedBy: form.requestedBy.trim(),
      requestedAt: new Date().toLocaleString('en-IN'),
      status: 'pending',
      items: [...form.items],
      notes: form.notes,
      approvedBy: '',
      approvedAt: '',
    };
    const updated = [newRecord, ...records];
    setRecords(updated);
    saveJson(INDENT_KEY, updated);
    setForm({ wardName: 'General Ward', requestedBy: '', notes: '', itemDrug: '', itemStrength: '', itemForm: 'Tablet', itemQty: 10, items: [] });
    setShowForm(false);
    toast.success('Indent submitted');
  };

  const approveIndent = (id: string) => {
    const updated = records.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        status: 'approved' as const,
        approvedBy: 'Pharmacist',
        approvedAt: new Date().toLocaleString('en-IN'),
        items: r.items.map(i => ({ ...i, qtyApproved: i.qtyRequested })),
      };
    });
    setRecords(updated);
    saveJson(INDENT_KEY, updated);
    toast.success('Indent approved');
  };

  const issueIndent = (id: string) => {
    const updated = records.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        status: 'issued' as const,
        items: r.items.map(i => ({ ...i, qtyIssued: i.qtyApproved || i.qtyRequested })),
      };
    });
    setRecords(updated);
    saveJson(INDENT_KEY, updated);
    toast.success('Indent issued');
  };

  const pendingCount = records.filter(r => r.status === 'pending').length;
  const approvedToday = records.filter(r => r.status === 'approved' || r.status === 'issued').length;
  const totalItemsIndented = records.reduce((s, r) => s + r.items.reduce((s2, i) => s2 + i.qtyRequested, 0), 0);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return r.wardName.toLowerCase().includes(q) || r.requestedBy.toLowerCase().includes(q) || r.id.includes(q);
    });
  }, [records, search, statusFilter]);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { pending: 'bg-amber-500/10 text-amber-600', approved: 'bg-blue-500/10 text-blue-600', partial: 'bg-purple-500/10 text-purple-600', issued: 'bg-emerald-500/10 text-emerald-600', rejected: 'bg-destructive/10 text-destructive' };
    return map[s] || 'bg-muted text-muted-foreground';
  };

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">IPD Ward Indent / Floor Stock</h1>
        <p className="text-sm text-muted-foreground mt-1">Ward-level medication requisitions, approval workflow, and issue tracking for floor stock and patient-specific supplies.</p>
      </motion.div>
      <PreviewStrip />
      <QuickLinks />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Pending</span></div>
          <p className="text-2xl font-bold">{pendingCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">Approved/Issued</span></div>
          <p className="text-2xl font-bold">{approvedToday}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Package className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold">Total Items</span></div>
          <p className="text-2xl font-bold">{totalItemsIndented}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Indents</span></div>
          <p className="text-2xl font-bold">{records.length}</p>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search ward/requestor..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="issued">Issued</option>
          <option value="rejected">Rejected</option>
        </select>
        <Button size="sm" className="gap-1 ml-auto" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />New Indent</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.wardName} onChange={e => setForm(f => ({ ...f, wardName: e.target.value }))}>
              {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <Input placeholder="Requested by" value={form.requestedBy} onChange={e => setForm(f => ({ ...f, requestedBy: e.target.value }))} />
          </div>

          <Separator />
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Add Items</p>
          <div className="grid grid-cols-4 gap-2">
            <Input placeholder="Drug name" className="text-xs" value={form.itemDrug} onChange={e => setForm(f => ({ ...f, itemDrug: e.target.value }))} />
            <Input placeholder="Strength" className="text-xs" value={form.itemStrength} onChange={e => setForm(f => ({ ...f, itemStrength: e.target.value }))} />
            <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-xs" value={form.itemForm} onChange={e => setForm(f => ({ ...f, itemForm: e.target.value }))}>
              {DOSAGE_FORMS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <div className="flex gap-1">
              <Input type="number" min={1} className="text-xs" value={form.itemQty} onChange={e => setForm(f => ({ ...f, itemQty: Number(e.target.value) }))} />
              <Button size="sm" className="h-10 shrink-0" onClick={addItemToList}><Plus className="w-3 h-3" /></Button>
            </div>
          </div>

          {form.items.length > 0 && (
            <div className="space-y-1">
              {form.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-1.5 text-xs">
                  <span className="font-medium">{item.drugName}</span>
                  {item.strength && <span className="text-muted-foreground">{item.strength}</span>}
                  <span className="text-muted-foreground">{item.dosageForm}</span>
                  <span className="ml-auto font-semibold">Qty: {item.qtyRequested}</span>
                  <button onClick={() => removeItem(idx)} className="text-destructive hover:text-destructive/80"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}

          <Textarea placeholder="Notes for pharmacy" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={submitIndent} disabled={form.items.length === 0}>Submit Indent</Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {filtered.map(r => (
          <Card key={r.id} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Package className={`w-4 h-4 mt-0.5 shrink-0 ${r.status === 'pending' ? 'text-amber-500' : r.status === 'rejected' ? 'text-destructive' : 'text-emerald-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold">{r.wardName}</p>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusBadge(r.status)}`}>{r.status}</span>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{r.items.length} item{r.items.length !== 1 ? 's' : ''}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">by {r.requestedBy} · {r.requestedAt}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mt-2">
                    {r.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1 bg-muted/30 rounded px-2 py-1 text-[9px]">
                        <span className="font-medium truncate">{item.drugName}</span>
                        <span className="text-muted-foreground shrink-0">x{item.qtyRequested}</span>
                      </div>
                    ))}
                  </div>
                  {r.approvedBy && <p className="text-[9px] text-muted-foreground mt-1">Approved by {r.approvedBy} · {r.approvedAt}</p>}
                  {r.notes && <p className="text-[10px] text-muted-foreground mt-1">{r.notes}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  {r.status === 'pending' && (
                    <>
                      <Button size="sm" className="h-7 text-[10px]" onClick={() => approveIndent(r.id)}><Check className="w-3 h-3 mr-1" />Approve</Button>
                      <Button size="sm" variant="outline" className="h-7 text-[10px] text-destructive" onClick={() => {
                        const updated = records.map(x => x.id === r.id ? { ...x, status: 'rejected' as const } : x);
                        setRecords(updated);
                        saveJson(INDENT_KEY, updated);
                        toast.success('Indent rejected');
                      }}><X className="w-3 h-3 mr-1" />Reject</Button>
                    </>
                  )}
                  {r.status === 'approved' && (
                    <Button size="sm" className="h-7 text-[10px]" onClick={() => issueIndent(r.id)}><PackageCheck className="w-3 h-3 mr-1" />Issue</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No indents yet.</p>}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════
// 3. Returns & Credit Notes
// ════════════════════════════════════════════

const RETURNS_KEY = 'adrine_pharmacy_returns';

type ReturnRecord = {
  id: string;
  returnDate: string;
  source: 'Patient' | 'Ward' | 'Supplier';
  patientName: string;
  uhid: string;
  wardName: string;
  drugName: string;
  strength: string;
  batchNo: string;
  expiryDate: string;
  qtyReturned: number;
  unitPrice: number;
  totalAmount: number;
  reason: string;
  condition: 'sealed' | 'opened' | 'damaged' | 'expired';
  restocked: boolean;
  creditNoteNo: string;
  notes: string;
  processedBy: string;
};

const RETURN_REASONS = [
  'Patient discharged', 'Medication changed', 'Doctor cancelled',
  'Over-supplied', 'Wrong drug dispensed', 'Expired stock',
  'Damaged packaging', 'Supplier recall', 'Cold chain breach',
  'Patient expired', 'Treatment protocol changed', 'Other',
];

const SOURCES = ['Patient', 'Ward', 'Supplier'];

export function PharmacyReturns() {
  const [records, setRecords] = useState<ReturnRecord[]>(() => loadJson<ReturnRecord[]>(RETURNS_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    source: 'Patient' as ReturnRecord['source'],
    patientName: '', uhid: '', wardName: '',
    drugName: '', strength: '', batchNo: '', expiryDate: '',
    qtyReturned: 1, unitPrice: 0, reason: 'Medication changed',
    condition: 'sealed' as ReturnRecord['condition'],
    restocked: true, creditNoteNo: '', notes: '', processedBy: '',
  });
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');

  const addReturn = () => {
    if (!form.drugName.trim()) return;
    const newRecord: ReturnRecord = {
      ...form,
      id: crypto.randomUUID?.() ?? `${Date.now()}`,
      returnDate: new Date().toLocaleString('en-IN'),
      totalAmount: form.qtyReturned * form.unitPrice,
    };
    const updated = [newRecord, ...records];
    setRecords(updated);
    saveJson(RETURNS_KEY, updated);
    setForm({ source: 'Patient', patientName: '', uhid: '', wardName: '', drugName: '', strength: '', batchNo: '', expiryDate: '', qtyReturned: 1, unitPrice: 0, reason: 'Medication changed', condition: 'sealed', restocked: true, creditNoteNo: '', notes: '', processedBy: '' });
    setShowForm(false);
    toast.success('Return recorded');
  };

  const toggleRestocked = (id: string) => {
    const updated = records.map(r => r.id === id ? { ...r, restocked: !r.restocked } : r);
    setRecords(updated);
    saveJson(RETURNS_KEY, updated);
  };

  const returnedValue = records.reduce((s, r) => s + r.totalAmount, 0);
  const restockedCount = records.filter(r => r.restocked).length;
  const damagedCount = records.filter(r => r.condition === 'damaged').length;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter(r => {
      if (sourceFilter !== 'all' && r.source !== sourceFilter) return false;
      if (conditionFilter !== 'all' && r.condition !== conditionFilter) return false;
      return r.drugName.toLowerCase().includes(q) || r.patientName.toLowerCase().includes(q) || r.batchNo.toLowerCase().includes(q) || r.creditNoteNo.includes(q);
    });
  }, [records, search, sourceFilter, conditionFilter]);

  const conditionBadge = (c: string) => {
    const map: Record<string, string> = { sealed: 'bg-emerald-500/10 text-emerald-600', opened: 'bg-amber-500/10 text-amber-600', damaged: 'bg-destructive/10 text-destructive', expired: 'bg-red-500/10 text-red-600' };
    return map[c] || 'bg-muted text-muted-foreground';
  };

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Returns &amp; Credit Notes</h1>
        <p className="text-sm text-muted-foreground mt-1">Track medication returns from patients, wards, and suppliers. Generate credit notes, manage restocking, and record disposal reasons.</p>
      </motion.div>
      <PreviewStrip />
      <QuickLinks />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><RotateCcw className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold">Return Value</span></div>
          <p className="text-2xl font-bold">₹{returnedValue.toLocaleString('en-IN')}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><PackageCheck className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">Restocked</span></div>
          <p className="text-2xl font-bold">{restockedCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" /><span className="text-sm font-semibold">Damaged</span></div>
          <p className="text-2xl font-bold">{damagedCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Total Returns</span></div>
          <p className="text-2xl font-bold">{records.length}</p>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search drug/patient/batch..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
          <option value="all">All sources</option>
          {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={conditionFilter} onChange={e => setConditionFilter(e.target.value)}>
          <option value="all">All conditions</option>
          <option value="sealed">Sealed</option>
          <option value="opened">Opened</option>
          <option value="damaged">Damaged</option>
          <option value="expired">Expired</option>
        </select>
        <Button size="sm" className="gap-1 ml-auto" onClick={() => setShowForm(!showForm)}><RotateCcw className="w-3.5 h-3.5" />Record Return</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-3 gap-2">
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value as ReturnRecord['source'] }))}>
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Input placeholder="Drug name" value={form.drugName} onChange={e => setForm(f => ({ ...f, drugName: e.target.value }))} />
            <Input placeholder="Strength" value={form.strength} onChange={e => setForm(f => ({ ...f, strength: e.target.value }))} />
            <Input placeholder="Batch no" value={form.batchNo} onChange={e => setForm(f => ({ ...f, batchNo: e.target.value }))} />
            <Input placeholder="Expiry date" type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Qty returned</Label>
              <Input type="number" min={1} value={form.qtyReturned} onChange={e => setForm(f => ({ ...f, qtyReturned: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Unit price (₹)</Label>
              <Input type="number" min={0} value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Total</Label>
              <Input type="number" readOnly value={(form.qtyReturned * form.unitPrice).toFixed(2)} className="bg-muted" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value as ReturnRecord['condition'] }))}>
              <option value="sealed">Sealed (intact)</option>
              <option value="opened">Opened</option>
              <option value="damaged">Damaged</option>
              <option value="expired">Expired</option>
            </select>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}>
              {RETURN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <Input placeholder="Credit note #" value={form.creditNoteNo} onChange={e => setForm(f => ({ ...f, creditNoteNo: e.target.value }))} />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.restocked} onChange={e => setForm(f => ({ ...f, restocked: e.target.checked }))} />Restock to inventory</label>
            <Input placeholder="Processed by" className="flex-1 max-w-xs h-8 text-xs" value={form.processedBy} onChange={e => setForm(f => ({ ...f, processedBy: e.target.value }))} />
          </div>
          <Textarea placeholder="Additional notes" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addReturn}>Record Return</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map(r => (
          <Card key={r.id} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <RotateCcw className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold">{r.drugName}</p>
                    {r.strength && <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{r.strength}</span>}
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${conditionBadge(r.condition)}`}>{r.condition}</span>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{r.source}</span>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{r.reason}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                    <span>Batch: {r.batchNo || '—'}</span>
                    <span>Qty: {r.qtyReturned}</span>
                    <span>Amount: ₹{r.totalAmount.toLocaleString('en-IN')}</span>
                    {r.creditNoteNo && <span>CN: {r.creditNoteNo}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[9px] text-muted-foreground">
                    {r.patientName && <span>{r.patientName}</span>}
                    {r.uhid && <span>{r.uhid}</span>}
                    {r.wardName && <span>{r.wardName}</span>}
                    <span>· {r.returnDate} · by {r.processedBy || '—'}</span>
                  </div>
                  {r.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{r.notes}</p>}
                </div>
                <button
                  onClick={() => toggleRestocked(r.id)}
                  className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded transition-colors shrink-0 ${r.restocked ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}
                >
                  {r.restocked ? 'Restocked' : 'Not Restocked'}
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No returns recorded yet.</p>}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════
// 4. Narcotics Register (Witnessed)
// ════════════════════════════════════════════

const NARCOTICS_KEY = 'adrine_pharmacy_narcotics';

type NarcoticRecord = {
  id: string;
  date: string;
  drugName: string;
  strength: string;
  dosageForm: string;
  batchNo: string;
  openingBalance: number;
  receivedQty: number;
  dispensedQty: number;
  closingBalance: number;
  patientName: string;
  uhid: string;
  ward: string;
  prescriptionNo: string;
  prescribingDoctor: string;
  administeringNurse: string;
  dispensedBy: string;
  witnessedBy: string;
  reason: string;
  disposalQty: number;
  disposalWitness: string;
  remarks: string;
};

export function PharmacyNarcotics() {
  const [records, setRecords] = useState<NarcoticRecord[]>(() => loadJson<NarcoticRecord[]>(NARCOTICS_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    drugName: '', strength: '', dosageForm: 'Injection', batchNo: '',
    openingBalance: 0, receivedQty: 0, dispensedQty: 0, closingBalance: 0,
    patientName: '', uhid: '', ward: '',
    prescriptionNo: '', prescribingDoctor: '', administeringNurse: '',
    dispensedBy: '', witnessedBy: '', reason: '', disposalQty: 0, disposalWitness: '', remarks: '',
  });
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('all');

  const addRecord = () => {
    if (!form.drugName.trim() || !form.patientName.trim()) return;
    const balance = form.openingBalance + form.receivedQty - form.dispensedQty - form.disposalQty;
    const newRecord: NarcoticRecord = {
      ...form,
      id: crypto.randomUUID?.() ?? `${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      closingBalance: balance,
    };
    const updated = [newRecord, ...records];
    setRecords(updated);
    saveJson(NARCOTICS_KEY, updated);
    setForm({ drugName: '', strength: '', dosageForm: 'Injection', batchNo: '', openingBalance: 0, receivedQty: 0, dispensedQty: 0, closingBalance: 0, patientName: '', uhid: '', ward: '', prescriptionNo: '', prescribingDoctor: '', administeringNurse: '', dispensedBy: '', witnessedBy: '', reason: '', disposalQty: 0, disposalWitness: '', remarks: '' });
    setShowForm(false);
    toast.success('Narcotics register entry added');
  };

  const totalDispensed = records.reduce((s, r) => s + r.dispensedQty, 0);
  const totalDisposed = records.reduce((s, r) => s + r.disposalQty, 0);
  const todayEntries = records.filter(r => r.date === new Date().toISOString().split('T')[0]).length;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter(r => r.drugName.toLowerCase().includes(q) || r.patientName.toLowerCase().includes(q) || r.batchNo.includes(q) || r.uhid.includes(q));
  }, [records, search]);

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Narcotics Register (Witnessed)</h1>
        <p className="text-sm text-muted-foreground mt-1">Drug Control Authority compliant controlled substance register with dual-witness signature, running balance, and disposal tracking.</p>
      </motion.div>
      <PreviewStrip />
      <QuickLinks />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-destructive" /><span className="text-sm font-semibold">Total Dispensed</span></div>
          <p className="text-2xl font-bold">{totalDispensed}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Trash2 className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Total Disposed</span></div>
          <p className="text-2xl font-bold">{totalDisposed}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold">Today</span></div>
          <p className="text-2xl font-bold">{todayEntries}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Total Entries</span></div>
          <p className="text-2xl font-bold">{records.length}</p>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search drug/patient/batch..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button size="sm" className="gap-1 ml-auto" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />New Entry</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed border-destructive/30">
          <Alert className="py-2 text-[10px]"><AlertTriangle className="w-3 h-3" /><AlertTitle className="text-[10px]">Controlled Substance</AlertTitle><AlertDescription className="text-[10px]">All entries require dual witness verification.</AlertDescription></Alert>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Drug name" value={form.drugName} onChange={e => setForm(f => ({ ...f, drugName: e.target.value }))} />
            <Input placeholder="Strength" value={form.strength} onChange={e => setForm(f => ({ ...f, strength: e.target.value }))} />
            <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.dosageForm} onChange={e => setForm(f => ({ ...f, dosageForm: e.target.value }))}>
              {DOSAGE_FORMS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Batch number" value={form.batchNo} onChange={e => setForm(f => ({ ...f, batchNo: e.target.value }))} />
            <Input placeholder="Prescription #" value={form.prescriptionNo} onChange={e => setForm(f => ({ ...f, prescriptionNo: e.target.value }))} />
            <Input placeholder="Ward" value={form.ward} onChange={e => setForm(f => ({ ...f, ward: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Opening</Label><Input type="number" min={0} value={form.openingBalance} onChange={e => setForm(f => ({ ...f, openingBalance: Number(e.target.value) }))} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Received</Label><Input type="number" min={0} value={form.receivedQty} onChange={e => setForm(f => ({ ...f, receivedQty: Number(e.target.value) }))} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Dispensed</Label><Input type="number" min={0} value={form.dispensedQty} onChange={e => setForm(f => ({ ...f, dispensedQty: Number(e.target.value) }))} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Disposed</Label><Input type="number" min={0} value={form.disposalQty} onChange={e => setForm(f => ({ ...f, disposalQty: Number(e.target.value) }))} /></div>
          </div>
          <p className="text-[10px] font-semibold">Closing Balance: {form.openingBalance + form.receivedQty - form.dispensedQty - form.disposalQty}</p>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Prescribing doctor" value={form.prescribingDoctor} onChange={e => setForm(f => ({ ...f, prescribingDoctor: e.target.value }))} />
            <Input placeholder="Administering nurse" value={form.administeringNurse} onChange={e => setForm(f => ({ ...f, administeringNurse: e.target.value }))} />
            <Input placeholder="Reason for use" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Dispensed by (Signature)</Label>
              <Input placeholder="Dispensed by" value={form.dispensedBy} onChange={e => setForm(f => ({ ...f, dispensedBy: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Witnessed by (Signature)</Label>
              <Input placeholder="Witness" value={form.witnessedBy} onChange={e => setForm(f => ({ ...f, witnessedBy: e.target.value }))} />
            </div>
          </div>
          {form.disposalQty > 0 && (
            <Input placeholder="Disposal witness" value={form.disposalWitness} onChange={e => setForm(f => ({ ...f, disposalWitness: e.target.value }))} />
          )}
          <Textarea placeholder="Remarks" rows={2} value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addRecord}><Shield className="w-3 h-3 mr-1" />Add Entry</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map(r => (
          <Card key={r.id} className="rounded-xl border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 mt-0.5 shrink-0 text-destructive" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold">{r.drugName}</p>
                    {r.strength && <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{r.strength}</span>}
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{r.dosageForm}</span>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">Batch: {r.batchNo || '—'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 mt-1">
                    <div className="flex gap-3 text-[10px] text-muted-foreground">
                      <span>Op: {r.openingBalance}</span>
                      <span>Rec: {r.receivedQty}</span>
                      <span>Disp: {r.dispensedQty}</span>
                      <span>Disp: {r.disposalQty}</span>
                      <span className="font-semibold text-foreground">Cl: {r.closingBalance}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Patient: {r.patientName} · Dr. {r.prescribingDoctor || '—'}</p>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground mt-0.5">
                    <span>Dispensed: {r.dispensedBy || '—'}</span>
                    <span>Witnessed: {r.witnessedBy || '—'}</span>
                    <span>· {r.date}</span>
                  </div>
                  {r.remarks && <p className="text-[10px] text-muted-foreground mt-0.5">{r.remarks}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No narcotics register entries yet.</p>}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════
// 5. Expiry Quarantine & Destruction Log
// ════════════════════════════════════════════

const EXPIRY_KEY = 'adrine_pharmacy_expiry';

type ExpiryRecord = {
  id: string;
  drugName: string;
  strength: string;
  batchNo: string;
  mfgDate: string;
  expiryDate: string;
  qtyQuarantined: number;
  unit: string;
  supplier: string;
  quarantineDate: string;
  daysUntilExpiry: number;
  action: 'return' | 'destroy' | 'donate' | 'awaiting';
  destructionDate: string;
  destructionMethod: string;
  destructionWitness: string;
  certificateNo: string;
  notes: string;
  status: 'quarantined' | 'destroyed' | 'returned' | 'donated';
};

const DESTRUCTION_METHODS = ['Incineration', 'Chemical degradation', 'Shredding', 'Landfill (encapsulated)', 'Return to supplier', 'Third-party disposal'];

export function PharmacyExpiry() {
  const [records, setRecords] = useState<ExpiryRecord[]>(() => loadJson<ExpiryRecord[]>(EXPIRY_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    drugName: '', strength: '', batchNo: '', mfgDate: '', expiryDate: '',
    qtyQuarantined: 1, unit: 'Tablets', supplier: '',
    daysUntilExpiry: 0, action: 'awaiting' as ExpiryRecord['action'],
    destructionDate: '', destructionMethod: 'Incineration',
    destructionWitness: '', certificateNo: '', notes: '',
    status: 'quarantined' as ExpiryRecord['status'],
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const addRecord = () => {
    if (!form.drugName.trim() || !form.batchNo.trim()) return;
    const days = form.expiryDate ? Math.ceil((new Date(form.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
    const newRecord: ExpiryRecord = {
      ...form,
      id: crypto.randomUUID?.() ?? `${Date.now()}`,
      quarantineDate: new Date().toLocaleString('en-IN'),
      daysUntilExpiry: days,
    };
    const updated = [newRecord, ...records];
    setRecords(updated);
    saveJson(EXPIRY_KEY, updated);
    setForm({ drugName: '', strength: '', batchNo: '', mfgDate: '', expiryDate: '', qtyQuarantined: 1, unit: 'Tablets', supplier: '', daysUntilExpiry: 0, action: 'awaiting', destructionDate: '', destructionMethod: 'Incineration', destructionWitness: '', certificateNo: '', notes: '', status: 'quarantined' });
    setShowForm(false);
    toast.success('Quarantine entry created');
  };

  const markDestroyed = (id: string) => {
    const updated = records.map(r => r.id === id ? {
      ...r,
      status: 'destroyed' as const,
      action: 'destroy' as const,
      destructionDate: new Date().toLocaleString('en-IN'),
    } : r);
    setRecords(updated);
    saveJson(EXPIRY_KEY, updated);
    toast.success('Marked as destroyed');
  };

  const quarantinedCount = records.filter(r => r.status === 'quarantined').length;
  const destroyedCount = records.filter(r => r.status === 'destroyed').length;
  const totalQty = records.reduce((s, r) => s + r.qtyQuarantined, 0);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return r.drugName.toLowerCase().includes(q) || r.batchNo.includes(q) || r.supplier.toLowerCase().includes(q);
    });
  }, [records, search, statusFilter]);

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Expiry Quarantine &amp; Destruction Log</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage near-expiry and expired stock quarantine, destruction tracking with witnessed disposal, and regulatory certificate documentation.</p>
      </motion.div>
      <PreviewStrip />
      <QuickLinks />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Quarantined</span></div>
          <p className="text-2xl font-bold">{quarantinedCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Trash2 className="w-4 h-4 text-destructive" /><span className="text-sm font-semibold">Destroyed</span></div>
          <p className="text-2xl font-bold">{destroyedCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><PackageX className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Total Qty</span></div>
          <p className="text-2xl font-bold">{totalQty}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Total Batches</span></div>
          <p className="text-2xl font-bold">{records.length}</p>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search drug/batch/supplier..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="quarantined">Quarantined</option>
          <option value="destroyed">Destroyed</option>
          <option value="returned">Returned</option>
          <option value="donated">Donated</option>
        </select>
        <Button size="sm" className="gap-1 ml-auto" onClick={() => setShowForm(!showForm)}><PackageX className="w-3.5 h-3.5" />Quarantine Batch</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed border-amber-500/30">
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Drug name" value={form.drugName} onChange={e => setForm(f => ({ ...f, drugName: e.target.value }))} />
            <Input placeholder="Strength" value={form.strength} onChange={e => setForm(f => ({ ...f, strength: e.target.value }))} />
            <Input placeholder="Batch number" value={form.batchNo} onChange={e => setForm(f => ({ ...f, batchNo: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Mfg date" type="date" value={form.mfgDate} onChange={e => setForm(f => ({ ...f, mfgDate: e.target.value }))} />
            <Input placeholder="Expiry date" type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
            <Input placeholder="Supplier" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Qty quarantined</Label><Input type="number" min={1} value={form.qtyQuarantined} onChange={e => setForm(f => ({ ...f, qtyQuarantined: Number(e.target.value) }))} /></div>
            <Input placeholder="Unit (e.g. Tablets, Vials)" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
            <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value as ExpiryRecord['action'] }))}>
              <option value="awaiting">Awaiting decision</option>
              <option value="return">Return to supplier</option>
              <option value="destroy">Destroy</option>
              <option value="donate">Donate</option>
            </select>
          </div>
          <Textarea placeholder="Quarantine notes" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addRecord}>Quarantine Batch</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map(r => {
          const days = r.expiryDate ? Math.ceil((new Date(r.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
          return (
            <Card key={r.id} className={`rounded-xl ${days < 0 ? 'border-destructive/30' : days < 30 ? 'border-amber-500/30' : ''} ${r.status === 'destroyed' ? 'opacity-70' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {r.status === 'destroyed' ? <Trash2 className="w-4 h-4 mt-0.5 shrink-0 text-destructive" /> : <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${days < 0 ? 'text-destructive' : 'text-amber-500'}`} />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-semibold">{r.drugName}</p>
                      {r.strength && <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{r.strength}</span>}
                      <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">Batch: {r.batchNo}</span>
                      <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${r.status === 'quarantined' ? 'bg-amber-500/10 text-amber-600' : r.status === 'destroyed' ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-600'}`}>{r.status}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${days < 0 ? 'bg-destructive/10 text-destructive' : days <= 30 ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                        {days < 0 ? `Expired ${Math.abs(days)}d ago` : `${days}d left`}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                      <span>Qty: {r.qtyQuarantined} {r.unit}</span>
                      <span>Supplier: {r.supplier || '—'}</span>
                      <span>Action: {r.action}</span>
                    </div>
                    {r.destructionDate && (
                      <p className="text-[10px] text-muted-foreground">Destroyed: {r.destructionDate} · {r.destructionMethod}{r.destructionWitness ? ` · Witness: ${r.destructionWitness}` : ''}</p>
                    )}
                    {r.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{r.notes}</p>}
                    <p className="text-[9px] text-muted-foreground mt-0.5">{r.quarantineDate}</p>
                  </div>
                  {r.status === 'quarantined' && (
                    <Button size="sm" variant="outline" className="h-7 text-[10px] shrink-0 text-destructive" onClick={() => markDestroyed(r.id)}>
                      <Trash2 className="w-3 h-3 mr-1" />Destroy
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No quarantined batches.</p>}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════
// 6. Dispense Audit Trail Viewer
// ════════════════════════════════════════════

const AUDIT_KEY = 'adrine_pharmacy_audit';

type AuditEntry = {
  id: string;
  timestamp: string;
  action: 'dispensed' | 'verified' | 'cancelled' | 'modified' | 'viewed';
  drugName: string;
  strength: string;
  qty: number;
  patientName: string;
  uhid: string;
  prescriptionNo: string;
  user: string;
  barcodeScanned: boolean;
  ipAddress: string;
  details: string;
};

const AUDIT_ACTIONS: AuditEntry['action'][] = ['dispensed', 'verified', 'cancelled', 'modified', 'viewed'];

const SEED_AUDIT: AuditEntry[] = [
  { id: 'audit-1', timestamp: new Date(Date.now() - 300000).toLocaleString('en-IN'), action: 'dispensed', drugName: 'Amoxicillin 500mg', strength: '500mg', qty: 10, patientName: 'Rajesh Kumar', uhid: 'UHID-001', prescriptionNo: 'RX-1001', user: 'Pharmacist A', barcodeScanned: true, ipAddress: '192.168.1.50', details: 'Dispensed via barcode scan' },
  { id: 'audit-2', timestamp: new Date(Date.now() - 600000).toLocaleString('en-IN'), action: 'verified', drugName: 'Paracetamol 650mg', strength: '650mg', qty: 6, patientName: 'Priya Sharma', uhid: 'UHID-042', prescriptionNo: 'RX-1002', user: 'Pharmacist B', barcodeScanned: true, ipAddress: '192.168.1.51', details: 'Verified by second pharmacist' },
  { id: 'audit-3', timestamp: new Date(Date.now() - 900000).toLocaleString('en-IN'), action: 'cancelled', drugName: 'Azithromycin 250mg', strength: '250mg', qty: 6, patientName: 'Amit Singh', uhid: 'UHID-018', prescriptionNo: 'RX-0983', user: 'Pharmacist A', barcodeScanned: false, ipAddress: '192.168.1.50', details: 'Cancelled - doctor changed prescription' },
];

export function PharmacyAuditTrail() {
  const [entries, setEntries] = useState<AuditEntry[]>(() => loadJson<AuditEntry[]>(AUDIT_KEY, SEED_AUDIT));
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return entries.filter(e => {
      if (actionFilter !== 'all' && e.action !== actionFilter) return false;
      return e.drugName.toLowerCase().includes(q) || e.patientName.toLowerCase().includes(q) || e.uhid.includes(q) || e.user.toLowerCase().includes(q) || e.prescriptionNo.toLowerCase().includes(q);
    });
  }, [entries, search, actionFilter]);

  const actionIcon = (a: string) => {
    const map: Record<string, { icon: typeof Eye; color: string }> = {
      dispensed: { icon: CheckCircle2, color: 'text-emerald-600' },
      verified: { icon: ShieldCheck, color: 'text-blue-600' },
      cancelled: { icon: XCircle, color: 'text-destructive' },
      modified: { icon: Edit3, color: 'text-amber-600' },
      viewed: { icon: Eye, color: 'text-muted-foreground' },
    };
    const m = map[a] || { icon: Eye, color: 'text-muted-foreground' };
    return { Icon: m.icon, color: m.color };
  };

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Dispense Audit Trail</h1>
        <p className="text-sm text-muted-foreground mt-1">Read-only chronological log of all dispensing actions — barcode-scanned, user-verified, and cancelled transactions with full traceability.</p>
      </motion.div>
      <PreviewStrip />
      <QuickLinks />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">Dispensed</span></div>
          <p className="text-2xl font-bold">{entries.filter(e => e.action === 'dispensed').length}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold">Verified</span></div>
          <p className="text-2xl font-bold">{entries.filter(e => e.action === 'verified').length}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><XCircle className="w-4 h-4 text-destructive" /><span className="text-sm font-semibold">Cancelled</span></div>
          <p className="text-2xl font-bold">{entries.filter(e => e.action === 'cancelled').length}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><FileSearch className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Total Events</span></div>
          <p className="text-2xl font-bold">{entries.length}</p>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search drug/patient/user..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
          <option value="all">All actions</option>
          {AUDIT_ACTIONS.map(a => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
        </select>
        <Button size="sm" variant="outline" className="gap-1 ml-auto" onClick={() => {
          setEntries(SEED_AUDIT);
          saveJson(AUDIT_KEY, SEED_AUDIT);
          toast.success('Sample data loaded');
        }}><RefreshCw className="w-3.5 h-3.5" />Load Samples</Button>
      </div>

      <div className="space-y-2">
        {filtered.map(e => {
          const { Icon, color } = actionIcon(e.action);
          return (
            <Card key={e.id} className="rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-semibold">{e.drugName}</p>
                      {e.strength && <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{e.strength}</span>}
                      <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${color.replace('text-', 'bg-')}/10 ${color}`}>{e.action}</span>
                      <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">Qty: {e.qty}</span>
                      {e.barcodeScanned && <span className="text-[9px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded">Barcode</span>}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      <span>{e.patientName}</span>
                      <span className="font-mono">{e.uhid}</span>
                      <span>Rx: {e.prescriptionNo}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{e.details}</p>
                    <div className="flex items-center gap-3 text-[9px] text-muted-foreground mt-0.5">
                      <span>{e.user}</span>
                      <span>{e.timestamp}</span>
                      <span>IP: {e.ipAddress}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No audit entries found.</p>}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════
// 7. Barcode Scan Dispense
// ════════════════════════════════════════════

const BARCODE_KEY = 'adrine_pharmacy_barcode_dispense';

type BarcodeDispense = {
  id: string;
  timestamp: string;
  barcode: string;
  drugName: string;
  strength: string;
  batchNo: string;
  expiryDate: string;
  patientName: string;
  uhid: string;
  prescriptionNo: string;
  qtyDispensed: number;
  status: 'verified' | 'mismatch' | 'pending';
  dispensedBy: string;
};

export function PharmacyBarcodeDispense() {
  const [records, setRecords] = useState<BarcodeDispense[]>(() => loadJson<BarcodeDispense[]>(BARCODE_KEY, []));
  const [barcodeInput, setBarcodeInput] = useState('');
  const [form, setForm] = useState({
    barcode: '', drugName: '', strength: '', batchNo: '', expiryDate: '',
    patientName: '', uhid: '', prescriptionNo: '', qtyDispensed: 1,
    dispensedBy: '',
  });
  const [showManual, setShowManual] = useState(false);
  const [search, setSearch] = useState('');

  const simulateScan = () => {
    if (!barcodeInput.trim()) return;
    // Simulate barcode lookup
    const code = barcodeInput.trim();
    setForm(f => ({
      ...f,
      barcode: code,
      drugName: code.startsWith('890') ? 'Amoxicillin 500mg' : code.startsWith('480') ? 'Paracetamol 650mg' : 'Unknown Drug',
      strength: code.startsWith('890') ? '500mg' : code.startsWith('480') ? '650mg' : '',
      batchNo: `BT-${Date.now().toString().slice(-6)}`,
      expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    }));
    toast.success('Barcode scanned');
    setBarcodeInput('');
  };

  const submitDispense = () => {
    if (!form.drugName.trim() || !form.patientName.trim()) return;
    const newRecord: BarcodeDispense = {
      ...form,
      id: crypto.randomUUID?.() ?? `${Date.now()}`,
      timestamp: new Date().toLocaleString('en-IN'),
      status: 'verified',
    };
    const updated = [newRecord, ...records];
    setRecords(updated);
    saveJson(BARCODE_KEY, updated);
    setForm({ barcode: '', drugName: '', strength: '', batchNo: '', expiryDate: '', patientName: '', uhid: '', prescriptionNo: '', qtyDispensed: 1, dispensedBy: '' });
    setShowManual(false);
    toast.success('Dispense recorded');
  };

  const todayCount = records.filter(r => r.timestamp.includes(new Date().toLocaleDateString('en-IN').split(',')[0])).length;
  const totalDispensed = records.reduce((s, r) => s + r.qtyDispensed, 0);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter(r => r.drugName.toLowerCase().includes(q) || r.patientName.toLowerCase().includes(q) || r.barcode.includes(q) || r.uhid.includes(q));
  }, [records, search]);

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Barcode Scan Dispense</h1>
        <p className="text-sm text-muted-foreground mt-1">Scan barcode to verify and dispense medication with patient-drug matching and batch validation.</p>
      </motion.div>
      <PreviewStrip />
      <QuickLinks />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><ScanBarcode className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">Scanned Today</span></div>
          <p className="text-2xl font-bold">{todayCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold">Verified</span></div>
          <p className="text-2xl font-bold">{records.filter(r => r.status === 'verified').length}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Package className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Total Units</span></div>
          <p className="text-2xl font-bold">{totalDispensed}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><ScanLine className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Total Scans</span></div>
          <p className="text-2xl font-bold">{records.length}</p>
        </CardContent></Card>
      </div>

      <Card className="rounded-xl border-2 border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <ScanBarcode className="w-8 h-8 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-semibold mb-1">Scan Medication Barcode</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Scan or type barcode..."
                  value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && simulateScan()}
                  className="font-mono"
                  autoFocus
                />
                <Button onClick={simulateScan}><ScanLine className="w-4 h-4 mr-1" />Scan</Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Enter 890... (India) or 480... (Japan) to simulate lookup</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {form.drugName && (
        <Card className="rounded-xl border-emerald-500/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold text-emerald-600">Barcode Resolved</span></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-[10px] uppercase text-muted-foreground">Drug</Label><p className="text-sm font-medium">{form.drugName}</p></div>
              <div><Label className="text-[10px] uppercase text-muted-foreground">Strength</Label><p className="text-sm">{form.strength || '—'}</p></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label className="text-[10px] uppercase text-muted-foreground">Batch</Label><p className="text-xs font-mono">{form.batchNo}</p></div>
              <div><Label className="text-[10px] uppercase text-muted-foreground">Expiry</Label><p className="text-xs">{form.expiryDate}</p></div>
              <Input placeholder="Qty to dispense" type="number" min={1} className="h-8 text-xs" value={form.qtyDispensed} onChange={e => setForm(f => ({ ...f, qtyDispensed: Number(e.target.value) }))} />
            </div>
            <Separator />
            <p className="text-[10px] font-semibold uppercase text-muted-foreground">Patient Details</p>
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Patient name" className="h-8 text-xs" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
              <Input placeholder="UHID" className="h-8 text-xs" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
              <Input placeholder="Prescription #" className="h-8 text-xs" value={form.prescriptionNo} onChange={e => setForm(f => ({ ...f, prescriptionNo: e.target.value }))} />
            </div>
            <Input placeholder="Dispensed by" className="h-8 text-xs" value={form.dispensedBy} onChange={e => setForm(f => ({ ...f, dispensedBy: e.target.value }))} />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setForm({ barcode: '', drugName: '', strength: '', batchNo: '', expiryDate: '', patientName: '', uhid: '', prescriptionNo: '', qtyDispensed: 1, dispensedBy: '' })}>Clear</Button>
              <Button size="sm" onClick={submitDispense}><Check className="w-3 h-3 mr-1" />Confirm Dispense</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search records..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map(r => (
          <Card key={r.id} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <ScanBarcode className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold">{r.drugName}</p>
                    {r.strength && <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{r.strength}</span>}
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600">{r.status}</span>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">Batch: {r.batchNo}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                    <span>{r.patientName} ({r.uhid})</span>
                    <span>Rx: {r.prescriptionNo}</span>
                    <span>Qty: {r.qtyDispensed}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{r.timestamp} · by {r.dispensedBy}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No dispense records yet. Scan a barcode above.</p>}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════
// 8. Patient Counseling Notes
// ════════════════════════════════════════════

const COUNSELING_KEY = 'adrine_pharmacy_counseling';

type CounselingRecord = {
  id: string;
  patientName: string;
  uhid: string;
  drugName: string;
  date: string;
  counselor: string;
  topics: string[];
  patientUnderstanding: 'excellent' | 'good' | 'fair' | 'poor';
  questionsAsked: string;
  response: string;
  followUpRequired: boolean;
  followUpDate: string;
  notes: string;
};

const COUNSELING_TOPICS = [
  'Dosage instructions', 'Side effects', 'Drug interactions',
  'Storage instructions', 'Dietary precautions', 'Missed dose',
  'Duration of therapy', 'Monitoring requirements', 'Refill instructions',
  'Lifestyle modifications', 'Special precautions', 'Other',
];

export function PharmacyCounseling() {
  const [records, setRecords] = useState<CounselingRecord[]>(() => loadJson<CounselingRecord[]>(COUNSELING_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientName: '', uhid: '', drugName: '', counselor: '',
    topics: [] as string[], patientUnderstanding: 'good' as CounselingRecord['patientUnderstanding'],
    questionsAsked: '', response: '', followUpRequired: false,
    followUpDate: '', notes: '',
  });
  const [search, setSearch] = useState('');

  const toggleTopic = (topic: string) => {
    setForm(f => ({
      ...f,
      topics: f.topics.includes(topic)
        ? f.topics.filter(t => t !== topic)
        : [...f.topics, topic],
    }));
  };

  const addRecord = () => {
    if (!form.patientName.trim() || !form.drugName.trim()) return;
    const newRecord: CounselingRecord = {
      ...form,
      id: crypto.randomUUID?.() ?? `${Date.now()}`,
      date: new Date().toLocaleString('en-IN'),
    };
    const updated = [newRecord, ...records];
    setRecords(updated);
    saveJson(COUNSELING_KEY, updated);
    setForm({ patientName: '', uhid: '', drugName: '', counselor: '', topics: [], patientUnderstanding: 'good', questionsAsked: '', response: '', followUpRequired: false, followUpDate: '', notes: '' });
    setShowForm(false);
    toast.success('Counseling note saved');
  };

  const understandingBadge = (u: string) => {
    const map: Record<string, string> = { excellent: 'bg-emerald-500/10 text-emerald-600', good: 'bg-blue-500/10 text-blue-600', fair: 'bg-amber-500/10 text-amber-600', poor: 'bg-destructive/10 text-destructive' };
    return map[u] || 'bg-muted text-muted-foreground';
  };

  const todayCount = records.filter(r => r.date.includes(new Date().toLocaleDateString('en-IN').split(',')[0])).length;
  const followUps = records.filter(r => r.followUpRequired).length;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter(r => r.patientName.toLowerCase().includes(q) || r.uhid.includes(q) || r.drugName.toLowerCase().includes(q) || r.counselor.toLowerCase().includes(q));
  }, [records, search]);

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Patient Counseling Notes</h1>
        <p className="text-sm text-muted-foreground mt-1">Document medication counseling sessions, patient understanding assessment, follow-up scheduling, and education records.</p>
      </motion.div>
      <PreviewStrip />
      <QuickLinks />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Speech className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold">Today</span></div>
          <p className="text-2xl font-bold">{todayCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Follow-ups</span></div>
          <p className="text-2xl font-bold">{followUps}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><ThumbsUp className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">Excellent/Good</span></div>
          <p className="text-2xl font-bold">{records.filter(r => r.patientUnderstanding === 'excellent' || r.patientUnderstanding === 'good').length}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><MessagesSquare className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Total Sessions</span></div>
          <p className="text-2xl font-bold">{records.length}</p>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search patient/drug/counselor..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button size="sm" className="gap-1 ml-auto" onClick={() => setShowForm(!showForm)}><Speech className="w-3.5 h-3.5" />New Counseling Note</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Drug/medication" value={form.drugName} onChange={e => setForm(f => ({ ...f, drugName: e.target.value }))} />
            <Input placeholder="Counselor name" value={form.counselor} onChange={e => setForm(f => ({ ...f, counselor: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-muted-foreground">Counseling Topics Covered</Label>
            <div className="flex flex-wrap gap-1.5">
              {COUNSELING_TOPICS.map(topic => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  className={`text-[10px] px-2 py-1 rounded-full transition-colors ${form.topics.includes(topic) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Patient Understanding</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.patientUnderstanding} onChange={e => setForm(f => ({ ...f, patientUnderstanding: e.target.value as CounselingRecord['patientUnderstanding'] }))}>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
            <div className="space-y-1 flex items-end pb-2">
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={form.followUpRequired} onChange={e => setForm(f => ({ ...f, followUpRequired: e.target.checked }))} />
                Follow-up required
              </label>
            </div>
          </div>
          {form.followUpRequired && (
            <Input placeholder="Follow-up date" type="date" value={form.followUpDate} onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))} />
          )}
          <Textarea placeholder="Questions asked by patient" rows={2} value={form.questionsAsked} onChange={e => setForm(f => ({ ...f, questionsAsked: e.target.value }))} />
          <Textarea placeholder="Counselor response" rows={2} value={form.response} onChange={e => setForm(f => ({ ...f, response: e.target.value }))} />
          <Textarea placeholder="Additional notes" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addRecord}>Save Note</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map(r => (
          <Card key={r.id} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Speech className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold">{r.patientName}</p>
                    {r.uhid && <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{r.uhid}</span>}
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{r.drugName}</span>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${understandingBadge(r.patientUnderstanding)}`}>{r.patientUnderstanding}</span>
                    {r.followUpRequired && <span className="text-[9px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded">Follow-up</span>}
                  </div>
                  {r.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {r.topics.map(t => <span key={t} className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{t}</span>)}
                    </div>
                  )}
                  {r.questionsAsked && <p className="text-[10px] text-muted-foreground mt-1">Q: {r.questionsAsked}</p>}
                  {r.response && <p className="text-[10px] text-muted-foreground">R: {r.response}</p>}
                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground mt-1">
                    <span>{r.counselor}</span>
                    <span>· {r.date}</span>
                    {r.followUpDate && <span>· Follow-up: {r.followUpDate}</span>}
                  </div>
                  {r.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{r.notes}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No counseling notes yet.</p>}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════
// 9. Refill Management
// ════════════════════════════════════════════

const REFILL_KEY = 'adrine_pharmacy_refills';

type RefillRecord = {
  id: string;
  patientName: string;
  uhid: string;
  drugName: string;
  strength: string;
  dosageForm: string;
  prescriptionNo: string;
  prescribingDoctor: string;
  totalRefills: number;
  refillsUsed: number;
  refillsRemaining: number;
  lastFillDate: string;
  nextDueDate: string;
  daysSupply: number;
  autoRefill: boolean;
  status: 'active' | 'due' | 'expired' | 'completed';
  notes: string;
  phone: string;
};

export function PharmacyRefills() {
  const [records, setRecords] = useState<RefillRecord[]>(() => loadJson<RefillRecord[]>(REFILL_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientName: '', uhid: '', drugName: '', strength: '', dosageForm: 'Tablet',
    prescriptionNo: '', prescribingDoctor: '', totalRefills: 3, refillsUsed: 0,
    lastFillDate: new Date().toISOString().split('T')[0], nextDueDate: '',
    daysSupply: 30, autoRefill: false, notes: '', phone: '',
    status: 'active' as RefillRecord['status'],
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const addRecord = () => {
    if (!form.patientName.trim() || !form.drugName.trim()) return;
    const remaining = form.totalRefills - form.refillsUsed;
    const newRecord: RefillRecord = {
      ...form,
      id: crypto.randomUUID?.() ?? `${Date.now()}`,
      refillsRemaining: remaining,
      nextDueDate: form.nextDueDate || new Date(Date.now() + form.daysSupply * 86400000).toISOString().split('T')[0],
      status: remaining <= 0 ? 'completed' : remaining > 0 ? 'active' : 'active',
    };
    const updated = [newRecord, ...records];
    setRecords(updated);
    saveJson(REFILL_KEY, updated);
    setForm({ patientName: '', uhid: '', drugName: '', strength: '', dosageForm: 'Tablet', prescriptionNo: '', prescribingDoctor: '', totalRefills: 3, refillsUsed: 0, lastFillDate: new Date().toISOString().split('T')[0], nextDueDate: '', daysSupply: 30, autoRefill: false, notes: '', phone: '', status: 'active' });
    setShowForm(false);
    toast.success('Refill record created');
  };

  const markFilled = (id: string) => {
    const updated = records.map(r => {
      if (r.id !== id) return r;
      const used = r.refillsUsed + 1;
      const remaining = r.totalRefills - used;
      return {
        ...r,
        refillsUsed: used,
        refillsRemaining: remaining,
        lastFillDate: new Date().toISOString().split('T')[0],
        nextDueDate: new Date(Date.now() + r.daysSupply * 86400000).toISOString().split('T')[0],
        status: remaining <= 0 ? 'completed' as const : 'active' as const,
      };
    });
    setRecords(updated);
    saveJson(REFILL_KEY, updated);
    toast.success('Refill marked as filled');
  };

  const toggleAutoRefill = (id: string) => {
    const updated = records.map(r => r.id === id ? { ...r, autoRefill: !r.autoRefill } : r);
    setRecords(updated);
    saveJson(REFILL_KEY, updated);
  };

  const dueCount = records.filter(r => r.status === 'active' && new Date(r.nextDueDate) <= new Date()).length;
  const activeCount = records.filter(r => r.status === 'active').length;
  const autoRefillCount = records.filter(r => r.autoRefill).length;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return r.patientName.toLowerCase().includes(q) || r.drugName.toLowerCase().includes(q) || r.uhid.includes(q);
    });
  }, [records, search, statusFilter]);

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Refill Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Prescription refill scheduling, auto-refill flagging, adherence tracking, and due-date alerts.</p>
      </motion.div>
      <PreviewStrip />
      <QuickLinks />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-destructive" /><span className="text-sm font-semibold">Due Now</span></div>
          <p className="text-2xl font-bold">{dueCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">Active</span></div>
          <p className="text-2xl font-bold">{activeCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold">Auto-Refill</span></div>
          <p className="text-2xl font-bold">{autoRefillCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Pill className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Total</span></div>
          <p className="text-2xl font-bold">{records.length}</p>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search patient/drug..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="due">Due</option>
          <option value="expired">Expired</option>
          <option value="completed">Completed</option>
        </select>
        <Button size="sm" className="gap-1 ml-auto" onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />New Refill Record</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Drug name" value={form.drugName} onChange={e => setForm(f => ({ ...f, drugName: e.target.value }))} />
            <Input placeholder="Strength" value={form.strength} onChange={e => setForm(f => ({ ...f, strength: e.target.value }))} />
            <Input placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Prescription #" value={form.prescriptionNo} onChange={e => setForm(f => ({ ...f, prescriptionNo: e.target.value }))} />
            <Input placeholder="Prescribing doctor" value={form.prescribingDoctor} onChange={e => setForm(f => ({ ...f, prescribingDoctor: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Total Refills</Label><Input type="number" min={0} value={form.totalRefills} onChange={e => setForm(f => ({ ...f, totalRefills: Number(e.target.value) }))} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Used</Label><Input type="number" min={0} value={form.refillsUsed} onChange={e => setForm(f => ({ ...f, refillsUsed: Number(e.target.value) }))} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Day Supply</Label><Input type="number" min={1} value={form.daysSupply} onChange={e => setForm(f => ({ ...f, daysSupply: Number(e.target.value) }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Next due date" type="date" value={form.nextDueDate} onChange={e => setForm(f => ({ ...f, nextDueDate: e.target.value }))} />
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.autoRefill} onChange={e => setForm(f => ({ ...f, autoRefill: e.target.checked }))} />Auto-refill enabled</label>
            </div>
          </div>
          <Textarea placeholder="Notes" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addRecord}>Create Record</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map(r => {
          const isDue = r.status === 'active' && new Date(r.nextDueDate) <= new Date();
          return (
            <Card key={r.id} className={`rounded-xl ${isDue ? 'border-destructive/20' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Pill className={`w-4 h-4 mt-0.5 shrink-0 ${isDue ? 'text-destructive' : r.status === 'completed' ? 'text-muted-foreground' : 'text-emerald-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-semibold">{r.patientName}</p>
                      <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{r.uhid}</span>
                      <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{r.drugName} {r.strength}</span>
                      <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${isDue ? 'bg-destructive/10 text-destructive' : r.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : r.status === 'completed' ? 'bg-blue-500/10 text-blue-600' : 'bg-muted text-muted-foreground'}`}>{isDue ? 'Due' : r.status}</span>
                      {r.autoRefill && <span className="text-[9px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded">Auto</span>}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                      <span>Refills: {r.refillsUsed}/{r.totalRefills}</span>
                      <span>Last: {r.lastFillDate || '—'}</span>
                      <span>Next due: {r.nextDueDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                      <span>Rx: {r.prescriptionNo} · Dr. {r.prescribingDoctor}</span>
                    </div>
                    {r.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{r.notes}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {r.status === 'active' && (
                      <Button size="sm" className="h-7 text-[10px]" onClick={() => markFilled(r.id)}><Check className="w-3 h-3 mr-1" />Fill</Button>
                    )}
                    <button
                      onClick={() => toggleAutoRefill(r.id)}
                      className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded transition-colors ${r.autoRefill ? 'bg-blue-500/10 text-blue-600' : 'bg-muted text-muted-foreground'}`}
                    >
                      {r.autoRefill ? 'Auto On' : 'Auto Off'}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No refill records yet.</p>}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════
// 10. Compounding / IV Admixture
// ════════════════════════════════════════════

const COMPOUNDING_KEY = 'adrine_pharmacy_compounding';

type CompoundingOrder = {
  id: string;
  orderDate: string;
  patientName: string;
  uhid: string;
  ward: string;
  productName: string;
  ingredients: { name: string; qty: string }[];
  totalVolume: string;
  diluent: string;
  route: 'IV' | 'IM' | 'SC' | 'oral' | 'topical' | 'other';
  rate: string;
  preparedBy: string;
  checkedBy: string;
  preparationDate: string;
  expiryDateTime: string;
  storageCondition: string;
  status: 'ordered' | 'prepared' | 'checked' | 'dispensed' | 'cancelled';
  batchNo: string;
  notes: string;
};

export function PharmacyCompounding() {
  const [orders, setOrders] = useState<CompoundingOrder[]>(() => loadJson<CompoundingOrder[]>(COMPOUNDING_KEY, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientName: '', uhid: '', ward: '', productName: '',
    ingredientName: '', ingredientQty: '', ingredients: [] as { name: string; qty: string }[],
    totalVolume: '', diluent: '', route: 'IV' as CompoundingOrder['route'],
    rate: '', preparedBy: '', checkedBy: '', storageCondition: '2-8°C',
    status: 'ordered' as CompoundingOrder['status'],
    batchNo: `CM-${Date.now().toString().slice(-6)}`, notes: '',
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const addIngredient = () => {
    if (!form.ingredientName.trim() || !form.ingredientQty.trim()) return;
    setForm(f => ({
      ...f,
      ingredients: [...f.ingredients, { name: f.ingredientName.trim(), qty: f.ingredientQty.trim() }],
      ingredientName: '', ingredientQty: '',
    }));
  };

  const removeIngredient = (idx: number) => {
    setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, i) => i !== idx) }));
  };

  const addOrder = () => {
    if (!form.patientName.trim() || !form.productName.trim() || form.ingredients.length === 0) return;
    const newOrder: CompoundingOrder = {
      ...form,
      id: crypto.randomUUID?.() ?? `${Date.now()}`,
      orderDate: new Date().toLocaleString('en-IN'),
      preparationDate: new Date().toISOString().split('T')[0],
      expiryDateTime: new Date(Date.now() + 24 * 3600000).toISOString(),
    };
    const updated = [newOrder, ...orders];
    setOrders(updated);
    saveJson(COMPOUNDING_KEY, updated);
    setForm({ patientName: '', uhid: '', ward: '', productName: '', ingredientName: '', ingredientQty: '', ingredients: [], totalVolume: '', diluent: '', route: 'IV', rate: '', preparedBy: '', checkedBy: '', storageCondition: '2-8°C', status: 'ordered', batchNo: `CM-${Date.now().toString().slice(-6)}`, notes: '' });
    setShowForm(false);
    toast.success('Compounding order created');
  };

  const updateStatus = (id: string, status: CompoundingOrder['status']) => {
    const updated = orders.map(o => o.id === id ? { ...o, status } : o);
    setOrders(updated);
    saveJson(COMPOUNDING_KEY, updated);
    toast.success(`Status: ${status}`);
  };

  const pending = orders.filter(o => o.status === 'ordered' || o.status === 'prepared').length;
  const prepared = orders.filter(o => o.status === 'prepared' || o.status === 'checked' || o.status === 'dispensed').length;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter(o => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      return o.patientName.toLowerCase().includes(q) || o.productName.toLowerCase().includes(q) || o.batchNo.includes(q);
    });
  }, [orders, search, statusFilter]);

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Compounding / IV Admixture</h1>
        <p className="text-sm text-muted-foreground mt-1">Sterile compounding orders, master formulation records, ingredient tracking, batch preparation, and expiration dating.</p>
      </motion.div>
      <PreviewStrip />
      <QuickLinks />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Pending</span></div>
          <p className="text-2xl font-bold">{pending}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><FlaskConical className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">Prepared</span></div>
          <p className="text-2xl font-bold">{prepared}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Beaker className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold">Total Batches</span></div>
          <p className="text-2xl font-bold">{orders.length}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><FlaskRound className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Dispensed</span></div>
          <p className="text-2xl font-bold">{orders.filter(o => o.status === 'dispensed').length}</p>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search patient/product/batch..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="ordered">Ordered</option>
          <option value="prepared">Prepared</option>
          <option value="checked">Checked</option>
          <option value="dispensed">Dispensed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <Button size="sm" className="gap-1 ml-auto" onClick={() => setShowForm(!showForm)}><FlaskConical className="w-3.5 h-3.5" />New Compounding Order</Button>
      </div>

      {showForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Patient name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            <Input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Product name (e.g. TPN, IVABx)" value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} />
            <Input placeholder="Ward" value={form.ward} onChange={e => setForm(f => ({ ...f, ward: e.target.value }))} />
          </div>

          <Separator />
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Ingredients</p>
          <div className="flex gap-2">
            <Input placeholder="Ingredient name" className="text-xs h-8" value={form.ingredientName} onChange={e => setForm(f => ({ ...f, ingredientName: e.target.value }))} />
            <Input placeholder="Qty" className="text-xs h-8 w-32" value={form.ingredientQty} onChange={e => setForm(f => ({ ...f, ingredientQty: e.target.value }))} />
            <Button size="sm" className="h-8 text-xs" onClick={addIngredient}><Plus className="w-3 h-3 mr-1" />Add</Button>
          </div>
          {form.ingredients.length > 0 && (
            <div className="space-y-1">
              {form.ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-muted/30 rounded px-3 py-1.5 text-xs">
                  <span className="font-medium">{ing.name}</span>
                  <span className="text-muted-foreground">{ing.qty}</span>
                  <button onClick={() => removeIngredient(idx)} className="ml-auto text-destructive"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Total volume (mL)" value={form.totalVolume} onChange={e => setForm(f => ({ ...f, totalVolume: e.target.value }))} />
            <Input placeholder="Diluent" value={form.diluent} onChange={e => setForm(f => ({ ...f, diluent: e.target.value }))} />
            <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.route} onChange={e => setForm(f => ({ ...f, route: e.target.value as CompoundingOrder['route'] }))}>
              <option value="IV">IV</option><option value="IM">IM</option><option value="SC">SC</option><option value="oral">Oral</option><option value="topical">Topical</option><option value="other">Other</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Rate (mL/hr)" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} />
            <Input placeholder="Storage condition" value={form.storageCondition} onChange={e => setForm(f => ({ ...f, storageCondition: e.target.value }))} />
            <Input placeholder="Batch #" value={form.batchNo} onChange={e => setForm(f => ({ ...f, batchNo: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Prepared by" value={form.preparedBy} onChange={e => setForm(f => ({ ...f, preparedBy: e.target.value }))} />
            <Input placeholder="Checked by" value={form.checkedBy} onChange={e => setForm(f => ({ ...f, checkedBy: e.target.value }))} />
          </div>
          <Textarea placeholder="Notes" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addOrder}>Create Order</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map(o => (
          <Card key={o.id} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <FlaskConical className="w-4 h-4 mt-0.5 shrink-0 text-purple-500" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold">{o.productName}</p>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{o.batchNo}</span>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                      o.status === 'ordered' ? 'bg-amber-500/10 text-amber-600' :
                      o.status === 'prepared' ? 'bg-blue-500/10 text-blue-600' :
                      o.status === 'checked' ? 'bg-purple-500/10 text-purple-600' :
                      o.status === 'dispensed' ? 'bg-emerald-500/10 text-emerald-600' :
                      'bg-destructive/10 text-destructive'
                    }`}>{o.status}</span>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{o.route}</span>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{o.totalVolume || '—'}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{o.patientName} · {o.uhid} · {o.ward}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {o.ingredients.map((ing, idx) => (
                      <span key={idx} className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{ing.name} {ing.qty}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground mt-0.5">
                    <span>Prepared: {o.preparedBy || '—'}</span>
                    <span>Checked: {o.checkedBy || '—'}</span>
                    <span>· {o.orderDate}</span>
                  </div>
                  {o.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{o.notes}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  {o.status === 'ordered' && <Button size="sm" className="h-7 text-[10px]" onClick={() => updateStatus(o.id, 'prepared')}>Prepare</Button>}
                  {o.status === 'prepared' && <Button size="sm" className="h-7 text-[10px]" onClick={() => updateStatus(o.id, 'checked')}>Check</Button>}
                  {o.status === 'checked' && <Button size="sm" className="h-7 text-[10px]" onClick={() => updateStatus(o.id, 'dispensed')}>Dispense</Button>}
                  {o.status !== 'dispensed' && o.status !== 'cancelled' && (
                    <Button size="sm" variant="outline" className="h-7 text-[10px] text-destructive" onClick={() => updateStatus(o.id, 'cancelled')}>Cancel</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No compounding orders yet.</p>}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════
// 11. Cold Chain Monitoring
// ════════════════════════════════════════════

const COLD_CHAIN_KEY = 'adrine_pharmacy_cold_chain';

type TemperatureLog = {
  id: string;
  deviceId: string;
  deviceName: string;
  location: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  status: 'normal' | 'warning' | 'excursion';
  minTemp: number;
  maxTemp: number;
  duration: string;
  actionTaken: string;
  correctedBy: string;
  notes: string;
};

type ColdChainDevice = {
  id: string;
  name: string;
  location: string;
  type: 'refrigerator' | 'freezer' | 'cold_room' | 'transport_box' | 'thermometer';
  minTemp: number;
  maxTemp: number;
  status: 'online' | 'offline' | 'alarm';
  lastReading: number;
  lastReadingTime: string;
};

const DEFAULT_DEVICES: ColdChainDevice[] = [
  { id: 'dev-1', name: 'Main Fridge A', location: 'Central Pharmacy', type: 'refrigerator', minTemp: 2, maxTemp: 8, status: 'online', lastReading: 5.2, lastReadingTime: new Date().toLocaleString('en-IN') },
  { id: 'dev-2', name: 'Vaccine Freezer B', location: 'Central Pharmacy', type: 'freezer', minTemp: -20, maxTemp: -15, status: 'online', lastReading: -18.5, lastReadingTime: new Date().toLocaleString('en-IN') },
  { id: 'dev-3', name: 'Ward 3 Fridge', location: 'Ward 3', type: 'refrigerator', minTemp: 2, maxTemp: 8, status: 'online', lastReading: 7.8, lastReadingTime: new Date(Date.now() - 3600000).toLocaleString('en-IN') },
  { id: 'dev-4', name: 'ER Cold Box', location: 'Emergency', type: 'transport_box', minTemp: 2, maxTemp: 8, status: 'alarm', lastReading: 11.2, lastReadingTime: new Date(Date.now() - 600000).toLocaleString('en-IN') },
];

export function PharmacyColdChain() {
  const [devices, setDevices] = useState<ColdChainDevice[]>(() => loadJson<ColdChainDevice[]>(`${COLD_CHAIN_KEY}_devices`, DEFAULT_DEVICES));
  const [logs, setLogs] = useState<TemperatureLog[]>(() => loadJson<TemperatureLog[]>(`${COLD_CHAIN_KEY}_logs`, []));
  const [showLogForm, setShowLogForm] = useState(false);
  const [logForm, setLogForm] = useState({
    deviceId: 'dev-1', temperature: 5, humidity: 45,
    actionTaken: '', correctedBy: '', notes: '',
  });
  const [search, setSearch] = useState('');

  const addLog = () => {
    const device = devices.find(d => d.id === logForm.deviceId);
    if (!device) return;
    const temp = logForm.temperature;
    const isExcursion = temp < device.minTemp || temp > device.maxTemp;
    const newLog: TemperatureLog = {
      id: crypto.randomUUID?.() ?? `${Date.now()}`,
      deviceId: logForm.deviceId,
      deviceName: device.name,
      location: device.location,
      timestamp: new Date().toLocaleString('en-IN'),
      temperature: temp,
      humidity: logForm.humidity,
      status: isExcursion ? 'excursion' : temp >= device.minTemp + 1 && temp <= device.maxTemp - 1 ? 'normal' : 'warning',
      minTemp: device.minTemp,
      maxTemp: device.maxTemp,
      duration: '',
      actionTaken: logForm.actionTaken,
      correctedBy: logForm.correctedBy,
      notes: logForm.notes,
    };
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    saveJson(`${COLD_CHAIN_KEY}_logs`, updatedLogs);

    // Update device status
    const updatedDevices = devices.map(d => {
      if (d.id !== logForm.deviceId) return d;
      return {
        ...d,
        lastReading: temp,
        lastReadingTime: new Date().toLocaleString('en-IN'),
        status: isExcursion ? 'alarm' as const : 'online' as const,
      };
    });
    setDevices(updatedDevices);
    saveJson(`${COLD_CHAIN_KEY}_devices`, updatedDevices);

    setLogForm({ deviceId: 'dev-1', temperature: 5, humidity: 45, actionTaken: '', correctedBy: '', notes: '' });
    setShowLogForm(false);
    toast.success(isExcursion ? '⚠️ Temperature excursion recorded!' : 'Temperature logged');
  };

  const excursions = logs.filter(l => l.status === 'excursion').length;
  const onlineCount = devices.filter(d => d.status === 'online').length;
  const alarmCount = devices.filter(d => d.status === 'alarm').length;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return logs.filter(l => l.deviceName.toLowerCase().includes(q) || l.location.toLowerCase().includes(q));
  }, [logs, search]);

  const tempColor = (temp: number, min: number, max: number) => {
    if (temp < min || temp > max) return 'text-destructive';
    if (temp <= min + 1 || temp >= max - 1) return 'text-amber-500';
    return 'text-emerald-500';
  };

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Cold Chain Monitoring</h1>
        <p className="text-sm text-muted-foreground mt-1">Temperature and humidity monitoring for refrigerators, freezers, and cold storage. Excursion alerts and corrective action tracking.</p>
      </motion.div>
      <PreviewStrip />
      <QuickLinks />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><ThermometerSnowflake className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold">Online</span></div>
          <p className="text-2xl font-bold">{onlineCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" /><span className="text-sm font-semibold">Alarms</span></div>
          <p className="text-2xl font-bold">{alarmCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Thermometer className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Excursions</span></div>
          <p className="text-2xl font-bold">{excursions}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Total Logs</span></div>
          <p className="text-2xl font-bold">{logs.length}</p>
        </CardContent></Card>
      </div>

      {/* Device status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {devices.map((d, i) => (
          <motion.div key={d.id} {...fadeIn(i)}>
            <Card className={`rounded-xl ${d.status === 'alarm' ? 'border-destructive/30 bg-destructive/5' : ''}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">{d.name}</span>
                  <span className={`text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded ${
                    d.status === 'online' ? 'bg-emerald-500/10 text-emerald-600' :
                    d.status === 'alarm' ? 'bg-destructive/10 text-destructive' :
                    'bg-muted text-muted-foreground'
                  }`}>{d.status}</span>
                </div>
                <p className="text-[9px] text-muted-foreground">{d.location} · {d.type}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className={`text-lg font-bold ${tempColor(d.lastReading, d.minTemp, d.maxTemp)}`}>
                    {d.lastReading}°{d.type === 'freezer' ? 'C' : 'C'}
                  </span>
                  <span className="text-[9px] text-muted-foreground">Range: {d.minTemp}–{d.maxTemp}°C</span>
                </div>
                <p className="text-[9px] text-muted-foreground">{d.lastReadingTime}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search device/location..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button size="sm" className="gap-1 ml-auto" onClick={() => setShowLogForm(!showLogForm)}><ThermometerSnowflake className="w-3.5 h-3.5" />Log Temperature</Button>
      </div>

      {showLogForm && (
        <Card className="rounded-xl p-4 space-y-3 border-dashed">
          <div className="grid grid-cols-3 gap-2">
            <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={logForm.deviceId} onChange={e => setLogForm(f => ({ ...f, deviceId: e.target.value }))}>
              {devices.map(d => <option key={d.id} value={d.id}>{d.name} ({d.location})</option>)}
            </select>
            <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Temperature (°C)</Label><Input type="number" step="0.1" value={logForm.temperature} onChange={e => setLogForm(f => ({ ...f, temperature: Number(e.target.value) }))} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Humidity (%)</Label><Input type="number" min={0} max={100} value={logForm.humidity} onChange={e => setLogForm(f => ({ ...f, humidity: Number(e.target.value) }))} /></div>
          </div>
          <Input placeholder="Corrective action taken" value={logForm.actionTaken} onChange={e => setLogForm(f => ({ ...f, actionTaken: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Corrected by" value={logForm.correctedBy} onChange={e => setLogForm(f => ({ ...f, correctedBy: e.target.value }))} />
            <Input placeholder="Notes" value={logForm.notes} onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowLogForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addLog}>Log Reading</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map(l => (
          <Card key={l.id} className={`rounded-xl ${l.status === 'excursion' ? 'border-destructive/30' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Thermometer className={`w-4 h-4 mt-0.5 shrink-0 ${
                  l.status === 'excursion' ? 'text-destructive' :
                  l.status === 'warning' ? 'text-amber-500' :
                  'text-emerald-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold">{l.deviceName}</p>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">{l.location}</span>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                      l.status === 'excursion' ? 'bg-destructive/10 text-destructive' :
                      l.status === 'warning' ? 'bg-amber-500/10 text-amber-600' :
                      'bg-emerald-500/10 text-emerald-600'
                    }`}>{l.status}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className={`text-sm font-bold ${tempColor(l.temperature, l.minTemp, l.maxTemp)}`}>{l.temperature}°C</span>
                    <span className="text-[10px] text-muted-foreground">Humidity: {l.humidity}%</span>
                    <span className="text-[10px] text-muted-foreground">Range: {l.minTemp}–{l.maxTemp}°C</span>
                  </div>
                  {l.actionTaken && <p className="text-[10px] text-muted-foreground mt-0.5">Action: {l.actionTaken} · {l.correctedBy}</p>}
                  {l.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{l.notes}</p>}
                  <p className="text-[9px] text-muted-foreground mt-0.5">{l.timestamp}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No temperature logs yet.</p>}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════
// 12. Drug Interaction & Allergy Check
// ════════════════════════════════════════════

const INTERACTION_KEY = 'adrine_pharmacy_interactions';

type InteractionCheck = {
  id: string;
  patientName: string;
  uhid: string;
  drugA: string;
  drugB: string;
  severity: 'contraindicated' | 'major' | 'moderate' | 'minor';
  effect: string;
  mechanism: string;
  recommendation: string;
  alternativeDrug: string;
  checkedAt: string;
  checkedBy: string;
  status: 'resolved' | 'override' | 'pending';
  notes: string;
};

type PatientAllergy = {
  id: string;
  patientName: string;
  uhid: string;
  allergen: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe';
  recordedAt: string;
  recordedBy: string;
};

const ALLERGIES_KEY = 'adrine_pharmacy_allergies';

const DRUG_LIST = [
  'Amoxicillin', 'Paracetamol', 'Aspirin', 'Ibuprofen', 'Atorvastatin',
  'Metformin', 'Omeprazole', 'Losartan', 'Amlodipine', 'Metoprolol',
  'Warfarin', 'Clopidogrel', 'Digoxin', 'Phenytoin', 'Carbamazepine',
  'Ciprofloxacin', 'Levofloxacin', 'Azithromycin', 'Doxycycline', 'Fluconazole',
  'Prednisolone', 'Dexamethasone', 'Furosemide', 'Spironolactone', 'Insulin',
];

export function PharmacyInteractions() {
  const [checks, setChecks] = useState<InteractionCheck[]>(() => loadJson<InteractionCheck[]>(INTERACTION_KEY, []));
  const [allergies, setAllergies] = useState<PatientAllergy[]>(() => loadJson<PatientAllergy[]>(ALLERGIES_KEY, []));
  const [activeTab, setActiveTab] = useState<'interactions' | 'allergies'>('interactions');
  const [showCheckForm, setShowCheckForm] = useState(false);
  const [showAllergyForm, setShowAllergyForm] = useState(false);
  const [checkForm, setCheckForm] = useState({
    patientName: '', uhid: '', drugA: DRUG_LIST[0], drugB: DRUG_LIST[1],
    severity: 'moderate' as InteractionCheck['severity'],
    effect: '', mechanism: '', recommendation: '',
    alternativeDrug: '', checkedBy: '', notes: '', status: 'pending' as InteractionCheck['status'],
  });
  const [allergyForm, setAllergyForm] = useState({
    patientName: '', uhid: '', allergen: '', reaction: '',
    severity: 'moderate' as PatientAllergy['severity'], recordedBy: '',
  });
  const [search, setSearch] = useState('');

  const runInteractionCheck = () => {
    if (!checkForm.patientName.trim()) return;
    // Simulate known interactions
    const knownPairs: Record<string, { effect: string; mechanism: string; severity: InteractionCheck['severity']; recommendation: string }> = {
      'Warfarin+Aspirin': { effect: 'Increased bleeding risk', mechanism: 'Additive antiplatelet effect', severity: 'major', recommendation: 'Monitor INR closely, consider GI protection' },
      'Amoxicillin+Methotrexate': { effect: 'Increased MTX toxicity', mechanism: 'Reduced renal clearance of MTX', severity: 'major', recommendation: 'Monitor MTX levels, adjust dose' },
      'Ciprofloxacin+Prednisolone': { effect: 'Increased tendon rupture risk', mechanism: 'Synergistic effect on collagen', severity: 'moderate', recommendation: 'Avoid combination in elderly' },
      'Clopidogrel+Omeprazole': { effect: 'Reduced clopidogrel efficacy', mechanism: 'CYP2C19 inhibition', severity: 'moderate', recommendation: 'Use pantoprazole instead' },
    };
    const key = `${checkForm.drugA}+${checkForm.drugB}`;
    const reverseKey = `${checkForm.drugB}+${checkForm.drugA}`;
    const known = knownPairs[key] || knownPairs[reverseKey];

    const newCheck: InteractionCheck = {
      id: crypto.randomUUID?.() ?? `${Date.now()}`,
      patientName: checkForm.patientName,
      uhid: checkForm.uhid,
      drugA: checkForm.drugA,
      drugB: checkForm.drugB,
      severity: known?.severity || 'minor',
      effect: known?.effect || 'No known significant interaction in database',
      mechanism: known?.mechanism || 'No data',
      recommendation: known?.recommendation || 'No special precautions required. Proceed with standard monitoring.',
      alternativeDrug: checkForm.alternativeDrug,
      checkedAt: new Date().toLocaleString('en-IN'),
      checkedBy: checkForm.checkedBy,
      status: known ? 'pending' : 'resolved',
      notes: checkForm.notes,
    };
    const updated = [newCheck, ...checks];
    setChecks(updated);
    saveJson(INTERACTION_KEY, updated);
    setCheckForm({ patientName: '', uhid: '', drugA: DRUG_LIST[0], drugB: DRUG_LIST[1], severity: 'moderate', effect: '', mechanism: '', recommendation: '', alternativeDrug: '', checkedBy: '', notes: '', status: 'pending' });
    setShowCheckForm(false);
    if (known) {
      toast.warning(`⚠️ ${known.severity.toUpperCase()} interaction found!`);
    } else {
      toast.success('No significant interaction detected');
    }
  };

  const addAllergy = () => {
    if (!allergyForm.patientName.trim() || !allergyForm.allergen.trim()) return;
    const newAllergy: PatientAllergy = {
      ...allergyForm,
      id: crypto.randomUUID?.() ?? `${Date.now()}`,
      recordedAt: new Date().toLocaleString('en-IN'),
    };
    const updated = [newAllergy, ...allergies];
    setAllergies(updated);
    saveJson(ALLERGIES_KEY, updated);
    setAllergyForm({ patientName: '', uhid: '', allergen: '', reaction: '', severity: 'moderate', recordedBy: '' });
    setShowAllergyForm(false);
    toast.success('Allergy recorded');
  };

  const resolveInteraction = (id: string) => {
    const updated = checks.map(c => c.id === id ? { ...c, status: 'resolved' as const } : c);
    setChecks(updated);
    saveJson(INTERACTION_KEY, updated);
  };

  const overrideInteraction = (id: string) => {
    const updated = checks.map(c => c.id === id ? { ...c, status: 'override' as const } : c);
    setChecks(updated);
    saveJson(INTERACTION_KEY, updated);
    toast.success('Interaction overridden with clinical justification');
  };

  const majorCount = checks.filter(c => c.severity === 'major' || c.severity === 'contraindicated').length;
  const unresolvedCount = checks.filter(c => c.status === 'pending').length;
  const allergyTotal = allergies.length;

  const filteredChecks = useMemo(() => {
    const q = search.toLowerCase();
    return checks.filter(c => c.patientName.toLowerCase().includes(q) || c.drugA.toLowerCase().includes(q) || c.drugB.toLowerCase().includes(q) || c.uhid.includes(q));
  }, [checks, search]);

  const filteredAllergies = useMemo(() => {
    const q = search.toLowerCase();
    return allergies.filter(a => a.patientName.toLowerCase().includes(q) || a.uhid.includes(q) || a.allergen.toLowerCase().includes(q));
  }, [allergies, search]);

  return (
    <motion.div className="space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl font-bold tracking-tight">Drug Interaction &amp; Allergy Check</h1>
        <p className="text-sm text-muted-foreground mt-1">Drug-drug interaction checking, allergy registration, severity categorization, and clinical recommendation engine.</p>
      </motion.div>
      <PreviewStrip />
      <QuickLinks />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" /><span className="text-sm font-semibold">Major/CI</span></div>
          <p className="text-2xl font-bold">{majorCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold">Unresolved</span></div>
          <p className="text-2xl font-bold">{unresolvedCount}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-blue-600" /><span className="text-sm font-semibold">Allergies</span></div>
          <p className="text-2xl font-bold">{allergyTotal}</p>
        </CardContent></Card>
        <Card className="rounded-xl"><CardContent className="p-4 space-y-1">
          <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-semibold">Total Checks</span></div>
          <p className="text-2xl font-bold">{checks.length}</p>
        </CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'interactions' | 'allergies')}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="interactions" className="text-xs">Drug-Drug Interactions</TabsTrigger>
            <TabsTrigger value="allergies" className="text-xs">Patient Allergies</TabsTrigger>
          </TabsList>
          {activeTab === 'interactions' ? (
            <Button size="sm" className="gap-1" onClick={() => setShowCheckForm(!showCheckForm)}><Activity className="w-3.5 h-3.5" />Check Interaction</Button>
          ) : (
            <Button size="sm" className="gap-1" onClick={() => setShowAllergyForm(!showAllergyForm)}><Plus className="w-3.5 h-3.5" />Record Allergy</Button>
          )}
        </div>

        <TabsContent value="interactions" className="space-y-4 mt-4">
          {showCheckForm && (
            <Card className="rounded-xl p-4 space-y-3 border-dashed">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Patient name" value={checkForm.patientName} onChange={e => setCheckForm(f => ({ ...f, patientName: e.target.value }))} />
                <Input placeholder="UHID" value={checkForm.uhid} onChange={e => setCheckForm(f => ({ ...f, uhid: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={checkForm.drugA} onChange={e => setCheckForm(f => ({ ...f, drugA: e.target.value }))}>
                  {DRUG_LIST.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={checkForm.drugB} onChange={e => setCheckForm(f => ({ ...f, drugB: e.target.value }))}>
                  {DRUG_LIST.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <Input placeholder="Alternative drug suggestion (optional)" value={checkForm.alternativeDrug} onChange={e => setCheckForm(f => ({ ...f, alternativeDrug: e.target.value }))} />
              <Input placeholder="Checked by" value={checkForm.checkedBy} onChange={e => setCheckForm(f => ({ ...f, checkedBy: e.target.value }))} />
              <Textarea placeholder="Clinical notes" rows={2} value={checkForm.notes} onChange={e => setCheckForm(f => ({ ...f, notes: e.target.value }))} />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => setShowCheckForm(false)}>Cancel</Button>
                <Button size="sm" onClick={runInteractionCheck}><Activity className="w-3 h-3 mr-1" />Run Check</Button>
              </div>
            </Card>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search checks..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            {filteredChecks.map(c => (
              <Card key={c.id} className={`rounded-xl ${
                c.severity === 'contraindicated' ? 'border-destructive/30 bg-destructive/5' :
                c.severity === 'major' ? 'border-destructive/20' :
                c.severity === 'moderate' ? 'border-amber-500/20' : ''
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${
                      c.severity === 'contraindicated' || c.severity === 'major' ? 'text-destructive' :
                      c.severity === 'moderate' ? 'text-amber-500' :
                      'text-muted-foreground'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-semibold">{c.patientName}</p>
                        <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{c.uhid}</span>
                        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                          c.severity === 'contraindicated' ? 'bg-destructive/10 text-destructive' :
                          c.severity === 'major' ? 'bg-red-500/10 text-red-600' :
                          c.severity === 'moderate' ? 'bg-amber-500/10 text-amber-600' :
                          'bg-blue-500/10 text-blue-600'
                        }`}>{c.severity}</span>
                        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                          c.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-600' :
                          c.status === 'override' ? 'bg-purple-500/10 text-purple-600' :
                          'bg-amber-500/10 text-amber-600'
                        }`}>{c.status}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                        <span className="font-mono text-xs font-semibold text-foreground">{c.drugA}</span>
                        <span className="text-muted-foreground">+</span>
                        <span className="font-mono text-xs font-semibold text-foreground">{c.drugB}</span>
                      </div>
                      <p className="text-[10px] text-foreground mt-0.5">{c.effect}</p>
                      <p className="text-[10px] text-muted-foreground">{c.mechanism}</p>
                      <p className="text-[10px] text-blue-600 mt-0.5">Recommendation: {c.recommendation}</p>
                      {c.alternativeDrug && <p className="text-[10px] text-emerald-600">Alternative: {c.alternativeDrug}</p>}
                      <div className="flex items-center gap-2 text-[9px] text-muted-foreground mt-0.5">
                        <span>by {c.checkedBy || '—'}</span>
                        <span>· {c.checkedAt}</span>
                      </div>
                      {c.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{c.notes}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {c.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" className="h-7 text-[10px] text-emerald-600" onClick={() => resolveInteraction(c.id)}><Check className="w-3 h-3 mr-1" />Resolve</Button>
                          <Button size="sm" variant="outline" className="h-7 text-[10px] text-amber-600" onClick={() => overrideInteraction(c.id)}><Shield className="w-3 h-3 mr-1" />Override</Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredChecks.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No interaction checks performed yet.</p>}
          </div>
        </TabsContent>

        <TabsContent value="allergies" className="space-y-4 mt-4">
          {showAllergyForm && (
            <Card className="rounded-xl p-4 space-y-3 border-dashed">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Patient name" value={allergyForm.patientName} onChange={e => setAllergyForm(f => ({ ...f, patientName: e.target.value }))} />
                <Input placeholder="UHID" value={allergyForm.uhid} onChange={e => setAllergyForm(f => ({ ...f, uhid: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Allergen (drug/substance)" value={allergyForm.allergen} onChange={e => setAllergyForm(f => ({ ...f, allergen: e.target.value }))} />
                <Input placeholder="Reaction description" value={allergyForm.reaction} onChange={e => setAllergyForm(f => ({ ...f, reaction: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={allergyForm.severity} onChange={e => setAllergyForm(f => ({ ...f, severity: e.target.value as PatientAllergy['severity'] }))}>
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
                <Input placeholder="Recorded by" value={allergyForm.recordedBy} onChange={e => setAllergyForm(f => ({ ...f, recordedBy: e.target.value }))} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => setShowAllergyForm(false)}>Cancel</Button>
                <Button size="sm" onClick={addAllergy}>Record Allergy</Button>
              </div>
            </Card>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search allergies..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            {filteredAllergies.map(a => (
              <Card key={a.id} className="rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Shield className={`w-4 h-4 mt-0.5 shrink-0 ${
                      a.severity === 'severe' ? 'text-destructive' :
                      a.severity === 'moderate' ? 'text-amber-500' :
                      'text-muted-foreground'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-semibold">{a.patientName}</p>
                        <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{a.uhid}</span>
                        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                          a.severity === 'severe' ? 'bg-destructive/10 text-destructive' :
                          a.severity === 'moderate' ? 'bg-amber-500/10 text-amber-600' :
                          'bg-blue-500/10 text-blue-600'
                        }`}>{a.severity}</span>
                      </div>
                      <p className="text-xs mt-0.5">{a.allergen}</p>
                      <p className="text-[10px] text-muted-foreground">{a.reaction}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{a.recordedAt} · by {a.recordedBy || '—'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredAllergies.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No allergies recorded.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
