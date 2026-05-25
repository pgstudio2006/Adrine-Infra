import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Activity, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PatientContextBar } from '@/components/clinical/PatientContextBar';
import { NursePageHeader } from '@/components/clinical/ClinicalTableStates';
import { useHospital } from '@/stores/hospitalStore';
import {
  canUseNursingRuntime,
  platformListVitalsForAdmission,
  type PlatformNursingVital,
} from '@/runtime/nursing-runtime';
import { formatPlatformErrorBody, PlatformApiError } from '@/runtime/platform-client';
import { Skeleton } from '@/components/ui/skeleton';

const chartConfig = {
  pulse: { label: 'Pulse', color: 'hsl(var(--chart-1))' },
  spo2: { label: 'SpO₂', color: 'hsl(var(--chart-2))' },
  temp: { label: 'Temp °F', color: 'hsl(var(--chart-3))' },
  painScore: { label: 'Pain', color: 'hsl(var(--chart-4))' },
};

function parseBp(bp: string): number | null {
  const match = bp.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return null;
  return Math.round((Number(match[1]) + Number(match[2])) / 2);
}

export default function NurseVitalsChart() {
  const { admissionId = '' } = useParams();
  const navigate = useNavigate();
  const { admissions } = useHospital();
  const platformOk = canUseNursingRuntime();

  const admission = admissions.find((a) => a.id === admissionId);
  const [vitals, setVitals] = useState<PlatformNursingVital[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!admission?.platformAdmissionId || !platformOk) {
      setVitals([]);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const rows = await platformListVitalsForAdmission(admission.platformAdmissionId);
      setVitals(rows.slice().sort((a, b) => a.recordedAt.localeCompare(b.recordedAt)));
    } catch (err) {
      const body = err instanceof PlatformApiError ? err.body : undefined;
      const msg =
        formatPlatformErrorBody(body)
        ?? (err instanceof Error ? err.message : 'Could not load vitals trend');
      setLoadError(msg);
      toast.error('Failed to load vitals', { description: msg });
    } finally {
      setLoading(false);
    }
  }, [admission?.platformAdmissionId, platformOk]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const chartData = useMemo(
    () =>
      vitals.map((v) => ({
        at: new Date(v.recordedAt).toLocaleString('en-IN', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        pulse: v.pulse,
        spo2: v.spo2,
        temp: v.temp,
        painScore: v.painScore,
        bpSys: parseBp(v.bp),
        nurse: v.nurse,
        shift: v.shift,
      })),
    [vitals],
  );

  if (!admission) {
    return (
      <div className="space-y-4">
        <NursePageHeader title="Vitals trend" description="Admission not found." />
        <Button variant="outline" asChild>
          <Link to="/nurse/vitals">Back to vitals</Link>
        </Button>
      </div>
    );
  }

  const platformLinked = Boolean(admission.platformAdmissionId);

  return (
    <div className="space-y-6">
      <PatientContextBar
        patientName={admission.patientName}
        uhid={admission.uhid}
        ward={admission.ward}
        bed={admission.bed}
        status={admission.status}
        attendingDoctor={admission.attendingDoctor}
        platformLinked={platformLinked}
        backTo="/nurse/vitals"
        backLabel="Back to vitals"
        actions={
          <Button size="sm" variant="outline" onClick={() => navigate('/nurse/vitals')}>
            <Plus className="mr-1 h-4 w-4" />
            Record vitals
          </Button>
        }
      />

      <NursePageHeader
        title="Vitals trend"
        description={
          platformLinked && platformOk
            ? 'Historical vital signs from domain-api for this admission.'
            : 'Connect a platform-linked admission to load governed vitals history.'
        }
      />

      {!platformLinked || !platformOk ? (
        <Card className="border-border">
          <CardContent className="p-6 text-sm text-muted-foreground">
            This chart requires an active platform IPD admission. Admit or sync the patient on the platform,
            then return here to view trends from{' '}
            <code className="text-xs">GET /nursing/vitals/admission/:id</code>.
          </CardContent>
        </Card>
      ) : null}

      {loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-[280px] w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ) : null}

      {!loading && platformLinked && platformOk && chartData.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Activity className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">No vitals recorded yet</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Record the first vital sign round from the vitals workspace to populate this chart.
            </p>
            <Button size="sm" onClick={() => navigate('/nurse/vitals')}>
              Record vitals
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!loading && chartData.length > 0 ? (
        <>
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pulse & SpO₂</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[260px] w-full">
                <LineChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="at" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
                  <YAxis yAxisId="left" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis yAxisId="right" orientation="right" domain={[85, 100]} tickLine={false} axisLine={false} fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line yAxisId="left" type="monotone" dataKey="pulse" stroke="var(--color-pulse)" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="spo2" stroke="var(--color-spo2)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Temperature & pain</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[220px] w-full">
                <LineChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="at" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="temp" stroke="var(--color-temp)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="painScore" stroke="var(--color-painScore)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Reading log</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {vitals
                .slice()
                .reverse()
                .map((v) => (
                  <div key={v.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-foreground">
                        {new Date(v.recordedAt).toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {v.nurse} · {v.shift}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        BP {v.bp}
                      </Badge>
                      <Badge variant="outline" className="font-mono text-xs">
                        {v.pulse} bpm
                      </Badge>
                      <Badge variant="outline" className="font-mono text-xs">
                        {v.temp}°F
                      </Badge>
                      <Badge variant={v.spo2 < 94 ? 'destructive' : 'outline'} className="font-mono text-xs">
                        SpO₂ {v.spo2}%
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Pain {v.painScore}/10
                      </Badge>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
