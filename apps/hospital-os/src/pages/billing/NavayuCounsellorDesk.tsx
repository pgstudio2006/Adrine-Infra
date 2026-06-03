import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, Package, RefreshCw, User } from 'lucide-react';
import { toast } from 'sonner';
import { BillingDeptShell } from '@/components/billing/BillingDeptShell';
import { NavayuFollowUpHandoff } from '@/components/navayu/NavayuFollowUpHandoff';
import { AppSelect } from '@/components/ui/app-select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  hydrateNavayuProtocolCatalog,
  listNavayuPackageTiers,
  protocolMapLabels,
  resolveCounsellingRecord,
  type NavayuPackageTierId,
} from '@/lib/navayu/navayu-protocol-engine';
import {
  MSK_STATE_LABELS,
  canUseNavayuRuntime,
  platformListNavayuCounsellorQueue,
  platformLoadNavayuVisitBundle,
  platformSaveNavayuCounselling,
  platformSaveNavayuFollowUp,
  platformSaveNavayuPackagePlanned,
  type NavayuCounsellorQueueRow,
} from '@/lib/navayu/navayu-runtime';
import { platformEnsureOpdDraft, platformSyncCharge } from '@/runtime/billing-runtime';
import { getPlatformSession } from '@/runtime/platform-session';
import { useHospital } from '@/stores/hospitalStore';

