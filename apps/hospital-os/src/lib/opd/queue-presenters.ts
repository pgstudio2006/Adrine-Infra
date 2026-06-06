import type { QueueEntry } from '@/stores/hospitalStore';

export type QueueEntryLookup = {
  platformOpdVisitId?: string;
  tokenNo?: number;
  uhid?: string;
};

export function normalizeQueueLookup(key: number | QueueEntryLookup): QueueEntryLookup {
  return typeof key === 'number' ? { tokenNo: key } : key;
}

/** Resolve a queue row — prefer platform visit id when multiple rows share token/UHID. */
export function findQueueEntry(
  entries: QueueEntry[],
  lookup: QueueEntryLookup,
): QueueEntry | undefined {
  if (lookup.platformOpdVisitId) {
    return entries.find((entry) => entry.platformOpdVisitId === lookup.platformOpdVisitId);
  }
  if (lookup.tokenNo != null && lookup.uhid) {
    return entries.find(
      (entry) => entry.tokenNo === lookup.tokenNo && entry.uhid === lookup.uhid,
    );
  }
  if (lookup.tokenNo != null) {
    return entries.find((entry) => entry.tokenNo === lookup.tokenNo);
  }
  if (lookup.uhid) {
    return entries.find((entry) => entry.uhid === lookup.uhid);
  }
  return undefined;
}

export function patchQueueEntries(
  entries: QueueEntry[],
  lookup: QueueEntryLookup,
  patch: Partial<QueueEntry>,
): QueueEntry[] {
  return entries.map((entry) => {
    const match = findQueueEntry([entry], lookup);
    return match ? { ...entry, ...patch } : entry;
  });
}

export function queueEntryKey(entry: Pick<QueueEntry, 'platformOpdVisitId' | 'tokenNo' | 'uhid'>): QueueEntryLookup {
  return {
    platformOpdVisitId: entry.platformOpdVisitId,
    tokenNo: entry.tokenNo,
    uhid: entry.uhid,
  };
}

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
