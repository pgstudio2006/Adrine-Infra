import { isPlatformRuntimeEnabled } from '@/runtime/platform-session';
import { isFullHospitalDemoEnabled } from '@/lib/platform/full-hospital-demo';

/** Role-picker / one-click demo login (Vercel static demo, local dev). */
export function allowDemoLogin(): boolean {
  if (isFullHospitalDemoEnabled()) return true;
  if (!import.meta.env.PROD) return true;
  if (!isPlatformRuntimeEnabled()) return true;
  return import.meta.env.VITE_ALLOW_DEMO_LOGIN === 'true';
}

/**
 * Demo/sample UI data is allowed only for local Vite dev without platform APIs.
 * Production and platform-runtime builds must never show fabricated rows.
 */
export function allowDemoFallback(): boolean {
  if (import.meta.env.PROD) return false;
  if (isPlatformRuntimeEnabled()) return false;
  return import.meta.env.VITE_ALLOW_DEMO_DATA === 'true';
}

/** Prefer platform rows; never fall back to demo unless explicitly allowed. */
export function pickPlatformRows<T>(
  platformOn: boolean,
  platformRows: T[],
  demoRows: T[],
): T[] {
  if (platformOn) return platformRows;
  if (allowDemoFallback()) return demoRows;
  return [];
}

export function pickPlatformValue<T>(
  platformOn: boolean,
  platformValue: T | null | undefined,
  demoValue: T,
): T | null | undefined {
  if (platformOn && platformValue != null) return platformValue;
  if (allowDemoFallback()) return demoValue;
  return platformOn ? platformValue : null;
}
