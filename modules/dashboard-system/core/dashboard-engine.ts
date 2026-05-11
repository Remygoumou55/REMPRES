import type { DeptKpiPayload } from "@/lib/dept/kpi-contract";
import type {
  DashboardErpDomainKey,
  DashboardFoundationId,
  DashboardFoundationSnapshot,
  DashboardSnapshotMeta,
} from "../types/domain";
import { DASHBOARD_FOUNDATION_ENGINE_VERSION } from "../constants";
import { createDashboardCorrelationId } from "../utils/correlation";

/** Fusionne plusieurs payloads département / domaine en snapshot foundation (structurelle uniquement). */
export function mergeDashboardPayloads(
  foundationId: DashboardFoundationId,
  domains: Partial<Record<DashboardErpDomainKey, DeptKpiPayload>>,
  meta?: Partial<DashboardSnapshotMeta>,
): DashboardFoundationSnapshot {
  const correlationId = meta?.correlationId ?? createDashboardCorrelationId();
  const generatedAtIso = meta?.generatedAtIso ?? new Date().toISOString();
  return {
    id: foundationId,
    domains,
    meta: {
      engineVersion: meta?.engineVersion ?? DASHBOARD_FOUNDATION_ENGINE_VERSION,
      correlationId,
      generatedAtIso,
    },
  };
}
