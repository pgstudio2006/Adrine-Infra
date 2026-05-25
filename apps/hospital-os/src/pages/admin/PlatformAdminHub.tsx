import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getPlatformSession, isPlatformRuntimeEnabled } from '@/runtime/platform-session';
import { loadEffectiveModules, platformEnableModule } from '@/runtime/module-runtime';
import { platformFetch } from '@/runtime/platform-client';
import {
  platformCreateApiKey,
  platformListApiKeys,
  canUseIntegrationRuntime,
} from '@/runtime/integration-runtime';
import {
  platformListNotificationOutbox,
  platformSendNotification,
  canUseNotificationRuntime,
} from '@/runtime/notification-runtime';
import {
  platformCreateImportJob,
  platformExecuteImportJob,
  platformPreviewImportJob,
  platformRollbackImportJob,
  canUseMigrationRuntime,
} from '@/runtime/migration-runtime';
import {
  platformInstantiateTemplate,
  platformListTemplateCatalog,
  canUseTemplateRuntime,
} from '@/runtime/template-runtime';
import { useEffect, useState } from 'react';
import OnboardingWizard from './OnboardingWizard';
import AdminCommandCenter from './AdminCommandCenter';

function kernelBase(): string | undefined {
  return import.meta.env.VITE_KERNEL_API_URL as string | undefined;
}

