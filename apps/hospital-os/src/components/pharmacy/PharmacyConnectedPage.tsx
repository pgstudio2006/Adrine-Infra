import { useMemo } from 'react';
import { PlatformConnectivityStrip } from '@/components/PlatformConnectivityStrip';
import { PlatformEmptyState } from '@/components/platform/PlatformEmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useHospital } from '@/stores/hospitalStore';
import { isPlatformRuntimeEnabled } from '@/runtime/platform-session';
import { canUsePharmacyRuntime } from '@/runtime/pharmacy-runtime';

type PharmacyConnectedPageProps = {
  title: string;
  description: string;
  focus: string;
};

export function PharmacyConnectedPage({ title, description, focus }: PharmacyConnectedPageProps) {
  const { pharmacyInventory, prescriptions, workflowEvents } = useHospital();
  const platformOn = isPlatformRuntimeEnabled() && canUsePharmacyRuntime();

  const lowStock = useMemo(
    () => pharmacyInventory.filter((item) => item.qty <= item.reorder),
    [pharmacyInventory],
  );

  const focusEvents = useMemo(() => {
    const needle = focus.toLowerCase();
    return workflowEvents
      .filter((event) => {
        const text = `${event.module} ${event.action} ${event.details}`.toLowerCase();
        return (
          text.includes(needle) ||
          text.includes('pharmacy') ||
          text.includes('prescription') ||
          text.includes('dispense')
        );
      })
      .slice(0, 12);
  }, [focus, workflowEvents]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <PlatformConnectivityStrip
        label={`${focus} pharmacy workspace`}
        detail={`Inventory ${pharmacyInventory.length} SKUs · low stock ${lowStock.length} · active prescriptions ${prescriptions.length}`}
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
            <Badge variant={platformOn ? 'default' : 'secondary'}>
              {platformOn ? 'Platform live' : 'Local store'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{focus} activity stream</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {focusEvents.length === 0 ? (
            <PlatformEmptyState
              title="No events yet"
              message={`No ${focus.toLowerCase()} pharmacy activity found for this branch yet.`}
            />
          ) : (
            focusEvents.map((event) => (
              <div key={event.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {event.module} · {event.action}
                    </p>
                    <p className="text-xs text-muted-foreground">{event.details}</p>
                  </div>
                  <Badge variant="outline" className="whitespace-nowrap">
                    {new Date(event.timestamp).toLocaleString()}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
