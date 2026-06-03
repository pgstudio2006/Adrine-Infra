import { useMemo } from 'react';
import { useCrmPlatform } from '@/hooks/useCrmPlatform';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, BarChart3, CalendarCheck2, PlayCircle, Users, Zap } from 'lucide-react';
import { PlatformConnectivityStrip } from '@/components/PlatformConnectivityStrip';
import { ScheduleFromLeadDialog } from '@/components/crm/ScheduleFromLeadDialog';
import { allowDemoFallback, pickPlatformRows } from '@/lib/platform/demo-fallback';
import { PlatformEmptyState } from '@/components/platform/PlatformEmptyState';

const statsDemo = [
  { label: 'Active participants', value: '1,284', icon: Users, detail: '+12% this month' },
  { label: 'Engagement rate', value: '84.2%', icon: Activity, detail: 'Across all journeys' },
  { label: 'Retention lift', value: '28%', icon: BarChart3, detail: 'Compared with baseline' },
];

const journeysDemo = [
  { name: 'Post-NICU Support', segment: 'Maternity Patients', reach: 182, channel: 'WhatsApp + Call', engagement: 92, status: 'Active' },
  { name: 'Diabetes Wellness Hub', segment: 'Chronic Care', reach: 246, channel: 'SMS + App', engagement: 74, status: 'Active' },
  { name: 'Cardiac Rehab Follow-up', segment: 'Post-op Patients', reach: 138, channel: 'Call + Email', engagement: 88, status: 'Review' },
  { name: 'Preventive Screening Recall', segment: 'Wellness Members', reach: 204, channel: 'WhatsApp + SMS', engagement: 69, status: 'Active' },
];

const templatesDemo = [
  { name: 'Orthopedic rehab', detail: 'Discharge to physiotherapy completion', usage: '32 launches' },
  { name: 'Maternity concierge', detail: 'ANC to postpartum experience', usage: '24 launches' },
  { name: 'Executive health renewal', detail: 'Annual package reactivation', usage: '18 launches' },
];

const statusStyles: Record<string, string> = {
  Active: 'bg-success/10 text-success border-success/20',
  Review: 'bg-warning/10 text-warning border-warning/20',
};

export default function Campaigns() {
  const { platformOn, loading, error, campaigns: platformCampaigns, leads: platformLeads, refresh } =
    useCrmPlatform();

  const platformJourneyRows = useMemo(() => {
    return platformCampaigns.map((c) => ({
      id: c.id,
      name: c.name,
      segment: c.segment ?? 'All patients',
      reach: c.reachCount,
      channel: c.channel ?? 'Multi-channel',
      engagement: 0,
      status: c.status.charAt(0).toUpperCase() + c.status.slice(1),
    }));
  }, [platformCampaigns]);

  const demoJourneyRows = useMemo(
    () => journeysDemo.map((j, i) => ({ id: `demo-${i}`, ...j })),
    [],
  );

  const journeyRows = useMemo(
    () => pickPlatformRows(platformOn && platformCampaigns.length > 0, platformJourneyRows, demoJourneyRows),
    [platformOn, platformCampaigns.length, platformJourneyRows, demoJourneyRows],
  );

  const stats = useMemo(() => {
    if (platformOn && platformCampaigns.length > 0) {
      const totalReach = platformCampaigns.reduce((s, c) => s + c.reachCount, 0);
      return [
        { label: 'Active participants', value: String(totalReach), icon: Users, detail: `${platformCampaigns.length} journeys` },
        { label: 'Engagement rate', value: '—', icon: Activity, detail: 'Analytics pending' },
        { label: 'Retention lift', value: '—', icon: BarChart3, detail: 'Analytics pending' },
      ];
    }
    if (allowDemoFallback()) return statsDemo;
    return statsDemo.map((s) => ({ ...s, value: '—', detail: 'No platform data' }));
  }, [platformOn, platformCampaigns]);

  const templates = allowDemoFallback() ? templatesDemo : [];

  const campaignLeads = useMemo(() => {
    if (!platformOn) return [];
    return platformLeads
      .filter((l) => l.status === 'open' || l.stage === 'decision_phase' || l.stage === 'counseling')
      .slice(0, 8);
  }, [platformOn, platformLeads]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Care Journeys</h1>
          <p className="text-sm text-muted-foreground">
            Campaign outreach — book consults from enrolled leads via scheduling API
          </p>
        </div>
        <Button>
          <Zap className="mr-2 h-4 w-4" />
          Deploy Journey
        </Button>
      </div>

      {platformOn && (
        <PlatformConnectivityStrip
          label="CRM campaigns"
          detail={
            loading
              ? 'Loading /crm/campaigns and /crm/leads…'
              : `${platformCampaigns.length} journey(s) · ${campaignLeads.length} bookable lead(s)`
          }
          error={error}
        />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-3xl font-bold">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.detail}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarCheck2 className="h-5 w-5 text-primary" />
            Campaign → appointment
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Convert journey participants into confirmed slots. Requires a CRM lead linked to a registered patient (
            <span className="font-mono text-xs">patientId</span>).
          </p>
        </CardHeader>
        <CardContent>
          {campaignLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {platformOn
                ? 'No open leads with patient records — register patients and attach them to leads first.'
                : 'Enable platform runtime to book appointments from live CRM leads.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Scheduling</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.fullName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {lead.stage.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{lead.packageName ?? '—'}</TableCell>
                    <TableCell>{lead.ownerLabel ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      <ScheduleFromLeadDialog
                        lead={{
                          id: lead.id,
                          fullName: lead.fullName,
                          patientId: lead.patientId,
                          specialty: lead.specialty,
                          packageName: lead.packageName,
                        }}
                        triggerLabel={lead.patientId ? 'Book appointment' : 'Needs patient'}
                        variant={lead.patientId ? 'default' : 'outline'}
                        onBooked={() => void refresh()}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Journey Performance</CardTitle>
            <Button variant="outline" size="sm">
              View Reports
            </Button>
          </CardHeader>
          <CardContent>
            {journeyRows.length === 0 ? (
              <PlatformEmptyState message="No care journeys yet. Enable platform runtime to load CRM campaigns." />
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Journey</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead>Reach</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Follow-up</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journeyRows.map((journey) => (
                  <TableRow key={journey.id ?? journey.name}>
                    <TableCell className="font-medium">{journey.name}</TableCell>
                    <TableCell>{journey.segment}</TableCell>
                    <TableCell>{journey.reach}</TableCell>
                    <TableCell>{journey.channel}</TableCell>
                    <TableCell className="min-w-[150px]">
                      <div className="space-y-2">
                        <div className="text-sm">{journey.engagement}%</div>
                        <Progress value={journey.engagement} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusStyles[journey.status]}>
                        {journey.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {campaignLeads[0] ? (
                        <ScheduleFromLeadDialog
                          lead={{
                            id: campaignLeads[0].id,
                            fullName: campaignLeads[0].fullName,
                            patientId: campaignLeads[0].patientId,
                            specialty: campaignLeads[0].specialty,
                            packageName: campaignLeads[0].packageName,
                          }}
                          triggerLabel="Book lead"
                          size="sm"
                          onBooked={() => void refresh()}
                        />
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Popular Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {templates.length === 0 ? (
              <PlatformEmptyState message="Journey templates appear when demo data is enabled or platform campaigns are configured." />
            ) : (
              templates.map((template) => (
              <div key={template.name} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{template.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{template.detail}</p>
                  </div>
                  <PlayCircle className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{template.usage}</p>
              </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
