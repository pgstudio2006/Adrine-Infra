import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCheck, ClipboardList, Package, TrendingUp, Plus, X, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { canUseCrmRuntime, platformListTasks, platformCreateTask, platformUpdateTask, platformListProposals, platformCreateProposal, platformUpdateProposal, type PlatformCrmTask, type PlatformCrmProposal } from '@/runtime/crm-runtime';
import { getPlatformSession } from '@/runtime/platform-session';
import { toast } from 'sonner';

const TASK_KEY = 'adrine_crm_counsellor_tasks';
const PROPOSAL_KEY = 'adrine_crm_counsellor_proposals';

function loadJson<T>(key: string, fallback: T): T { try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; } catch { return fallback; } }
function saveJson(key: string, data: unknown) { localStorage.setItem(key, JSON.stringify(data)); }

const DEMO_TASKS: PlatformCrmTask[] = [
  { id: 't-1', patientName: 'Rajesh Kumar', assignedTo: 'Counsellor Priya', taskType: 'follow_up', title: 'Call to confirm knee replacement package acceptance', status: 'pending', priority: 'high', dueAt: new Date(Date.now() + 86400000).toISOString(), createdAt: new Date().toISOString() },
  { id: 't-2', patientName: 'Sunita Devi', assignedTo: 'Counsellor Rahul', taskType: 'proposal', title: 'Send spine treatment package proposal', status: 'pending', priority: 'medium', dueAt: new Date(Date.now() + 172800000).toISOString(), createdAt: new Date().toISOString() },
  { id: 't-3', patientName: 'Amit Singh', assignedTo: 'Counsellor Priya', taskType: 'follow_up', title: 'Follow-up on PRP treatment response', status: 'completed', priority: 'high', completedAt: new Date().toISOString(), createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 't-4', patientName: 'Meena Sharma', assignedTo: 'Counsellor Anjali', taskType: 'package', title: 'Prepare basic package for frozen shoulder', status: 'pending', priority: 'low', dueAt: new Date(Date.now() + 259200000).toISOString(), createdAt: new Date().toISOString() },
];

const DEMO_PROPOSALS: PlatformCrmProposal[] = [
  { id: 'p-1', patientName: 'Rajesh Kumar', packageName: 'Advanced Knee Package', proposedPriceCents: 1500000, counsellorLabel: 'Counsellor Priya', status: 'sent', notes: 'Includes PRP + physio sessions', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'p-2', patientName: 'Sunita Devi', packageName: 'Spine Care Basic', proposedPriceCents: 750000, counsellorLabel: 'Counsellor Rahul', status: 'accepted', notes: 'Ozone + physiotherapy', createdAt: new Date(Date.now() - 172800000).toISOString(), convertedAt: new Date().toISOString() },
  { id: 'p-3', patientName: 'Vikram Patel', packageName: 'Regenerative Premium', proposedPriceCents: 3000000, counsellorLabel: 'Counsellor Priya', status: 'draft', notes: 'Full regenerative treatment plan', createdAt: new Date().toISOString() },
  { id: 'p-4', patientName: 'Neha Gupta', packageName: 'Shoulder Recovery', proposedPriceCents: 900000, counsellorLabel: 'Counsellor Anjali', status: 'declined', notes: 'Patient deferred to next quarter', createdAt: new Date(Date.now() - 259200000).toISOString() },
];

const taskPriorityStyles: Record<string, string> = { high: 'bg-destructive/10 text-destructive', medium: 'bg-warning/10 text-warning', low: 'bg-muted text-muted-foreground' };
const proposalStatusStyles: Record<string, string> = { draft: 'bg-muted text-muted-foreground', sent: 'bg-blue-500/10 text-blue-600', accepted: 'bg-success/10 text-success', declined: 'bg-destructive/10 text-destructive' };

function formatPrice(cents: number) { return `₹${(cents / 100).toLocaleString('en-IN')}`; }

