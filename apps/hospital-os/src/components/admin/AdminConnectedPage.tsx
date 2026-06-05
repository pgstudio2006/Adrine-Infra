import { useMemo } from 'react';
import { PlatformConnectivityStrip } from '@/components/PlatformConnectivityStrip';
import { DashboardKpiGrid } from '@/components/dashboard/DashboardKpiGrid';
import { PlatformEmptyState } from '@/components/platform/PlatformEmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminOperationalData } from '@/hooks/useAdminOperationalData';
import { useHospital } from '@/stores/hospitalStore';
import { buildMisHeaderKpis } from '@/lib/dashboard/dashboard-engine';

type AdminConnectedPageProps = {
  title: string;
  description: string;
  focus: string;
};

export function AdminConnectedPage({ title, description, focus }: AdminConnectedPageProps) {
  const { snapshot, analytics, error, platformOn } = useAdminOperationalData('24h');
  const { patients, admissions, invoices, workflowEvents } = useHospital();

  const headerKpis = useMemo(
    () => buildMisHeaderKpis(snapshot?.counts, analytics),
    [snapshot?.counts, analytics],
  );

  const focusEvents = useMemo(() => {
    const needle = focus.toLowerCase();
    return workflowEvents
      .filter((event) => {
        const text = `${event.module} ${event.action} ${event.details}`.toLowerCase();
        return text.includes(needle);
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
        label={`${focus} workspace`}
        detail={
          snapshot
            ? `Branch ${snapshot.branchId} · OPD ${snapshot.counts.opdActiveVisits} · IPD ${snapshot.counts.ipdActiveAdmissions} · Queue ${snapshot.counts.opdWaitingQueue}`
            : 'Showing live store state while runtime sync initializes'
        }
        error={error}
      />

      {headerKpis.length > 0 && (
        <DashboardKpiGrid kpis={headerKpis} live={platformOn} loading={!snapshot} columns={4} />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{patients.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active Admissions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {admissions.filter((admission) => admission.status !== 'discharged').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Open Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {invoices.filter((invoice) => invoice.status !== 'paid').length}
            </p>
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
              message={`No ${focus.toLowerCase()} activity found for this branch yet.`}
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
