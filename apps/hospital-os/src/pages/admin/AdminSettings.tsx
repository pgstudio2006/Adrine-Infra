import { useEffect, useState } from 'react';
import { ROLE_TABS } from '@/config/roleNavigation';
import {
  REGISTRATION_JOURNEY_OPTIONS,
  TenantFormTemplateKey,
  RegistrationJourneyType,
  TENANT_FEATURE_LABELS,
  TenantFeatureFlag,
} from '@/config/tenantSettings';
import { useTenantSettings } from '@/hooks/useTenantSettings';
import { UserRole } from '@/types/roles';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ClipboardList, FileText, LayoutTemplate, LockKeyhole, Palette, Settings2, SlidersHorizontal } from 'lucide-react';

type SettingsTab = 'branding' | 'roles' | 'navigation' | 'features' | 'registration' | 'forms' | 'advanced';

const TAB_OPTIONS: Array<{ key: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: 'branding', label: 'Branding', icon: Palette },
  { key: 'roles', label: 'Roles', icon: LayoutTemplate },
  { key: 'navigation', label: 'Navigation', icon: SlidersHorizontal },
  { key: 'features', label: 'Feature Flags', icon: Settings2 },
  { key: 'registration', label: 'Registration', icon: ClipboardList },
  { key: 'forms', label: 'Form Builder', icon: FileText },
  { key: 'advanced', label: 'Advanced JSON', icon: LockKeyhole },
];

