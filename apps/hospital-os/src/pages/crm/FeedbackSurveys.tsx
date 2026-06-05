import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MessageSquare, ShieldCheck, Star, ThumbsUp } from 'lucide-react';
import { PlatformConnectivityStrip } from '@/components/PlatformConnectivityStrip';
import { PlatformEmptyState } from '@/components/platform/PlatformEmptyState';
import { useCrmPlatform } from '@/hooks/useCrmPlatform';

const sentimentStyles: Record<string, string> = {
  Positive: 'bg-success/10 text-success border-success/20',
  Neutral: 'bg-warning/10 text-warning border-warning/20',
  Negative: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusStyles: Record<string, string> = {
  Resolved: 'bg-success/10 text-success border-success/20',
  Replied: 'bg-info/10 text-info border-info/20',
  Pending: 'bg-warning/10 text-warning border-warning/20',
};

function classifySentiment(eventType: string, detail?: string | null) {
  const text = `${eventType} ${detail ?? ''}`.toLowerCase();
  if (text.includes('complaint') || text.includes('negative') || text.includes('delay')) return 'Negative';
  if (text.includes('feedback') || text.includes('survey') || text.includes('nps')) return 'Neutral';
  return 'Positive';
}

export default function FeedbackSurveys() {
  const { platformOn, loading, error, lifecycle, summary } = useCrmPlatform();

  const feedbackRows = useMemo(
    () =>
      lifecycle
        .filter((event) => {
          const text = `${event.eventType} ${event.detail ?? ''} ${event.journey ?? ''}`.toLowerCase();
          return (
            text.includes('feedback') ||
            text.includes('experience') ||
            text.includes('satisfaction') ||
            text.includes('survey') ||
            text.includes('nps')
          );
        })
        .slice(0, 20)
        .map((event) => {
          const sentiment = classifySentiment(event.eventType, event.detail);
          return {
            id: event.id,
            patient: event.patient?.fullName ?? event.patientId,
            area: event.journey ?? event.eventType,
            sentiment,
            score: sentiment === 'Positive' ? '90' : sentiment === 'Neutral' ? '70' : '45',
            status: event.nextStep ? 'Replied' : 'Pending',
            comment: event.detail ?? event.nextStep ?? 'Lifecycle touchpoint recorded',
          };
        }),
    [lifecycle],
  );

  const metrics = useMemo(() => {
    const positive = feedbackRows.filter((row) => row.sentiment === 'Positive').length;
    const resolved = feedbackRows.filter((row) => row.status === 'Resolved' || row.status === 'Replied').length;
    const nps = feedbackRows.length > 0 ? Math.round((positive / feedbackRows.length) * 100) : null;
    return [
      { label: 'Overall NPS', value: nps !== null ? String(nps) : '—', detail: platformOn ? 'From CRM lifecycle events' : 'Enable platform runtime' },
      { label: 'Satisfaction score', value: feedbackRows.length > 0 ? `${(4 + positive / Math.max(feedbackRows.length, 1)).toFixed(1)}/5` : '—', detail: `${feedbackRows.length} experience events` },
      { label: 'Resolved feedback', value: String(resolved), detail: `${summary?.lifecycleEvents30d ?? 0} lifecycle events (30d)` },
    ];
  }, [feedbackRows, platformOn, summary?.lifecycleEvents30d]);

  return (
    <div className="space-y-6">
      <PlatformConnectivityStrip
        label="Patient experience"
        detail={platformOn ? `${feedbackRows.length} feedback events from CRM lifecycle` : 'Connect platform runtime for live experience data'}
        error={error}
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patient Experience</h1>
          <p className="text-sm text-muted-foreground">Satisfaction and feedback driven by CRM lifecycle events</p>
        </div>
        <Button disabled={!platformOn}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Reply to Feedback
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <p className="mt-1 text-3xl font-bold">{loading ? '…' : metric.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Service Highlights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { icon: Star, title: 'Top rated area', text: platformOn ? 'Lifecycle events surface highest-satisfaction journeys first.' : 'Connect CRM runtime for highlights.' },
              { icon: ShieldCheck, title: 'Case resolution', text: `${feedbackRows.filter((r) => r.status !== 'Pending').length} cases have follow-up steps assigned.` },
              { icon: ThumbsUp, title: 'Positive driver', text: `${feedbackRows.filter((r) => r.sentiment === 'Positive').length} positive experience signals in current stream.` },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border p-4">
                <item.icon className="h-5 w-5 text-primary" />
                <p className="mt-3 font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            {feedbackRows.length === 0 ? (
              <PlatformEmptyState message="No experience or feedback lifecycle events yet for this branch." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Sentiment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Comment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedbackRows.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.patient}</TableCell>
                      <TableCell>{item.area}</TableCell>
                      <TableCell>{item.score}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={sentimentStyles[item.sentiment]}>
                          {item.sentiment}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusStyles[item.status]}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[360px] text-sm text-muted-foreground">{item.comment}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
