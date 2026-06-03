import { Route } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { hydrateNavayuProtocolCatalog } from '@/lib/navayu/navayu-protocol-engine';
import { AppSelect } from '@/components/ui/app-select';
import { getServerTenantProtocols } from '@/runtime/branch-config';
import {
  getNavayuProtocolMapForm,
  type NavayuProtocolMapData,
} from '@/lib/navayu/navayu-forms';
import {
  listNavayuProtocols,
  recommendTierForProtocolStage,
} from '@/lib/navayu/navayu-protocol-engine';

type ProtocolLibrary = {
  protocols?: Array<{
    id: string;
    label: string;
    stages?: Array<{ id: string; label: string }>;
  }>;
  packageTiers?: Array<{ id: string; label: string }>;
};

interface Props {
  value: NavayuProtocolMapData;
  onChange: (next: NavayuProtocolMapData) => void;
}

export function NavayuProtocolMapPanel({ value, onChange }: Props) {
  useEffect(() => {
    void hydrateNavayuProtocolCatalog();
  }, []);

  const form = getNavayuProtocolMapForm();
  const library = (getServerTenantProtocols() ?? {}) as ProtocolLibrary;

  const protocols = library.protocols?.length ? library.protocols : listNavayuProtocols();
  const selected = protocols.find((p) => p.id === value.protocolId);
  const stages = selected?.stages ?? [];
  const tiers = library.packageTiers ?? [
    { id: 'basic', label: 'Basic' },
    { id: 'advanced', label: 'Advanced' },
    { id: 'regenerative', label: 'Regenerative' },
    { id: 'premium', label: 'Premium' },
  ];
  const engineTier =
    value.protocolId && value.stageId
      ? recommendTierForProtocolStage(value.protocolId, value.stageId)
      : null;

  const protocolOptions = useMemo(
    () => protocols.map((p) => ({ value: p.id, label: p.label })),
    [protocols],
  );

  return (
    <div className="border rounded-xl bg-card p-4 space-y-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
        <Route className="w-3.5 h-3.5" /> {form.label}
      </p>
      {protocols.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Protocol catalog not loaded — run provision:navayu (tenant.protocols on Gurgaon branch).
        </p>
      ) : (
        <>
          <div>
            <label className="text-xs font-medium mb-1 block">Protocol family</label>
            <AppSelect
              value={value.protocolId ?? ''}
              onValueChange={(protocolId) =>
                onChange({ ...value, protocolId, stageId: '', mappedAt: new Date().toISOString() })
              }
              options={[{ value: '', label: 'Select protocol' }, ...protocolOptions]}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Stage</label>
            <AppSelect
              value={value.stageId ?? ''}
              onValueChange={(stageId) => {
                const tier = value.protocolId
                  ? recommendTierForProtocolStage(value.protocolId, stageId)
                  : undefined;
                onChange({
                  ...value,
                  stageId,
                  packageTier: tier,
                  mappedAt: new Date().toISOString(),
                });
              }}
              options={[
                { value: '', label: 'Select stage' },
                ...stages.map((s) => ({ value: s.id, label: s.label })),
              ]}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
              disabled={!value.protocolId}
            />
          </div>
          {engineTier ? (
            <p className="text-xs text-muted-foreground">
              Engine recommends: <span className="font-medium capitalize">{engineTier}</span>
            </p>
          ) : null}
          {tiers.length > 0 ? (
            <div>
              <label className="text-xs font-medium mb-1 block">Package tier</label>
              <AppSelect
                value={value.packageTier ?? ''}
                onValueChange={(packageTier) => onChange({ ...value, packageTier })}
                options={[
                  { value: '', label: 'Optional' },
                  ...tiers.map((t) => ({ value: t.id, label: t.label })),
                ]}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
              />
            </div>
          ) : null}
          <div>
            <label className="text-xs font-medium mb-1 block">Plan notes</label>
            <textarea
              value={value.protocolNotes ?? ''}
              onChange={(e) => onChange({ ...value, protocolNotes: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm min-h-[60px]"
              rows={2}
            />
          </div>
        </>
      )}
    </div>
  );
}
