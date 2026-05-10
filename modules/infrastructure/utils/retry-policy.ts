/** Backoff exponentiel contrôlé (ms) pour rejouer une opération distribuée. */
export function computeRetryDelayMs(attemptAfterClaim: number, baseMs = 2000, capMs = 300_000): number {
  const step = Math.max(1, attemptAfterClaim);
  const raw = baseMs * 2 ** Math.min(step - 1, 12);
  return Math.min(capMs, raw);
}
