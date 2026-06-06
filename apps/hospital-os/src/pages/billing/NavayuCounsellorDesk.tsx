import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ExternalLink, IndianRupee, Package, RefreshCw, User } from 'lucide-react';
import { toast } from 'sonner';
import { BillingDeptShell } from '@/components/billing/BillingDeptShell';
import { NavayuFollowUpHandoff } from '@/components/navayu/NavayuFollowUpHandoff';
import { AppSelect } from '@/components/ui/app-select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useOpdLiveFinancial } from '@/hooks/useBillingDeptPlatform';
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
  platformEnsureNavayuBillingHandoff,
  platformGetNavayuOpdVisitSummary,
  platformListNavayuCounsellorQueue,
  platformLoadNavayuVisitBundle,
  platformSaveNavayuCounselling,
  platformSaveNavayuFollowUp,
  platformSaveNavayuPackagePlanned,
  type NavayuCounsellorQueueRow,
  type NavayuMskLifecycleState,
} from '@/lib/navayu/navayu-runtime';
import { platformEnsureOpdDraft, platformSyncCharge } from '@/runtime/billing-runtime';
import { getPlatformSession } from '@/runtime/platform-session';
import { useHospital } from '@/stores/hospitalStore';

const COUNSELLOR_MSK_STATES: NavayuMskLifecycleState[] = [
  'protocol_mapped',
  'counselling',
  'package_planned',
];

