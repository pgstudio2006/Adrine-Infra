import { Card, CardContent } from '@/components/ui/card';

type Kpi = { label: string; value: string; hint?: string };

export function AfKpiGrid({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="rounded-xl border-border/70 shadow-sm">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              {kpi.label}
            </p>
            <p className="text-xl font-bold mt-1 tabular-nums">{kpi.value}</p>
            {kpi.hint ? (
              <p className="text-[11px] text-muted-foreground mt-1">{kpi.hint}</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
