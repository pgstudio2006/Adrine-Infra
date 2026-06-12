import { useMemo } from "react";
import { isAdrine2026Experience } from "@/lib/adrine/experience";
import DialysisDashboard2026 from "./DialysisDashboard2026";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperationsModulePage } from "@/components/operations/OperationsModulePage";
import { Link } from "react-router-dom";
import { useDialysisPlatformData } from "@/hooks/useDialysisPlatformData";
import { mapDialysisMachineRow, mapDialysisSessionRow } from "@/lib/dialysis/dialysis-presenters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { pickPlatformRows, allowDemoFallback } from "@/lib/platform/demo-fallback";
import {
  Activity, Users, Clock, AlertTriangle, CheckCircle,
  Droplets, Settings, TrendingUp, Cpu
} from "lucide-react";

const todaySessionsDemo = [
  { id: "DS-001", patient: "Ramesh Kumar", uhid: "UH-10234", time: "08:00 AM", machine: "HD-01", tech: "Sunil K", status: "In Progress", progress: 65 },
  { id: "DS-002", patient: "Lakshmi Devi", uhid: "UH-10456", time: "08:00 AM", machine: "HD-03", tech: "Priya M", status: "In Progress", progress: 40 },
  { id: "DS-003", patient: "Mohammad Ali", uhid: "UH-10789", time: "10:00 AM", machine: "HD-05", tech: "Ravi T", status: "Scheduled", progress: 0 },
  { id: "DS-004", patient: "Savita Joshi", uhid: "UH-11023", time: "10:00 AM", machine: "HD-02", tech: "Sunil K", status: "Scheduled", progress: 0 },
  { id: "DS-005", patient: "Anil Sharma", uhid: "UH-11234", time: "02:00 PM", machine: "HD-04", tech: "Priya M", status: "Scheduled", progress: 0 },
  { id: "DS-006", patient: "Fatima Begum", uhid: "UH-11456", time: "02:00 PM", machine: "HD-06", tech: "Ravi T", status: "Scheduled", progress: 0 },
];

const machineStatusDemo = [
  { id: "HD-01", model: "Fresenius 5008S", status: "In Use", patient: "Ramesh Kumar", hours: 12450 },
  { id: "HD-02", model: "Fresenius 5008S", status: "Available", patient: null, hours: 11200 },
  { id: "HD-03", model: "B.Braun Dialog+", status: "In Use", patient: "Lakshmi Devi", hours: 9800 },
  { id: "HD-04", model: "Nipro Surdial X", status: "Available", patient: null, hours: 7600 },
  { id: "HD-05", model: "Fresenius 5008S", status: "Available", patient: null, hours: 13100 },
  { id: "HD-06", model: "B.Braun Dialog+", status: "Maintenance", patient: null, hours: 15200 },
];

const alerts = [
  { type: "critical", message: "HD-06: Maintenance overdue — 200 hours past schedule", time: "2h ago" },
  { type: "warning", message: "Dialyzer stock low — 12 units remaining (reorder at 15)", time: "4h ago" },
  { type: "warning", message: "Patient Ramesh Kumar — BP 160/100 during session", time: "15m ago" },
  { type: "info", message: "Tomorrow: 8 sessions scheduled across 2 shifts", time: "1h ago" },
];

export default function DialysisDashboard() {
  if (isAdrine2026Experience()) return <DialysisDashboard2026 />;
  const { platformOn, sessions, machines, loading } = useDialysisPlatformData();
  const todaySessions = useMemo(
    () => pickPlatformRows(platformOn && sessions.length > 0, sessions.map(mapDialysisSessionRow), todaySessionsDemo),
    [platformOn, sessions],
  );
  const machineStatus = useMemo(() => {
    if (platformOn && machines.length > 0) {
      return machines.map((m) => {
        const active = sessions.find((s) => s.machineId === m.id && s.state === 'in_progress');
        return mapDialysisMachineRow(m, active);
      });
    }
    return pickPlatformRows(false, [], machineStatusDemo);
  }, [platformOn, machines, sessions]);

  return (
    <OperationsModulePage
      module="dialysis"
      layout="dashboard"
      title="Dialysis unit dashboard"
      subtitle={`Haemodialysis overview — ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
      actions={
        <>
          <Button variant="outline" size="sm" asChild><Link to="/dialysis/schedule">Schedule</Link></Button>
          <Button variant="outline" size="sm"><Settings className="w-4 h-4 mr-2" /> Unit settings</Button>
        </>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Droplets className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">{todaySessions.length}</p>
                <p className="text-xs text-muted-foreground">Today's Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10"><CheckCircle className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10"><Cpu className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold">4 / 6</p>
                <p className="text-xs text-muted-foreground">Machines Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10"><Users className="w-5 h-5 text-orange-600" /></div>
              <div>
                <p className="text-2xl font-bold">42</p>
                <p className="text-xs text-muted-foreground">Active Patients</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Today's Sessions */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4" /> Today's Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todaySessions.map(s => (
                  <div key={s.id} className="flex items-center gap-4 p-3 rounded-lg border bg-card">
                    <div className="min-w-[70px] text-xs font-mono text-muted-foreground">{s.time}</div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{s.patient}</p>
                      <p className="text-xs text-muted-foreground">{s.uhid} · Machine {s.machine} · Tech: {s.tech}</p>
                    </div>
                    {s.status === "In Progress" ? (
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Progress value={s.progress} className="h-2" />
                        <span className="text-xs font-mono">{s.progress}%</span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs">{s.status}</Badge>
                    )}
                    <Button variant="ghost" size="sm" className="text-xs">View</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((a, i) => (
                <div key={i} className={`p-3 rounded-lg border text-sm ${
                  a.type === 'critical' ? 'border-destructive/30 bg-destructive/5' :
                  a.type === 'warning' ? 'border-orange-300 bg-orange-50 dark:bg-orange-950/20' :
                  'border-border bg-muted/30'
                }`}>
                  <p className="text-xs">{a.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{a.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Machine Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Cpu className="w-4 h-4" /> Machine Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {machineStatus.map(m => (
              <div key={m.id} className={`p-4 rounded-lg border text-center ${
                m.status === 'In Use' ? 'border-primary/30 bg-primary/5' :
                m.status === 'Maintenance' ? 'border-destructive/30 bg-destructive/5' :
                'border-border bg-card'
              }`}>
                <Cpu className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="font-bold text-sm">{m.id}</p>
                <p className="text-[10px] text-muted-foreground">{m.model}</p>
                <Badge variant={m.status === 'In Use' ? 'default' : m.status === 'Maintenance' ? 'destructive' : 'secondary'} className="mt-2 text-[10px]">
                  {m.status}
                </Badge>
                {m.patient && <p className="text-[10px] mt-1 text-primary">{m.patient}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">{m.hours.toLocaleString()} hrs</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </OperationsModulePage>
  );
}