export default function NavayuCounsellorDesk() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const visitFromUrl = searchParams.get('visitId');
  const { patients, createEstimate } = useHospital();
  const [queue, setQueue] = useState<NavayuCounsellorQueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(visitFromUrl);
  const [deepLinkRow, setDeepLinkRow] = useState<NavayuCounsellorQueueRow | null>(null);
  const [tierId, setTierId] = useState<NavayuPackageTierId>('advanced');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [bundleLoading, setBundleLoading] = useState(false);
  const [protocolLabel, setProtocolLabel] = useState('');
  const [stageLabel, setStageLabel] = useState('');

  const tiers = useMemo(() => listNavayuPackageTiers(), []);
  const selected =
    queue.find((row) => row.visitId === selectedId) ??
    (deepLinkRow?.visitId === selectedId ? deepLinkRow : null);
  const platformOn = canUseNavayuRuntime();
  const liveOpd = useOpdLiveFinancial(selected?.visitId);

  const selectVisit = useCallback(
    (visitId: string) => {
      setSelectedId(visitId);
      setSearchParams({ visitId }, { replace: true });
    },
    [setSearchParams],
  );

  const refreshQueue = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await platformListNavayuCounsellorQueue();
      setQueue(rows);
      if (!selectedId && !visitFromUrl && rows[0]) {
        selectVisit(rows[0].visitId);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedId, visitFromUrl, selectVisit]);

  useEffect(() => {
    if (visitFromUrl) {
      setSelectedId(visitFromUrl);
    }
  }, [visitFromUrl]);

  useEffect(() => {
    void hydrateNavayuProtocolCatalog();
    void refreshQueue();
  }, [refreshQueue]);

  useEffect(() => {
    if (!selectedId || !platformOn) {
      setDeepLinkRow(null);
      return;
    }
    if (queue.some((row) => row.visitId === selectedId)) {
      setDeepLinkRow(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      const [summary, bundle] = await Promise.all([
        platformGetNavayuOpdVisitSummary(selectedId),
        platformLoadNavayuVisitBundle(selectedId),
      ]);
      if (cancelled || !summary || !bundle?.mskLifecycleState) {
        if (!cancelled) setDeepLinkRow(null);
        return;
      }
      if (!COUNSELLOR_MSK_STATES.includes(bundle.mskLifecycleState)) {
        setDeepLinkRow(null);
        return;
      }
      const labels = bundle.protocolMap ? protocolMapLabels(bundle.protocolMap) : {};
      setDeepLinkRow({
        visitId: summary.visitId,
        patientId: summary.patientId,
        patientName: summary.patientName,
        mrn: summary.mrn,
        department: summary.department,
        assignedDoctor: summary.assignedDoctor,
        mskLifecycleState: bundle.mskLifecycleState,
        protocolLabel: labels.protocolLabel,
        createdAt: new Date().toISOString(),
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedId, platformOn, queue]);

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
      } else {
        setProtocolLabel('');
        setStageLabel('');
      }
      if (bundle?.counselling?.tierId) {
        setTierId(bundle.counselling.tierId);
        setNotes(bundle.counselling.notes ?? '');
      }
      setBundleLoading(false);
    });
  }, [selectedId, platformOn]);

  const tier = tiers.find((t) => t.id === tierId) ?? tiers[0];

  const syncBillingCharges = async (
    visitId: string,
    patientId: string,
    counselling: ReturnType<typeof resolveCounsellingRecord>,
  ) => {
    const handoff = await platformEnsureNavayuBillingHandoff(visitId);
    if (!handoff.billingReady) {
      throw new Error(
        `Visit not billing-ready (OPD state: ${handoff.visit.state}). Encounter closed: ${handoff.encounterClosed ? 'yes' : 'no'}.`,
      );
    }

    const session = getPlatformSession();
    if (!session) return;

    await platformEnsureOpdDraft({
      opdVisitId: visitId,
      patientId,
    });
    await platformSyncCharge({
      opdVisitId: visitId,
      patientId,
      idempotencyKey: `navayu-package:${visitId}:${counselling.packageCode}`,
      description: counselling.packageName,
      amountCents: counselling.proposedAmountInr * 100,
      chargeCode: counselling.packageCode,
      sourceModule: 'navayu_counselling',
      sourceAction: 'plan_package',
      sourceRefId: counselling.packageCode,
    });
    await liveOpd.refresh();
  };

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
      await syncBillingCharges(selected.visitId, selected.patientId, counselling);

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
    setSearchParams({}, { replace: true });
    await refreshQueue();
  };

  return (
    <BillingDeptShell
      title="Counsellor desk"
      subtitle="Package tier mapping, financial proposal, billing handoff, and follow-up scheduling after senior consult"
      showPlatformStrip
      gateFocus="GAP-006"
      blockers={liveOpd.blockers}
      warnings={liveOpd.state?.warnings}
      platformError={liveOpd.error}
      platformLabel={selected ? `OPD billing · ${selected.patientName}` : undefined}
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
          {selected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(`/billing-dept/invoices?visitId=${encodeURIComponent(selected.visitId)}`)
              }
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Invoices
            </Button>
          ) : null}
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
          {!loading && queue.length === 0 && !deepLinkRow && (
            <p className="p-4 text-sm text-muted-foreground">
              No patients awaiting counselling. Senior doctor must map protocol first.
            </p>
          )}
          {queue.map((row) => (
            <button
              key={row.visitId}
              type="button"
              onClick={() => selectVisit(row.visitId)}
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
          {deepLinkRow && !queue.some((r) => r.visitId === deepLinkRow.visitId) ? (
            <button
              type="button"
              onClick={() => selectVisit(deepLinkRow.visitId)}
              className={`w-full text-left p-4 hover:bg-accent/50 transition-colors border-t border-dashed ${selectedId === deepLinkRow.visitId ? 'bg-accent/60' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {deepLinkRow.patientName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Handoff link · {deepLinkRow.mrn ?? deepLinkRow.patientId.slice(0, 8)}
                    {deepLinkRow.protocolLabel ? ` · ${deepLinkRow.protocolLabel}` : ''}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {MSK_STATE_LABELS[deepLinkRow.mskLifecycleState] ?? deepLinkRow.mskLifecycleState}
                </Badge>
              </div>
            </button>
          ) : null}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selected ? (
            <>
              <div className="rounded-xl border bg-card p-4 space-y-2">
                <h2 className="font-semibold">{selected.patientName}</h2>
                <p className="text-xs text-muted-foreground">
                  {selected.department ?? 'MSK'} · {selected.assignedDoctor ?? 'Unassigned'}
                  {liveOpd.state?.visit.state
                    ? ` · OPD ${liveOpd.state.visit.state.replace(/_/g, ' ')}`
                    : ''}
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
          ) : visitFromUrl && !loading ? (
            <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground text-sm">
              Visit not found or not ready for counselling. Confirm senior protocol mapping completed.
            </div>
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
