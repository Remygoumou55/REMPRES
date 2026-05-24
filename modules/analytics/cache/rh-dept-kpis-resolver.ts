import { cache } from "react";
import type { DeptKpiPayload } from "@/lib/dept/kpi-contract";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { computeRhDeptKpisLive } from "@/modules/analytics/aggregation/rh-dept-kpi-live";
import {
  RH_DEPT_KPIS_SNAPSHOT_MAX_AGE_SEC,
} from "@/modules/analytics/constants";
import { fetchRhDeptKpisSnapshotRow } from "@/modules/analytics/server/repositories/analytics-snapshot-repository";
import { rhDeptKpiPayloadFromSnapshot } from "@/modules/analytics/snapshots/rh-dept-kpi-from-snapshot";
import { isTimestampFresh } from "@/modules/analytics/utils/is-fresh";

/**
 * KPI dept RH : snapshot DB fraîche pour opérateurs éligibles (aligné RLS), sinon agrégation live sous RLS.
 * Cache Next par observateur + tier (pas de fuite cross-user).
 */
export async function resolveRhDeptKpisCached(opts: {
  viewerUserId: string;
  elevated: boolean;
}): Promise<DeptKpiPayload> {
  const viewerUserId = String(opts.viewerUserId ?? "").trim();
  const tier = opts.elevated ? "elevated" : "standard";
  return loadRhDeptKpis(viewerUserId, tier, opts.elevated);
}

const loadRhDeptKpis = cache(
  async (viewerUserId: string, tier: string, elevated: boolean): Promise<DeptKpiPayload> => {
    void viewerUserId;
    void tier;
    if (elevated) {
      const row = await fetchRhDeptKpisSnapshotRow();
      if (row && isTimestampFresh(row.computed_at, RH_DEPT_KPIS_SNAPSHOT_MAX_AGE_SEC)) {
        const fromSnap = rhDeptKpiPayloadFromSnapshot(row.payload, row.computed_at);
        if (fromSnap) return fromSnap;
      }
    }
    const supabase = getSupabaseServerClient();
    return computeRhDeptKpisLive(supabase);
  },
);
