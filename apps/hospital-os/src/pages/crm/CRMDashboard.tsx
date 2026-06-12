import { useMemo } from 'react';
import { useCrmPlatform } from '@/hooks/useCrmPlatform';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, CalendarCheck2, HeartHandshake, MessageSquare, PhoneCall, TrendingUp, UserRoundCheck, Users } from 'lucide-react';
import { allowDemoFallback, pickPlatformRows } from '@/lib/platform/demo-fallback';
import { PlatformEmptyState } from '@/components/platform/PlatformEmptyState';

const statsDemo = [
  { label: 'Active Leads', value: '284', trend: '+18 this week', icon: Users },
  { label: 'Conversion Rate', value: '18.7%', trend: '+2.3% vs last month', icon: TrendingUp },
  { label: 'Care Journeys Live', value: '12', trend: '4 high-priority cohorts', icon: HeartHandshake },
  { label: 'Patient Experience', value: '74 NPS', trend: '82% positive sentiment', icon: MessageSquare },
];

const funnelDemo = [
  { stage: 'New Inquiry', count: 124, progress: 100 },
  { stage: 'Counseling', count: 82, progress: 66 },
  { stage: 'Treatment Plan Shared', count: 45, progress: 36 },
  { stage: 'Converted', count: 28, progress: 23 },
];

const followUpsDemo = [
  { patient: 'Aditya Varma', journey: 'Executive health package', owner: 'Sonia Patel', nextStep: 'Confirm package payment', channel: 'Phone', priority: 'High' },
  { patient: 'Meera Nair', journey: 'Maternity concierge', owner: 'Neha Shah', nextStep: 'Schedule hospital tour', channel: 'WhatsApp', priority: 'Medium' },
  { patient: 'Rahul Khanna', journey: 'Lasik surgery program', owner: 'Aman Verma', nextStep: 'Insurance clarification', channel: 'Call back', priority: 'High' },
  { patient: 'Asha Menon', journey: 'Post-discharge physio', owner: 'Riya Das', nextStep: 'Resend follow-up plan', channel: 'SMS', priority: 'Low' },
];

const demoCampaigns = [
  { name: 'Cardiac Rehab Follow-up', reach: '186 patients', engagement: '88%', status: 'Active' },
  { name: 'Post-NICU Support', reach: '92 patients', engagement: '92%', status: 'Active' },
  { name: 'Wellness Reactivation', reach: '143 patients', engagement: '61%', status: 'Review' },
];

const priorityStyles: Record<string, string> = {
  High: 'bg-destructive/10 text-destructive border-destructive/20',
  Medium: 'bg-warning/10 text-warning border-warning/20',
  Low: 'bg-muted text-muted-foreground border-border',
};

const statusStyles: Record<string, string> = {
  Active: 'bg-success/10 text-success border-success/20',
  Review: 'bg-warning/10 text-warning border-warning/20',
};

