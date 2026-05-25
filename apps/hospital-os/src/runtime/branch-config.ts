import { platformFetch } from './platform-client';
import { platformGetEffectivePolicies } from './governance-runtime';
import { getPlatformSession, isPlatformRuntimeEnabled } from './platform-session';

const STORAGE_KEY = 'adrine_branch_config';

export type BranchConfigMap = Record<string, boolean | number | string | unknown>;

export async function loadBranchConfig(): Promise<BranchConfigMap | null> {
  const session = getPlatformSession();
  const kernel = import.meta.env.VITE_KERNEL_API_URL as string | undefined;
  if (!isPlatformRuntimeEnabled() || !session || !kernel) return null;

  try {
    const [legacyConfig, effectivePolicies] = await Promise.all([
      platformFetch<BranchConfigMap>(kernel, `/org/branches/${session.branchId}/config`).catch(
        () => ({} as BranchConfigMap),
      ),
      platformGetEffectivePolicies(session.branchId).catch(() => ({} as Record<string, unknown>)),
    ]);

    const billing = effectivePolicies.billing as Record<string, unknown> | undefined;
    const merged: BranchConfigMap = {
      ...legacyConfig,
      ...flattenPolicies(effectivePolicies),
      'billing.allow_partial_payment':
        (billing?.allowPartialPayment as boolean | undefined) ??
        (legacyConfig['billing.allow_partial_payment'] as boolean | undefined) ??
        true,
      'billing.payment_required':
        (billing?.paymentRequired as boolean | undefined) ??
        (legacyConfig['billing.payment_required'] as boolean | undefined) ??
        true,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return null;
  }
}

function flattenPolicies(policies: Record<string, unknown>): BranchConfigMap {
  const out: BranchConfigMap = {};
  for (const [key, value] of Object.entries(policies)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [subKey, subVal] of Object.entries(value as Record<string, unknown>)) {
        out[`${key}.${subKey.replace(/([A-Z])/g, '_$1').toLowerCase()}`] = subVal as boolean | number | string;
      }
    }
  }
  return out;
}

export function getBranchConfigOverrides(): Record<string, boolean> {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      'billing.allow_partial_payment': true,
      'billing.payment_required': true,
      'scheduling.walk_in_enabled': true,
    };
  }
  try {
    const config = JSON.parse(raw) as BranchConfigMap;
    const out: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'boolean') out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}
