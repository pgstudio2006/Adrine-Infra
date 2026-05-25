/** Minutes since ISO timestamp (board `createdAt` or check-in time). */
export function computeWaitMinutes(isoOrNull?: string | null): number | null {
  if (!isoOrNull) return null;
  const ms = Date.parse(isoOrNull);
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.round((Date.now() - ms) / 60_000));
}

export function formatWaitMinutes(minutes: number | null | undefined): string {
  if (minutes == null) return '—';
  if (minutes < 1) return '<1 min';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function averageWaitMinutes(values: (number | null | undefined)[]): number | null {
  const nums = values.filter((v): v is number => typeof v === 'number' && v >= 0);
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}
