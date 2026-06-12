import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkspacePage, MetricStrip, WorkflowPanel, type MetricCard } from '@/components/shell/workspace-primitives';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles } from 'lucide-react';

type WorkflowStep = {
  id: string;
  label: string;
  status: 'done' | 'active' | 'pending';
};

export default function AdrineModuleScreen({
  title,
  subtitle,
  module,
  metrics,
  workflow,
  aiInsight,
  children,
}: {
  title: string;
  subtitle: string;
  module: string;
  metrics?: MetricCard[];
  workflow?: WorkflowStep[];
  aiInsight?: string;
  children?: ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <WorkspacePage
      title={title}
      subtitle={subtitle}
      actions={
        <Badge variant="outline" className="text-[10px] font-normal">
          {module}
        </Badge>
      }
    >
      {metrics && metrics.length > 0 && <MetricStrip metrics={metrics} />}

      {aiInsight && (
        <div className="rounded-xl border border-foreground/10 bg-gradient-to-r from-foreground/[0.03] to-transparent p-4 flex gap-3 items-start">
          <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI insight</p>
            <p className="text-sm mt-1 text-foreground/90">{aiInsight}</p>
          </div>
        </div>
      )}

      {workflow && workflow.length > 0 && (
        <WorkflowPanel title="Workflow">
          <ol className="space-y-2">
            {workflow.map((step, i) => (
              <li key={step.id} className="flex items-center gap-3 text-sm">
                <span
                  className={
                    step.status === 'done'
                      ? 'h-6 w-6 rounded-full bg-emerald-500/15 text-emerald-700 flex items-center justify-center text-xs font-bold'
                      : step.status === 'active'
                        ? 'h-6 w-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold'
                        : 'h-6 w-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs'
                  }
                >
                  {i + 1}
                </span>
                <span className={step.status === 'pending' ? 'text-muted-foreground' : 'font-medium'}>
                  {step.label}
                </span>
                {step.status === 'active' && (
                  <Badge className="text-[10px] ml-auto">In progress</Badge>
                )}
              </li>
            ))}
          </ol>
        </WorkflowPanel>
      )}

      {children}

      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(-1)}>
          Back <ArrowRight className="h-3.5 w-3.5 rotate-180" />
        </Button>
      </div>
    </WorkspacePage>
  );
}
