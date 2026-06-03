import type { DashboardKpi } from '@/lib/dashboard/dashboard-engine';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { LucideIcon } from 'lucide-react';

type Props = {
  kpis: DashboardKpi[];
  icons?: LucideIcon[];
  live?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  columns?: 2 | 3 | 4 | 6;
};

export function DashboardKpiGrid({
  kpis,
  icons = [],
  live = false,
  loading = false,
  emptyMessage = 'Enable platform runtime for live branch KPIs.',
  columns = 4,
}: Props) {
  const colClass =
    columns === 6
      ? 'grid-cols-2 lg:grid-cols-6'
      : columns === 3
        ? 'grid-cols-1 sm:grid-cols-3'
        : columns === 2
          ? 'grid-cols-2'
          : 'grid-cols-2 lg:grid-cols-4';

  if (loading && kpis.length === 0) {
    return <p className="text-xs text-muted-foreground">Loading live KPIs…</p>;
  }

  if (kpis.length === 0) {
    return <p className="text-xs text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className={`grid ${colClass} gap-3`}>
      {kpis.map((kpi, i) => {
        const Icon = icons[i];
        return (
          <Card key={kpi.id}>
            <CardContent className="p-3 flex items-start gap-3">
              {Icon ? <Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" /> : null}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold tabular-nums">{kpi.value}</p>
                  {live && i === 0 ? (
                    <Badge variant="outline" className="text-[9px]">
                      Live
                    </Badge>
                  ) : null}
                </div>
                <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                {kpi.hint ? (
                  <p className="text-[10px] text-muted-foreground/80 mt-0.5 truncate">{kpi.hint}</p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
