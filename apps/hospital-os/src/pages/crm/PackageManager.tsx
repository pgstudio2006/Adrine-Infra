import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Plus, X, IndianRupee, CheckCircle2, Send, BarChart3 } from 'lucide-react';
import { canUseCrmRuntime, platformListPackages, platformCreatePackage, platformListProposals, platformCreateProposal, platformUpdateProposal, type PlatformCrmPackage, type PlatformCrmProposal } from '@/runtime/crm-runtime';
import { getPlatformSession } from '@/runtime/platform-session';
import { toast } from 'sonner';

const PKG_KEY = 'adrine_crm_packages';
const PROP_KEY = 'adrine_crm_proposals';

function loadJson<T>(key: string, fallback: T): T { try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; } catch { return fallback; } }
function saveJson(key: string, data: unknown) { localStorage.setItem(key, JSON.stringify(data)); }
function formatPrice(cents: number) { return `₹${(cents / 100).toLocaleString('en-IN')}`; }

const DEMO_PACKAGES: PlatformCrmPackage[] = [
  { id: 'pkg-1', name: 'Basic Knee Care', category: 'Knee', description: 'Consultation + basic physiotherapy (4 sessions)', basePriceCents: 350000, isActive: true },
  { id: 'pkg-2', name: 'Advanced Knee Package', category: 'Knee', description: 'PRP + physiotherapy (8 sessions) + follow-up', basePriceCents: 1500000, isActive: true },
  { id: 'pkg-3', name: 'Spine Care Basic', category: 'Spine', description: 'Ozone therapy + basic physio (6 sessions)', basePriceCents: 750000, isActive: true },
  { id: 'pkg-4', name: 'Spine Care Advanced', category: 'Spine', description: 'DSCB + PRP + physio (12 sessions) + follow-ups', basePriceCents: 2200000, isActive: true },
  { id: 'pkg-5', name: 'Regenerative Premium', category: 'Regenerative', description: 'Full BMAC/GFC + PRP + physio + nutrition plan', basePriceCents: 3000000, isActive: true },
  { id: 'pkg-6', name: 'Frozen Shoulder Protocol', category: 'Shoulder', description: 'Hydrodilatation + PRP + physio (8 sessions)', basePriceCents: 1200000, isActive: true },
  { id: 'pkg-7', name: 'Sports Injury Recovery', category: 'Sports', description: 'Assessment + PRP + rehab (10 sessions)', basePriceCents: 1800000, isActive: true },
];

const DEMO_PROPOSALS: PlatformCrmProposal[] = [
  { id: 'pp-1', patientName: 'Rajesh Kumar', packageName: 'Advanced Knee Package', proposedPriceCents: 1500000, counsellorLabel: 'Counsellor Priya', status: 'sent', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'pp-2', patientName: 'Sunita Devi', packageName: 'Spine Care Basic', proposedPriceCents: 750000, counsellorLabel: 'Counsellor Rahul', status: 'accepted', createdAt: new Date(Date.now() - 172800000).toISOString(), convertedAt: new Date().toISOString() },
  { id: 'pp-3', patientName: 'Amit Singh', packageName: 'Regenerative Premium', proposedPriceCents: 2800000, counsellorLabel: 'Counsellor Priya', status: 'sent', createdAt: new Date(Date.now() - 43200000).toISOString() },
  { id: 'pp-4', patientName: 'Neha Gupta', packageName: 'Frozen Shoulder Protocol', proposedPriceCents: 1100000, counsellorLabel: 'Counsellor Anjali', status: 'declined', createdAt: new Date(Date.now() - 259200000).toISOString() },
  { id: 'pp-5', patientName: 'Vikram Patel', packageName: 'Basic Knee Care', proposedPriceCents: 350000, counsellorLabel: 'Counsellor Rahul', status: 'accepted', createdAt: new Date(Date.now() - 345600000).toISOString(), convertedAt: new Date(Date.now() - 259200000).toISOString() },
];

const categoryColors: Record<string, string> = { Knee: 'bg-blue-500/10 text-blue-600', Spine: 'bg-violet-500/10 text-violet-600', Shoulder: 'bg-amber-500/10 text-amber-600', Regenerative: 'bg-emerald-500/10 text-emerald-600', Sports: 'bg-cyan-500/10 text-cyan-600' };
const proposalStatusStyles: Record<string, string> = { draft: 'bg-muted text-muted-foreground', sent: 'bg-blue-500/10 text-blue-600', accepted: 'bg-success/10 text-success', declined: 'bg-destructive/10 text-destructive' };

