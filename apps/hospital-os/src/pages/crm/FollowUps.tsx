import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarCheck2, Clock, PhoneCall, Plus, X, CheckCircle2, AlertTriangle, MessageSquare } from 'lucide-react';
import { canUseCrmRuntime, platformListFollowUps, platformCreateFollowUp, platformUpdateFollowUp, type PlatformCrmFollowUp } from '@/runtime/crm-runtime';
import { getPlatformSession } from '@/runtime/platform-session';
import { toast } from 'sonner';

const STORAGE_KEY = 'adrine_crm_follow_ups';

function loadLocal(): PlatformCrmFollowUp[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
}
function saveLocal(rows: PlatformCrmFollowUp[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(rows)); }

const DEMO_FOLLOW_UPS: PlatformCrmFollowUp[] = [
  { id: 'fu-1', patientName: 'Rajesh Kumar', phone: '9876543210', assignedTo: 'Counsellor Priya', followUpType: 'call', scheduledAt: new Date(Date.now() + 86400000).toISOString(), status: 'scheduled', priority: 'high', notes: 'Post-consultation follow-up for knee replacement package' },
  { id: 'fu-2', patientName: 'Sunita Devi', phone: '9812345678', assignedTo: 'Counsellor Rahul', followUpType: 'whatsapp', scheduledAt: new Date(Date.now() - 3600000).toISOString(), status: 'scheduled', priority: 'medium', notes: 'Spine consultation package proposal pending' },
  { id: 'fu-3', patientName: 'Amit Singh', phone: '9988776655', assignedTo: 'Counsellor Priya', followUpType: 'visit', scheduledAt: new Date(Date.now() - 86400000).toISOString(), status: 'completed', outcome: 'Patient agreed to basic package', priority: 'high', completedAt: new Date().toISOString() },
  { id: 'fu-4', patientName: 'Meena Sharma', phone: '9871234567', assignedTo: 'Counsellor Anjali', followUpType: 'call', scheduledAt: new Date(Date.now() - 172800000).toISOString(), status: 'missed', priority: 'medium', notes: 'No answer after 3 attempts', missedAt: new Date().toISOString() },
  { id: 'fu-5', patientName: 'Vikram Patel', phone: '9765432100', assignedTo: 'Counsellor Rahul', followUpType: 'sms', scheduledAt: new Date(Date.now() + 172800000).toISOString(), status: 'scheduled', priority: 'low', notes: 'PRP treatment follow-up reminder' },
];

const typeIcons: Record<string, typeof PhoneCall> = { call: PhoneCall, whatsapp: MessageSquare, visit: CalendarCheck2, sms: MessageSquare };
const priorityStyles: Record<string, string> = { high: 'bg-destructive/10 text-destructive border-destructive/20', medium: 'bg-warning/10 text-warning border-warning/20', low: 'bg-muted text-muted-foreground border-border' };
const statusStyles: Record<string, string> = { scheduled: 'bg-blue-500/10 text-blue-600 border-blue-200', completed: 'bg-success/10 text-success border-success/20', missed: 'bg-destructive/10 text-destructive border-destructive/20' };

