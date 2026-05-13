import type { ExecutiveGlobalSnapshot } from "@/modules/executive-dashboard/types/domain";

function sanitizeNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function validateExecutiveSnapshot(snapshot: ExecutiveGlobalSnapshot): ExecutiveGlobalSnapshot {
  const domains = { ...snapshot.domains };
  for (const key of Object.keys(domains) as (keyof typeof domains)[]) {
    const payload = domains[key];
    if (!payload) continue;
    payload.stats = payload.stats.map((s) => ({ ...s, value: sanitizeNumber(s.value) }));
  }
  return { ...snapshot, domains };
}
