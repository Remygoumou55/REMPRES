import type { AdminPlatformAggregates } from "@/modules/admin-platform-dashboard/server/repositories";

function toCount(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function validateAdminPlatformAggregates(input: AdminPlatformAggregates): AdminPlatformAggregates {
  return {
    jobsPending: toCount(input.jobsPending),
    jobsFailed24h: toCount(input.jobsFailed24h),
    incidentsOpen: toCount(input.incidentsOpen),
    anomaliesOpen: toCount(input.anomaliesOpen),
    riskSignalsOpen: toCount(input.riskSignalsOpen),
    tenantsActive: toCount(input.tenantsActive),
    tenantSnapshots: toCount(input.tenantSnapshots),
    scopeHash: String(input.scopeHash ?? "global"),
  };
}
