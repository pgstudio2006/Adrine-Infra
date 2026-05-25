import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  canUseProvisioningRuntime,
  platformCompleteOnboarding,
  platformOnboardingStep,
  platformSignup,
} from '@/runtime/provisioning-runtime';
import { isPlatformRuntimeEnabled } from '@/runtime/platform-session';

export default function OnboardingWizard() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [status, setStatus] = useState<string>('');

  if (!isPlatformRuntimeEnabled()) {
    return (
      <p className="text-sm text-muted-foreground">
        Enable VITE_PLATFORM_RUNTIME to use platform onboarding.
      </p>
    );
  }

  const runSignup = async () => {
    const res = await platformSignup({ orgName, adminEmail });
    setSessionId(res.sessionId);
    setTenantId(res.tenantId);
    setStatus('Signup created — complete steps with tenant header on subsequent calls.');
  };

  const runStep = async (stepKey: string, payload: Record<string, unknown>) => {
    if (!sessionId) return;
    await platformOnboardingStep(sessionId, stepKey, payload);
    setStatus(`Step ${stepKey} saved`);
  };

  const finish = async () => {
    if (!sessionId) return;
    const res = await platformCompleteOnboarding(sessionId);
    setStatus(`Tenant activated: ${JSON.stringify(res)}`);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Tenant Onboarding</h1>
      {!canUseProvisioningRuntime() && (
        <p className="text-sm text-amber-600">Log in with platform session or complete signup first.</p>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Signup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input placeholder="Organization name" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
          <Input placeholder="Admin email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
          <Button onClick={runSignup} disabled={!orgName || !adminEmail}>
            Create tenant
          </Button>
          {tenantId && <p className="text-xs text-muted-foreground">Tenant: {tenantId}</p>}
        </CardContent>
      </Card>
      {sessionId && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">2. Hospital & branches</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => runStep('hospital', { orgName })}>
                Save hospital
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  runStep('branches', {
                    branches: [{ code: 'main', name: 'Main Branch' }],
                  })
                }
              >
                Add main branch
              </Button>
              <Button
                variant="secondary"
                onClick={() => runStep('modules', { template_pack: 'opd_clinic' })}
              >
                Select OPD template
              </Button>
            </CardContent>
          </Card>
          <Button onClick={finish}>Activate tenant</Button>
        </>
      )}
      {status && <p className="text-sm text-muted-foreground">{status}</p>}
    </div>
  );
}

