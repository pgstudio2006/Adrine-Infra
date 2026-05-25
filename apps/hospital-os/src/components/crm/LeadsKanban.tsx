import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CRM_LEAD_STAGES, crmStageColor, crmStageLabel } from '@/lib/crm/crm-stage-labels';

export type KanbanLeadRow = {
  id: string;
  name: string;
  specialty: string;
  packageName: string;
  owner: string;
  value: string;
  priority: string;
  status: string;
  stage: string;
};

const priorityStyles: Record<string, string> = {
  High: 'bg-destructive/10 text-destructive border-destructive/20',
  Medium: 'bg-warning/10 text-warning border-warning/20',
  Low: 'bg-muted text-muted-foreground border-border',
};

type Props = {
  rows: KanbanLeadRow[];
};

export function LeadsKanban({ rows }: Props) {
  const stageIds = CRM_LEAD_STAGES.map((s) => s.id);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {CRM_LEAD_STAGES.map((stage) => {
        const column = rows.filter((r) => {
          const normalized = r.stage.toLowerCase().replace(/\s+/g, '_');
          return normalized === stage.id || crmStageLabel(r.stage).toLowerCase() === stage.label.toLowerCase();
        });

        return (
          <Card key={stage.id} className="flex flex-col min-h-[280px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: stage.color }}
                  />
                  {stage.label}
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {column.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 flex-1 pt-0">
              {column.length === 0 && (
                <p className="text-[11px] text-muted-foreground text-center py-6 border border-dashed rounded-lg">
                  No leads
                </p>
              )}
              {column.map((lead) => (
                <div
                  key={lead.id}
                  className="rounded-lg border bg-card p-3 shadow-sm hover:border-primary/30 transition-colors"
                >
                  <p className="text-sm font-medium">{lead.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{lead.specialty}</p>
                  <p className="text-[10px] text-muted-foreground">{lead.packageName}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="outline" className={`text-[9px] ${priorityStyles[lead.priority] ?? ''}`}>
                      {lead.priority}
                    </Badge>
                    <Badge variant="outline" className="text-[9px]">
                      {lead.value}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">{lead.owner}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{lead.status}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
      {rows.some((r) => !stageIds.includes(r.stage as (typeof stageIds)[number])) && (
        <Card className="md:col-span-2 xl:col-span-3 border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Other stages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {rows
              .filter((r) => !stageIds.some((id) => id === r.stage))
              .map((lead) => (
                <div key={lead.id} className="rounded-lg border p-3 text-sm">
                  <span className="font-medium">{lead.name}</span>
                  <Badge variant="outline" className="ml-2 text-[9px]" style={{ borderColor: crmStageColor(lead.stage) }}>
                    {crmStageLabel(lead.stage)}
                  </Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