function parseUniqueLines(value: string) {
  const seen = new Set<string>();
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter((item) => {
      if (!item) {
        return false;
      }

      const key = item.toLowerCase();
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function resolveJourneyType(value: string): RegistrationJourneyType | null {
  const normalized = value.trim().toLowerCase();
  return REGISTRATION_JOURNEY_OPTIONS.find((option) => option.toLowerCase() === normalized) ?? null;
}

function buildFormTemplateDrafts(forms: Record<TenantFormTemplateKey, { label: string; fields: string[] }>) {
  return (Object.keys(forms) as TenantFormTemplateKey[]).reduce((result, key) => {
    result[key] = {
      label: forms[key].label,
      fieldsText: forms[key].fields.join('\n'),
    };
    return result;
  }, {} as Record<TenantFormTemplateKey, { label: string; fieldsText: string }>);
}

export default function AdminSettings() {
  const {
    settings,
    updateBranding,
    updateRole,
    updateNavigation,
    updateFeatureFlag,
    updateRegistration,
    updateFormTemplate,
    replaceSettings,
    resetSettings,
  } = useTenantSettings();
  const [tab, setTab] = useState<SettingsTab>('branding');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [jsonText, setJsonText] = useState(() => JSON.stringify(settings, null, 2));
  const [departmentText, setDepartmentText] = useState(() => settings.registration.departments.join('\n'));
  const [patientTypeText, setPatientTypeText] = useState(() =>
    settings.registration.patientTypes.map((item) => `${item.label}|${item.journeyType}`).join('\n'),
  );
  const [formTemplateDrafts, setFormTemplateDrafts] = useState(() => buildFormTemplateDrafts(settings.forms));

  useEffect(() => {
    setJsonText(JSON.stringify(settings, null, 2));
    setDepartmentText(settings.registration.departments.join('\n'));
    setPatientTypeText(settings.registration.patientTypes.map((item) => `${item.label}|${item.journeyType}`).join('\n'));
    setFormTemplateDrafts(buildFormTemplateDrafts(settings.forms));
  }, [settings]);

  function applyAdvancedJson() {
    try {
      replaceSettings(JSON.parse(jsonText));
      toast.success('Customization schema applied');
    } catch {
      toast.error('Invalid JSON', { description: 'Please fix the JSON syntax and try again.' });
    }
  }

  function resetToDefaults() {
    resetSettings();
    toast.success('Customization reset to defaults');
  }

  function applyRegistrationSettings() {
    const departments = parseUniqueLines(departmentText);
    if (!departments.length) {
      toast.error('Department list is empty', { description: 'Add at least one department.' });
      return;
    }

    const patientTypeLines = parseUniqueLines(patientTypeText);
    const patientTypes = patientTypeLines
      .map((line) => {
        const [rawLabel, rawJourneyType] = line.split('|').map((part) => part.trim());
        if (!rawLabel) {
          return null;
        }

        const journeyType = resolveJourneyType(rawJourneyType || rawLabel) ?? 'OPD';
        return {
          label: rawLabel,
          journeyType,
        };
      })
      .filter((item): item is { label: string; journeyType: RegistrationJourneyType } => item !== null);

    if (!patientTypes.length) {
      toast.error('Patient type list is empty', {
        description: 'Add at least one patient type. Format: Label|Journey Type',
      });
      return;
    }

    updateRegistration({
      departments,
      patientTypes,
    });
    toast.success('Registration options updated');
  }

  function applyFormTemplate(templateKey: TenantFormTemplateKey) {
    const draft = formTemplateDrafts[templateKey];
    const fields = parseUniqueLines(draft.fieldsText);

    if (!draft.label.trim()) {
      toast.error('Template label is required');
      return;
    }

    if (!fields.length) {
      toast.error('Add at least one form field');
      return;
    }

    updateFormTemplate(templateKey, {
      label: draft.label.trim(),
      fields,
    });
    toast.success('Form template updated');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customization Studio</h1>
          <p className="text-sm text-muted-foreground">Tenant branding, role presentation, navigation labels and feature controls</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline">Live persisted</Badge>
          <Button variant="outline" onClick={resetToDefaults}>Reset Defaults</Button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b pb-1">
        {TAB_OPTIONS.map((option) => (
          <Button
            key={option.key}
            size="sm"
            variant={tab === option.key ? 'default' : 'ghost'}
            onClick={() => setTab(option.key)}
          >
            <option.icon className="mr-1 h-4 w-4" />
            {option.label}
          </Button>
        ))}
      </div>

      {tab === 'branding' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Branding & Identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Platform Name</Label>
                <Input value={settings.branding.platformName} onChange={(event) => updateBranding({ platformName: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Platform Mark</Label>
                <Input value={settings.branding.platformMark} onChange={(event) => updateBranding({ platformMark: event.target.value })} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Organization Name</Label>
                <Input value={settings.branding.organizationName} onChange={(event) => updateBranding({ organizationName: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Organization Short Name</Label>
                <Input value={settings.branding.organizationShortName} onChange={(event) => updateBranding({ organizationShortName: event.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Product Descriptor</Label>
              <Input value={settings.branding.productDescriptor} onChange={(event) => updateBranding({ productDescriptor: event.target.value })} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Login Headline</Label>
                <Input value={settings.branding.loginHeadline} onChange={(event) => updateBranding({ loginHeadline: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Login Subheadline</Label>
                <Input value={settings.branding.loginSubheadline} onChange={(event) => updateBranding({ loginSubheadline: event.target.value })} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Support Email</Label>
                <Input value={settings.branding.supportEmail} onChange={(event) => updateBranding({ supportEmail: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Support Phone</Label>
                <Input value={settings.branding.supportPhone} onChange={(event) => updateBranding({ supportPhone: event.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea value={settings.branding.address} onChange={(event) => updateBranding({ address: event.target.value })} />
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'roles' && (
        <div className="grid gap-4 md:grid-cols-2">
          {(Object.keys(settings.roles) as UserRole[]).map((role) => (
            <Card key={role}>
              <CardHeader>
                <CardTitle className="text-base">{settings.roles[role].label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Role Label</Label>
                  <Input value={settings.roles[role].label} onChange={(event) => updateRole(role, { label: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Role Description</Label>
                  <Textarea value={settings.roles[role].description} onChange={(event) => updateRole(role, { description: event.target.value })} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Role visible in launcher</p>
                    <p className="text-xs text-muted-foreground">Hide this role from the module selection screen.</p>
                  </div>
                  <Switch checked={settings.roles[role].enabled} onCheckedChange={(checked) => updateRole(role, { enabled: checked })} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === 'navigation' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(settings.navigation) as UserRole[]).map((role) => (
              <Button key={role} size="sm" variant={selectedRole === role ? 'default' : 'outline'} onClick={() => setSelectedRole(role)}>
                {settings.roles[role].label}
              </Button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{settings.roles[selectedRole].label} Navigation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ROLE_TABS[selectedRole].map((tabItem) => (
                <div key={tabItem.key} className="grid gap-4 rounded-lg border p-4 md:grid-cols-[1.2fr,0.9fr,auto] md:items-center">
                  <div>
                    <p className="text-sm font-medium">{tabItem.path}</p>
                    <p className="text-xs text-muted-foreground">Edit label and visibility for this navigation item.</p>
                  </div>
                  <Input
                    value={settings.navigation[selectedRole][tabItem.key].label}
                    onChange={(event) => updateNavigation(selectedRole, tabItem.key, { label: event.target.value })}
                  />
                  <div className="flex items-center gap-3">
                    <Label className="text-sm">Visible</Label>
                    <Switch
                      checked={settings.navigation[selectedRole][tabItem.key].visible}
                      onCheckedChange={(checked) => updateNavigation(selectedRole, tabItem.key, { visible: checked })}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'features' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Feature Flags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(Object.keys(settings.featureFlags) as TenantFeatureFlag[]).map((flag) => (
              <div key={flag} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">{TENANT_FEATURE_LABELS[flag].label}</p>
                  <p className="text-xs text-muted-foreground">{TENANT_FEATURE_LABELS[flag].description}</p>
                </div>
                <Switch checked={settings.featureFlags[flag]} onCheckedChange={(checked) => updateFeatureFlag(flag, checked)} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {tab === 'registration' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registration Routing & Patient Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Departments (one per line)</Label>
                <Textarea
                  className="min-h-[260px]"
                  value={departmentText}
                  onChange={(event) => setDepartmentText(event.target.value)}
                  placeholder="General Medicine\nCardiology\nOrthopedics"
                />
                <p className="text-xs text-muted-foreground">
                  These departments appear in patient registration when deciding where to route the patient.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Patient Types (one per line)</Label>
                <Textarea
                  className="min-h-[260px] font-mono text-xs"
                  value={patientTypeText}
                  onChange={(event) => setPatientTypeText(event.target.value)}
                  placeholder={[
                    'OPD|OPD',
                    'Emergency|Emergency',
                    'Corporate Walk-In|OPD',
                    'Senior Citizen Priority|OPD',
                  ].join('\n')}
                />
                <p className="text-xs text-muted-foreground">
                  Format: Category Label|Journey Type. If journey type is omitted or invalid, OPD is used.
                </p>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">Allowed Journey Types</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {REGISTRATION_JOURNEY_OPTIONS.map((journeyType) => (
                  <Badge key={journeyType} variant="outline">{journeyType}</Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={applyRegistrationSettings}>Apply Registration Settings</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setDepartmentText(settings.registration.departments.join('\n'));
                  setPatientTypeText(settings.registration.patientTypes.map((item) => `${item.label}|${item.journeyType}`).join('\n'));
                }}
              >
                Reset Editor
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'forms' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tenant Form Builder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(Object.keys(settings.forms) as TenantFormTemplateKey[]).map((templateKey) => (
              <div key={templateKey} className="rounded-lg border p-4 space-y-3">
                <div className="grid gap-3 md:grid-cols-[1fr,auto] md:items-center">
                  <div className="space-y-2">
                    <Label>Template Label</Label>
                    <Input
                      value={formTemplateDrafts[templateKey].label}
                      onChange={(event) => {
                        const value = event.target.value;
                        setFormTemplateDrafts((current) => ({
                          ...current,
                          [templateKey]: {
                            ...current[templateKey],
                            label: value,
                          },
                        }));
                      }}
                    />
                  </div>
                  <Button className="md:self-end" onClick={() => applyFormTemplate(templateKey)}>Apply Template</Button>
                </div>

                <div className="space-y-2">
                  <Label>Fields (one per line)</Label>
                  <Textarea
                    className="min-h-[150px]"
                    value={formTemplateDrafts[templateKey].fieldsText}
                    onChange={(event) => {
                      const value = event.target.value;
                      setFormTemplateDrafts((current) => ({
                        ...current,
                        [templateKey]: {
                          ...current[templateKey],
                          fieldsText: value,
                        },
                      }));
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <p>Customize form fields per tenant. Updated templates are persisted in local tenant settings.</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFormTemplateDrafts((current) => ({
                        ...current,
                        [templateKey]: {
                          label: settings.forms[templateKey].label,
                          fieldsText: settings.forms[templateKey].fields.join('\n'),
                        },
                      }));
                    }}
                  >
                    Reset Draft
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {tab === 'advanced' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Advanced JSON Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This is the tenant configuration payload. Edit it directly to support deeper customization and future server sync.
            </p>
            <Textarea className="min-h-[420px] font-mono text-xs" value={jsonText} onChange={(event) => setJsonText(event.target.value)} />
            <div className="flex gap-3">
              <Button onClick={applyAdvancedJson}>Apply JSON</Button>
              <Button variant="outline" onClick={() => setJsonText(JSON.stringify(settings, null, 2))}>Refresh JSON</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
