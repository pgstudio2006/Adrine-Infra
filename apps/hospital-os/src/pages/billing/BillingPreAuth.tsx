import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldCheck, Send, CheckCircle, FileText } from 'lucide-react';
import { BillingDeptShell } from '@/components/billing/BillingDeptShell';
import { BillingStepWizard, type WizardStep } from '@/components/billing/BillingStepWizard';
import { BillingEmptyState } from '@/components/billing/BillingEmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHospital } from '@/stores/hospitalStore';
import {
  canUseFinanceRuntime,
  platformInsuranceTransition,
  platformStartInsuranceAuthorization,
} from '@/runtime/finance-runtime';
import { useBillingInsuranceDeskData } from '@/hooks/useBillingDeptData';

const STEPS: WizardStep[] = [
  { id: 'admission', label: 'Admission' },
  { id: 'details', label: 'TPA details' },
  { id: 'documents', label: 'Documents' },
  { id: 'submit', label: 'Submit' },
  { id: 'approve', label: 'Approve' },
];

export default function BillingPreAuth() {
  const { admissions, patients } = useHospital();
  const { data: desk, refresh } = useBillingInsuranceDeskData();
  const [step, setStep] = useState(0);
  const [admissionId, setAdmissionId] = useState('');
  const [payerName, setPayerName] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [approvedRupees, setApprovedRupees] = useState('50000');
  const [authId, setAuthId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ipdOptions = useMemo(
    () =>
      admissions
        .filter((a) => a.status !== 'discharged' && a.platformAdmissionId)
        .map((a) => {
          const p = patients.find((pt) => pt.uhid === a.uhid);
          return {
            id: a.platformAdmissionId!,
            patientId: p?.platformPatientId ?? a.platformPatientId ?? '',
            label: `${a.patientName} (${a.uhid}) — ${a.ward ?? 'Ward'}`,
            uhid: a.uhid,
          };
        }),
    [admissions, patients],
  );

  const selected = ipdOptions.find((o) => o.id === admissionId);

  const runTransition = async (action: string, payload?: Record<string, unknown>) => {
    if (!authId || !canUseFinanceRuntime()) return;
    setBusy(true);
    try {
      await platformInsuranceTransition(authId, action, payload);
      toast.success(`Insurance: ${action.replace(/_/g, ' ')}`);
      void refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Transition failed');
    } finally {
      setBusy(false);
    }
  };

  const startAuth = async () => {
    if (!selected?.patientId || !canUseFinanceRuntime()) {
      toast.error('Select an IPD admission with platform linkage');
      return;
    }
    setBusy(true);
    try {
      const auth = await platformStartInsuranceAuthorization({
        admissionId: selected.id,
        patientId: selected.patientId,
        payerName: payerName || undefined,
        policyNumber: policyNumber || undefined,
      });
      setAuthId(auth.id);
      toast.success('Authorization initiated on platform');
      setStep(2);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not start authorization');
    } finally {
      setBusy(false);
    }
  };

  const finishApprove = async () => {
    await runTransition('mark_under_review');
    await runTransition('approve_authorization', {
      approvedCents: Math.round(Number(approvedRupees) * 100) || 500000,
    });
    setStep(0);
    setAuthId(null);
    setAdmissionId('');
  };

  return (
    <BillingDeptShell
      title="Insurance pre-authorization"
      subtitle="Step through TPA lifecycle transitions (insuranceTpaLifecycle on domain-api)"
      gateFocus="GAP-007"
      platformLabel="Pre-auth wizard — domain-api /insurance/authorizations"
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link to="/billing-dept/insurance">Insurance desk</Link>
        </Button>
      }
    >
      {!canUseFinanceRuntime() ? (
        <BillingEmptyState
          icon={ShieldCheck}
          title="Platform runtime required"
          description="Enable VITE_PLATFORM_RUNTIME and sign in with a branch session to run live pre-authorization transitions."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="pt-6">
              <BillingStepWizard
                steps={STEPS}
                currentStep={step}
                onStepChange={setStep}
                onBack={() => setStep((s) => Math.max(0, s - 1))}
                onNext={() => {
                  if (step === 1) void startAuth();
                  else if (step === 2) void runTransition('request_documents').then(() => setStep(3));
                  else if (step === 3) void runTransition('submit_to_tpa').then(() => setStep(4));
                  else setStep((s) => s + 1);
                }}
                onFinish={() => void finishApprove()}
                nextLabel={
                  step === 1 ? 'Start authorization' : step === 3 ? 'Submit to TPA' : 'Continue'
                }
                finishLabel="Approve pre-auth"
                canNext={
                  step === 0
                    ? !!admissionId
                    : step === 1
                      ? !!payerName && !!policyNumber
                      : step < 4 || !!authId
                }
                canFinish={!!authId && Number(approvedRupees) > 0}
                loading={busy}
              >
                {step === 0 && (
                  <div className="space-y-3">
                    <Label>IPD admission</Label>
                    <Select value={admissionId} onValueChange={setAdmissionId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select admission" />
                      </SelectTrigger>
                      <SelectContent>
                        {ipdOptions.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {ipdOptions.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No platform-linked active admissions. Admit via Reception IPD first.
                      </p>
                    )}
                  </div>
                )}
                {step === 1 && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Payer / TPA</Label>
                      <Input
                        value={payerName}
                        onChange={(e) => setPayerName(e.target.value)}
                        placeholder="e.g. Star Health"
                      />
                    </div>
                    <div>
                      <Label>Policy number</Label>
                      <Input
                        value={policyNumber}
                        onChange={(e) => setPolicyNumber(e.target.value)}
                        placeholder="Policy ID"
                      />
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <p className="text-sm text-muted-foreground">
                    Request supporting documents from the patient desk. Platform action:{' '}
                    <code className="text-xs">request_documents</code>
                    {authId && (
                      <span className="block mt-2 font-mono text-xs">Auth: {authId}</span>
                    )}
                  </p>
                )}
                {step === 3 && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Submit package to TPA for review (<code className="text-xs">submit_to_tpa</code>
                    ).
                  </p>
                )}
                {step === 4 && (
                  <div className="space-y-3">
                    <Label>Approved amount (₹)</Label>
                    <Input
                      type="number"
                      value={approvedRupees}
                      onChange={(e) => setApprovedRupees(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Marks under review then approves via{' '}
                      <code className="text-xs">approve_authorization</code> (GAP-007 gate for IPD
                      charges).
                    </p>
                  </div>
                )}
              </BillingStepWizard>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Pending authorizations
              </p>
              {(desk?.authorizations as { id: string; state: string; payerName?: string }[] | undefined)
                ?.filter((a) => !['approved', 'settled', 'rejected'].includes(a.state))
                .slice(0, 6)
                .map((a) => (
                  <div
                    key={a.id}
                    className="text-xs border rounded-md px-2 py-1.5 flex justify-between"
                  >
                    <span>{a.payerName ?? 'TPA'}</span>
                    <span className="text-muted-foreground">{a.state}</span>
                  </div>
                )) ?? (
                <p className="text-xs text-muted-foreground">No open authorizations on desk.</p>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="w-full gap-1"
                disabled={!authId}
                onClick={() => void runTransition('approve_authorization', { approvedCents: 500000 })}
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Quick-approve current
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </BillingDeptShell>
  );
}