export default function CRMDashboard() {
  const { platformOn, summary, leads: platformLeads, campaigns: platformCampaigns, lifecycle: platformLifecycle } =
    useCrmPlatform();

  const stats = useMemo(() => {
    if (platformOn && summary) {
      return [
        { label: 'Active Leads', value: String(summary.openLeads), trend: 'Open leads from CRM', icon: Users },
        { label: 'Conversion Rate', value: '—', trend: 'Analytics pending', icon: TrendingUp },
        { label: 'Care Journeys Live', value: String(platformCampaigns.filter((c) => c.status === 'active').length), trend: `${platformLifecycle.length} lifecycle events`, icon: HeartHandshake },
        { label: 'Patient Experience', value: '—', trend: 'NPS not wired', icon: MessageSquare },
      ];
    }
    if (allowDemoFallback()) return statsDemo;
    return statsDemo.map((s) => ({ ...s, value: '—', trend: 'No platform data' }));
  }, [platformOn, summary, platformCampaigns, platformLifecycle]);

  const funnel = useMemo(() => {
    if (platformOn && summary?.leadsByStage?.length) {
      const max = Math.max(...summary.leadsByStage.map((s) => s._count._all), 1);
      return summary.leadsByStage.map((s) => ({
        stage: s.stage.replace(/_/g, ' '),
        count: s._count._all,
        progress: Math.round((s._count._all / max) * 100),
      }));
    }
    return allowDemoFallback() ? funnelDemo : [];
  }, [platformOn, summary]);

  const platformCampaignRows = useMemo(() => {
    return platformCampaigns.map((c) => ({
      name: c.name,
      reach: `${c.reachCount} patients`,
      engagement: '—',
      status: c.status.charAt(0).toUpperCase() + c.status.slice(1),
    }));
  }, [platformCampaigns]);

  const campaignRows = useMemo(
    () => pickPlatformRows(platformOn && platformCampaigns.length > 0, platformCampaignRows, demoCampaigns),
    [platformOn, platformCampaigns.length, platformCampaignRows],
  );

  const platformFollowUpRows = useMemo(() => {
    return platformLeads.slice(0, 4).map((l) => ({
      patient: l.fullName,
      journey: l.packageName ?? l.specialty ?? 'Lead',
      owner: l.ownerLabel ?? 'Unassigned',
      nextStep: l.status,
      channel: l.channel ?? '—',
      priority: l.priority.charAt(0).toUpperCase() + l.priority.slice(1),
    }));
  }, [platformLeads]);

  const followUpRows = useMemo(
    () => pickPlatformRows(platformOn && platformLeads.length > 0, platformFollowUpRows, followUpsDemo),
    [platformOn, platformLeads.length, platformFollowUpRows],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">CRM & Patient Relations Dashboard</h1>
        <p className="text-sm text-muted-foreground">Lead conversion, patient experience and follow-up operations overview</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.trend}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lead Funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {funnel.length === 0 ? (
              <PlatformEmptyState message="Lead funnel populates when CRM platform data is available." />
            ) : (
              funnel.map((item) => (
                <div key={item.stage} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{item.stage}</span>
                    <span className="text-muted-foreground">{item.count}</span>
                  </div>
                  <Progress value={item.progress} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Today&apos;s Priority Follow-ups</CardTitle>
            <Button variant="outline" size="sm">View All</Button>
          </CardHeader>
          <CardContent>
            {followUpRows.length === 0 ? (
              <PlatformEmptyState message="No priority follow-ups. Connect CRM platform to load leads." />
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Journey</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Next Step</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {followUpRows.map((item) => (
                  <TableRow key={`${item.patient}-${item.journey}`}>
                    <TableCell className="font-medium">{item.patient}</TableCell>
                    <TableCell>{item.journey}</TableCell>
                    <TableCell>{item.owner}</TableCell>
                    <TableCell>{item.nextStep}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.channel}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={priorityStyles[item.priority]}>
                        {item.priority}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Patient Experience Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm text-muted-foreground">NPS Score</p>
                <p className="text-2xl font-bold">{allowDemoFallback() ? '74' : '—'}</p>
              </div>
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm text-muted-foreground">Resolved Cases</p>
                <p className="text-2xl font-bold">{allowDemoFallback() ? '38' : '—'}</p>
              </div>
              <UserRoundCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm text-muted-foreground">Escalations Open</p>
                <p className="text-2xl font-bold">{allowDemoFallback() ? '6' : '—'}</p>
              </div>
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Live Campaigns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {campaignRows.length === 0 ? (
              <PlatformEmptyState message="No live campaigns. Enable platform runtime to sync CRM journeys." />
            ) : (
              campaignRows.map((campaign) => (
              <div key={campaign.name} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{campaign.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{campaign.reach}</p>
                  </div>
                  <Badge variant="outline" className={statusStyles[campaign.status]}>
                    {campaign.status}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Engagement</span>
                  <span className="font-medium">{campaign.engagement}</span>
                </div>
                <Progress value={Number.parseInt(campaign.engagement, 10) || 0} className="mt-2 h-2" />
              </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start">
              <PhoneCall className="mr-2 h-4 w-4" />
              Start Priority Calls
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <CalendarCheck2 className="mr-2 h-4 w-4" />
              Schedule Follow-ups
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <HeartHandshake className="mr-2 h-4 w-4" />
              Launch Care Journey
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
