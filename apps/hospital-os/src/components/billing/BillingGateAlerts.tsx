import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  BILLING_GATE_COPY,
  blockersToGateMessages,
  type BillingGateMessage,
} from '@/components/billing/billing-gate-messages';

type Props = {
  blockers?: string[];
  extra?: BillingGateMessage[];
  focus?: 'all' | 'GAP-006' | 'GAP-007';
};

export function BillingGateAlerts({
  blockers = [],
  extra = [],
  focus = 'all',
}: Props) {
  const merged = [...blockersToGateMessages(blockers), ...extra];
  const filtered =
    focus === 'all'
      ? merged
      : merged.filter((m) => m.gapId === focus);

  if (filtered.length === 0) return null;

  const byGap = new Map<string, BillingGateMessage[]>();
  for (const m of filtered) {
    const list = byGap.get(m.gapId) ?? [];
    list.push(m);
    byGap.set(m.gapId, list);
  }

  return (
    <div className="space-y-2">
      {[...byGap.entries()].map(([gapId, messages]) => {
        const copy = BILLING_GATE_COPY[gapId as keyof typeof BILLING_GATE_COPY];
        return (
          <div
            key={gapId}
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm space-y-1.5"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="destructive" className="text-[10px] gap-1">
                <AlertTriangle className="h-3 w-3" />
                {gapId}
              </Badge>
              <span className="font-medium text-foreground">{copy.title}</span>
            </div>
            <p className="text-xs text-muted-foreground">{copy.hint}</p>
            <ul className="text-xs text-destructive list-disc pl-4">
              {messages.map((m) => (
                <li key={m.message}>{m.message}</li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
