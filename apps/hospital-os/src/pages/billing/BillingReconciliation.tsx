import { useMemo } from 'react';
import { Scale, RefreshCw, Wallet, AlertTriangle } from 'lucide-react';
import { BillingDeptShell } from '@/components/billing/BillingDeptShell';
import { BillingEmptyState } from '@/components/billing/BillingEmptyState';
import { useFinanceOperationsLive } from '@/hooks/useFinanceOperationsLive';
import { useBillingStoreAggregates } from '@/hooks/useBillingDeptPlatform';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function BillingReconciliation() {
  const { data, error, loading, refresh, platformOn } = useFinanceOperationsLive();
  const aggregates = useBillingStoreAggregates();

  const cashCollected = useMemo(() => {
    const cash = aggregates.collectionsByMethod.Cash;
    return cash?.amount ?? 0;
  }, [aggregates.collectionsByMethod]);

  const platformOutstanding = (data?.summary.outstandingCents ?? 0) / 100;
  const variance = platformOn
    ? Math.abs(aggregates.totalCollected - cashCollected - platformOutstanding * 0.01)
    : 0;

  return (
    <BillingDeptShell
      title="Day-end cash reconciliation"
      subtitle="Branch live finance posture from GET /finance/operations/live"
      gateFocus="GAP-006"
      blockers={data?.reconciliationWarnings ?? []}
      platformError={error}
      platformLabel="Finance operations live"
      actions={
        <Button
          variant="outline"
          size="sm"
          disabled={loading || !platformOn}
          onClick={() => void refresh()}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
    >
      {!platformOn ? (
        <BillingEmptyState
          icon={Scale}
          title="Connect platform finance runtime"
          description="Day-end reconciliation compares hospitalStore cash collections with domain-api open invoices and orchestration health. Enable platform runtime and billing sync first."
        />
      ) : !data ? (
        <BillingEmptyState
          icon={AlertTriangle}
          title="Finance live snapshot unavailable"
          description={error ?? 'Could not load /finance/operations/live for this branch.'}
          actionLabel="Retry"
          onAction={() => void refresh()}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 flex gap-3">
                <Wallet className="h-8 w-8 text-green-600 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Cash collected (store)</p>
                  <p className="text-2xl font-bold">₹{cashCollected.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Open invoices</p>
                <p className="text-2xl font-bold">{data.summary.openInvoices}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Outstanding (platform)</p>
                <p className="text-2xl font-bold">₹{platformOutstanding.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Orchestration</p>
                <Badge variant={data.reconciliation.status === 'healthy' ? 'secondary' : 'destructive'}>
                  {data.reconciliation.status}
                </Badge>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Checked {new Date(data.reconciliation.checkedAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reconciliation checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span>Pending discharges</span>
                <span className="font-medium">{data.reconciliation.pendingDischarges}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span>Stuck insurance (GAP-007)</span>
                <span className="font-medium">{data.reconciliation.stuckInsurance}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span>Discharge billing blockers (GAP-006)</span>
                <span className="font-medium">{data.summary.dischargeBillingBlockers}</span>
              </div>
              <div className="flex justify-between">
                <span>Store vs platform sanity</span>
                <span className="font-medium text-muted-foreground">
                  {variance < 1 ? 'Aligned' : 'Review collections export'}
                </span>
              </div>
              {data.reconciliationWarnings.map((w) => (
                <p key={w} className="text-xs text-destructive pt-2">
                  {w}
                </p>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Open invoices (platform)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data.invoices.length === 0 ? (
                <BillingEmptyState
                  title="No open invoices"
                  description="All branch invoices are settled or void for this snapshot."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.invoices.slice(0, 20).map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-xs">{inv.id.slice(0, 10)}</TableCell>
                        <TableCell>{inv.status}</TableCell>
                        <TableCell>₹{(inv.amountCents / 100).toLocaleString()}</TableCell>
                        <TableCell>₹{(inv.paidCents / 100).toLocaleString()}</TableCell>
                        <TableCell className="font-medium">
                          ₹{(inv.outstandingCents / 100).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </BillingDeptShell>
  );
}
