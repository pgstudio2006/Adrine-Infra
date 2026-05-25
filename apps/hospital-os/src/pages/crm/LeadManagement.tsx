import { useMemo, useState } from 'react';
import { useCrmPlatform } from '@/hooks/useCrmPlatform';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarCheck2, LayoutGrid, List, MessageSquare, PhoneCall, Plus, TrendingUp, Users } from 'lucide-react';
import { PlatformConnectivityStrip } from '@/components/PlatformConnectivityStrip';
import { LeadsKanban, type KanbanLeadRow } from '@/components/crm/LeadsKanban';
import { CRM_LEAD_STAGES, crmStageLabel } from '@/lib/crm/crm-stage-labels';
import { ScheduleFromLeadDialog } from '@/components/crm/ScheduleFromLeadDialog';

const pipelineStats = [
  { label: 'Open leads', value: '124', icon: Users, detail: '+16 new this week' },
  { label: 'Hot prospects', value: '32', icon: TrendingUp, detail: 'Need action in 48 hours' },
  { label: 'Consults booked', value: '28', icon: CalendarCheck2, detail: '11 scheduled today' },
  { label: 'Pending callbacks', value: '14', icon: PhoneCall, detail: '3 overdue by SLA' },
];

const demoLeads = [
  { id: 'L-1', name: 'Aditya Varma', specialty: 'Cardiology', packageName: 'TAVI Procedure', owner: 'Sonia Patel', channel: 'Phone', value: 'Rs 4.5L', priority: 'High', status: 'Counseling today', stage: 'counseling' },
  { id: 'L-2', name: 'Meera Nair', specialty: 'Maternity', packageName: 'Premium Suite Bundle', owner: 'Neha Shah', channel: 'WhatsApp', value: 'Rs 1.8L', priority: 'Medium', status: 'Tour pending', stage: 'new_inquiry' },
  { id: 'L-3', name: 'Rahul Khanna', specialty: 'Ophthalmology', packageName: 'Robot Lasik', owner: 'Aman Verma', channel: 'Call back', value: 'Rs 85K', priority: 'High', status: 'Insurance review', stage: 'financial_plan' },
  { id: 'L-4', name: 'Surbhi Gupta', specialty: 'Bariatric', packageName: 'Gastric Balloon', owner: 'Riya Das', channel: 'Email', value: 'Rs 2.2L', priority: 'Medium', status: 'Treatment plan sent', stage: 'financial_plan' },
  { id: 'L-5', name: 'Vikram Seth', specialty: 'Orthopedics', packageName: 'Knee Replacement', owner: 'Parth Mehta', channel: 'Phone', value: 'Rs 3.5L', priority: 'High', status: 'Consult booking', stage: 'decision_phase' },
];

const priorityStyles: Record<string, string> = {
  High: 'bg-destructive/10 text-destructive border-destructive/20',
  Medium: 'bg-warning/10 text-warning border-warning/20',
  Low: 'bg-muted text-muted-foreground border-border',
};

function formatValue(cents?: number | null) {
  if (cents == null) return '—';
  return `Rs ${(cents / 100).toLocaleString('en-IN')}`;
}

