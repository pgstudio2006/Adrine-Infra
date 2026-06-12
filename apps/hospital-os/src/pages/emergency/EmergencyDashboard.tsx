import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Siren, Users, Clock, AlertTriangle, Bed,
  Ambulance, HeartPulse, ArrowRight
} from 'lucide-react';
import { useHospital } from '@/stores/hospitalStore';
import {
  computeEmergencyDashboardStats,
  EMERGENCY_STATUS_LABELS,
  EMERGENCY_TRIAGE_LABELS,
  isActiveEmergencyCase,
  triageDistribution,
} from '@/lib/emergency/emergency-presenters';
import { isPlatformRuntimeEnabled } from '@/runtime/platform-session';
import { useEmergencyOperationalStream } from '@/hooks/useEmergencyOperationalStream';
import { TraumaBayBoard } from '@/components/emergency/TraumaBayBoard';
import { isAdrine2026Experience } from '@/lib/adrine/experience';
import EmergencyDashboard2026 from './EmergencyDashboard2026';

export default function EmergencyDashboard() {
  if (isAdrine2026Experience()) return <EmergencyDashboard2026 />;
  const navigate = useNavigate();
  const { emergencyCases, createEmergencyCase } = useHospital();
  useEmergencyOperationalStream({ worklists: true });

  const stats = useMemo(() => computeEmergencyDashboardStats(emergencyCases), [emergencyCases]);
  const triageSummary = useMemo(() => triageDistribution(emergencyCases), [emergencyCases]);
  const criticalCases = useMemo(
    () =>
      emergencyCases
        .filter((c) => isActiveEmergencyCase(c) && (c.triage === 'critical' || c.triage === 'urgent'))
        .slice(0, 5),
    [emergencyCases],
  );
  const ambulanceCases = useMemo(
    () => emergencyCases.filter((c) => c.arrivalMode === 'Ambulance' && isActiveEmergencyCase(c)).slice(0, 4),
    [emergencyCases],
  );
  const observationCount = emergencyCases.filter((c) => c.status === 'under-observation').length;
  const occupiedBeds = emergencyCases.filter((c) => isActiveEmergencyCase(c)).length;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Emergency Department</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isPlatformRuntimeEnabled()
              ? 'Operational ER board — domain patient + encounter spine active'
              : 'Real-time ER monitoring & case management'}
          </p>
        </div>
        <Button
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
          onClick={handleQuickRegister}
        >
          <Siren className="w-4 h-4" />
          New Emergency Case
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Cases', value: String(stats.activeCases), icon: Siren, change: `${stats.critical} critical`, accent: true },
          { label: 'In Triage', value: String(stats.inTriage), icon: Users, change: 'Pending assessment' },
          { label: 'Under Treatment', value: String(stats.inTreatment), icon: HeartPulse, change: `${observationCount} in observation` },
          { label: 'Platform Spine', value: isPlatformRuntimeEnabled() ? 'On' : 'Demo', icon: Clock, change: 'Patient + OPD encounter' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={`p-5 ${s.accent ? 'border-destructive/30 bg-destructive/5' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <s.icon className={`w-5 h-5 ${s.accent ? 'text-destructive' : 'text-muted-foreground'}`} />
                <span className="text-[11px] text-muted-foreground">{s.change}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Critical & Urgent Cases
            </h2>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/emergency/cases')}>
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            {criticalCases.length === 0 ? (
              <Card className="p-4 text-sm text-muted-foreground">No critical or urgent cases on board.</Card>
            ) : (
              criticalCases.map((c) => (
                <Card key={c.id} className="p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{c.id}</span>
                        {c.triage && (
                          <Badge variant={c.triage === 'critical' ? 'destructive' : 'outline'} className="text-[10px]">
                            {EMERGENCY_TRIAGE_LABELS[c.triage]}
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-sm text-foreground">{c.patientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.assignedDoctor ?? 'Unassigned'} · {c.createdAt}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {EMERGENCY_STATUS_LABELS[c.status]}
                    </Badge>
                  </div>
                </Card>
              ))
            )}
          </div>

          <div className="mt-6">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <Ambulance className="w-4 h-4" />
              Ambulance Arrivals
            </h2>
            <div className="space-y-2">
              {ambulanceCases.length === 0 ? (
                <Card className="p-3 text-sm text-muted-foreground">No active ambulance cases.</Card>
              ) : (
                ambulanceCases.map((a) => (
                  <Card key={a.id} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      <div>
                        <p className="text-xs font-medium text-foreground">{a.patientName}</p>
                        <p className="text-[11px] text-muted-foreground">{a.complaint}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{a.createdAt}</Badge>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Triage Distribution</h2>
            <Card className="p-4 space-y-3">
              {triageSummary.map((t) => (
                <div key={t.category}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{t.category}</span>
                    <span className="font-medium text-foreground">{t.count}</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-foreground/40" style={{ width: `${t.percent}%` }} />
                  </div>
                </div>
              ))}
            </Card>
          </div>

          <TraumaBayBoard />

          <div>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <Bed className="w-4 h-4" />
              ER Bed Status
            </h2>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-2">
                {occupiedBeds} active cases across treatment and observation bays
              </p>
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-success/40" /> Available</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-foreground/20" /> Occupied</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-destructive/40" /> Critical</span>
              </div>
            </Card>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={handleQuickRegister}>
                Register Walk-in
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={() => navigate('/emergency/ambulance')}>
                Log Ambulance Arrival
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={() => navigate('/emergency/triage')}>
                Open Triage Board
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={() => navigate('/emergency/orders')}>
                ER Orders
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
