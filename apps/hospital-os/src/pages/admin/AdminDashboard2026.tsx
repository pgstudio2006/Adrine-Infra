import { useNavigate } from 'react-router-dom';
import { WorkspacePage, MetricStrip, WorkflowPanel } from '@/components/shell/workspace-primitives';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Users,
  Bed,
  CalendarDays,
  IndianRupee,
  Globe,
  ArrowRight,
  Activity,
  FlaskConical,
  Droplets,
  Sparkles,
} from 'lucide-react';

const QUICK_LINKS = [
  { label: 'Command Center', path: '/admin/command-center' },
  { label: 'Disease Mapping', path: '/admin/disease-mapping' },
  { label: 'Geo Intelligence', path: '/admin/geo-intelligence' },
  { label: 'MIS Reports', path: '/admin/mis' },
  { label: 'LIS Machines', path: '/lab/analyzers' },
  { label: 'Blood Bank', path: '/blood-bank' },
];

export default function AdminDashboard2026() {
  const navigate = useNavigate();

  return (
    <WorkspacePage
      title="Hospital command"
      subtitle="Real-time operations, AI-assisted decisions, and cross-department visibility — Adrine 2026."
      actions={
        <Button size="sm" className="gap-1.5" onClick={() => navigate('/admin/command-center')}>
          <Activity className="h-3.5 w-3.5" />
          Live command
        </Button>
      }
    >
      <MetricStrip
        columns={5}
        metrics={[
          { id: 'patients', label: 'Active patients', value: '12,847', hint: '+12% vs last month', icon: Users, trend: { value: '+12%', positive: true } },
          { id: 'opd', label: "Today's OPD", value: 184, hint: '8 in queue', icon: CalendarDays },
          { id: 'beds', label: 'Bed occupancy', value: '78%', hint: '156 / 200 beds', icon: Bed },
          { id: 'revenue', label: 'Revenue today', value: '₹4.2L', hint: '+18% vs avg', icon: IndianRupee, trend: { value: '+18%', positive: true } },
          { id: 'ai', label: 'AI actions', value: 47, hint: 'Briefings & alerts', icon: Sparkles },
        ]}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card
          className="lg:col-span-2 cursor-pointer group overflow-hidden border-foreground/10 hover:shadow-lg transition-shadow"
          onClick={() => navigate('/admin/geo-intelligence')}
        >
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row min-h-[200px]">
              <div className="flex-1 p-6 md:p-8">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  <Globe className="h-3.5 w-3.5" />
                  Geographic intelligence
                </div>
                <h2 className="text-xl font-semibold tracking-tight">Patient catchment & growth map</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">
                  Ahmedabad zone analysis — density, revenue, and service mix by locality.
                </p>
                <span className="inline-flex items-center gap-1 mt-4 text-xs font-medium group-hover:gap-2 transition-all">
                  Open map <ArrowRight className="h-3 w-3" />
                </span>
              </div>
              <div className="md:w-48 bg-gradient-to-br from-foreground/5 to-foreground/10 border-l border-border/50" />
            </div>
          </CardContent>
        </Card>

        <WorkflowPanel title="Today's priorities">
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between"><span>ICU bed pressure</span><span className="text-amber-600 font-medium">High</span></li>
            <li className="flex justify-between"><span>Lab TAT breaches</span><span className="text-rose-600 font-medium">3</span></li>
            <li className="flex justify-between"><span>Pending discharges</span><span>7</span></li>
            <li className="flex justify-between"><span>Insurance pre-auth</span><span>12</span></li>
          </ul>
        </WorkflowPanel>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:border-foreground/30 transition-colors" onClick={() => navigate('/lab/analyzers')}>
          <CardContent className="p-5 flex items-center gap-4">
            <FlaskConical className="h-8 w-8 text-foreground/70" />
            <div className="flex-1">
              <p className="font-semibold">LIS · 8 analysers</p>
              <p className="text-xs text-muted-foreground">HL7 middleware demo · auto reports</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-foreground/30 transition-colors" onClick={() => navigate('/blood-bank')}>
          <CardContent className="p-5 flex items-center gap-4">
            <Droplets className="h-8 w-8 text-rose-600/80" />
            <div className="flex-1">
              <p className="font-semibold">Blood Bank</p>
              <p className="text-xs text-muted-foreground">Donor → transfusion · NBTC reports</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <WorkflowPanel title="Quick navigation">
        <div className="flex flex-wrap gap-2">
          {QUICK_LINKS.map((link) => (
            <Button key={link.path} variant="outline" size="sm" onClick={() => navigate(link.path)}>
              {link.label}
            </Button>
          ))}
        </div>
      </WorkflowPanel>
    </WorkspacePage>
  );
}
