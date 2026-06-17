import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Stethoscope, Users, Building2, Plus, X, ArrowRight, TrendingUp } from 'lucide-react';
import { canUseCrmRuntime, platformListReferrals, platformCreateReferral, platformUpdateReferral, type PlatformCrmReferral } from '@/runtime/crm-runtime';
import { getPlatformSession } from '@/runtime/platform-session';
import { toast } from 'sonner';

const STORAGE_KEY = 'adrine_crm_referrals';

function loadLocal(): PlatformCrmReferral[] { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; } }
function saveLocal(rows: PlatformCrmReferral[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(rows)); }

const DEMO_REFERRALS: PlatformCrmReferral[] = [
  { id: 'ref-1', patientName: 'Rajesh Kumar', referralType: 'doctor', referringDoctor: 'Dr. Mehta (AIIMS)', referralSource: 'Doctor Referral', specialty: 'Knee', status: 'active', convertedToLead: true, leadId: 'L-101', createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 'ref-2', patientName: 'Sunita Devi', referralType: 'patient', referringDoctor: undefined, referralSource: 'Patient Referral', specialty: 'Spine', status: 'active', convertedToLead: true, leadId: 'L-102', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'ref-3', patientName: 'Amit Singh', referralType: 'doctor', referringDoctor: 'Dr. Kapoor (Max Hospital)', referralSource: 'Doctor Referral', specialty: 'Shoulder', status: 'active', convertedToLead: false, createdAt: new Date(Date.now() - 43200000).toISOString() },
  { id: 'ref-4', patientName: 'Meena Sharma', referralType: 'source', referringDoctor: undefined, referralSource: 'Google', specialty: 'Knee', status: 'converted', convertedToLead: true, leadId: 'L-103', createdAt: new Date(Date.now() - 345600000).toISOString() },
  { id: 'ref-5', patientName: 'Vikram Patel', referralType: 'doctor', referringDoctor: 'Dr. Singh (Fortis)', referralSource: 'Doctor Referral', specialty: 'Regenerative', status: 'active', convertedToLead: false, notes: 'Corporate referral from Fortis tie-up', createdAt: new Date(Date.now() - 259200000).toISOString() },
  { id: 'ref-6', patientName: 'Neha Gupta', referralType: 'source', referringDoctor: undefined, referralSource: 'Instagram', specialty: 'Spine', status: 'active', convertedToLead: false, createdAt: new Date(Date.now() - 604800000).toISOString() },
  { id: 'ref-7', patientName: 'Pradeep Joshi', referralType: 'doctor', referringDoctor: 'Dr. Agarwal (Medanta)', referralSource: 'Doctor Referral', specialty: 'Hip', status: 'active', convertedToLead: true, leadId: 'L-104', notes: 'Corporate screening camp referral', createdAt: new Date(Date.now() - 432000000).toISOString() },
];

const typeStyles: Record<string, string> = { doctor: 'bg-blue-500/10 text-blue-600', patient: 'bg-emerald-500/10 text-emerald-600', source: 'bg-violet-500/10 text-violet-600' };
const statusStyles: Record<string, string> = { active: 'bg-success/10 text-success', converted: 'bg-blue-500/10 text-blue-600', inactive: 'bg-muted text-muted-foreground' };

