/**
 * Navayu Protocol Engine — tier mapping from clients/navayu/protocols.json (engine-based, not hard-coded UI).
 */

import { getServerTenantProtocols } from '@/runtime/branch-config';
import { platformFetch } from '@/runtime/platform-client';
import { canUseOpdRuntime } from '@/runtime/opd-runtime';
import type { NavayuProtocolMapData } from '@/lib/navayu/navayu-forms';

export type NavayuPackageTierId = 'basic' | 'advanced' | 'regenerative' | 'premium';

export type NavayuProtocolStage = {
  id: string;
  label: string;
  components: string[];
};

export type NavayuProtocol = {
  id: string;
  label: string;
  specialty: string;
  stages: NavayuProtocolStage[];
};

export type NavayuPackageTier = {
  id: NavayuPackageTierId;
  label: string;
  priceInr: number;
  billingCode: string;
};

export type NavayuCounsellingRecord = {
  tierId: NavayuPackageTierId;
  tierLabel: string;
  packageCode: string;
  packageName: string;
  proposedAmountInr: number;
  notes?: string;
  counsellorAt: string;
};

export type NavayuFollowUpHandoff = {
  appointmentId?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  resourceLabel: string;
  daysFromNow: number;
  bookedAt: string;
};

const PROTOCOL_CATALOG: { protocols: NavayuProtocol[]; packageTiers: { id: string; label: string }[] } = {
  protocols: [
    {
      id: 'disc_care',
      label: 'Disc Care',
      specialty: 'Spine',
      stages: [
        { id: 'stage_1', label: 'Stage 1 — Acute pain control', components: ['physio', 'medication', 'activity_modification'] },
        { id: 'stage_2', label: 'Stage 2 — Functional restoration', components: ['structured_physio', 'core_strengthening'] },
        { id: 'stage_3', label: 'Stage 3 — Regenerative options', components: ['ozone', 'dscb', 'epidural'] },
        { id: 'stage_4', label: 'Stage 4 — Maintenance', components: ['home_program', 'follow_up'] },
      ],
    },
    {
      id: 'frozen_shoulder',
      label: 'Frozen Shoulder',
      specialty: 'Shoulder',
      stages: [
        { id: 'freezing', label: 'Freezing', components: ['pain_management', 'gentle_mobility'] },
        { id: 'frozen', label: 'Frozen', components: ['capsular_stretch', 'hydrodilatation'] },
        { id: 'thawing', label: 'Thawing', components: ['strengthening', 'prp_optional', 'ozone_optional'] },
      ],
    },
    {
      id: 'knee_oa',
      label: 'Knee Osteoarthritis',
      specialty: 'Knee',
      stages: [
        { id: 'kl_1_2', label: 'KL Grade 1–2', components: ['physio', 'weight_management', 'viscosupplementation'] },
        { id: 'kl_3', label: 'KL Grade 3', components: ['prp', 'gfc', 'bracing'] },
        { id: 'kl_4', label: 'KL Grade 4', components: ['bmac', 'surgical_referral'] },
      ],
    },
    {
      id: 'avn',
      label: 'Avascular Necrosis (AVN)',
      specialty: 'Hip',
      stages: [
        { id: 'ficat_1', label: 'Ficat I', components: ['protected_weight_bearing', 'bisphosphonates'] },
        { id: 'ficat_2', label: 'Ficat II', components: ['core_decompression', 'eboo'] },
        { id: 'ficat_3_4', label: 'Ficat III–IV', components: ['joint_preservation', 'arthroplasty_referral'] },
      ],
    },
  ],
  packageTiers: [
    { id: 'basic', label: 'Basic' },
    { id: 'advanced', label: 'Advanced' },
    { id: 'regenerative', label: 'Regenerative' },
    { id: 'premium', label: 'Premium' },
  ],
};

const DEFAULT_TIER_PRICING: Record<NavayuPackageTierId, NavayuPackageTier> = {
  basic: { id: 'basic', label: 'Basic', priceInr: 25_000, billingCode: 'NAV-MSK-BASIC' },
  advanced: { id: 'advanced', label: 'Advanced', priceInr: 75_000, billingCode: 'NAV-MSK-ADV' },
  regenerative: { id: 'regenerative', label: 'Regenerative', priceInr: 1_50_000, billingCode: 'NAV-MSK-REGEN' },
  premium: { id: 'premium', label: 'Premium', priceInr: 2_50_000, billingCode: 'NAV-MSK-PREM' },
};

type ProtocolCatalogSource = {
  protocols?: NavayuProtocol[];
  packageTiers?: Array<{
    id: string;
    label: string;
    priceInr?: number;
    billingCode?: string;
  }>;
};

let cachedCatalog: ProtocolCatalogSource | null = null;

function domainBase(): string | undefined {
  return import.meta.env.VITE_DOMAIN_API_URL as string | undefined;
}

function tierPricingFromCatalog(source: ProtocolCatalogSource): Record<NavayuPackageTierId, NavayuPackageTier> {
  const tiers = source.packageTiers ?? [];
  const out = { ...DEFAULT_TIER_PRICING };
  for (const tier of tiers) {
    const id = tier.id as NavayuPackageTierId;
    if (!DEFAULT_TIER_PRICING[id]) continue;
    out[id] = {
      id,
      label: tier.label ?? DEFAULT_TIER_PRICING[id].label,
      priceInr: typeof tier.priceInr === 'number' ? tier.priceInr : DEFAULT_TIER_PRICING[id].priceInr,
      billingCode: tier.billingCode ?? DEFAULT_TIER_PRICING[id].billingCode,
    };
  }
  return out;
}

