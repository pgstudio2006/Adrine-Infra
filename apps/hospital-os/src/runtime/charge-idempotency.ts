/** Stable idempotency key for operational charge sync. */
export function buildChargeIdempotencyKey(input: {
  module: string;
  action: string;
  refId?: string;
  description: string;
}): string {
  const raw = [input.module, input.action, input.refId ?? '', input.description]
    .join('|')
    .toLowerCase()
    .replace(/\s+/g, '_');
  return raw.length > 180 ? raw.slice(0, 180) : raw;
}
