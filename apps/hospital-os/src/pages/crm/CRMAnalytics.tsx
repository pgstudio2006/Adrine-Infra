import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { CircleDollarSign, LineChart, MessageCircleHeart, Users } from 'lucide-react';
import { PlatformConnectivityStrip } from '@/components/PlatformConnectivityStrip';
import { PlatformEmptyState } from '@/components/platform/PlatformEmptyState';
import { useCrmPlatform } from '@/hooks/useCrmPlatform';

const statusStyles: Record<string, string> = {
  Recommended: 'bg-success/10 text-success border-success/20',
  Open: 'bg-warning/10 text-warning border-warning/20',
};

export default function CRMAnalytics() {
  const { platformOn, loading, error, summary, leads, lifecycle, campaigns } = useCrmPlatform();

  const convertedLeads = useMemo(
    () => leads.filter((lead) => lead.stage === 'converted' || lead.status === 'converted').length,
    [leads],
  );

  const conversionRate = leads.length > 0 ? `${((convertedLeads / leads.length) * 100).toFixed(1)}%` : '—';

  const revenueInfluenced = useMemo(() => {
    const cents = leads.reduce((sum, lead) => sum + (lead.valueCents ?? 0), 0);
    if (cents <= 0) return '—';
    return `Rs ${(cents / 100_000).toFixed(1)}L`;
  }, [leads]);

  const repeatVisitShare = useMemo(() => {
    const repeat = lifecycle.filter((event) => event.eventType.toLowerCase().includes('return')).length;
    if (lifecycle.length === 0) return '—';
    return `${Math.round((repeat / lifecycle.length) * 100)}%`;
  }, [lifecycle]);

  const positiveSentiment = useMemo(() => {
    const positive = lifecycle.filter((event) => {
      const text = `${event.eventType} ${event.detail ?? ''}`.toLowerCase();
      return text.includes('positive') || text.includes('satisfied') || text.includes('completed');
    }).length;
    if (lifecycle.length === 0) return '—';
    return `${Math.round((positive / lifecycle.length) * 100)}%`;
  }, [lifecycle]);

  const summaryCards = [
    { label: 'Conversion rate', value: conversionRate, detail: `${convertedLeads} of ${leads.length} leads converted`, icon: LineChart },
    { label: 'Revenue influenced', value: revenueInfluenced, detail: 'Sum of lead values in pipeline', icon: CircleDollarSign },
    { label: 'Repeat visit share', value: repeatVisitShare, detail: `${lifecycle.length} lifecycle events`, icon: Users },
    { label: 'Positive sentiment', value: positiveSentiment, detail: `${summary?.lifecycleEvents30d ?? 0} events (30d)`, icon: MessageCircleHeart },
  ];

  const channelData = useMemo(() => {
    const byChannel = new Map<string, { leads: number; conversions: number }>();
    for (const lead of leads) {
      const channel = lead.channel ?? 'Direct';
      const current = byChannel.get(channel) ?? { leads: 0, conversions: 0 };
      current.leads += 1;
      if (lead.stage === 'converted' || lead.status === 'converted') current.conversions += 1;
      byChannel.set(channel, current);
    }
    return Array.from(byChannel.entries()).map(([channel, value]) => ({
      channel,
      leads: value.leads,
      conversions: value.conversions,
    }));
  }, [leads]);

  const insights = useMemo(() => {
    const rows: { title: string; impact: string; action: string; status: string }[] = [];
    if (campaigns.length > 0) {
      rows.push({
        title: campaigns[0].name,
        impact: `${campaigns[0].reachCount} reach`,
        action: `Channel: ${campaigns[0].channel ?? 'multi'}`,
        status: 'Recommended',
      });
    }
    if (summary && summary.openLeads > 0) {
      rows.push({
        title: 'Open lead follow-up',
        impact: `${summary.openLeads} open leads`,
        action: 'Prioritize high-value stages in Lead Pipeline',
        status: 'Open',
      });
    }
    return rows;
  }, [campaigns, summary]);

  return (
    <div className="space-y-6">
      <PlatformConnectivityStrip
        label="CRM analytics"
        detail={platformOn ? `${leads.length} leads · ${campaigns.length} campaigns · ${lifecycle.length} lifecycle events` : 'Enable platform runtime for live CRM analytics'}
        error={error}
      />

      <div>
        <h1 className="text-2xl font-bold text-foreground">Engagement Analytics</h1>
        <p className="text-sm text-muted-foreground">Channel quality, conversion outcomes and retention from live CRM data</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-3xl font-bold">{loading ? '…' : item.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Channel Conversion Quality</CardTitle>
          </CardHeader>
          <CardContent>
            {channelData.length === 0 ? (
              <PlatformEmptyState message="No lead channel data yet for this branch." />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={channelData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 4" stroke="hsl(var(--border))" />
                  <XAxis dataKey="channel" stroke="transparent" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis stroke="transparent" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 6,
                      backgroundColor: 'hsl(var(--background))',
                    }}
                  />
                  <Bar dataKey="leads" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="conversions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recommended Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.length === 0 ? (
              <PlatformEmptyState message="Insights appear when CRM campaigns and leads are synced." />
            ) : (
              insights.map((insight) => (
                <div key={insight.title} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{insight.title}</p>
                    <Badge variant="outline" className={statusStyles[insight.status]}>
                      {insight.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{insight.impact}</p>
                  <p className="mt-2 text-xs">{insight.action}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Stage Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {(summary?.leadsByStage ?? []).length === 0 ? (
            <PlatformEmptyState message="No lead stage breakdown available yet." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stage</TableHead>
                  <TableHead>Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary!.leadsByStage.map((row) => (
                  <TableRow key={row.stage}>
                    <TableCell className="font-medium capitalize">{row.stage}</TableCell>
                    <TableCell>{row._count._all}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
