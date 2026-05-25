import { PreviewWireBanner } from '@/components/PreviewWireBanner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MessageSquare, ShieldCheck, Star, ThumbsUp } from 'lucide-react';

const metrics = [
  { label: 'Overall NPS', value: '74', detail: 'Excellent' },
  { label: 'Satisfaction score', value: '4.8/5', detail: 'Top service lines performing well' },
  { label: 'Resolved feedback', value: '38', detail: 'Closed today by patient relations team' },
];

const feedback = [
  { patient: 'Sameer K.', area: 'ICU', sentiment: 'Positive', score: '92', status: 'Resolved', comment: 'Nursing staff was very professional and the discharge process was smooth.' },
  { patient: 'Anita Roy', area: 'OPD', sentiment: 'Neutral', score: '68', status: 'Replied', comment: 'Wait time was longer than expected, but doctor explanation was good.' },
  { patient: 'Karan Singh', area: 'Facilities', sentiment: 'Negative', score: '45', status: 'Pending', comment: 'Attendant cafeteria options were limited during the visit.' },
  { patient: 'Priya M.', area: 'Laboratory', sentiment: 'Positive', score: '98', status: 'Resolved', comment: 'WhatsApp report delivery saved time and improved the overall experience.' },
];

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

export default function FeedbackSurveys() {
  return (
    <div className="space-y-6">
      <PreviewWireBanner
        title="Patient experience (preview)"
        description="NPS and feedback tables are illustrative. Lifecycle events on /crm/lifecycle are platform-backed; full survey ingestion will use /crm/experience APIs in a later phase."
      />
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patient Experience</h1>
          <p className="text-sm text-muted-foreground">Preview satisfaction workspace — use Lead Pipeline and Lifecycle for connected CRM touchpoints</p>
        </div>
        <Button>
          <MessageSquare className="mr-2 h-4 w-4" />
          Reply to Feedback
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <p className="mt-1 text-3xl font-bold">{metric.value}</p>
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
              { icon: Star, title: 'Top rated area', text: 'Laboratory digital reporting continues to earn the highest satisfaction.' },
              { icon: ShieldCheck, title: 'Case resolution', text: 'Most complaints are being closed within the same working day.' },
              { icon: ThumbsUp, title: 'Positive driver', text: 'Nursing care and discharge guidance are the strongest experience drivers.' },
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
            <Button variant="outline" size="sm">Filter Cases</Button>
          </CardHeader>
          <CardContent>
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
                {feedback.map((item) => (
                  <TableRow key={`${item.patient}-${item.area}`}>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
