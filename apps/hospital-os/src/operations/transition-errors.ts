/** Extract failure reason from lifecycle results when strict discriminated narrowing is off. */
export function transitionFailureReason(
  result: { ok: boolean } & Partial<{ reason: string }>,
  fallback = 'Action not allowed',
): string {
  if (result.ok) return fallback;
  return typeof result.reason === 'string' ? result.reason : fallback;
}
