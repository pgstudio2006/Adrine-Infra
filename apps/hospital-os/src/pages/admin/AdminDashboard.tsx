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
  Bed,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  FlaskConical,
  Globe,
  IndianRupee,
  MapPin,
  Pill,
  Users,
  UsersRound,
} from 'lucide-react';
import { useTenantSettings } from '@/hooks/useTenantSettings';
import { isNavayuTenant } from '@/lib/navayu/navayu-forms';
import { ADMIN_DASHBOARD_SECTION_OPTIONS } from '@/lib/admin/master-data';
import { useHospital } from '@/stores/hospitalStore';
import { useHrPlatform } from '@/hooks/useHrPlatform';
import { downloadCsv } from '@/lib/export';
import { toast } from 'sonner';

const ADRINE_STATS = [
  { label: 'Total Patients', value: '8', sub: '+12% this month', icon: Users, color: 'text-success' },
  { label: 'Bed Occupancy', value: '7%', sub: '2 of 30 beds', icon: Bed, color: 'text-info' },
  { label: "Today's Appointments", value: '6', sub: '+8 from yesterday', icon: CalendarDays, color: 'text-success' },
  { label: 'Active Admissions', value: '2', sub: '2 discharges today', icon: Activity, color: 'text-warning' },
  { label: 'Revenue Today', value: '₹4.2L', sub: '+15% vs avg', icon: IndianRupee, color: 'text-success' },
];

const ADRINE_QUICK_ACTIONS = [
  { label: 'Pending Rx', value: 2, icon: Pill, color: 'text-success' },
  { label: 'Pending Labs', value: 2, icon: FlaskConical, color: 'text-info' },
  { label: 'Staff on Duty', value: 24, icon: UsersRound, color: 'text-foreground' },
  { label: "Today's Actions", value: 156, icon: FileText, color: 'text-foreground' },
];

const ADRINE_RECENT_ADMISSIONS = [
  { name: 'Kishanbhai Joshi', ward: 'ICU', bed: 'ICU-01', status: 'Admitted' },
  { name: 'Kokilaben Trivedi', ward: 'General Ward', bed: 'GW-05', status: 'Admitted' },
  { name: 'Ramesh Patel', ward: 'Private', bed: 'PV-02', status: 'Admitted' },
];

