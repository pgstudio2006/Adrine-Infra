import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, Clock, ListTodo, Pill, Syringe, TestTube } from 'lucide-react';
import { toast } from 'sonner';
import type { NursingValidationContext } from '@adrine/hospital-operations';
import { useHospital } from '@/stores/hospitalStore';
import { useClinicalPlatformListSync } from '@/hooks/useClinicalPlatformListSync';
import { formatPlatformErrorBody, PlatformApiError } from '@/runtime/platform-client';
import {
  canUseNursingRuntime,
  platformCreateNursingTask,
  platformListNursingTasksForAdmission,
  platformNursingTransition,
  type PlatformNursingTask,
} from '@/runtime/nursing-runtime';
import {
  ClinicalTableEmptyRow,
  ClinicalTableLoadingRow,
  NursePageHeader,
} from '@/components/clinical/ClinicalTableStates';

interface TaskRow {
  id: string;
  uhid: string;
  patient: string;
  bed: string;
  task: string;
  category: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  scheduled: string;
  completed?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'missed';
  orderedBy?: string;
}

const priorityColor = (p: string) => {
  if (p === 'urgent' || p === 'high') return 'destructive';
  if (p === 'high') return 'default';
  return 'outline';
};

const categoryIcon = (c: string) => {
  if (c === 'Medication' || c.toLowerCase().includes('med')) return <Pill className="h-3.5 w-3.5" />;
  if (c.toLowerCase().includes('sample')) return <TestTube className="h-3.5 w-3.5" />;
  if (c.toLowerCase().includes('procedure')) return <Syringe className="h-3.5 w-3.5" />;
  return <Clock className="h-3.5 w-3.5" />;
};

function mapPlatformPriority(p?: string | null): TaskRow['priority'] {
  const v = (p || '').toLowerCase();
  if (v === 'urgent' || v === 'emergency') return 'urgent';
  if (v === 'high') return 'high';
  if (v === 'low') return 'low';
  return 'normal';
}