export default function LeadManagement() {
  const { platformOn, loading, error, leads: platformLeads, summary } = useCrmPlatform();
  const [view, setView] = useState<'kanban' | 'table'>('kanban');

  const rows = useMemo((): KanbanLeadRow[] => {
    if (platformOn && platformLeads.length > 0) {
      return platformLeads.map((l) => ({
        id: l.id,
        name: l.fullName,
        specialty: l.specialty ?? 'General',
        packageName: l.packageName ?? '—',
        owner: l.ownerLabel ?? 'Unassigned',
        channel: l.channel ?? '—',
        value: formatValue(l.valueCents),
        priority: l.priority.charAt(0).toUpperCase() + l.priority.slice(1),
        status: l.status,
        stage: l.stage,
      }));
    }
    return demoLeads.map((l) => ({ ...l, channel: l.channel }));
  }, [platformOn, platformLeads]);

  const stageSummary = useMemo(() => {
    if (platformOn && summary?.leadsByStage?.length) {
      const total = summary.leadsByStage.reduce((acc, s) => acc + s._count._all, 0) || 1;
      return summary.leadsByStage.map((s) => ({
        stage: crmStageLabel(s.stage),
        count: s._count._all,
        percent: Math.round((s._count._all / total) * 100),
      }));
    }
    return CRM_LEAD_STAGES.slice(0, 4).map((s, i) => ({
      stage: s.label,
      count: [42, 31, 18, 11][i] ?? 0,
      percent: [100, 74, 43, 26][i] ?? 0,
    }));
  }, [platformOn, summary]);

  const openLeads =
    platformOn && summary ? String(summary.openLeads) : pipelineStats[0].value;

  const bookableLeads = platformOn
    ? platformLeads.filter((l) => l.patientId).slice(0, 3)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lead Pipeline</h1>
          <p className="text-sm text-muted-foreground">Kanban by stage or table view — domain `/crm/leads` when runtime is on</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as 'kanban' | 'table')}>
            <TabsList>
              <TabsTrigger value="kanban" className="gap-1.5 text-xs">
                <LayoutGrid className="h-3.5 w-3.5" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="table" className="gap-1.5 text-xs">
                <List className="h-3.5 w-3.5" />
                Table
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        </div>
      </div>

      {platformOn && (
        <PlatformConnectivityStrip
          label="CRM leads"
          detail={loading ? 'Loading GET /crm/leads…' : `${platformLeads.length} lead(s) · open: ${openLeads}`}
          error={error}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {pipelineStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-3xl font-bold text-foreground">
                    {stat.label === 'Open leads' ? openLeads : stat.value}
                  </p>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stage Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stageSummary.map((item) => (
              <div key={item.stage} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.stage}</span>
                  <span className="text-muted-foreground">{item.count}</span>
                </div>
                <Progress value={item.percent} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          {view === 'kanban' ? (
            <LeadsKanban rows={rows} />
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">All Leads</CardTitle>
                <Button variant="outline" size="sm">
                  Export List
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Specialty</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((lead) => {
                      const platformLead = platformLeads.find((l) => l.id === lead.id);
                      return (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {crmStageLabel(lead.stage)}
                            </Badge>
                          </TableCell>
                          <TableCell>{lead.specialty}</TableCell>
                          <TableCell>{lead.packageName}</TableCell>
                          <TableCell>{lead.owner}</TableCell>
                          <TableCell>{lead.value}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={priorityStyles[lead.priority]}>
                              {lead.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{lead.status}</TableCell>
                          <TableCell className="text-right">
                            {platformLead && (
                              <ScheduleFromLeadDialog
                                lead={{
                                  id: platformLead.id,
                                  fullName: platformLead.fullName,
                                  patientId: platformLead.patientId,
                                  specialty: platformLead.specialty,
                                  packageName: platformLead.packageName,
                                }}
                                triggerLabel="Book"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button>
            <PhoneCall className="mr-2 h-4 w-4" />
            Start Call Round
          </Button>
          <Button variant="outline">
            <MessageSquare className="mr-2 h-4 w-4" />
            Send Follow-up Message
          </Button>
          {bookableLeads[0] && (
            <ScheduleFromLeadDialog
              lead={{
                id: bookableLeads[0].id,
                fullName: bookableLeads[0].fullName,
                patientId: bookableLeads[0].patientId,
                specialty: bookableLeads[0].specialty,
                packageName: bookableLeads[0].packageName,
              }}
              variant="outline"
              triggerLabel="Book Consultation (top lead)"
            />
          )}
          {!bookableLeads.length && (
            <Button variant="outline" disabled title="Requires platform lead with patientId">
              <CalendarCheck2 className="mr-2 h-4 w-4" />
              Book Consultation
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