export default function CounsellorModule() {
  const platformOn = canUseCrmRuntime();
  const branchId = getPlatformSession()?.branchId;
  const [tasks, setTasks] = useState<PlatformCrmTask[]>([]);
  const [proposals, setProposals] = useState<PlatformCrmProposal[]>([]);
  const [tab, setTab] = useState('dashboard');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', patientName: '', assignedTo: '', taskType: 'follow_up', priority: 'medium', dueAt: '' });
  const [proposalForm, setProposalForm] = useState({ patientName: '', packageName: '', proposedPriceCents: '', counsellorLabel: '', notes: '' });

  const refresh = useCallback(async () => {
    if (platformOn) {
      try { const [t, p] = await Promise.all([platformListTasks(branchId), platformListProposals(branchId)]); setTasks(t); setProposals(p); } catch { setTasks(loadJson(TASK_KEY, DEMO_TASKS)); setProposals(loadJson(PROPOSAL_KEY, DEMO_PROPOSALS)); }
    } else { setTasks(loadJson(TASK_KEY, DEMO_TASKS)); setProposals(loadJson(PROPOSAL_KEY, DEMO_PROPOSALS)); }
  }, [platformOn, branchId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const stats = useMemo(() => ({
    assignedPatients: new Set(proposals.map(p => p.patientName)).size,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    activeProposals: proposals.filter(p => p.status === 'sent' || p.status === 'draft').length,
    conversions: proposals.filter(p => p.status === 'accepted').length,
    conversionRate: proposals.length > 0 ? `${Math.round((proposals.filter(p => p.status === 'accepted').length / proposals.length) * 100)}%` : '—',
  }), [tasks, proposals]);

  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) { toast.error('Title is required'); return; }
    const row: PlatformCrmTask = { id: `t-${Date.now()}`, ...taskForm, status: 'pending', createdAt: new Date().toISOString() };
    if (platformOn) { try { const c = await platformCreateTask(row as any, branchId); setTasks(prev => [c, ...prev]); } catch { setTasks(prev => [row, ...prev]); } }
    else { setTasks(prev => [row, ...prev]); saveJson(TASK_KEY, [row, ...tasks]); }
    setTaskForm({ title: '', patientName: '', assignedTo: '', taskType: 'follow_up', priority: 'medium', dueAt: '' });
    setShowTaskForm(false); toast.success('Task created');
  };

  const handleCreateProposal = async () => {
    if (!proposalForm.patientName.trim() || !proposalForm.packageName.trim()) { toast.error('Patient name and package are required'); return; }
    const row: PlatformCrmProposal = { id: `p-${Date.now()}`, ...proposalForm, proposedPriceCents: Number(proposalForm.proposedPriceCents) || 0, status: 'draft', createdAt: new Date().toISOString() };
    if (platformOn) { try { const c = await platformCreateProposal(row as any, branchId); setProposals(prev => [c, ...prev]); } catch { setProposals(prev => [row, ...prev]); } }
    else { setProposals(prev => [row, ...prev]); saveJson(PROPOSAL_KEY, [row, ...proposals]); }
    setProposalForm({ patientName: '', packageName: '', proposedPriceCents: '', counsellorLabel: '', notes: '' });
    setShowProposalForm(false); toast.success('Proposal created');
  };

  const completeTask = async (id: string) => {
    if (platformOn) { try { await platformUpdateTask(id, { status: 'completed', completedAt: new Date().toISOString() }); } catch { /* */ } }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'completed', completedAt: new Date().toISOString() } : t));
    toast.success('Task completed');
  };

  const updateProposalStatus = async (id: string, status: string) => {
    if (platformOn) { try { await platformUpdateProposal(id, { status, ...(status === 'accepted' ? { convertedAt: new Date().toISOString() } : {}) }); } catch { /* */ } }
    setProposals(prev => prev.map(p => p.id === id ? { ...p, status, ...(status === 'accepted' ? { convertedAt: new Date().toISOString() } : {}) } : p));
    toast.success(`Proposal ${status}`);
  };

  if (tab === 'dashboard') return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">Counsellor Dashboard</h1><p className="text-sm text-muted-foreground">Assigned patients, tasks, package proposals, and conversion tracking</p></div></div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[{ label: 'Assigned Patients', value: stats.assignedPatients, icon: UserCheck }, { label: 'Pending Tasks', value: stats.pendingTasks, icon: ClipboardList }, { label: 'Active Proposals', value: stats.activeProposals, icon: Package }, { label: 'Conversions', value: stats.conversions, icon: TrendingUp }, { label: 'Conversion Rate', value: stats.conversionRate, icon: TrendingUp }].map(s => (
          <Card key={s.label}><CardContent className="pt-6"><div className="flex items-start justify-between"><div><p className="text-xs text-muted-foreground">{s.label}</p><p className="mt-1 text-2xl font-bold">{s.value}</p></div><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><s.icon className="h-5 w-5 text-primary" /></div></div></CardContent></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Pending Tasks</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {tasks.filter(t => t.status === 'pending').slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
                <div><p className="text-sm font-medium">{t.title}</p><p className="text-xs text-muted-foreground">{t.patientName} · {t.assignedTo} · Due {t.dueAt ? new Date(t.dueAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</p></div>
                <div className="flex items-center gap-2"><Badge variant="outline" className={`text-[10px] ${taskPriorityStyles[t.priority] ?? ''}`}>{t.priority}</Badge><Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => completeTask(t.id)}><CheckCircle2 className="h-3 w-3" /></Button></div>
              </div>
            ))}
            {tasks.filter(t => t.status === 'pending').length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No pending tasks</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Recent Proposals</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {proposals.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                <div><p className="text-sm font-medium">{p.patientName}</p><p className="text-xs text-muted-foreground">{p.packageName} · {formatPrice(p.proposedPriceCents)}</p></div>
                <Badge variant="outline" className={`text-[10px] ${proposalStatusStyles[p.status] ?? ''}`}>{p.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">{tab === 'tasks' ? 'Task Management' : 'Package Proposals'}</h1></div>
        <div className="flex gap-2">
          {tab === 'tasks' && <Button onClick={() => setShowTaskForm(true)}><Plus className="mr-2 h-4 w-4" /> New Task</Button>}
          {tab === 'proposals' && <Button onClick={() => setShowProposalForm(true)}><Plus className="mr-2 h-4 w-4" /> New Proposal</Button>}
        </div>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList><TabsTrigger value="dashboard">Dashboard</TabsTrigger><TabsTrigger value="tasks">Tasks</TabsTrigger><TabsTrigger value="proposals">Proposals</TabsTrigger></TabsList>
      </Tabs>

      {tab === 'tasks' && (
        <Card><CardContent className="p-0">
          <Table><TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Patient</TableHead><TableHead>Assigned</TableHead><TableHead>Type</TableHead><TableHead>Due</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>{tasks.map(t => (
              <TableRow key={t.id} className={t.status === 'pending' && t.dueAt && new Date(t.dueAt) < new Date() ? 'bg-destructive/5' : ''}>
                <TableCell className="font-medium">{t.title}</TableCell><TableCell>{t.patientName ?? '—'}</TableCell><TableCell>{t.assignedTo ?? '—'}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{t.taskType}</Badge></TableCell>
                <TableCell className="text-sm">{t.dueAt ? new Date(t.dueAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</TableCell>
                <TableCell><Badge variant="outline" className={`text-[10px] ${taskPriorityStyles[t.priority] ?? ''}`}>{t.priority}</Badge></TableCell>
                <TableCell><Badge variant="outline" className={`text-[10px] ${t.status === 'completed' ? 'bg-success/10 text-success' : ''}`}>{t.status}</Badge></TableCell>
                <TableCell className="text-right">{t.status === 'pending' && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => completeTask(t.id)}>Complete</Button>}</TableCell>
              </TableRow>
            ))}</TableBody></Table>
        </CardContent></Card>
      )}

      {tab === 'proposals' && (
        <Card><CardContent className="p-0">
          <Table><TableHeader><TableRow><TableHead>Patient</TableHead><TableHead>Package</TableHead><TableHead>Price</TableHead><TableHead>Counsellor</TableHead><TableHead>Notes</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>{proposals.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.patientName}</TableCell><TableCell>{p.packageName}</TableCell><TableCell>{formatPrice(p.proposedPriceCents)}</TableCell>
                <TableCell>{p.counsellorLabel ?? '—'}</TableCell><TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{p.notes ?? '—'}</TableCell>
                <TableCell><Badge variant="outline" className={`text-[10px] ${proposalStatusStyles[p.status] ?? ''}`}>{p.status}</Badge></TableCell>
                <TableCell className="text-right">
                  {p.status === 'draft' && <Button size="sm" variant="outline" className="h-7 text-xs mr-1" onClick={() => updateProposalStatus(p.id, 'sent')}>Send</Button>}
                  {p.status === 'sent' && <><Button size="sm" variant="outline" className="h-7 text-xs mr-1 text-success" onClick={() => updateProposalStatus(p.id, 'accepted')}>Accept</Button><Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={() => updateProposalStatus(p.id, 'declined')}>Decline</Button></>}
                </TableCell>
              </TableRow>
            ))}</TableBody></Table>
        </CardContent></Card>
      )}

      {showTaskForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><Card className="w-full max-w-md">
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-lg">New Task</CardTitle><Button variant="ghost" size="icon" onClick={() => setShowTaskForm(false)}><X className="h-4 w-4" /></Button></CardHeader>
          <CardContent className="space-y-3">
            <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Task title *" value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} />
            <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Patient name" value={taskForm.patientName} onChange={e => setTaskForm(p => ({ ...p, patientName: e.target.value }))} />
            <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Assigned to" value={taskForm.assignedTo} onChange={e => setTaskForm(p => ({ ...p, assignedTo: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <select className="rounded-lg border bg-background px-3 py-2 text-sm" value={taskForm.taskType} onChange={e => setTaskForm(p => ({ ...p, taskType: e.target.value }))}><option value="follow_up">Follow-up</option><option value="proposal">Proposal</option><option value="package">Package</option><option value="call">Call</option></select>
              <select className="rounded-lg border bg-background px-3 py-2 text-sm" value={taskForm.priority} onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value }))}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
            </div>
            <input type="datetime-local" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={taskForm.dueAt} onChange={e => setTaskForm(p => ({ ...p, dueAt: e.target.value }))} />
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowTaskForm(false)}>Cancel</Button><Button onClick={() => void handleCreateTask()}>Create</Button></div>
          </CardContent>
        </Card></div>
      )}

      {showProposalForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><Card className="w-full max-w-md">
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-lg">New Proposal</CardTitle><Button variant="ghost" size="icon" onClick={() => setShowProposalForm(false)}><X className="h-4 w-4" /></Button></CardHeader>
          <CardContent className="space-y-3">
            <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Patient name *" value={proposalForm.patientName} onChange={e => setProposalForm(p => ({ ...p, patientName: e.target.value }))} />
            <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Package name *" value={proposalForm.packageName} onChange={e => setProposalForm(p => ({ ...p, packageName: e.target.value }))} />
            <input type="number" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Price (paise)" value={proposalForm.proposedPriceCents} onChange={e => setProposalForm(p => ({ ...p, proposedPriceCents: e.target.value }))} />
            <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Counsellor" value={proposalForm.counsellorLabel} onChange={e => setProposalForm(p => ({ ...p, counsellorLabel: e.target.value }))} />
            <textarea className="w-full rounded-lg border bg-background px-3 py-2 text-sm" rows={2} placeholder="Notes" value={proposalForm.notes} onChange={e => setProposalForm(p => ({ ...p, notes: e.target.value }))} />
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowProposalForm(false)}>Cancel</Button><Button onClick={() => void handleCreateProposal()}>Create</Button></div>
          </CardContent>
        </Card></div>
      )}
    </div>
  );
}
