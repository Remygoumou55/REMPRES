import { cache } from "react";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  buildAutomationCockpitDigest,
  type AutomationCockpitDigest,
} from "@/modules/automation/server/services/automation-cockpit-digest";
import {
  buildPlatformCockpitDigest,
  type PlatformCockpitDigest,
} from "@/modules/platform/server/services/platform-cockpit-digest";
import {
  buildObservabilityHubDigest,
  type ObservabilityHubDigest,
} from "@/modules/observability/server/services/observability-hub-digest";

/** TTL court — hubs admin, évite requêtes lourdes à chaque navigation (process-local). */
export const ADMIN_DIGEST_REVALIDATE_SEC = 120 as const;

type DigestCacheRow<T> = { expiresAt: number; payload: T };

const digestStore = new Map<string, DigestCacheRow<unknown>>();

function readDigestCache<T>(key: string): T | null {
  const row = digestStore.get(key);
  if (!row || Date.now() > row.expiresAt) {
    digestStore.delete(key);
    return null;
  }
  return row.payload as T;
}

function writeDigestCache<T>(key: string, payload: T): void {
  digestStore.set(key, {
    payload,
    expiresAt: Date.now() + ADMIN_DIGEST_REVALIDATE_SEC * 1000,
  });
}

async function loadAutomationDigest(): Promise<AutomationCockpitDigest> {
  const key = "admin-automation-cockpit-digest";
  const hit = readDigestCache<AutomationCockpitDigest>(key);
  if (hit) return hit;
  const supabase = getSupabaseServerClient();
  const payload = await buildAutomationCockpitDigest(supabase);
  writeDigestCache(key, payload);
  return payload;
}

async function loadPlatformDigest(): Promise<PlatformCockpitDigest> {
  const key = "admin-platform-cockpit-digest";
  const hit = readDigestCache<PlatformCockpitDigest>(key);
  if (hit) return hit;
  const supabase = getSupabaseServerClient();
  const payload = await buildPlatformCockpitDigest(supabase);
  writeDigestCache(key, payload);
  return payload;
}

async function loadObservabilityDigest(): Promise<ObservabilityHubDigest> {
  const key = "admin-observability-hub-digest";
  const hit = readDigestCache<ObservabilityHubDigest>(key);
  if (hit) return hit;
  const supabase = getSupabaseServerClient();
  const payload = await buildObservabilityHubDigest(supabase);
  writeDigestCache(key, payload);
  return payload;
}

/** Déduplication par requête (React) + TTL 120s en mémoire process. */
export const getCachedAutomationCockpitDigest = cache(loadAutomationDigest);
export const getCachedPlatformCockpitDigest = cache(loadPlatformDigest);
export const getCachedObservabilityHubDigest = cache(loadObservabilityDigest);
