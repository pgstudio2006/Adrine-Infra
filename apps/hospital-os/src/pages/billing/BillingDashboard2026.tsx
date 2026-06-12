import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  CreditCard,
  FileText,
  IndianRupee,
  ShieldCheck,
} from 'lucide-react';
import { WorkspacePage, MetricStrip, WorkflowPanel } from '@/components/shell/workspace-primitives';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useHospital } from '@/stores/hospitalStore';
import { useBillingStoreAggregates } from '@/hooks/useBillingDeptPlatform';
import { cn } from '@/lib/utils';

const PAY_STATUS_STYLE: Record<string, string> = {
  paid: 'bg-emerald-500/10 text-emerald-700',
  partial: 'bg-amber-500/10 text-amber-700',
  pending: 'bg-amber-500/10 text-amber-700',
  overdue: 'bg-rose-500/10 text-rose-700',
};

export default function BillingDashboard2026() {
  const navigate = useNavigate();
  const { invoices, billingTransactions, patients } = useHospital();
  const aggregates = useBillingStoreAggregates();

  const todayKey = new Date().toISOString().slice(0, 10);

  const collectionsToday = useMemo(
    () =>
      billingTransactions
        .filter((tx) => tx.kind === 'payment' && tx.createdAt.startsWith(todayKey))
        .reduce((sum, tx) => sum + tx.amount, 0),
    [billingTransactions, todayKey],
  );

  const collectionsTodayCount = useMemo(
    () =>
      billingTransactions.filter(
        (tx) => tx.kind === 'payment' && tx.createdAt.startsWith(todayKey),
      ).length,
    [billingTransactions, todayKey],
  );

  const pendingInvoices = useMemo(
    () =>
      invoices.filter(
        (inv) => inv.status !== 'paid' && inv.total > inv.paid,
      ),
    [invoices],
  );

  const tpaQueue = useMemo(
    () =>
      patients.filter(
        (p) =>
          p.tpaPreAuthStatus === 'pending' ||
          (p.category === 'insurance' && p.tpaPreAuthStatus !== 'approved'),
      ),
    [patients],
  );

  const outstandingTotal = pendingInvoices.reduce(
    (sum, inv) => sum + Math.max(0, inv.total - inv.paid),
    0,
  );

  const dateLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <WorkspacePage
      title="Revenue cycle command"
      subtitle={`${dateLabel} · Collections, open invoices, and TPA authorization queue.`}
      actions={
        <Button size="sm" className="gap-1.5" onClick={() => navigate('/billing-dept/payments')}>
          <CreditCard className="h-3.5 w-3.5" />
          Record payment
        </Button>
      }
    >
      <MetricStrip
        columns={4}
        metrics={[
          {
            id: 'collections',
            label: 'Collections today',
            value: `₹${collectionsToday.toLocaleString('en-IN')}`,
            hint: `${collectionsTodayCount} payment${collectionsTodayCount === 1 ? '' : 's'}`,
            icon: IndianRupee,
          },
          {
            id: 'pending',
            label: 'Pending invoices',
            value: pendingInvoices.length,
            hint: `₹${outstandingTotal.toLocaleString('en-IN')} outstanding`,
            icon: Clock,
          },
          {
            id: 'tpa',
            label: 'TPA queue',
            value: tpaQueue.length,
            hint: tpaQueue.length ? 'Awaiting pre-auth' : 'Queue clear',
            icon: ShieldCheck,
          },
          {
            id: 'invoices',
            label: 'Total invoices',
            value: aggregates.invoiceCount || invoices.length,
            hint: aggregates.platformOn ? 'Platform-synced' : 'Store-backed',
            icon: FileText,
          },
        ]}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <WorkflowPanel title="Collections today" className="lg:col-span-2">
          {collectionsTodayCount === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No payments recorded today yet.
            </p>
          ) : (
            <ul className="divide-y divide-border/60 -mx-4 -mb-4">
              {billingTransactions
                .filter((tx) => tx.kind === 'payment' && tx.createdAt.startsWith(todayKey))
                .slice(0, 8)
                .map((tx) => (
                  <li
                    key={tx.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => navigate('/billing-dept/payments')}
                  >
                    <IndianRupee className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tx.patientName}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {tx.id} · {tx.mode}
                      </p>
                    </div>
                    <span className="text-sm font-semibold shrink-0">
                      ₹{tx.amount.toLocaleString('en-IN')}
                    </span>
                  </li>
                ))}
            </ul>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 gap-1 text-xs"
            onClick={() => navigate('/billing-dept/payments')}
          >
            Payment desk <ArrowRight className="h-3 w-3" />
          </Button>
        </WorkflowPanel>

        <WorkflowPanel title="TPA queue">
          {tpaQueue.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No pending TPA authorizations.
            </p>
          ) : (
            <ul className="space-y-3">
              {tpaQueue.slice(0, 6).map((patient) => (
                <li
                  key={patient.uhid}
                  className="flex items-start gap-3 text-sm cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate('/billing-dept/pre-auth')}
                >
                  <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{patient.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {patient.tpaProvider || patient.insuranceProvider || 'Insurance'} · {patient.uhid}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0 capitalize">
                    {patient.tpaPreAuthStatus ?? 'pending'}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 gap-1 text-xs w-full"
            onClick={() => navigate('/billing-dept/pre-auth')}
          >
            Pre-auth wizard <ArrowRight className="h-3 w-3" />
          </Button>
        </WorkflowPanel>
      </div>

      <WorkflowPanel title="Pending invoices">
        {pendingInvoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">All invoices settled — no outstanding balances.</p>
        ) : (
          <ul className="divide-y divide-border/60 -mx-4 -my-4">
            {pendingInvoices.slice(0, 8).map((inv) => (
              <li
                key={inv.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer"
                onClick={() => navigate('/billing-dept/invoices')}
              >
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{inv.patientName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {inv.id} · {inv.category}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">
                    ₹{Math.max(0, inv.total - inv.paid).toLocaleString('en-IN')}
                  </p>
                  <span
                    className={cn(
                      'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full',
                      PAY_STATUS_STYLE[inv.status] ?? PAY_STATUS_STYLE.pending,
                    )}
                  >
                    {inv.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </WorkflowPanel>

      <WorkflowPanel title="Quick actions">
        <div className="grid sm:grid-cols-3 gap-3">
          <Card
            className="cursor-pointer border-foreground/10 hover:border-foreground/25 hover:shadow-sm transition-all"
            onClick={() => navigate('/billing-dept/invoices')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <FileText className="h-5 w-5 text-foreground/70" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Invoices</p>
                <p className="text-xs text-muted-foreground">{pendingInvoices.length} pending</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer border-foreground/10 hover:border-foreground/25 hover:shadow-sm transition-all"
            onClick={() => navigate('/billing-dept/payments')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-foreground/70" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Payments</p>
                <p className="text-xs text-muted-foreground">
                  ₹{collectionsToday.toLocaleString('en-IN')} today
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer border-foreground/10 hover:border-foreground/25 hover:shadow-sm transition-all"
            onClick={() => navigate('/billing-dept/pre-auth')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-foreground/70" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">TPA / pre-auth</p>
                <p className="text-xs text-muted-foreground">{tpaQueue.length} in queue</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      </WorkflowPanel>
    </WorkspacePage>
  );
}
