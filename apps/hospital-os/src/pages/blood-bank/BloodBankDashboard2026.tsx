import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Droplets,
  Heart,
  Package,
  ShieldCheck,
  Thermometer,
} from 'lucide-react';
import { WorkspacePage, MetricStrip, WorkflowPanel } from '@/components/shell/workspace-primitives';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BLOOD_UNITS, DONORS, REQUISITIONS } from './bloodBankReferenceData';

export default function BloodBankDashboard2026() {
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const available = BLOOD_UNITS.filter((u) => u.status === 'Available').length;
    const quarantine = BLOOD_UNITS.filter((u) => u.status === 'Quarantine').length;
    const pendingReq = REQUISITIONS.filter((r) => r.status === 'Pending').length;
    const eligibleDonors = DONORS.filter((d) => d.eligible).length;
    const expiringSoon = BLOOD_UNITS.filter((u) => {
      const days = (Date.parse(u.expiryDate) - Date.now()) / (1000 * 60 * 60 * 24);
      return u.status === 'Available' && days <= 7 && days > 0;
    }).length;
    return { available, quarantine, pendingReq, eligibleDonors, expiringSoon };
  }, []);

  const pendingRequisitions = REQUISITIONS.filter((r) => r.status === 'Pending').slice(0, 5);
  const lowStockGroups = ['O-', 'AB-', 'B-'].map((group) => ({
    group,
    count: BLOOD_UNITS.filter((u) => u.bloodGroup === group && u.status === 'Available').length,
  }));

  return (
    <WorkspacePage
      title="Blood bank command"
      subtitle="Donor-to-transfusion lifecycle with NBTC compliance, cold-chain monitoring, and cross-match traceability."
      actions={
        <Button size="sm" className="gap-1.5" onClick={() => navigate('/blood-bank/issue')}>
          <Droplets className="h-3.5 w-3.5" />
          Issue blood
        </Button>
      }
    >
      <MetricStrip
        metrics={[
          { id: 'units', label: 'Available units', value: stats.available, hint: `${stats.expiringSoon} expiring ≤7d`, icon: Package },
          { id: 'donors', label: 'Eligible donors', value: stats.eligibleDonors, icon: Heart },
          { id: 'req', label: 'Pending requisitions', value: stats.pendingReq, icon: Droplets },
          { id: 'hold', label: 'Quarantine / TTI hold', value: stats.quarantine, icon: AlertTriangle },
        ]}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <WorkflowPanel title="Requisition queue" className="lg:col-span-2">
          <ul className="space-y-2 text-sm">
            {pendingRequisitions.length === 0 ? (
              <li className="text-muted-foreground">No pending requisitions.</li>
            ) : (
              pendingRequisitions.map((r) => (
                <li key={r.reqId} className="flex items-center justify-between gap-2 py-1.5 border-b border-border/50 last:border-0">
                  <div>
                    <p className="font-medium">{r.patientName}</p>
                    <p className="text-xs text-muted-foreground">{r.bloodGroup} · {r.component} · {r.ward}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{r.urgency}</Badge>
                </li>
              ))
            )}
          </ul>
        </WorkflowPanel>

        <WorkflowPanel title="Critical stock">
          <ul className="space-y-2 text-sm">
            {lowStockGroups.map(({ group, count }) => (
              <li key={group} className="flex justify-between">
                <span>{group}</span>
                <span className={count < 3 ? 'text-rose-600 font-medium' : 'text-muted-foreground'}>{count} units</span>
              </li>
            ))}
          </ul>
        </WorkflowPanel>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:border-foreground/30 transition-colors" onClick={() => navigate('/blood-bank/donors')}>
          <CardContent className="p-5 flex items-center gap-4">
            <Heart className="h-7 w-7 text-rose-600/80" />
            <div className="flex-1">
              <p className="font-semibold">Donor registry</p>
              <p className="text-xs text-muted-foreground">Voluntary & replacement donors</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-foreground/30 transition-colors" onClick={() => navigate('/blood-bank/inventory')}>
          <CardContent className="p-5 flex items-center gap-4">
            <Thermometer className="h-7 w-7 text-blue-600/80" />
            <div className="flex-1">
              <p className="font-semibold">Cold chain inventory</p>
              <p className="text-xs text-muted-foreground">2–6°C monitored units</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-foreground/30 transition-colors" onClick={() => navigate('/blood-bank/compliance')}>
          <CardContent className="p-5 flex items-center gap-4">
            <ShieldCheck className="h-7 w-7 text-emerald-600/80" />
            <div className="flex-1">
              <p className="font-semibold">NBTC compliance</p>
              <p className="text-xs text-muted-foreground">TTI screening & audit reports</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    </WorkspacePage>
  );
}
