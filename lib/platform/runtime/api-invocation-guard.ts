/**
 * Bloc 3 Étape 8 — Garde invocation API (rate limit in-process + audit best-effort).
 */

import { resolveApiGovernance } from "@/lib/platform/governance/api-governance-registry";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { emitPlatformApiInvoked } from "@/lib/erp-core/events/integrations/platform-events";

const WINDOW_MS = 60_000;
const counters = new Map<string, { count: number; windowStart: number }>();

export type ApiInvocationResult =
  | { allowed: true; apiKey: string }
  | { allowed: false; reason: "unknown_api" | "rate_limited" | "retired" };

export function checkApiInvocationAllowed(apiKey: string): ApiInvocationResult {
  const entry = resolveApiGovernance(apiKey);
  if (!entry) return { allowed: false, reason: "unknown_api" };
  if (entry.lifecycleStatus === "retired") return { allowed: false, reason: "retired" };

  const now = Date.now();
  const bucket = counters.get(apiKey) ?? { count: 0, windowStart: now };
  if (now - bucket.windowStart > WINDOW_MS) {
    bucket.count = 0;
    bucket.windowStart = now;
  }
  bucket.count += 1;
  counters.set(apiKey, bucket);

  if (bucket.count > entry.rateLimitPerMinute) {
    return { allowed: false, reason: "rate_limited" };
  }
  return { allowed: true, apiKey };
}

export async function recordApiInvocationAudit(params: {
  actorUserId: string;
  apiKey: string;
  routePattern: string;
  statusCode: number;
  latencyMs: number;
}): Promise<void> {
  try {
    const admin = getSupabaseAdminClient();
    await admin.from("erp_platform_api_audit_log").insert({
      api_key: params.apiKey,
      actor_user_id: params.actorUserId,
      route_pattern: params.routePattern,
      status_code: params.statusCode,
      latency_ms: params.latencyMs,
      http_method: "GET",
      metadata: {},
    });
  } catch (e) {
    console.warn("[api-invocation-guard:audit]", e instanceof Error ? e.message : e);
  }

  void emitPlatformApiInvoked({
    actorUserId: params.actorUserId,
    apiKey: params.apiKey,
    routePattern: params.routePattern,
    statusCode: params.statusCode,
    latencyMs: params.latencyMs,
  });
}

export function clearApiInvocationCountersForTests(): void {
  counters.clear();
}
