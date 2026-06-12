/**
 * AIInsightPanel — renders the advisory intelligence layer.
 * Shows recommendation, expandable reasoning chain, confidence, and action.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronDown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { AIInsight, InsightSeverity } from '@/lib/adrine/ai-insights';

const SEVERITY_STYLE: Record<InsightSeverity, { dot: string; label: string }> = {
  info: { dot: 'bg-muted-foreground', label: 'Info' },
  suggestion: { dot: 'bg-info', label: 'Suggestion' },
  warning: { dot: 'bg-warning', label: 'Attention' },
  critical: { dot: 'bg-destructive', label: 'Critical' },
};

function InsightRow({ insight }: { insight: AIInsight }) {
  const [open, setOpen] = useState(insight.severity === 'critical');
  const navigate = useNavigate();
  const style = SEVERITY_STYLE[insight.severity];

  return (
    <div className="border-b border-border/60 last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start gap-3 py-3 px-4 text-left transition-colors hover:bg-accent/30"
      >
        <span className={cn('mt-1.5 h-2 w-2 rounded-full shrink-0', style.dot)} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-medium text-foreground leading-tight">{insight.title}</p>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
              {style.label}
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground mt-0.5">{insight.recommendation}</p>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground shrink-0 mt-0.5 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pl-9">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1.5">
                Reasoning
              </p>
              <ol className="space-y-1">
                {insight.reasoning.map((step, i) => (
                  <li key={i} className="text-[12px] text-foreground/80 flex gap-2">
                    <span className="text-muted-foreground tabular-nums shrink-0">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  Confidence {Math.round(insight.confidence * 100)}%
                </span>
                {insight.action?.to && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 text-[11px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(insight.action!.to!);
                    }}
                  >
                    {insight.action.label}
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AIInsightPanel({
  insights,
  title = 'Adrine Intelligence',
  className,
}: {
  insights: AIInsight[];
  title?: string;
  className?: string;
}) {
  return (
    <section className={cn('rounded-lg border border-border bg-card overflow-hidden', className)}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-gradient-to-r from-foreground/[0.03] to-transparent">
        <Sparkles className="h-3.5 w-3.5 text-foreground" />
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground">{title}</h2>
        <span className="ml-auto text-[10px] text-muted-foreground">Advisory · human-confirmed</span>
      </div>
      <div>
        {insights.map((insight) => (
          <InsightRow key={insight.id} insight={insight} />
        ))}
      </div>
    </section>
  );
}
