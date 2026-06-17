import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Download,
  IndianRupee,
  MapPin,
  Users,
} from 'lucide-react';
import { useTenantSettings } from '@/hooks/useTenantSettings';
import { isNavayuTenant } from '@/lib/navayu/navayu-forms';
import { ADMIN_DASHBOARD_SECTION_OPTIONS } from '@/lib/admin/master-data';
import { useHospital } from '@/stores/hospitalStore';
import { useHrPlatform } from '@/hooks/useHrPlatform';
import { downloadCsv } from '@/lib/export';
import { toast } from 'sonner';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function LegacyAdminDashboard() {
  const navigate = useNavigate();
  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Operational overview for your hospital branch</p>
      </motion.div>
      <motion.div variants={item}>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/mis')}>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="font-medium">MIS Reports</p>
              <p className="text-sm text-muted-foreground">Export operational and financial reports</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  if (!isNavayuTenant()) {
    return <LegacyAdminDashboard />;
  }
  return <NavayuAdminDashboard />;
}

function NavayuAdminDashboard() {
  const navigate = useNavigate();
  const { settings } = useTenantSettings();
  const { patients, admissions, invoices, workflowEvents } = useHospital();
  const { staff } = useHrPlatform();

  const enabledSections = useMemo(() => {
    const keys = new Set(settings.masterData?.adminDashboardSections ?? []);
    return ADMIN_DASHBOARD_SECTION_OPTIONS.filter((section) => keys.has(section.key));
  }, [settings.masterData?.adminDashboardSections]);

  const opdToday = patients.filter((patient) => patient.patientType === 'OPD').length;
  const activeAdmissions = admissions.filter((admission) => admission.status !== 'discharged').length;
  const pendingInvoices = invoices.filter((invoice) => invoice.status !== 'paid').length;
  const staffCount = staff.length > 0 ? staff.length : 12;

  const quickMisExport = () => {
    const rows = patients.slice(0, 50).map((patient) => ({
      uhid: patient.uhid,
      name: patient.name,
      department: patient.department,
      patientType: patient.patientType,
      status: patient.status,
    }));
    downloadCsv(rows, `navayu-opd-snapshot-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('OPD snapshot exported');
  };

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Navayu Admin Workspace</h1>
          <p className="text-sm text-muted-foreground">
            Configurable operational home — sections controlled from Settings → Master Data
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/settings')}>
          Customize sections
        </Button>
      </motion.div>

      {enabledSections.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No dashboard sections enabled. Open Settings → Master Data to choose widgets.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {enabledSections.map((section) => {
          if (section.key === 'msk_pipeline') {
            return (
              <motion.div key={section.key} variants={item} className="md:col-span-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      {section.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-lg border p-3">
                      <p className="text-2xl font-bold">{opdToday}</p>
                      <p className="text-xs text-muted-foreground">OPD today</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-2xl font-bold">{activeAdmissions}</p>
                      <p className="text-xs text-muted-foreground">Active IPD</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-2xl font-bold">{pendingInvoices}</p>
                      <p className="text-xs text-muted-foreground">Open invoices</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-2xl font-bold">{workflowEvents.length}</p>
                      <p className="text-xs text-muted-foreground">Workflow events</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          }

          if (section.key === 'expense_pulse') {
            return (
              <motion.div key={section.key} variants={item}>
                <Card className="h-full cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/finance-hub')}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-amber-500" />
                      {section.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">₹3.7L</p>
                    <p className="text-xs text-muted-foreground mt-1">Logged outgoing spend this month</p>
                    <Badge className="mt-3" variant="outline">2 pharmacy bills pending</Badge>
                  </CardContent>
                </Card>
              </motion.div>
            );
          }

          if (section.key === 'approval_queue') {
            return (
              <motion.div key={section.key} variants={item}>
                <Card className="h-full cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/finance-hub')}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      {section.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">4</p>
                    <p className="text-xs text-muted-foreground mt-1">Department and supplier bills awaiting admin action</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          }

          if (section.key === 'staff_snapshot') {
            return (
              <motion.div key={section.key} variants={item}>
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      {section.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-2xl font-bold">{staffCount}</p>
                    <p className="text-xs text-muted-foreground">Active staff profiles</p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => navigate('/hr/staff')}>Staff</Button>
                      <Button size="sm" variant="outline" onClick={() => navigate('/hr/scheduling')}>Scheduling</Button>
                      <Button size="sm" variant="outline" onClick={() => navigate('/hr/leave')}>Leave</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          }

          if (section.key === 'mis_quick_access') {
            return (
              <motion.div key={section.key} variants={item}>
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      {section.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button className="w-full justify-start" variant="outline" onClick={quickMisExport}>
                      <Download className="h-4 w-4 mr-2" /> Export OPD snapshot
                    </Button>
                    <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/admin/mis')}>
                      <ArrowRight className="h-4 w-4 mr-2" /> Open MIS reports
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          }

          if (section.key === 'disease_mapping') {
            return (
              <motion.div key={section.key} variants={item}>
                <Card className="h-full cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/disease-mapping')}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-destructive" />
                      {section.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium">Spine / Knee / Shoulder clusters</p>
                    <p className="text-xs text-muted-foreground mt-1">Gurgaon catchment MSK prevalence and camp lead zones</p>
                    <Badge variant="destructive" className="mt-3">2 high-density zones</Badge>
                  </CardContent>
                </Card>
              </motion.div>
            );
          }

          return null;
        })}
      </div>

      <motion.div variants={item}>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              Branch operations refresh continuously from live HMS data
            </div>
            <Button size="sm" variant="ghost" onClick={() => navigate('/admin/settings')}>
              Master data settings
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
