import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarCheck2,
  HeartHandshake,
  MessageSquare,
  PhoneCall,
  TrendingUp,
  Users,
} from 'lucide-react';
import { WorkspacePage, MetricStrip, WorkflowPanel } from '@/components/shell/workspace-primitives';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useCrmPlatform } from '@/hooks/useCrmPlatform';
import { allowDemoFallback, pickPlatformRows } from '@/lib/platform/demo-fallback';

const funnelDemo = [
  { stage: 'New inquiry', count: 124 },
  { stage: 'Counseling', count: 82 },
  { stage: 'Plan shared', count: 45 },
  { stage: 'Converted', count: 28 },
];

const followUpsDemo = [
  { patient: 'Aditya Varma', journey: 'Executive health', owner: 'Sonia Patel', priority: 'High' },
  { patient: 'Meera Nair', journey: 'Maternity concierge', owner: 'Neha Shah', priority: 'Medium' },
  { patient: 'Rahul Khanna', journey: 'Lasik program', owner: 'Aman Verma', priority: 'High' },
];

export default function CRMDashboard2026() {
  const navigate = useNavigate();
  const { leads, lifecycle, campaigns } = useCrmPlatform();

  const activeLeads = allowDemoFallback() ? 284 : leads.length;
  const liveJourneys = allowDemoFallback() ? 12 : lifecycle.length;
  const activeCampaigns = allowDemoFallback() ? 3 : campaigns.length;

  const followUps = useMemo(
    () => (allowDemoFallback() ? followUpsDemo : []),
    [],
  );

  return (
    <WorkspacePage
      title="Patient experience hub"
      subtitle="Lead nurturing, care journeys, and omnichannel follow-ups — AI-assisted conversion intelligence."
      actions={
        <Button size="sm" className="gap-1.5" onClick={() => navigate('/crm/leads')}>
          <Users className="h-3.5 w-3.5" />
          View leads
        </Button>
      }
    >
      <MetricStrip
        metrics={[
          { id: 'leads', label: 'Active leads', value: activeLeads, hint: '+18 this week', icon: Users, trend: { value: '+6.8%', positive: true } },
          { id: 'conv', label: 'Conversion rate', value: '18.7%', hint: '+2.3% vs last month', icon: TrendingUp, trend: { value: '+2.3%', positive: true } },
          { id: 'journeys', label: 'Care journeys live', value: liveJourneys, hint: '4 high-priority', icon: HeartHandshake },
          { id: 'nps', label: 'Patient NPS', value: 74, hint: '82% positive', icon: MessageSquare },
        ]}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <WorkflowPanel title="Conversion funnel" className="lg:col-span-1">
          <ul className="space-y-2 text-sm">
            {funnelDemo.map((s) => (
              <li key={s.stage} className="flex justify-between">
                <span>{s.stage}</span>
                <span className="font-medium">{s.count}</span>
              </li>
            ))}
          </ul>
        </WorkflowPanel>

        <WorkflowPanel title="Follow-ups due today" className="lg:col-span-2">
          <ul className="space-y-2 text-sm">
            {followUps.map((f) => (
              <li key={f.patient} className="flex items-center justify-between gap-2 py-1.5 border-b border-border/50 last:border-0">
                <div>
                  <p className="font-medium">{f.patient}</p>
                  <p className="text-xs text-muted-foreground">{f.journey} · {f.owner}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">{f.priority}</Badge>
              </li>
            ))}
          </ul>
        </WorkflowPanel>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:border-foreground/30 transition-colors" onClick={() => navigate('/crm/campaigns')}>
          <CardContent className="p-5 flex items-center gap-4">
            <CalendarCheck2 className="h-7 w-7 text-foreground/70" />
            <div className="flex-1">
              <p className="font-semibold">Campaigns</p>
              <p className="text-xs text-muted-foreground">{activeCampaigns} active programs</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-foreground/30 transition-colors" onClick={() => navigate('/crm/journeys')}>
          <CardContent className="p-5 flex items-center gap-4">
            <HeartHandshake className="h-7 w-7 text-foreground/70" />
            <div className="flex-1">
              <p className="font-semibold">Care journeys</p>
              <p className="text-xs text-muted-foreground">Cohort-based patient pathways</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-foreground/30 transition-colors" onClick={() => navigate('/crm/callbacks')}>
          <CardContent className="p-5 flex items-center gap-4">
            <PhoneCall className="h-7 w-7 text-foreground/70" />
            <div className="flex-1">
              <p className="font-semibold">Callbacks</p>
              <p className="text-xs text-muted-foreground">Phone & WhatsApp queue</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    </WorkspacePage>
  );
}
