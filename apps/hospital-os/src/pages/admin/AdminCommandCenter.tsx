import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Activity, Users, BedDouble, Stethoscope, Zap, Building2,
  Pill, FlaskConical, Radio, AlertTriangle,
} from 'lucide-react';
import { useHospital } from '@/stores/hospitalStore';
import { PlatformConnectivityStrip } from '@/components/PlatformConnectivityStrip';
import { PreviewSectionBadge } from '@/components/shared/PreviewSectionBadge';
import { useAdminOperationalData } from '@/hooks/useAdminOperationalData';
import { isNavayuTenant } from '@/lib/navayu/navayu-forms';
import { DEMO_BED_WARDS } from '@/lib/admin/demo-operational-fallback';
import type { OperationalSnapshotCounts } from '@adrine/hospital-operations';

const fadeIn = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.3 },
});

function loadPct(value: number, capacity: number): number {
  if (capacity <= 0) return 0;
  return Math.min(100, Math.round((value / capacity) * 100));
}

function deptRowsFromCounts(c: OperationalSnapshotCounts) {
  return [
    { dept: 'OPD', active: c.opdActiveVisits, pending: c.opdWaitingQueue, load: loadPct(c.opdActiveVisits, 60) },
    { dept: 'IPD', active: c.ipdActiveAdmissions, pending: c.dischargeInProgress, load: loadPct(c.ipdActiveAdmissions, 90) },
    { dept: 'Lab', active: c.labPending, pending: c.labCriticalUnacked, load: loadPct(c.labPending, 40) },
    { dept: 'Radiology', active: c.radiologyPending ?? 0, pending: 0, load: loadPct(c.radiologyPending ?? 0, 20) },
    { dept: 'Pharmacy', active: c.pharmacyPending, pending: 0, load: loadPct(c.pharmacyPending, 30) },
    { dept: 'Nursing', active: c.nursingOpenTasks, pending: c.nursingMissed, load: loadPct(c.nursingOpenTasks, 50) },
    { dept: 'Billing', active: c.billingDraftInvoices, pending: c.insurancePending, load: loadPct(c.billingDraftInvoices, 25) },
  ];
}

