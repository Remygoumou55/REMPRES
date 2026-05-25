/**
 * Observability Hub digest — agrégation DB + bus, émission événements officiels.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getObservabilityOperationalOverview } from "@/modules/observability/server/services/observability-overview";
import {
  emitObservabilityHealthDegraded,
  emitObservabilityHubRefreshed,
} from "@/lib/erp-core/events/integrations/executive-events";

export const OBSERVABILITY_HUB_DIGEST_SOURCE = "observability-hub-digest-bloc3-v1" as const;

export type ObservabilityHubDigest = {
  source: typeof OBSERVABILITY_HUB_DIGEST_SOURCE;
  overview: Awaited<ReturnType<typeof getObservabilityOperationalOverview>>;
  generatedAt: string;
};

export async function buildObservabilityHubDigest(
  supabase: SupabaseClient<Database>,
): Promise<ObservabilityHubDigest> {
  const overview = await getObservabilityOperationalOverview(supabase);
  return {
    source: OBSERVABILITY_HUB_DIGEST_SOURCE,
    overview,
    generatedAt: new Date().toISOString(),
  };
}

export async function publishObservabilityHubDigest(
  supabase: SupabaseClient<Database>,
  actorUserId: string,
): Promise<ObservabilityHubDigest> {
  const digest = await buildObservabilityHubDigest(supabase);

  await emitObservabilityHubRefreshed({
    actorUserId,
    openIncidents: digest.overview.openIncidents,
    healthScore: digest.overview.latestHealthScore,
  });

  const score = digest.overview.latestHealthScore;
  if (score != null && score < 70) {
    await emitObservabilityHealthDegraded({
      actorUserId,
      healthScore: score,
      previousScore: null,
    });
  }

  return digest;
}