export default function PlatformAdminHub() {
  const [modules, setModules] = useState<Record<string, boolean>>({});
  const [usage, setUsage] = useState<unknown>(null);
  const [apiKeys, setApiKeys] = useState<unknown[]>([]);
  const [outbox, setOutbox] = useState<unknown[]>([]);
  const [templates, setTemplates] = useState<unknown[]>([]);
  const [migrationJobId, setMigrationJobId] = useState<string | null>(null);
  const [migrationPreview, setMigrationPreview] = useState<unknown>(null);
  const [newKeyName, setNewKeyName] = useState('LIS integration');
  const [createdKey, setCreatedKey] = useState<unknown>(null);
  const [importCsv, setImportCsv] = useState('name,mrn\nJane Doe,MRN001');
  const [status, setStatus] = useState('');
  const [tab, setTab] = useState<
    'onboarding' | 'modules' | 'billing' | 'notifications' | 'integrations' | 'migration' | 'templates' | 'command'
  >('onboarding');

  const refresh = async () => {
    if (!isPlatformRuntimeEnabled()) return;
    loadEffectiveModules().then(setModules).catch(() => undefined);
    const kb = kernelBase();
    if (kb) {
      platformFetch(kb, '/billing/usage/summary')
        .then(setUsage)
        .catch(() => undefined);
    }
    if (canUseIntegrationRuntime()) {
      platformListApiKeys().then(setApiKeys).catch(() => undefined);
    }
    if (canUseNotificationRuntime()) {
      platformListNotificationOutbox('pending')
        .then((rows) => setOutbox(Array.isArray(rows) ? rows : []))
        .catch(() => undefined);
    }
    if (canUseTemplateRuntime()) {
      platformListTemplateCatalog().then(setTemplates).catch(() => undefined);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  if (!isPlatformRuntimeEnabled()) {
    return (
      <p className="text-sm text-muted-foreground">
        Set VITE_PLATFORM_RUNTIME=true and API URLs to use the platform admin hub.
      </p>
    );
  }

  const runMigration = async () => {
    const job = await platformCreateImportJob({
      type: 'patients',
      fileName: 'import.csv',
      csv: importCsv,
    });
    setMigrationJobId(job.id);
    setStatus(`Import job ${job.id} created`);
  };

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold">Platform Admin</h1>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['onboarding', 'Onboarding'],
            ['modules', 'Modules'],
            ['billing', 'Plans & usage'],
            ['notifications', 'Notifications'],
            ['integrations', 'Integrations'],
            ['migration', 'Data migration'],
            ['templates', 'Template packs'],
            ['command', 'Command center'],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            variant={tab === id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab(id)}
          >
            {label}
          </Button>
        ))}
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/settings">Governance / policies</Link>
        </Button>
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>

      {status && <p className="text-sm text-muted-foreground">{status}</p>}

      {tab === 'onboarding' && <OnboardingWizard />}

      {tab === 'modules' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Module entitlements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <pre className="text-xs overflow-auto max-h-48">{JSON.stringify(modules, null, 2)}</pre>
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                await platformEnableModule('OPD');
                await refresh();
                setStatus('Enabled OPD module');
              }}
            >
              Enable OPD (demo)
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === 'billing' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usage summary</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto">{JSON.stringify(usage, null, 2)}</pre>
          </CardContent>
        </Card>
      )}

      {tab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notification outbox</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!canUseNotificationRuntime() && (
              <p className="text-sm text-amber-600">Log in with platform session to manage notifications.</p>
            )}
            <Button
              size="sm"
              disabled={!canUseNotificationRuntime()}
              onClick={async () => {
                await platformSendNotification({
                  channel: 'sms',
                  recipient: 'ops-oncall@tenant.local',
                  templateCode: 'escalation_critical',
                  payload: { test: true },
                });
                await refresh();
                setStatus('Test notification enqueued');
              }}
            >
              Send test alert
            </Button>
            <pre className="text-xs overflow-auto max-h-64">{JSON.stringify(outbox, null, 2)}</pre>
          </CardContent>
        </Card>
      )}

      {tab === 'integrations' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">API keys</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2">
              <Input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
              <Button
                size="sm"
                disabled={!canUseIntegrationRuntime()}
                onClick={async () => {
                  const key = await platformCreateApiKey(newKeyName);
                  setCreatedKey(key);
                  await refresh();
                  setStatus('API key created — copy now; shown once');
                }}
              >
                Create key
              </Button>
            </div>
            {createdKey != null && (
              <pre className="text-xs bg-muted p-2 rounded">{JSON.stringify(createdKey, null, 2)}</pre>
            )}
            <pre className="text-xs overflow-auto max-h-48">{JSON.stringify(apiKeys, null, 2)}</pre>
          </CardContent>
        </Card>
      )}

      {tab === 'migration' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Import jobs (patients CSV)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea value={importCsv} onChange={(e) => setImportCsv(e.target.value)} rows={4} />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={!canUseMigrationRuntime()} onClick={() => void runMigration()}>
                Create job
              </Button>
              {migrationJobId && (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      const p = await platformPreviewImportJob(migrationJobId);
                      setMigrationPreview(p);
                      setStatus('Preview ready');
                    }}
                  >
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      const r = await platformExecuteImportJob(migrationJobId);
                      setStatus(`Executed: ${JSON.stringify(r)}`);
                    }}
                  >
                    Execute
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const r = await platformRollbackImportJob(migrationJobId);
                      setStatus(`Rolled back: ${JSON.stringify(r)}`);
                    }}
                  >
                    Rollback
                  </Button>
                </>
              )}
            </div>
            {migrationJobId && <p className="text-xs text-muted-foreground">Job: {migrationJobId}</p>}
            {migrationPreview != null && (
              <pre className="text-xs overflow-auto max-h-48">{JSON.stringify(migrationPreview, null, 2)}</pre>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'templates' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Operational template packs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <pre className="text-xs overflow-auto max-h-40">{JSON.stringify(templates, null, 2)}</pre>
            <Button
              size="sm"
              disabled={!canUseTemplateRuntime()}
              onClick={async () => {
                const session = getPlatformSession();
                if (!session?.branchId) return;
                await platformInstantiateTemplate(session.branchId, 'opd_clinic');
                setStatus('Template pack opd_clinic instantiated');
              }}
            >
              Instantiate OPD clinic pack
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === 'command' && <AdminCommandCenter />}
    </div>
  );
}