export default function AdminCommandCenter() {
  const { emergencyCases, labOrders, prescriptions } = useHospital();
  const navayuMode = isNavayuTenant();
  const { snapshot, finance, error, loading, platformOn, demoMode } = useAdminOperationalData('24h');
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const c = snapshot?.counts;
  const deptActivity = useMemo(() => (c ? deptRowsFromCounts(c) : []), [c]);

  const bedSummary = useMemo(() => {
    if (demoMode) {
      return DEMO_BED_WARDS;
    }
    if (!c) return [];
    const total = c.bedsOccupied + c.bedsAvailable;
    return [
      {
        ward: 'Branch census',
        total: total || 1,
        occupied: c.bedsOccupied,
        available: c.bedsAvailable,
      },
    ];
  }, [c, demoMode]);

  const staffActivityLog = useMemo(
    () =>
      (snapshot?.escalations ?? []).slice(0, 12).map((e) => ({
        time: new Date(e.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        staff: e.sourceRuntime,
        action: e.message,
        dept: e.type,
        severity: e.severity,
      })),
    [snapshot?.escalations],
  );

  const platformDetail = c
    ? `Live command snapshot · OPD ${c.opdActiveVisits} (${c.opdWaitingQueue} waiting) · IPD ${c.ipdActiveAdmissions} · beds ${c.bedsOccupied}/${c.bedsOccupied + c.bedsAvailable} · lab ${c.labPending} · Rx ${c.pharmacyPending} · billing drafts ${c.billingDraftInvoices}`
    : loading
      ? 'Loading operational snapshot…'
      : null;

  const totalBeds = bedSummary.reduce((s, b) => s + b.total, 0);
  const occupiedBeds = bedSummary.reduce((s, b) => s + b.occupied, 0);

  const kpis = c
    ? [
        { label: 'OPD Active', value: c.opdActiveVisits, icon: Users, color: 'text-primary' },
        { label: 'IPD Active', value: c.ipdActiveAdmissions, icon: BedDouble, color: 'text-emerald-600' },
        { label: 'ER Cases', value: emergencyCases.filter((x) => x.status !== 'discharged').length, icon: Zap, color: 'text-destructive' },
        { label: 'Discharge pend.', value: c.dischargeInProgress, icon: Stethoscope, color: 'text-amber-600' },
        { label: 'Lab Pending', value: c.labPending, icon: FlaskConical, color: 'text-blue-600' },
        { label: 'Rx Pending', value: c.pharmacyPending, icon: Pill, color: 'text-purple-600' },
      ]
    : [
        { label: 'OPD Active', value: '—', icon: Users, color: 'text-primary' },
        { label: 'IPD Active', value: occupiedBeds || '—', icon: BedDouble, color: 'text-emerald-600' },
        { label: 'ER Cases', value: emergencyCases.length, icon: Zap, color: 'text-destructive' },
        { label: 'Lab Pending', value: labOrders.length, icon: FlaskConical, color: 'text-blue-600' },
        { label: 'Rx Pending', value: prescriptions.length, icon: Pill, color: 'text-purple-600' },
        { label: 'Outstanding', value: finance ? `₹${(finance.summary.outstandingCents / 100).toLocaleString('en-IN')}` : '—', icon: Stethoscope, color: 'text-amber-600' },
      ];

  return (
    <div className="space-y-4">
      {!navayuMode && platformOn && (
        <PlatformConnectivityStrip
          label="Live command center"
          detail={platformDetail ?? 'Loading operational snapshot…'}
          error={error}
        />
      )}

      <motion.div {...fadeIn(0)} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary animate-pulse" /> Central Command Center
          </h1>
          <p className="text-sm text-muted-foreground">
            {platformOn
              ? `Branch ${snapshot?.branchId ?? '—'} · domain command snapshot`
              : demoMode
                ? 'Illustrative branch operations snapshot — Adrine full-hospital demo'
                : 'Enable platform runtime for live branch snapshot'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-mono font-bold">{clock.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
          <p className="text-[10px] text-muted-foreground">{clock.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
      </motion.div>

      <motion.div {...fadeIn(1)} className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => (
          <Card key={i}>
            <CardContent className="p-3 flex items-center gap-3">
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              <div>
                <p className="text-lg font-bold">{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div {...fadeIn(2)} className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Department Load Monitor
                {platformOn && <Badge variant="outline" className="text-[9px]">Live</Badge>}
                {demoMode && <Badge variant="secondary" className="text-[9px]">Demo</Badge>}
              </p>
              {deptActivity.length === 0 ? (
                <p className="text-xs text-muted-foreground">No live department load until command snapshot is available.</p>
              ) : (
                <div className="space-y-2.5">
                  {deptActivity.map((d, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs w-24 shrink-0">{d.dept}</span>
                      <div className="flex-1">
                        <Progress value={d.load} className={`h-2 ${d.load > 85 ? '[&>div]:bg-destructive' : d.load > 70 ? '[&>div]:bg-amber-500' : ''}`} />
                      </div>
                      <span className={`text-xs font-bold w-10 text-right ${d.load > 85 ? 'text-destructive' : d.load > 70 ? 'text-amber-600' : 'text-emerald-600'}`}>{d.load}%</span>
                      <div className="flex gap-2 text-[10px] text-muted-foreground w-32">
                        <span>{d.active} active</span>
                        <span>{d.pending} queue</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeIn(3)}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <BedDouble className="w-3.5 h-3.5" /> Bed Occupancy
                </p>
                <Badge variant="secondary" className="text-[10px]">{occupiedBeds}/{totalBeds || '—'}</Badge>
              </div>
              <div className="space-y-2">
                {bedSummary.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Bed board unavailable offline.</p>
                ) : (
                  bedSummary.map((b, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span>{b.ward}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={(b.occupied / b.total) * 100} className="w-20 h-1.5" />
                        <span className={`font-medium w-8 text-right ${b.available <= 2 ? 'text-destructive' : 'text-emerald-600'}`}>
                          {b.available}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div {...fadeIn(4)}>
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Blocker feed
              </p>
                {platformOn && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-muted-foreground">Platform</span>
                  </div>
                )}
              </div>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                {staffActivityLog.length === 0 && (snapshot?.blockers ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No open escalations or blockers in the current snapshot.</p>
                ) : (
                  <>
                    {staffActivityLog.map((log, i) => (
                      <div key={`esc-${i}`} className="flex items-start gap-2 text-xs border-b last:border-0 pb-1.5">
                        <span className="text-[10px] text-muted-foreground w-10 shrink-0 font-mono">{log.time}</span>
                        <div className="flex-1">
                          <span className="font-medium">{log.staff}</span>
                          <span className="text-muted-foreground"> — {log.action}</span>
                        </div>
                        <Badge variant="outline" className="text-[8px] shrink-0">{log.dept}</Badge>
                      </div>
                    ))}
                    {(snapshot?.blockers ?? []).slice(0, 5).map((b) => (
                      <div key={b.id} className="flex items-start gap-2 text-xs text-amber-700">
                        <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>{b.message}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
          </CardContent>
        </Card>
      </motion.div>

      {!navayuMode && !demoMode && (
        <motion.div {...fadeIn(5)}>
          <PreviewSectionBadge explanation="Hourly patient flow chart is not on domain analytics yet — use live KPI grid and department load above for operational decisions." />
        </motion.div>
      )}
    </div>
  );
}
