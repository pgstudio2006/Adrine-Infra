import { AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { BillingPageBanner } from '@/config/routeReadiness';

type Props = {
  mode: BillingPageBanner;
  detail?: string;
};

export function BillingReadinessStrip({ mode, detail }: Props) {
  if (mode === 'live') return null;

  const isPreview = mode === 'preview';

  return (
    <div
      className={`rounded-lg border border-dashed px-4 py-3 text-sm space-y-1 ${
        isPreview
          ? 'border-amber-500/40 bg-amber-500/5'
          : 'border-muted-foreground/30 bg-muted/30'
      }`}
    >
      <div className="flex items-center gap-2">
        <Badge
          variant={isPreview ? 'secondary' : 'outline'}
          className="text-[10px] gap-1"
        >
          {isPreview ? (
            <>
              <Info className="h-3 w-3" />
              Preview
            </>
          ) : (
            <>
              <AlertTriangle className="h-3 w-3" />
              Local demo
            </>
          )}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        {detail ??
          (isPreview
            ? 'Illustrative data only — not production financial truth. Use Invoices, Payments, or IPD Billing for live platform billing.'
            : 'Sample billing data in browser storage. Enable platform runtime for live invoices and settlement via BillingSyncService.')}
      </p>
    </div>
  );
}
