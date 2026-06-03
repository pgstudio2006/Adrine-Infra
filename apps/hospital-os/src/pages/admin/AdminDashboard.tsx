import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Bed,
  CalendarDays,
  Activity,
  Pill,
  FlaskConical,
  ArrowRight,
  Radio,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlatformConnectivityStrip } from '@/components/PlatformConnectivityStrip';
import { DashboardKpiGrid } from '@/components/dashboard/DashboardKpiGrid';
import { buildAdminHomeKpis } from '@/lib/dashboard/dashboard-engine';
import { useDashboardEngine } from '@/hooks/useDashboardEngine';
import { useHospital } from '@/stores/hospitalStore';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { admissions, labOrders, prescriptions, patients } = useHospital();
  const { counts, analytics, branchId, platformOn, loading, error } = useDashboardEngine('24h');

  const liveKpis = useMemo(
    () => buildAdminHomeKpis(counts, analytics),
    [counts, analytics],
  );

  const activeAdmissions = admissions.filter((a) => a.status !== 'discharged').length;
  const opdToday = patients.filter((p) => p.patientType === 'OPD').length;
  const pendingRx = prescriptions.filter((rx) => rx.status !== 'Dispensed').length;
  const pendingLabs = labOrders.filter(
    (o) => o.stage !== 'Reported' && o.stage !== 'Validated',
  ).length;

  const fallbackKpis = [
    { id: 'opd', label: 'OPD patients (store)', value: opdToday },
    { id: 'ipd', label: 'Active admissions', value: activeAdmissions },
    { id: 'lab', label: 'Pending labs', value: pendingLabs },
    { id: 'rx', label: 'Pending Rx', value: pendingRx },
  ];

  const displayKpis = platformOn && liveKpis.length > 0 ? liveKpis : fallbackKpis;
  const icons = platformOn && liveKpis.length > 0
    ? [Users, Bed, CalendarDays, FlaskConical, Pill, Activity]
    : [Users, Bed, CalendarDays, FlaskConical];

  const platformDetail = counts
    ? `Branch ${branchId ?? '—'} · OPD ${counts.opdActiveVisits} (${counts.opdWaitingQueue} queue) · IPD ${counts.ipdActiveAdmissions}`
    : null;

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {platformOn ? (
        <PlatformConnectivityStrip
          label="Admin dashboard · live branch KPIs"
          detail={platformDetail ?? 'Loading command snapshot…'}
          error={error}
        />
      ) : (
        <p className="text-xs text-muted-foreground">
          Local store summary — sign in with platform runtime for domain command + analytics KPIs.
        </p>
      )}

      <motion.div variants={item} className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Operations overview</h1>
          <p className="text-sm text-muted-foreground">
            {branchId ? `Branch ${branchId}` : 'No branch session'} · Gurgaon / Navayu MSK admin
          </p>
        </div>
        <Badge
          variant="outline"
          className="cursor-pointer gap-1"
          onClick={() => navigate('/admin/command-center')}
        >
          <Radio className="w-3 h-3" /> Command center <ArrowRight className="w-3 h-3" />
        </Badge>
      </motion.div>

      <motion.div variants={item}>
        <DashboardKpiGrid
          kpis={displayKpis}
          icons={icons}
          live={platformOn && liveKpis.length > 0}
          loading={loading}
          columns={platformOn && liveKpis.length > 0 ? 6 : 4}
          emptyMessage="Connect platform runtime for live OPD queue and census KPIs."
        />
      </motion.div>

      <motion.div variants={item}>
        <Card className="border-border">
          <CardContent className="p-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">MIS & exports</p>
              <p className="text-xs text-muted-foreground">
                Report rows from hospitalStore; header KPIs from domain analytics when live.
              </p>
            </div>
            <button
              type="button"
              className="text-xs font-medium text-primary hover:underline"
              onClick={() => navigate('/admin/mis')}
            >
              Open MIS →
            </button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