export default function NavayuCounsellorDesk() {
  const navigate = useNavigate();
  const { patients, createEstimate } = useHospital();
  const [queue, setQueue] = useState<NavayuCounsellorQueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tierId, setTierId] = useState<NavayuPackageTierId>('advanced');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [bundleLoading, setBundleLoading] = useState(false);
  const [protocolLabel, setProtocolLabel] = useState('');
  const [stageLabel, setStageLabel] = useState('');

  const tiers = useMemo(() => listNavayuPackageTiers(), []);
  const selected = queue.find((row) => row.visitId === selectedId) ?? null;
  const platformOn = canUseNavayuRuntime();

  const refreshQueue = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await platformListNavayuCounsellorQueue();
      setQueue(rows);
      if (!selectedId && rows[0]) {
        setSelectedId(rows[0].visitId);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    void hydrateNavayuProtocolCatalog();
    void refreshQueue();
  }, [refreshQueue]);

  useEffect(() => {
    if (!selectedId || !platformOn) return;
    setBundleLoading(true);
    void platformLoadNavayuVisitBundle(selectedId).then((bundle) => {
      if (bundle?.protocolMap) {
        const labels = protocolMapLabels(bundle.protocolMap);
        setProtocolLabel(labels.protocolLabel);
        setStageLabel(labels.stageLabel);
        const recommended = bundle.protocolMap.packageTier as NavayuPackageTierId | undefined;
        if (recommended) setTierId(recommended);
      }
      if (bundle?.counselling?.tierId) {
        setTierId(bundle.counselling.tierId);
        setNotes(bundle.counselling.notes ?? '');
      }
      setBundleLoading(false);
    });
  }, [selectedId, platformOn]);

  const tier = tiers.find((t) => t.id === tierId) ?? tiers[0];

  const handleSaveCounselling = async () => {
    if (!selected || !platformOn) {
      toast.message('Platform runtime required', {
        description: 'Enable VITE_PLATFORM_RUNTIME and domain API to persist counselling.',
      });
      return;
    }
    setSaving(true);
    try {
      const bundle = await platformLoadNavayuVisitBundle(selected.visitId);
      if (!bundle?.protocolMap?.protocolId) {
        toast.error('Protocol not mapped yet', {
          description: 'Senior doctor must complete protocol mapping before counselling.',
        });
        return;
      }
      const counselling = resolveCounsellingRecord(bundle.protocolMap, tierId, notes);
      await platformSaveNavayuCounselling(selected.visitId, counselling);
      toast.success('Counselling plan saved');
      await refreshQueue();
    } finally {
      setSaving(false);
    }
  };

  const handlePlanPackageAndBill = async () => {
    if (!selected || !platformOn) return;
    setSaving(true);
    try {
      const bundle = await platformLoadNavayuVisitBundle(selected.visitId);
      if (!bundle?.protocolMap?.protocolId) {
        toast.error('Protocol mapping required');
        return;
      }
      const counselling = resolveCounsellingRecord(bundle.protocolMap, tierId, notes);
      await platformSaveNavayuPackagePlanned(selected.visitId, counselling);

      const session = getPlatformSession();
      if (session) {
        await platformEnsureOpdDraft({
          opdVisitId: selected.visitId,
          patientId: selected.patientId,
        });
        await platformSyncCharge({
          opdVisitId: selected.visitId,
          patientId: selected.patientId,
          idempotencyKey: `navayu-package:${selected.visitId}:${counselling.packageCode}`,
          description: counselling.packageName,
          amountCents: counselling.proposedAmountInr * 100,
          chargeCode: counselling.packageCode,
          sourceModule: 'navayu_counselling',
          sourceAction: 'plan_package',
          sourceRefId: counselling.packageCode,
        });
      }

      const localPatient = patients.find(
        (p) => p.platformPatientId === selected.patientId,
      );
      if (localPatient) {
        createEstimate({
          uhid: localPatient.uhid,
          patientName: localPatient.name,
          date: new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          category: 'OPD',
          items: [
            {
              description: counselling.packageName,
              amount: counselling.proposedAmountInr,
            },
          ],
          total: counselling.proposedAmountInr,
        });
      }

      toast.success('Package planned — estimate & platform charge synced');
      await refreshQueue();
    } catch (err) {
      toast.error('Billing sync failed', {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFollowUpScheduled = async (handoff: Parameters<
    typeof platformSaveNavayuFollowUp
  >[1]) => {
    if (!selected || !platformOn) return;
    await platformSaveNavayuFollowUp(selected.visitId, handoff);
    toast.success('MSK visit closed with follow-up');
    setSelectedId(null);
    await refreshQueue();
  };

  return (
    <BillingDeptShell
      title="Counsellor desk"
      subtitle="Package tier mapping, financial proposal, billing handoff, and follow-up scheduling after senior consult"
      showPlatformStrip
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {platformOn
            ? 'Queue loads from GET /navayu/counsellor-queue when runtime is on.'
            : 'Enable platform runtime to load the live counsellor queue.'}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void refreshQueue()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/billing-dept/packages')}>
            Package catalog
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/reception/billing')}>
            Reception billing
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded-xl border bg-card divide-y max-h-[70vh] overflow-y-auto">
          {loading && (
            <p className="p-4 text-sm text-muted-foreground">Loading queue…</p>
          )}
          {!loading && queue.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">
              No patients awaiting counselling. Senior doctor must map protocol first.
            </p>
          )}
          {queue.map((row) => (
            <button
              key={row.visitId}
              type="button"
              onClick={() => setSelectedId(row.visitId)}
              className={`w-full text-left p-4 hover:bg-accent/50 transition-colors ${selectedId === row.visitId ? 'bg-accent/60' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {row.patientName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {row.mrn ?? row.patientId.slice(0, 8)}
                    {row.protocolLabel ? ` · ${row.protocolLabel}` : ''}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {MSK_STATE_LABELS[row.mskLifecycleState] ?? row.mskLifecycleState}
                </Badge>
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selected ? (
            <>
              <div className="rounded-xl border bg-card p-4 space-y-2">
                <h2 className="font-semibold">{selected.patientName}</h2>
                <p className="text-xs text-muted-foreground">
                  {selected.department ?? 'MSK'} · {selected.assignedDoctor ?? 'Unassigned'}
                </p>
                {bundleLoading ? (
                  <p className="text-xs text-muted-foreground">Loading protocol…</p>
                ) : protocolLabel ? (
                  <p className="text-sm">
                    Protocol: <span className="font-medium">{protocolLabel}</span>
                    {stageLabel ? ` · ${stageLabel}` : ''}
                  </p>
                ) : (
                  <p className="text-sm text-warning">
                    Protocol not mapped — return to senior consult.
                  </p>
                )}
              </div>

              <div className="rounded-xl border bg-card p-4 space-y-4">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Package tier (engine-based)
                </p>
                <AppSelect
                  value={tierId}
                  onValueChange={(v) => setTierId(v as NavayuPackageTierId)}
                  options={tiers.map((t) => ({
                    value: t.id,
                    label: `${t.label} — ₹${t.priceInr.toLocaleString('en-IN')}`,
                  }))}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-sm border rounded-lg px-3 py-2 bg-muted/30">
                  <span className="text-muted-foreground">Proposed amount</span>
                  <span className="font-bold flex items-center">
                    <IndianRupee className="w-4 h-4" />
                    {tier?.priceInr.toLocaleString('en-IN')}
                  </span>
                </div>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Counselling notes, payment plan, family discussion…"
                  rows={3}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    disabled={saving || !platformOn}
                    onClick={() => void handleSaveCounselling()}
                  >
                    Save counselling draft
                  </Button>
                  <Button
                    disabled={saving || !platformOn || !protocolLabel}
                    onClick={() => void handlePlanPackageAndBill()}
                  >
                    Plan package & sync billing
                  </Button>
                </div>
              </div>

              {selected.mskLifecycleState === 'package_planned' ||
              selected.mskLifecycleState === 'counselling' ? (
                <NavayuFollowUpHandoff
                  patientId={selected.patientId}
                  patientName={selected.patientName}
                  visitId={selected.visitId}
                  disabled={!platformOn || saving}
                  onScheduled={handleFollowUpScheduled}
                />
              ) : null}
            </>
          ) : (
            <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground text-sm">
              Select a patient from the counsellor queue.
            </div>
          )}
        </div>
      </div>
    </BillingDeptShell>
  );
}