const ADRINE_DEPT_PERFORMANCE = [
  { dept: 'OPD', patients: '45 patients today', growth: '+12%' },
  { dept: 'Emergency', patients: '12 patients today', growth: '+5%' },
  { dept: 'Pediatrics', patients: '18 patients today', growth: '+8%' },
  { dept: 'Cardiology', patients: '9 patients today', growth: '+3%' },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function AdrineAdminDashboard() {
  const navigate = useNavigate();

  return (
    <motion.div className="space-y-8" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Operational overview for your hospital branch</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/command-center')}>
          Open Command Center
        </Button>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {ADRINE_STATS.map((s) => (
          <motion.div key={s.label} variants={item}>
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-500 border-border group bg-background">
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 bg-current ${s.color}`} />
              <CardContent className="p-5 relative z-10">
                <s.icon className={`h-5 w-5 mb-4 ${s.color} drop-shadow-sm`} strokeWidth={2} />
                <p className="text-3xl font-bold tracking-tight text-foreground">{s.value}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  <p className={`text-[10px] font-bold ${s.color} bg-background px-1.5 py-0.5 rounded-sm border border-border shadow-sm`}>
                    {s.sub.split(' ')[0]}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ADRINE_QUICK_ACTIONS.map((q) => (
          <motion.div key={q.label} variants={item}>
            <Card className="hover:shadow-md transition-all cursor-pointer group border-border overflow-hidden relative">
              <div
                className={`absolute right-0 top-0 w-24 h-24 bg-current ${q.color !== 'text-foreground' ? q.color : 'text-muted'} opacity-[0.04] rounded-full blur-2xl -mr-10 -mt-10 group-hover:opacity-10 transition-opacity duration-500`}
              />
              <CardContent className="p-5 flex flex-col gap-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-md bg-background border border-border shadow-sm flex items-center justify-center ${q.color}`}>
                    <q.icon className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight text-foreground -mb-1">{q.value}</p>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{q.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div variants={item}>
        <Card
          className="bg-foreground text-background overflow-hidden cursor-pointer group hover:shadow-2xl transition-all border-0 relative shadow-xl"
          onClick={() => navigate('/admin/geo-intelligence')}
        >
          <div
            className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
            }}
          />
          <CardContent className="p-0 relative z-10">
            <div className="flex items-stretch min-h-[200px]">
              <div className="flex-1 p-8 md:p-10 flex flex-col justify-center relative">
                <div className="absolute left-0 top-0 w-1 h-full bg-info" />
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="h-4 w-4 text-info" />
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-info drop-shadow-sm">
                    Geographic Intelligence
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">Patient Distribution Analysis</h2>
                <p className="text-sm text-background/70 max-w-lg leading-relaxed font-medium">
                  Analyze catchment zones across Ahmedabad. Track patient flow and identify growth opportunities using our
                  dedicated mapping tools.
                </p>
                <div className="flex items-center gap-2 mt-6 text-[11px] font-bold uppercase tracking-widest group-hover:gap-3 transition-all text-background border-b border-background/20 pb-1 w-max">
                  View Interactive Map <ArrowRight className="h-3 w-3" />
                </div>
              </div>
              <div className="hidden md:flex items-center justify-center w-80 bg-background/5 relative overflow-hidden">
                <div className="absolute inset-x-0 h-[100%] border-l border-r border-info/20 skew-x-12 opacity-50" />
                <div className="absolute border rounded-full border-background/20 w-48 h-48 animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute border rounded-full border-info/40 w-24 h-24" />
                <div className="absolute bg-background w-2 h-2 rounded-full shadow-[0_0_15px_rgba(255,255,255,1)]" />
                <div className="absolute bg-success shadow-[0_0_10px_rgba(0,255,100,0.5)] w-1.5 h-1.5 rounded-full top-12 left-12" />
                <div className="absolute bg-warning shadow-[0_0_10px_rgba(255,200,0,0.5)] w-2 h-2 rounded-full bottom-16 right-16" />
                <div className="absolute bg-destructive shadow-[0_0_10px_rgba(255,0,0,0.5)] w-1.5 h-1.5 rounded-full top-24 right-20" />
                <div className="absolute bg-background/50 right-16 top-16 w-1 border-background/50 h-10 -rotate-45 block" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div variants={item}>
          <Card className="border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                <div className="p-1.5 rounded bg-muted/50 border border-border">
                  <Activity className="h-4 w-4 text-warning" strokeWidth={2} />
                </div>
                <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-foreground">Recent Admissions</span>
              </div>
              <div className="space-y-5">
                {ADRINE_RECENT_ADMISSIONS.map((a) => (
                  <div key={a.bed} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_5px_rgba(0,255,100,0.3)] opacity-70 group-hover:opacity-100 transition-opacity" />
                      <div>
                        <p className="text-sm font-semibold tracking-tight text-foreground transition-colors group-hover:text-success">
                          {a.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                          {a.ward} • {a.bed}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest bg-success/5 text-success border-success/20">
                      {a.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                <div className="p-1.5 rounded bg-muted/50 border border-border">
                  <MapPin className="h-4 w-4 text-info" strokeWidth={2} />
                </div>
                <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-foreground">Department Performance</span>
              </div>
              <div className="space-y-4">
                {ADRINE_DEPT_PERFORMANCE.map((d) => (
                  <div key={d.dept} className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50 transition-colors">
                    <div>
                      <p className="text-sm font-semibold tracking-tight text-foreground">{d.dept}</p>
                      <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{d.patients}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[13px] font-black tracking-tighter text-success">{d.growth}</span>
                      <div className="h-1 w-12 bg-muted rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-success rounded-full"
                          style={{ width: `${Math.min(100, parseFloat(d.growth.replace('+', '').replace('%', '')) * 6)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  if (!isNavayuTenant()) {
    return <AdrineAdminDashboard />;
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
                    <Badge className="mt-3" variant="outline">
                      2 pharmacy bills pending
                    </Badge>
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
                      <Button size="sm" variant="outline" onClick={() => navigate('/hr/staff')}>
                        Staff
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate('/hr/scheduling')}>
                        Scheduling
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate('/hr/leave')}>
                        Leave
                      </Button>
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
                <Card
                  className="h-full cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate('/admin/disease-mapping')}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-destructive" />
                      {section.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium">Spine / Knee / Shoulder clusters</p>
                    <p className="text-xs text-muted-foreground mt-1">Gurgaon catchment MSK prevalence and camp lead zones</p>
                    <Badge variant="destructive" className="mt-3">
                      2 high-density zones
                    </Badge>
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
