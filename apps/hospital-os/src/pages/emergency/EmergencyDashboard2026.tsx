import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Ambulance,
  ArrowRight,
  Bed,
  HeartPulse,
  Siren,
  Users,
} from 'lucide-react';
import { WorkspacePage, MetricStrip, WorkflowPanel } from '@/components/shell/workspace-primitives';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useHospital } from '@/stores/hospitalStore';
import { useEmergencyOperationalStream } from '@/hooks/useEmergencyOperationalStream';
import {
  computeEmergencyDashboardStats,
  EMERGENCY_STATUS_LABELS,
  EMERGENCY_TRIAGE_LABELS,
  isActiveEmergencyCase,
  triageDistribution,
} from '@/lib/emergency/emergency-presenters';
import { cn } from '@/lib/utils';

const TRAUMA_BAYS = [
  { id: 'TB-1', label: 'Trauma Bay 1', capacity: 1 },
  { id: 'TB-2', label: 'Trauma Bay 2', capacity: 1 },
  { id: 'TB-3', label: 'Resus Bay', capacity: 1 },
  { id: 'TB-4', label: 'Observation', capacity: 2 },
] as const;

function greetingForHour() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function EmergencyDashboard2026() {
  const navigate = useNavigate();
  const { emergencyCases, createEmergencyCase } = useHospital();
  useEmergencyOperationalStream({ worklists: true });

  const stats = useMemo(() => computeEmergencyDashboardStats(emergencyCases), [emergencyCases]);
  const triageSummary = useMemo(() => triageDistribution(emergencyCases), [emergencyCases]);

  const activeCases = useMemo(
    () => emergencyCases.filter(isActiveEmergencyCase),
    [emergencyCases],
  );

  const triageBoard = useMemo(
    () =>
      emergencyCases
        .filter((c) => isActiveEmergencyCase(c) && (c.status === 'triage-pending' || !c.triage))
        .slice(0, 8),
    [emergencyCases],
  );

  const criticalCases = useMemo(
    () =>
      activeCases
        .filter((c) => c.triage === 'critical' || c.triage === 'urgent')
        .slice(0, 6),
    [activeCases],
  );

  const ambulanceCases = useMemo(
    () => activeCases.filter((c) => c.arrivalMode === 'Ambulance').slice(0, 6),
    [activeCases],
  );

  const traumaCases = useMemo(
    () =>
      activeCases.filter(
        (c) =>
          c.triage === 'critical' ||
          c.triage === 'urgent' ||
          c.complaint?.toLowerCase().includes('trauma') ||
          c.arrivalMode === 'Ambulance',
      ),
    [activeCases],
  );

  const traumaAssignments = useMemo(() => {
    const map = new Map<string, typeof traumaCases>();
    TRAUMA_BAYS.forEach((bay, i) => {
      const start = TRAUMA_BAYS.slice(0, i).reduce((s, b) => s + b.capacity, 0);
      const end = TRAUMA_BAYS.slice(0, i + 1).reduce((s, b) => s + b.capacity, 0);
      map.set(bay.id, traumaCases.slice(start, end));
    });
    return map;
  }, [traumaCases]);

  const observationCount = emergencyCases.filter((c) => c.status === 'under-observation').length;

  const handleQuickRegister = () => {
    createEmergencyCase({
      patientName: 'Unidentified Emergency Walk-in',
      arrivalMode: 'Walk-in',
      complaint: 'Acute distress - initial assessment pending',
      vitals: 'BP --, HR --, SpO2 --',
      mlcRequired: false,
    });
    navigate('/emergency/triage');
  };

  const dateLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <WorkspacePage
      title={`${greetingForHour()}, emergency team`}
      subtitle={`${dateLabel} · Triage board, active cases, ambulance arrivals, and trauma bays.`}
      actions={
        <Button size="sm" variant="destructive" className="gap-1.5" onClick={handleQuickRegister}>
          <Siren className="h-3.5 w-3.5" />
          New case
        </Button>
      }
    >
      <MetricStrip
        columns={4}
        metrics={[
          {
            id: 'active',
            label: 'Active cases',
            value: stats.activeCases,
            hint: stats.critical ? `${stats.critical} critical` : 'Board clear',
            icon: Siren,
          },
          {
            id: 'triage',
            label: 'In triage',
            value: stats.inTriage,
            hint: 'Pending assessment',
            icon: Users,
          },
          {
            id: 'treatment',
            label: 'Under treatment',
            value: stats.inTreatment,
            hint: `${observationCount} in observation`,
            icon: HeartPulse,
          },
          {
            id: 'ambulance',
            label: 'Ambulance arrivals',
            value: ambulanceCases.length,
            hint: 'Active transport cases',
            icon: Ambulance,
          },
        ]}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <WorkflowPanel title="Triage board" className="lg:col-span-2">
          {triageBoard.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No cases awaiting triage.</p>
          ) : (
            <ul className="divide-y divide-border/60 -mx-4 -mb-4">
              {triageBoard.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() => navigate('/emergency/triage')}
                >
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.patientName}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {c.arrivalMode} · {c.complaint}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {EMERGENCY_STATUS_LABELS[c.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 gap-1 text-xs"
            onClick={() => navigate('/emergency/triage')}
          >
            Open triage board <ArrowRight className="h-3 w-3" />
          </Button>
        </WorkflowPanel>

        <WorkflowPanel title="Triage distribution">
          {triageSummary.every((t) => t.count === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-4">No triage data yet.</p>
          ) : (
            <ul className="space-y-3">
              {triageSummary.map((t) => (
                <li key={t.category}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{t.category}</span>
                    <span className="font-medium">{t.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground/50 transition-all"
                      style={{ width: `${t.percent}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </WorkflowPanel>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <WorkflowPanel title="Critical & urgent cases">
          {criticalCases.length === 0 ? (
            <p className="text-sm text-muted-foreground">No critical or urgent cases on board.</p>
          ) : (
            <ul className="space-y-3">
              {criticalCases.map((c) => (
                <li
                  key={c.id}
                  className="flex items-start gap-3 text-sm cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate('/emergency/cases')}
                >
                  <Siren className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.patientName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.assignedDoctor ?? 'Unassigned'} · {c.createdAt}
                    </p>
                  </div>
                  {c.triage && (
                    <Badge
                      variant={c.triage === 'critical' ? 'destructive' : 'outline'}
                      className="text-[10px] shrink-0"
                    >
                      {EMERGENCY_TRIAGE_LABELS[c.triage]}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </WorkflowPanel>

        <WorkflowPanel title="Ambulance arrivals">
          {ambulanceCases.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active ambulance cases.</p>
          ) : (
            <ul className="space-y-3">
              {ambulanceCases.map((c) => (
                <li
                  key={c.id}
                  className="flex items-start gap-3 text-sm cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate('/emergency/ambulance')}
                >
                  <Ambulance className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.patientName}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.complaint}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{c.createdAt}</span>
                </li>
              ))}
            </ul>
          )}
        </WorkflowPanel>
      </div>

      <WorkflowPanel title="Trauma bays">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TRAUMA_BAYS.map((bay) => {
            const occupants = traumaAssignments.get(bay.id) ?? [];
            const occupied = occupants.length >= bay.capacity;
            return (
              <div
                key={bay.id}
                className={cn(
                  'rounded-lg border px-3 py-2.5',
                  occupied ? 'border-destructive/40 bg-destructive/5' : 'border-border/60 bg-muted/20',
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold">{bay.label}</span>
                  <Badge variant={occupied ? 'destructive' : 'outline'} className="text-[9px]">
                    {occupants.length}/{bay.capacity}
                  </Badge>
                </div>
                {occupants.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground">Available</p>
                ) : (
                  occupants.map((c) => (
                    <div key={c.id} className="text-[10px] border-t border-border/60 pt-1.5 mt-1.5 first:mt-0 first:pt-0 first:border-0">
                      <p className="font-medium truncate">{c.patientName}</p>
                      {c.triage && (
                        <p className="text-muted-foreground">{EMERGENCY_TRIAGE_LABELS[c.triage]}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </WorkflowPanel>

      <WorkflowPanel title="Quick actions">
        <div className="grid sm:grid-cols-3 gap-3">
          <Card
            className="cursor-pointer border-foreground/10 hover:border-foreground/25 hover:shadow-sm transition-all"
            onClick={() => navigate('/emergency/triage')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <Activity className="h-5 w-5 text-foreground/70" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Triage board</p>
                <p className="text-xs text-muted-foreground">{stats.inTriage} waiting</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer border-foreground/10 hover:border-foreground/25 hover:shadow-sm transition-all"
            onClick={() => navigate('/emergency/cases')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <Bed className="h-5 w-5 text-foreground/70" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Active cases</p>
                <p className="text-xs text-muted-foreground">{stats.activeCases} on board</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer border-foreground/10 hover:border-foreground/25 hover:shadow-sm transition-all"
            onClick={() => navigate('/emergency/ambulance')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <Ambulance className="h-5 w-5 text-foreground/70" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Ambulance log</p>
                <p className="text-xs text-muted-foreground">{ambulanceCases.length} arrivals</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      </WorkflowPanel>
    </WorkspacePage>
  );
}
