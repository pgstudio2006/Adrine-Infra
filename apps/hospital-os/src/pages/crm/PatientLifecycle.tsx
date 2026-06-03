import { useMemo } from 'react';
import { useCrmPlatform } from '@/hooks/useCrmPlatform';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarCheck2, HeartHandshake, PhoneCall, UserRound } from 'lucide-react';
import { allowDemoFallback, pickPlatformRows } from '@/lib/platform/demo-fallback';
import { PlatformEmptyState } from '@/components/platform/PlatformEmptyState';

const lifecycleCardsDemo = [
  { label: 'Active journeys', value: '893', detail: 'Across OPD, IPD and chronic care' },
  { label: 'At-risk patients', value: '24', detail: 'Need intervention in 24 hours' },
  { label: 'Recovery completion', value: '72%', detail: 'Discharge follow-up task completion' },
];

const lifecycleStagesDemo = [
  { stage: 'Pre-visit activation', count: 428, progress: 91 },
  { stage: 'Care delivery', count: 276, progress: 84 },
  { stage: 'Recovery and loyalty', count: 189, progress: 72 },
];

const lifecyclePatientsDemo = [
  { patient: 'Sana Khan', journey: 'Orthopedic post-op recovery', owner: 'Neha', risk: 'High', nextStep: 'Call caregiver and escalate to nursing desk' },
  { patient: 'Rohan Iyer', journey: 'Preventive cardiology annual plan', owner: 'Wellness team', risk: 'Medium', nextStep: 'Send reminder bundle and slot reservation' },
  { patient: 'Meera Joseph', journey: 'Maternity postpartum support', owner: 'Women care pod', risk: 'Low', nextStep: 'Request review after successful support touchpoint' },
  { patient: 'Dev Patel', journey: 'Dialysis reminder flow', owner: 'Care manager', risk: 'Medium', nextStep: 'Confirm tomorrow session attendance' },
];

const riskStyles: Record<string, string> = {
  High: 'bg-destructive/10 text-destructive border-destructive/20',
  Medium: 'bg-warning/10 text-warning border-warning/20',
  Low: 'bg-success/10 text-success border-success/20',
};

export default function PatientLifecycle() {
  const { platformOn, lifecycle: platformLifecycle } = useCrmPlatform();
  const platformPatients = useMemo(() => {
    return platformLifecycle.map((e) => ({
      patient: e.patient?.fullName ?? 'Patient',
      journey: e.journey ?? e.eventType,
      owner: e.ownerLabel ?? 'Care team',
      risk:
        (e.riskLevel ?? 'medium').charAt(0).toUpperCase() + (e.riskLevel ?? 'medium').slice(1),
      nextStep: e.nextStep ?? e.detail ?? '—',
    }));
  }, [platformLifecycle]);

  const patients = useMemo(
    () => pickPlatformRows(platformOn && platformLifecycle.length > 0, platformPatients, lifecyclePatientsDemo),
    [platformOn, platformLifecycle.length, platformPatients],
  );

  const lifecycleCards = useMemo(() => {
    if (platformOn && platformLifecycle.length > 0) {
      return [
        { label: 'Active journeys', value: String(platformLifecycle.length), detail: 'From CRM lifecycle API' },
        { label: 'At-risk patients', value: String(platformLifecycle.filter((e) => e.riskLevel === 'high').length), detail: 'High risk flagged' },
        { label: 'Recovery completion', value: '—', detail: 'Analytics pending' },
      ];
    }
    if (allowDemoFallback()) return lifecycleCardsDemo;
    return lifecycleCardsDemo.map((c) => ({ ...c, value: '—', detail: 'No platform data' }));
  }, [platformOn, platformLifecycle]);

  const lifecycleStages = allowDemoFallback() ? lifecycleStagesDemo : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patient Lifecycle</h1>
          <p className="text-sm text-muted-foreground">Monitor touchpoints from first inquiry through recovery and retention</p>
        </div>
        <Button>
          <HeartHandshake className="mr-2 h-4 w-4" />
          Launch Care Workflow
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {lifecycleCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-3xl font-bold">{card.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lifecycle Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lifecycleStages.length === 0 ? (
              <PlatformEmptyState message="Lifecycle stage metrics appear when platform CRM data is available." />
            ) : (
              lifecycleStages.map((stage) => (
                <div key={stage.stage} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stage.stage}</span>
                    <span className="text-muted-foreground">{stage.count}</span>
                  </div>
                  <Progress value={stage.progress} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Intervention Queue</CardTitle>
            <Button variant="outline" size="sm">View All</Button>
          </CardHeader>
          <CardContent>
            {patients.length === 0 ? (
              <PlatformEmptyState message="No lifecycle interventions queued. Connect CRM platform to monitor patient journeys." />
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Journey</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Next Step</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((item) => (
                  <TableRow key={`${item.patient}-${item.journey}`}>
                    <TableCell className="font-medium">{item.patient}</TableCell>
                    <TableCell>{item.journey}</TableCell>
                    <TableCell>{item.owner}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={riskStyles[item.risk]}>
                        {item.risk}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.nextStep}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Care Team Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button>
            <PhoneCall className="mr-2 h-4 w-4" />
            Start Rescue Calls
          </Button>
          <Button variant="outline">
            <CalendarCheck2 className="mr-2 h-4 w-4" />
            Book Follow-up Slots
          </Button>
          <Button variant="outline">
            <UserRound className="mr-2 h-4 w-4" />
            Assign Care Manager
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
