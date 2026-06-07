const STORAGE_KEY = 'adrine_uhid_seq';
const DEFAULT_FLOOR = 240_008;

function parseUhidNumber(uhid: string | undefined | null): number | null {
  if (!uhid) return null;
  const match = /^UHID-(\d+)$/.exec(uhid.trim());
  if (!match) return null;
  const value = Number.parseInt(match[1], 10);
  return Number.isFinite(value) ? value : null;
}

function readStoredCounter(): number {
  if (typeof sessionStorage === 'undefined') return DEFAULT_FLOOR;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_FLOOR;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : DEFAULT_FLOOR;
}

function writeStoredCounter(value: number): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, String(value));
}

/** Bump the persisted counter from known patient MRNs (platform hydrate + local rows). */
export function syncUhidCounterFromMrns(mrns: Array<string | undefined | null>): void {
  let max = readStoredCounter();
  for (const mrn of mrns) {
    const parsed = parseUhidNumber(mrn);
    if (parsed != null) max = Math.max(max, parsed);
  }
  writeStoredCounter(max);
}

/** Allocate the next UHID, persisting across reloads within the browser session. */
export function allocateNextUhid(existingMrns: Array<string | undefined | null> = []): string {
  syncUhidCounterFromMrns(existingMrns);
  const next = readStoredCounter() + 1;
  writeStoredCounter(next);
  return `UHID-${next}`;
}
