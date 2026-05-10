import { revalidateTag } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { ANALYTICS_CACHE_TAGS } from "@/modules/analytics/constants/cache-tags";

export async function refreshRhDeptKpisDigestAndRevalidate(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  try {
    const admin = getSupabaseAdminClient();
    const { error } = await admin.rpc("refresh_rh_dept_kpis_digest");
    if (error) return { ok: false, message: error.message };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, message };
  }

  try {
    revalidateTag(ANALYTICS_CACHE_TAGS.rhDeptKpis);
    revalidateTag(ANALYTICS_CACHE_TAGS.rhFoundation);
  } catch {
    /* Revalidation tag indisponible hors boundary Next */
  }

  return { ok: true };
}