function mapPlatformTaskToRow(
  t: PlatformNursingTask,
  admission: { uhid: string; patientName: string; bed: string } | undefined,
): TaskRow {
  const st = t.state;
  const status: TaskRow['status'] =
    st === 'completed'
      ? 'completed'
      : st === 'missed'
        ? 'missed'
        : st === 'in_progress'
          ? 'in_progress'
          : 'pending';

  return {
    id: t.id,
    uhid: admission?.uhid ?? t.patientId.slice(0, 8),
    patient: admission?.patientName ?? 'Inpatient',
    bed: admission?.bed ?? '—',
    task: t.description,
    category: t.taskType,
    priority: mapPlatformPriority(t.priority),
    scheduled: t.dueAt
      ? new Date(t.dueAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      : '—',
    completed: t.completedAt
      ? new Date(t.completedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      : undefined,
    status,
    orderedBy: t.assignedTo ?? undefined,
  };
}

type AdmissionLinked = {
  id: string;
  uhid: string;
  patientName: string;
  bed: string;
  platformAdmissionId: string;
};

async function runGovernedTaskCompletion(taskId: string, initialState: string, initialVersion: number) {
  const ctx: NursingValidationContext = {
    nurseAssigned: true,
    taskDocumentationComplete: true,
  };
  let version = initialVersion;
  let state = initialState;

  const step = async (action: string) => {
    const { task } = await platformNursingTransition(taskId, action, ctx, version);
    version = task.version;
    state = task.state;
  };

  if (state === 'scheduled') await step('acknowledge_task');
  if (state === 'acknowledged') await step('start_task');
  if (state === 'in_progress') await step('complete_task');
}

export default function NurseTasks() {
  const { admissions, patients, inpatientCareOrders } = useHospital();
  useClinicalPlatformListSync({ ipd: true, departmentWorklists: false });
  const platformOk = canUseNursingRuntime();
  const [filter, setFilter] = useState('all');
  const [platformTasksRaw, setPlatformTasksRaw] = useState<
    { task: PlatformNursingTask; admission?: AdmissionLinked }[]
  >([]);
  const [platformLoadError, setPlatformLoadError] = useState<string | null>(null);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [createAdmissionLocalId, setCreateAdmissionLocalId] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTaskType, setNewTaskType] = useState('Monitoring');
  const [creating, setCreating] = useState(false);

  const ipdPlatformAdmissions = useMemo(
    () =>
      admissions
        .filter((a) => a.status !== 'discharged' && !!a.platformAdmissionId)
        .map(
          (a): AdmissionLinked => ({
            id: a.id,
            uhid: a.uhid,
            patientName: a.patientName,
            bed: a.bed,
            platformAdmissionId: a.platformAdmissionId!,
          }),
        ),
    [admissions],
  );

  const nursingOrders = useMemo(() => {
    const activeIds = new Set(admissions.filter((a) => a.status !== 'discharged').map((a) => a.id));
    return inpatientCareOrders
      .filter((order) => activeIds.has(order.admissionId) && order.status === 'Pending')
      .map((order) => ({
        id: order.id,
        uhid: order.uhid,
        patient: order.patientName,
        order: order.item,
        doctor: order.orderedBy,
        priority: order.priority,
        time: order.orderedAt,
        status: order.status,
      }));
  }, [admissions, inpatientCareOrders]);

  const refreshPlatformTasks = useCallback(async () => {
    if (!platformOk || ipdPlatformAdmissions.length === 0) {
      setPlatformTasksRaw([]);
      setPlatformLoadError(null);
      return;
    }
    setLoadingTasks(true);
    setPlatformLoadError(null);
    try {
      const bundles = await Promise.all(
        ipdPlatformAdmissions.map(async (adm) => {
          const list = await platformListNursingTasksForAdmission(adm.platformAdmissionId);
          return list.map((task) => ({ task, admission: adm }));
        }),
      );
      setPlatformTasksRaw(bundles.flat());
    } catch (err) {
      const body = err instanceof PlatformApiError ? err.body : undefined;
      const msg =
        formatPlatformErrorBody(body) ?? (err instanceof Error ? err.message : 'Could not load nursing tasks');
      setPlatformLoadError(msg);
      toast.error('Failed to load nursing tasks', { description: msg });
    } finally {
      setLoadingTasks(false);
    }
  }, [platformOk, ipdPlatformAdmissions]);

  useEffect(() => {
    void refreshPlatformTasks();
  }, [refreshPlatformTasks]);

  useEffect(() => {
    if (!platformOk) return;
    const timer = setInterval(() => void refreshPlatformTasks(), 22_000);
    return () => clearInterval(timer);
  }, [platformOk, refreshPlatformTasks]);

  const tasks: TaskRow[] = useMemo(
    () => platformTasksRaw.map(({ task, admission }) => mapPlatformTaskToRow(task, admission)),
    [platformTasksRaw],
  );

  const pending = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const completed = tasks.filter((t) => t.status === 'completed');
  const filteredPending = filter === 'all' ? pending : pending.filter((t) => t.category === filter);

  const handleComplete = async (row: TaskRow) => {
    const found = platformTasksRaw.find((x) => x.task.id === row.id);
    if (!found) return;
    setCompletingId(row.id);
    try {
      await runGovernedTaskCompletion(found.task.id, found.task.state, found.task.version);
      toast.success('Task completed');
      await refreshPlatformTasks();
    } catch (err) {
      const body = err instanceof PlatformApiError ? err.body : undefined;
      const msg = formatPlatformErrorBody(body) ?? (err instanceof Error ? err.message : 'Transition rejected');
      toast.error('Could not complete task', { description: msg });
    } finally {
      setCompletingId(null);
    }
  };

  const handleCreateTask = async () => {
    const adm = admissions.find((a) => a.id === createAdmissionLocalId);
    const patient = patients.find((p) => p.uhid === adm?.uhid);
    if (!adm?.platformAdmissionId || !patient?.platformPatientId) {
      toast.error('Select a platform-linked admission.');
      return;
    }
    if (!newDescription.trim()) {
      toast.error('Enter a task description.');
      return;
    }
    setCreating(true);
    try {
      await platformCreateNursingTask({
        admissionId: adm.platformAdmissionId,
        patientId: patient.platformPatientId,
        taskType: newTaskType,
        description: newDescription.trim(),
      });
      toast.success('Nursing task created');
      setNewDescription('');
      await refreshPlatformTasks();
    } catch (err) {
      const body = err instanceof PlatformApiError ? err.body : undefined;
      const msg = formatPlatformErrorBody(body) ?? (err instanceof Error ? err.message : 'Create rejected');
      toast.error('Could not create task', { description: msg });
    } finally {
      setCreating(false);
    }
  };

  const renderTaskTable = (rows: TaskRow[], pendingActions: boolean) => (
    <Card className="border-border">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Due</TableHead>
              {pendingActions ? <TableHead /> : <TableHead>Completed</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingTasks ? (
              <ClinicalTableLoadingRow colSpan={pendingActions ? 6 : 5} />
            ) : rows.length === 0 ? (
              <ClinicalTableEmptyRow
                colSpan={pendingActions ? 6 : 5}
                title={pendingActions ? 'No pending tasks' : 'No completed tasks'}
                description={
                  platformOk && ipdPlatformAdmissions.length === 0
                    ? 'Admit a platform-linked inpatient to load governed nursing tasks.'
                    : 'Tasks from domain-api appear when assigned to active admissions.'
                }
              />
            ) : (
              rows.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="max-w-[220px]">
                    <p className="text-sm font-medium">{t.task}</p>
                    {t.orderedBy ? (
                      <p className="text-xs text-muted-foreground">Assigned {t.orderedBy}</p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{t.patient}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.uhid} · {t.bed}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs">
                      {categoryIcon(t.category)}
                      {t.category}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={priorityColor(t.priority)} className="text-xs capitalize">
                      {t.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {pendingActions ? t.scheduled : t.completed ?? '—'}
                  </TableCell>
                  <TableCell>
                    {pendingActions ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        disabled={completingId === t.id || !platformOk}
                        onClick={() => void handleComplete(t)}
                      >
                        {completingId === t.id ? '…' : 'Complete'}
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <NursePageHeader
        title="Nursing tasks"
        description={
          platformOk
            ? 'Governed task list from domain-api for platform-linked admissions.'
            : 'Enable platform runtime to load and complete nursing tasks.'
        }
      />

      {!platformOk ? (
        <Alert>
          <AlertTitle>Platform required</AlertTitle>
          <AlertDescription>
            Nursing task create and complete actions require domain-api. Connect via Platform Admin, then open Ward
            or Admissions to sync IPD census.
          </AlertDescription>
        </Alert>
      ) : null}

      {platformLoadError ? (
        <Alert variant="destructive">
          <AlertTitle>Load error</AlertTitle>
          <AlertDescription>{platformLoadError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold">{pending.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold">{completed.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Urgent</p>
            <p className="text-2xl font-bold">{pending.filter((t) => t.priority === 'urgent').length}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Care orders</p>
            <p className="text-2xl font-bold">{nursingOrders.length}</p>
          </CardContent>
        </Card>
      </div>

      {platformOk && ipdPlatformAdmissions.length > 0 ? (
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Create task</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
            <div className="min-w-[200px] flex-1 space-y-1">
              <p className="text-xs text-muted-foreground">Admission</p>
              <Select value={createAdmissionLocalId} onValueChange={setCreateAdmissionLocalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select admission" />
                </SelectTrigger>
                <SelectContent>
                  {ipdPlatformAdmissions.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.patientName} · {a.bed} ({a.uhid})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full space-y-1 md:w-40">
              <p className="text-xs text-muted-foreground">Type</p>
              <Select value={newTaskType} onValueChange={setNewTaskType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Medication">Medication</SelectItem>
                  <SelectItem value="Monitoring">Monitoring</SelectItem>
                  <SelectItem value="Procedure">Procedure</SelectItem>
                  <SelectItem value="Sample Collection">Sample Collection</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[220px] flex-1 space-y-1">
              <p className="text-xs text-muted-foreground">Description</p>
              <Input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="What needs to be done?"
              />
            </div>
            <Button disabled={creating} onClick={() => void handleCreateTask()} className="w-full md:w-auto">
              {creating ? 'Creating…' : 'Create task'}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">
            <ListTodo className="mr-1 h-3.5 w-3.5" />
            Pending
          </TabsTrigger>
          <TabsTrigger value="orders">Care orders</TabsTrigger>
          <TabsTrigger value="completed">
            <CheckCircle className="mr-1 h-3.5 w-3.5" />
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-4 space-y-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="Medication">Medication</SelectItem>
              <SelectItem value="Monitoring">Monitoring</SelectItem>
              <SelectItem value="Procedure">Procedure</SelectItem>
              <SelectItem value="Sample Collection">Sample Collection</SelectItem>
            </SelectContent>
          </Select>
          {renderTaskTable(filteredPending, true)}
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <Card className="border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Ordered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nursingOrders.length === 0 ? (
                    <ClinicalTableEmptyRow
                      colSpan={4}
                      title="No pending care orders"
                      description="Doctor inpatient orders appear here for active admissions."
                    />
                  ) : (
                    nursingOrders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell>
                          <p className="text-sm font-medium">{o.patient}</p>
                          <p className="text-xs text-muted-foreground">{o.uhid}</p>
                        </TableCell>
                        <TableCell className="text-sm">{o.order}</TableCell>
                        <TableCell>
                          <Badge variant={priorityColor(o.priority)} className="text-xs">
                            {o.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {o.doctor} · {o.time}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {renderTaskTable(completed, false)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