function resolveCatalog(): ProtocolCatalogSource {
  const tenantProtocols = getServerTenantProtocols() as ProtocolCatalogSource | null;
  if (tenantProtocols?.protocols?.length) {
    return tenantProtocols;
  }
  if (cachedCatalog?.protocols?.length) {
    return cachedCatalog;
  }
  return PROTOCOL_CATALOG;
}

/** Hydrate protocol library from GET /navayu/protocols when platform runtime is on. */
export async function hydrateNavayuProtocolCatalog(): Promise<void> {
  const base = domainBase();
  if (!base || !canUseOpdRuntime()) return;
  try {
    const remote = await platformFetch<ProtocolCatalogSource>(base, '/navayu/protocols');
    if (remote.protocols?.length) {
      cachedCatalog = remote;
    }
  } catch {
    /* branch config + PROTOCOL_CATALOG fallback */
  }
}

const REGENERATIVE_COMPONENTS = new Set([
  'ozone',
  'dscb',
  'epidural',
  'prp',
  'prp_optional',
  'gfc',
  'bmac',
  'eboo',
  'hydrodilatation',
  'core_decompression',
  'joint_preservation',
  'arthroplasty_referral',
]);

export function listNavayuProtocols(): NavayuProtocol[] {
  const catalog = resolveCatalog();
  return catalog.protocols?.length ? catalog.protocols : PROTOCOL_CATALOG.protocols;
}

export function listNavayuPackageTiers(): NavayuPackageTier[] {
  const pricing = tierPricingFromCatalog(resolveCatalog());
  return (resolveCatalog().packageTiers ?? PROTOCOL_CATALOG.packageTiers).map((t) => {
    const id = t.id as NavayuPackageTierId;
    return pricing[id] ?? DEFAULT_TIER_PRICING.basic;
  });
}

export function getNavayuProtocol(id: string): NavayuProtocol | undefined {
  return listNavayuProtocols().find((p) => p.id === id);
}

export function getNavayuTier(id: NavayuPackageTierId): NavayuPackageTier {
  return tierPricingFromCatalog(resolveCatalog())[id] ?? DEFAULT_TIER_PRICING[id];
}

/** Engine rule: map protocol stage components → recommended package tier. */
export function recommendTierForProtocolStage(
  protocolId: string,
  stageId: string,
): NavayuPackageTierId {
  const protocol = getNavayuProtocol(protocolId);
  const stage = protocol?.stages.find((s) => s.id === stageId);
  if (!stage) return 'basic';

  const hasRegen = stage.components.some((c) => REGENERATIVE_COMPONENTS.has(c));
  const hasSurgical = stage.components.some((c) =>
    ['surgical_referral', 'arthroplasty_referral', 'joint_preservation'].includes(c),
  );

  if (hasSurgical || (protocolId === 'avn' && stageId === 'ficat_3_4')) {
    return 'premium';
  }
  if (hasRegen || stageId === 'stage_3' || stageId === 'kl_3' || stageId === 'kl_4') {
    return 'regenerative';
  }
  if (
    stageId === 'stage_2' ||
    stageId === 'frozen' ||
    stageId === 'thawing' ||
    stageId === 'kl_1_2' ||
    stageId === 'ficat_2'
  ) {
    return 'advanced';
  }
  return 'basic';
}

export function buildPackageName(protocolLabel: string, tierLabel: string): string {
  return `Navayu MSK — ${protocolLabel} (${tierLabel})`;
}

export function resolveProtocolMapData(
  protocolId: string,
  stageId: string,
  packageTier?: NavayuPackageTierId,
  protocolNotes?: string,
): NavayuProtocolMapData {
  const tier =
    packageTier ?? recommendTierForProtocolStage(protocolId, stageId);
  return {
    protocolId,
    stageId,
    packageTier: tier,
    protocolNotes,
    mappedAt: new Date().toISOString(),
  };
}

export function protocolMapLabels(map: NavayuProtocolMapData): {
  protocolLabel: string;
  stageLabel: string;
} {
  const protocol = getNavayuProtocol(map.protocolId);
  const stage = protocol?.stages.find((s) => s.id === map.stageId);
  return {
    protocolLabel: protocol?.label ?? map.protocolId,
    stageLabel: stage?.label ?? map.stageId,
  };
}

export function resolveCounsellingRecord(
  map: NavayuProtocolMapData,
  tierId?: NavayuPackageTierId,
  notes?: string,
): NavayuCounsellingRecord {
  const { protocolLabel } = protocolMapLabels(map);
  const resolvedTier =
    tierId ?? (map.packageTier as NavayuPackageTierId | undefined) ??
    recommendTierForProtocolStage(map.protocolId, map.stageId);
  const tier = getNavayuTier(resolvedTier);
  return {
    tierId: resolvedTier,
    tierLabel: tier.label,
    packageCode: tier.billingCode,
    packageName: buildPackageName(protocolLabel, tier.label),
    proposedAmountInr: tier.priceInr,
    notes: notes ?? map.protocolNotes,
    counsellorAt: new Date().toISOString(),
  };
}