export default function FollowUps() {
  const platformOn = canUseCrmRuntime();
  const branchId = getPlatformSession()?.branchId;
  const [followUps, setFollowUps] = useState<PlatformCrmFollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ patientName: '', phone: '', assignedTo: '', followUpType: 'call', scheduledAt: '', priority: 'medium', notes: '' });

  const refresh = useCallback(async () => {
    if (platformOn) {
      try { const data = await platformListFollowUps(branchId, tab === 'all' ? undefined : tab); setFollowUps(data); } catch { setFollowUps(loadLocal()); }
    } else { setFollowUps(loadLocal()); }
    setLoading(false);
  }, [platformOn, branchId, tab]);

  useEffect(() => { setLoading(true); void refresh(); }, [refresh]);

  const filtered = useMemo(() => {
    if (tab === 'all') return followUps;
    return followUps.filter(f => f.status === tab);
  }, [followUps, tab]);

  const stats = useMemo(() => ({
    scheduled: followUps.filter(f => f.status === 'scheduled').length,
    completed: followUps.filter(f => f.status === 'completed').length,
    missed: followUps.filter(f => f.status === 'missed').length,
    overdue: followUps.filter(f => f.status === 'scheduled' && new Date(f.scheduledAt) < new Date()).length,
  }), [followUps]);

  const handleCreate = async () => {
    if (!form.patientName.trim() || !form.scheduledAt) { toast.error('Patient name and scheduled date are required'); return; }
    const row: PlatformCrmFollowUp = {
      id: `fu-${Date.now()}`, patientName: form.patientName.trim(), phone: form.phone || undefined, assignedTo: form.assignedTo || undefined,
      followUpType: form.followUpType, scheduledAt: new Date(form.scheduledAt).toISOString(), status: 'scheduled', priority: form.priority, notes: form.notes || undefined,
    };
    if (platformOn) {
      try { const created = await platformCreateFollowUp(row as any, branchId); setFollowUps(prev => [created, ...prev]); } catch { setFollowUps(prev => [row, ...prev]); saveLocal([row, ...loadLocal()]); }
    } else { setFollowUps(prev => [row, ...prev]); saveLocal([row, ...loadLocal()]); }
    setForm({ patientName: '', phone: '', assignedTo: '', followUpType: 'call', scheduledAt: '', priority: 'medium', notes: '' });
    setShowCreate(false);
    toast.success('Follow-up scheduled');
  };

  const markStatus = async (id: string, status: string, outcome?: string) => {
    if (platformOn) {
      try {
        await platformUpdateFollowUp(id, {
          status,
          outcome,
          ...(status === 'completed'
            ? { completedAt: new Date().toISOString() }
            : { missedAt: new Date().toISOString() }),
        });
      } catch {
        /* ignore */
      }
    }
    setFollowUps(prev => prev.map(f => f.id === id ? { ...f, status, outcome, ...(status === 'completed' ? { completedAt: new Date().toISOString() } : { missedAt: new Date().toISOString() }) } : f));
    toast.success(`Follow-up marked as ${status}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Follow-up Management</h1>
          <p className="text-sm text-muted-foreground">Schedule, track, and manage patient follow-ups with reminders and outcome tracking</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" /> Schedule Follow-up</Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Scheduled</p><p className="mt-1 text-2xl font-bold text-blue-600">{stats.scheduled}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Completed</p><p className="mt-1 text-2xl font-bold text-success">{stats.completed}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Missed</p><p className="mt-1 text-2xl font-bold text-destructive">{stats.missed}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Overdue</p><p className="mt-1 text-2xl font-bold text-warning">{stats.overdue}</p></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="missed">Missed</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Patient</TableHead><TableHead>Type</TableHead><TableHead>Scheduled</TableHead><TableHead>Assigned To</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{loading ? 'Loading...' : 'No follow-ups found'}</TableCell></TableRow>
              ) : filtered.map(fu => {
                const Icon = typeIcons[fu.followUpType] ?? PhoneCall;
                const isOverdue = fu.status === 'scheduled' && new Date(fu.scheduledAt) < new Date();
                return (
                  <TableRow key={fu.id} className={isOverdue ? 'bg-destructive/5' : ''}>
                    <TableCell><p className="font-medium">{fu.patientName}</p>{fu.phone && <p className="text-xs text-muted-foreground">{fu.phone}</p>}</TableCell>
                    <TableCell><span className="flex items-center gap-1.5 text-sm"><Icon className="h-3.5 w-3.5" /> {fu.followUpType}</span></TableCell>
                    <TableCell><p className="text-sm">{new Date(fu.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p><p className="text-xs text-muted-foreground">{new Date(fu.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p></TableCell>
                    <TableCell className="text-sm">{fu.assignedTo ?? '—'}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-[10px] ${priorityStyles[fu.priority] ?? ''}`}>{fu.priority}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={`text-[10px] ${statusStyles[fu.status] ?? ''} ${isOverdue ? 'border-destructive' : ''}`}>{isOverdue ? 'Overdue' : fu.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      {fu.status === 'scheduled' && (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => markStatus(fu.id, 'completed', 'Followed up successfully')}><CheckCircle2 className="h-3 w-3 mr-1" /> Done</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={() => markStatus(fu.id, 'missed')}><AlertTriangle className="h-3 w-3 mr-1" /> Miss</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-lg">Schedule Follow-up</CardTitle><Button variant="ghost" size="icon" onClick={() => setShowCreate(false)}><X className="h-4 w-4" /></Button></CardHeader>
            <CardContent className="space-y-3">
              <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Patient name *" value={form.patientName} onChange={e => setForm(p => ({ ...p, patientName: e.target.value }))} />
              <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Assigned to (counsellor)" value={form.assignedTo} onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <select className="rounded-lg border bg-background px-3 py-2 text-sm" value={form.followUpType} onChange={e => setForm(p => ({ ...p, followUpType: e.target.value }))}>
                  <option value="call">Phone Call</option><option value="whatsapp">WhatsApp</option><option value="sms">SMS</option><option value="visit">In-Person Visit</option>
                </select>
                <select className="rounded-lg border bg-background px-3 py-2 text-sm" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                </select>
              </div>
              <input type="datetime-local" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={form.scheduledAt} onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))} />
              <textarea className="w-full rounded-lg border bg-background px-3 py-2 text-sm" rows={2} placeholder="Notes" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button onClick={() => void handleCreate()}>Schedule</Button></div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