export default function ReferralManagement() {
  const platformOn = canUseCrmRuntime();
  const branchId = getPlatformSession()?.branchId;
  const [referrals, setReferrals] = useState<PlatformCrmReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ patientName: '', referralType: 'doctor', referringDoctor: '', referringHospital: '', referralSource: 'Doctor Referral', specialty: '', notes: '' });

  const refresh = useCallback(async () => {
    if (platformOn) { try { const data = await platformListReferrals(branchId); setReferrals(data); } catch { setReferrals(loadLocal()); } }
    else { setReferrals(loadLocal()); }
    setLoading(false);
  }, [platformOn, branchId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const filtered = useMemo(() => {
    if (tab === 'all') return referrals;
    if (tab === 'doctor') return referrals.filter(r => r.referralType === 'doctor');
    if (tab === 'patient') return referrals.filter(r => r.referralType === 'patient');
    return referrals.filter(r => r.referralType === 'source');
  }, [referrals, tab]);

  const stats = useMemo(() => ({
    total: referrals.length,
    doctorReferrals: referrals.filter(r => r.referralType === 'doctor').length,
    patientReferrals: referrals.filter(r => r.referralType === 'patient').length,
    sourceReferrals: referrals.filter(r => r.referralType === 'source').length,
    converted: referrals.filter(r => r.convertedToLead).length,
    conversionRate: referrals.length > 0 ? `${Math.round((referrals.filter(r => r.convertedToLead).length / referrals.length) * 100)}%` : '—',
  }), [referrals]);

  const doctorStats = useMemo(() => {
    const byDoctor = new Map<string, number>();
    referrals.filter(r => r.referringDoctor).forEach(r => {
      byDoctor.set(r.referringDoctor!, (byDoctor.get(r.referringDoctor!) ?? 0) + 1);
    });
    return Array.from(byDoctor.entries()).sort((a, b) => b[1] - a[1]);
  }, [referrals]);

  const sourceStats = useMemo(() => {
    const bySource = new Map<string, number>();
    referrals.forEach(r => {
      bySource.set(r.referralSource ?? 'Unknown', (bySource.get(r.referralSource ?? 'Unknown') ?? 0) + 1);
    });
    return Array.from(bySource.entries()).sort((a, b) => b[1] - a[1]);
  }, [referrals]);

  const handleCreate = async () => {
    if (!form.patientName.trim()) { toast.error('Patient name is required'); return; }
    const row: PlatformCrmReferral = { id: `ref-${Date.now()}`, patientName: form.patientName.trim(), referralType: form.referralType, referringDoctor: form.referringDoctor || undefined, referringHospital: form.referringHospital || undefined, referralSource: form.referralSource || undefined, specialty: form.specialty || undefined, status: 'active', convertedToLead: false, notes: form.notes || undefined, createdAt: new Date().toISOString() };
    if (platformOn) { try { const c = await platformCreateReferral(row as any, branchId); setReferrals(prev => [c, ...prev]); } catch { setReferrals(prev => [row, ...prev]); saveLocal([row, ...loadLocal()]); } }
    else { setReferrals(prev => [row, ...prev]); saveLocal([row, ...loadLocal()]); }
    setForm({ patientName: '', referralType: 'doctor', referringDoctor: '', referringHospital: '', referralSource: 'Doctor Referral', specialty: '', notes: '' });
    setShowCreate(false); toast.success('Referral recorded');
  };

  const convertToLead = async (id: string) => {
    if (platformOn) { try { await platformUpdateReferral(id, { convertedToLead: true }); } catch { /* */ } }
    setReferrals(prev => prev.map(r => r.id === id ? { ...r, convertedToLead: true, status: 'converted' } : r));
    toast.success('Referral converted to lead');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><h1 className="text-2xl font-bold">Referral Management</h1><p className="text-sm text-muted-foreground">Track doctor, patient, and source referrals with conversion tracking</p></div>
        <Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" /> Add Referral</Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[{ label: 'Total Referrals', value: stats.total, icon: Users }, { label: 'Doctor Referrals', value: stats.doctorReferrals, icon: Stethoscope }, { label: 'Patient Referrals', value: stats.patientReferrals, icon: UserPlus }, { label: 'Converted', value: stats.converted, icon: ArrowRight }, { label: 'Conversion Rate', value: stats.conversionRate, icon: TrendingUp }].map(s => (
          <Card key={s.label}><CardContent className="pt-6"><div className="flex items-start justify-between"><div><p className="text-xs text-muted-foreground">{s.label}</p><p className="mt-1 text-2xl font-bold">{s.value}</p></div><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><s.icon className="h-5 w-5 text-primary" /></div></div></CardContent></Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="doctor">Doctor ({stats.doctorReferrals})</TabsTrigger>
          <TabsTrigger value="patient">Patient ({stats.patientReferrals})</TabsTrigger>
          <TabsTrigger value="source">Source ({stats.sourceReferrals})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Patient</TableHead><TableHead>Type</TableHead><TableHead>Referred By</TableHead><TableHead>Source</TableHead><TableHead>Specialty</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No referrals found</TableCell></TableRow>
                ) : filtered.map(ref => (
                  <TableRow key={ref.id}>
                    <TableCell className="font-medium">{ref.patientName}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-[10px] ${typeStyles[ref.referralType] ?? ''}`}>{ref.referralType}</Badge></TableCell>
                    <TableCell className="text-sm">{ref.referringDoctor ?? '—'}</TableCell>
                    <TableCell className="text-sm">{ref.referralSource ?? '—'}</TableCell>
                    <TableCell className="text-sm">{ref.specialty ?? '—'}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-[10px] ${statusStyles[ref.status] ?? ''}`}>{ref.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      {!ref.convertedToLead && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => convertToLead(ref.id)}>Convert</Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Top Referring Doctors</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {doctorStats.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No doctor referrals yet</p> : doctorStats.map(([doctor, count]) => (
                <div key={doctor} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2"><Stethoscope className="h-4 w-4 text-blue-500" /><p className="text-sm font-medium">{doctor}</p></div>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Source Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {sourceStats.map(([source, count]) => (
                <div key={source} className="flex items-center justify-between rounded-lg border p-3">
                  <p className="text-sm font-medium">{source}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${(count / stats.total) * 100}%` }} /></div>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-lg">Add Referral</CardTitle><Button variant="ghost" size="icon" onClick={() => setShowCreate(false)}><X className="h-4 w-4" /></Button></CardHeader>
            <CardContent className="space-y-3">
              <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Patient name *" value={form.patientName} onChange={e => setForm(p => ({ ...p, patientName: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <select className="rounded-lg border bg-background px-3 py-2 text-sm" value={form.referralType} onChange={e => setForm(p => ({ ...p, referralType: e.target.value }))}>
                  <option value="doctor">Doctor Referral</option><option value="patient">Patient Referral</option><option value="source">Source Referral</option>
                </select>
                <select className="rounded-lg border bg-background px-3 py-2 text-sm" value={form.referralSource} onChange={e => setForm(p => ({ ...p, referralSource: e.target.value }))}>
                  <option>Doctor Referral</option><option>Patient Referral</option><option>Google</option><option>Instagram</option><option>Facebook</option><option>Website</option><option>Walk-in</option><option>Corporate Camp</option>
                </select>
              </div>
              {form.referralType === 'doctor' && <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Referring doctor" value={form.referringDoctor} onChange={e => setForm(p => ({ ...p, referringDoctor: e.target.value }))} />}
              <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Hospital / Clinic" value={form.referringHospital} onChange={e => setForm(p => ({ ...p, referringHospital: e.target.value }))} />
              <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={form.specialty} onChange={e => setForm(p => ({ ...p, specialty: e.target.value }))}>
                <option value="">Select specialty</option><option>Knee</option><option>Spine</option><option>Shoulder</option><option>Hip</option><option>Sports</option><option>Regenerative</option>
              </select>
              <textarea className="w-full rounded-lg border bg-background px-3 py-2 text-sm" rows={2} placeholder="Notes" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button onClick={() => void handleCreate()}>Add Referral</Button></div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
