import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlatformEmptyState } from '@/components/platform/PlatformEmptyState';
import { useHospital } from '@/stores/hospitalStore';
import { PlatformConnectivityStrip } from '@/components/PlatformConnectivityStrip';
import { isPlatformRuntimeEnabled } from '@/runtime/platform-session';

type ConnectedOpsPageProps = {
  title: string;
  description: string;
  focus: string;
};

export function ConnectedOpsPage({ title, description, focus }: ConnectedOpsPageProps) {
  const { pharmacyInventory, prescriptions, invoices, workflowEvents } = useHospital();

  const rows = useMemo(() => {
    const needle = focus.toLowerCase();
    return workflowEvents
      .filter((event) => {
        const value = `${event.module} ${event.action} ${event.details}`.toLowerCase();
        return value.includes(needle) || value.includes('pharmacy') || value.includes('billing');
      })
      .slice(0, 12);
  }, [focus, workflowEvents]);

  const lowStock = pharmacyInventory.filter((item) => item.qty <= item.reorder);
  const openInvoices = invoices.filter((invoice) => invoice.status !== 'paid').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <PlatformConnectivityStrip
        label={`${focus} operations`}
        detail={`Inventory ${pharmacyInventory.length} · low stock ${lowStock.length} · active prescriptions ${prescriptions.length} · open invoices ${openInvoices}`}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Inventory SKUs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{pharmacyInventory.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Low stock alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{lowStock.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Runtime mode</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={isPlatformRuntimeEnabled() ? 'default' : 'secondary'}>
              {isPlatformRuntimeEnabled() ? 'Platform live' : 'Local mode'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{focus} activity stream</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 ? (
            <PlatformEmptyState
              title="No activity yet"
              message={`No ${focus.toLowerCase()} events found yet for this branch.`}
            />
          ) : (
            rows.map((row) => (
              <div key={row.id} className="rounded-md border p-3">
                <p className="text-sm font-medium">
                  {row.module} · {row.action}
                </p>
                <p className="text-xs text-muted-foreground">{row.details}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
