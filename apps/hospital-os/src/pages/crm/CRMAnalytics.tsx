import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { CircleDollarSign, LineChart, MessageCircleHeart, Users } from 'lucide-react';

const summary = [
  { label: 'Conversion rate', value: '18.7%', detail: '+2.3 pts vs last month', icon: LineChart },
  { label: 'Revenue influenced', value: 'Rs 42.6L', detail: 'Attributed to CRM touchpoints', icon: CircleDollarSign },
  { label: 'Repeat visit share', value: '34%', detail: 'Driven by loyalty journeys', icon: Users },
  { label: 'Positive sentiment', value: '82%', detail: 'Nursing and discharge praise strongest', icon: MessageCircleHeart },
];

const channelData = [
  { channel: 'Referral', leads: 142, conversions: 52 },
  { channel: 'WhatsApp', leads: 198, conversions: 64 },
  { channel: 'Website', leads: 126, conversions: 31 },
  { channel: 'Call Center', leads: 88, conversions: 21 },
];

const insights = [
  { title: 'WhatsApp recovery sequence', impact: '+19% conversion lift', action: 'Expand to ortho and dialysis cohorts', status: 'Recommended' },
  { title: 'Doctor referral nurture', impact: '+11% repeat consult rate', action: 'Add 72-hour concierge follow-up', status: 'Recommended' },
  { title: 'Wellness reactivation opportunity', impact: '87 dormant patients', action: 'Launch preventive screening offer', status: 'Open' },
];

const statusStyles: Record<string, string> = {
  Recommended: 'bg-success/10 text-success border-success/20',
  Open: 'bg-warning/10 text-warning border-warning/20',
};

export default function CRMAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Engagement Analytics</h1>
        <p className="text-sm text-muted-foreground">Measure channel quality, conversion outcomes and patient retention impact</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary.map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-3xl font-bold">{item.value}</p>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Best Channel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Top performer</p>
              <p className="mt-1 text-2xl font-bold">WhatsApp</p>
              <p className="mt-2 text-sm text-muted-foreground">64 conversions from 198 leads this cycle.</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Highest opportunity</p>
              <p className="mt-1 text-2xl font-bold">Referral</p>
              <p className="mt-2 text-sm text-muted-foreground">Strong close rate, worth expanding referral enablement.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Actionable Insights</CardTitle>
          <Badge variant="outline">Updated this week</Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Insight</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead>Recommended Action</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insights.map((item) => (
                <TableRow key={item.title}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{item.impact}</TableCell>
                  <TableCell>{item.action}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusStyles[item.status]}>
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