export default function PackageManager() {
  const platformOn = canUseCrmRuntime();
  const branchId = getPlatformSession()?.branchId;
  const [packages, setPackages] = useState<PlatformCrmPackage[]>([]);
  const [proposals, setProposals] = useState<PlatformCrmProposal[]>([]);
  const [tab, setTab] = useState('catalog');
  const [showPkgForm, setShowPkgForm] = useState(false);
  const [showPropForm, setShowPropForm] = useState(false);
  const [pkgForm, setPkgForm] = useState({ name: '', category: 'Knee', description: '', basePriceCents: '' });
  const [propForm, setPropForm] = useState({ patientName: '', packageName: '', proposedPriceCents: '', counsellorLabel: '', notes: '' });

  const refresh = useCallback(async () => {
    if (platformOn) {
      try { const [pk, pr] = await Promise.all([platformListPackages(branchId), platformListProposals(branchId)]); setPackages(pk); setProposals(pr); } catch { setPackages(loadJson(PKG_KEY, DEMO_PACKAGES)); setProposals(loadJson(PROP_KEY, DEMO_PROPOSALS)); }
    } else { setPackages(loadJson(PKG_KEY, DEMO_PACKAGES)); setProposals(loadJson(PROP_KEY, DEMO_PROPOSALS)); }
  }, [platformOn, branchId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const stats = useMemo(() => ({
    totalPackages: packages.filter(p => p.isActive).length,
    totalProposals: proposals.length,
    accepted: proposals.filter(p => p.status === 'accepted').length,
    totalRevenue: proposals.filter(p => p.status === 'accepted').reduce((s, p) => s + p.proposedPriceCents, 0),
    conversionRate: proposals.length > 0 ? `${Math.round((proposals.filter(p => p.status === 'accepted').length / proposals.length) * 100)}%` : '—',
  }), [packages, proposals]);

  const handleCreatePkg = () => {
    if (!pkgForm.name.trim()) { toast.error('Package name is required'); return; }
    const row: PlatformCrmPackage = { id: `pkg-${Date.now()}`, name: pkgForm.name.trim(), category: pkgForm.category, description: pkgForm.description || undefined, basePriceCents: Number(pkgForm.basePriceCents) || 0, isActive: true };
    setPackages(prev => [row, ...prev]); saveJson(PKG_KEY, [row, ...packages]);
    setPkgForm({ name: '', category: 'Knee', description: '', basePriceCents: '' }); setShowPkgForm(false); toast.success('Package created');
  };

  const handleCreateProposal = async () => {
    if (!propForm.patientName.trim() || !propForm.packageName.trim()) { toast.error('Patient name and package are required'); return; }
    const row: PlatformCrmProposal = { id: `pp-${Date.now()}`, ...propForm, proposedPriceCents: Number(propForm.proposedPriceCents) || 0, status: 'draft', createdAt: new Date().toISOString() };
    if (platformOn) { try { const c = await platformCreateProposal(row as any, branchId); setProposals(prev => [c, ...prev]); } catch { setProposals(prev => [row, ...prev]); } }
    else { setProposals(prev => [row, ...prev]); saveJson(PROP_KEY, [row, ...proposals]); }
    setPropForm({ patientName: '', packageName: '', proposedPriceCents: '', counsellorLabel: '', notes: '' }); setShowPropForm(false); toast.success('Proposal created');
  };

  const updateProposal = async (id: string, status: string) => {
    if (platformOn) { try { await platformUpdateProposal(id, { status, ...(status === 'accepted' ? { convertedAt: new Date().toISOString() } : {}) }); } catch { /* */ } }
    setProposals(prev => prev.map(p => p.id === id ? { ...p, status, ...(status === 'accepted' ? { convertedAt: new Date().toISOString() } : {}) } : p));
    toast.success(`Proposal ${status}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><h1 className="text-2xl font-bold">Package Management</h1><p className="text-sm text-muted-foreground">Create treatment packages, track proposals, and monitor conversion rates</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPropForm(true)}><Send className="mr-2 h-4 w-4" /> New Proposal</Button>
          <Button onClick={() => setShowPkgForm(true)}><Plus className="mr-2 h-4 w-4" /> New Package</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          { label: 'Active Packages', value: stats.totalPackages, icon: Package },
          { label: 'Total Proposals', value: stats.totalProposals, icon: Send },
          { label: 'Accepted', value: stats.accepted, icon: CheckCircle2 },
          { label: 'Conversion Rate', value: stats.conversionRate, icon: BarChart3 },
          { label: 'Revenue', value: stats.totalRevenue > 0 ? `₹${(stats.totalRevenue / 100000).toFixed(1)}L` : '—', icon: IndianRupee },
        ].map(s => (
          <Card key={s.label}><CardContent className="pt-6"><div className="flex items-start justify-between"><div><p className="text-xs text-muted-foreground">{s.label}</p><p className="mt-1 text-2xl font-bold">{s.value}</p></div><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><s.icon className="h-5 w-5 text-primary" /></div></div></CardContent></Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}><TabsList><TabsTrigger value="catalog">Package Catalog</TabsTrigger><TabsTrigger value="proposals">Proposals</TabsTrigger></TabsList></Tabs>

      {tab === 'catalog' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.filter(p => p.isActive).map(pkg => (
            <Card key={pkg.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-base">{pkg.name}</CardTitle><Badge variant="outline" className={`text-[10px] ${categoryColors[pkg.category] ?? ''}`}>{pkg.category}</Badge></div></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{pkg.description ?? 'No description'}</p>
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-1 text-lg font-bold"><IndianRupee className="h-4 w-4" />{(pkg.basePriceCents / 100).toLocaleString('en-IN')}</div>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setPropForm(p => ({ ...p, packageName: pkg.name, proposedPriceCents: String(pkg.basePriceCents) })); setShowPropForm(true); }}>Propose</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === 'proposals' && (
        <Card><CardContent className="p-0">
          <Table><TableHeader><TableRow><TableHead>Patient</TableHead><TableHead>Package</TableHead><TableHead>Price</TableHead><TableHead>Counsellor</TableHead><TableHead>Created</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>{proposals.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.patientName}</TableCell><TableCell>{p.packageName}</TableCell><TableCell>{formatPrice(p.proposedPriceCents)}</TableCell>
                <TableCell>{p.counsellorLabel ?? '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</TableCell>
                <TableCell><Badge variant="outline" className={`text-[10px] ${proposalStatusStyles[p.status] ?? ''}`}>{p.status}</Badge></TableCell>
                <TableCell className="text-right">
                  {p.status === 'draft' && <Button size="sm" variant="outline" className="h-7 text-xs mr-1" onClick={() => updateProposal(p.id, 'sent')}>Send</Button>}
                  {p.status === 'sent' && <><Button size="sm" variant="outline" className="h-7 text-xs mr-1 text-success" onClick={() => updateProposal(p.id, 'accepted')}>Accept</Button><Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={() => updateProposal(p.id, 'declined')}>Decline</Button></>}
                </TableCell>
              </TableRow>
            ))}</TableBody></Table>
        </CardContent></Card>
      )}

      {showPkgForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><Card className="w-full max-w-md">
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-lg">New Package</CardTitle><Button variant="ghost" size="icon" onClick={() => setShowPkgForm(false)}><X className="h-4 w-4" /></Button></CardHeader>
          <CardContent className="space-y-3">
            <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Package name *" value={pkgForm.name} onChange={e => setPkgForm(p => ({ ...p, name: e.target.value }))} />
            <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={pkgForm.category} onChange={e => setPkgForm(p => ({ ...p, category: e.target.value }))}>
              <option>Knee</option><option>Spine</option><option>Shoulder</option><option>Regenerative</option><option>Sports</option><option>Hip</option><option>General</option>
            </select>
            <textarea className="w-full rounded-lg border bg-background px-3 py-2 text-sm" rows={2} placeholder="Description" value={pkgForm.description} onChange={e => setPkgForm(p => ({ ...p, description: e.target.value }))} />
            <input type="number" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Base price (paise)" value={pkgForm.basePriceCents} onChange={e => setPkgForm(p => ({ ...p, basePriceCents: e.target.value }))} />
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowPkgForm(false)}>Cancel</Button><Button onClick={handleCreatePkg}>Create</Button></div>
          </CardContent>
        </Card></div>
      )}

      {showPropForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><Card className="w-full max-w-md">
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-lg">New Proposal</CardTitle><Button variant="ghost" size="icon" onClick={() => setShowPropForm(false)}><X className="h-4 w-4" /></Button></CardHeader>
          <CardContent className="space-y-3">
            <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Patient name *" value={propForm.patientName} onChange={e => setPropForm(p => ({ ...p, patientName: e.target.value }))} />
            <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Package name *" value={propForm.packageName} onChange={e => setPropForm(p => ({ ...p, packageName: e.target.value }))} />
            <input type="number" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Proposed price (paise)" value={propForm.proposedPriceCents} onChange={e => setPropForm(p => ({ ...p, proposedPriceCents: e.target.value }))} />
            <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Counsellor" value={propForm.counsellorLabel} onChange={e => setPropForm(p => ({ ...p, counsellorLabel: e.target.value }))} />
            <textarea className="w-full rounded-lg border bg-background px-3 py-2 text-sm" rows={2} placeholder="Notes" value={propForm.notes} onChange={e => setPropForm(p => ({ ...p, notes: e.target.value }))} />
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowPropForm(false)}>Cancel</Button><Button onClick={() => void handleCreateProposal()}>Create</Button></div>
          </CardContent>
        </Card></div>
      )}
    </div>
  );
}
