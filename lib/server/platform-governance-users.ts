/**
 * Résolution des comptes gouvernance plateforme (ROOT / SUPER_ADMIN) — requêtes serveur.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { hasSystemRootAuthority } from "@/lib/auth/system-authority";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

type ProfileGovernanceRow = {
  id: string;
  role_key: string | null;
  system_authority: string | null;
};

/** IDs des profils actifs avec autorité plateforme (system_authority ou role_key super_admin). */
export async function listActivePlatformGovernanceUserIds(
  admin?: SupabaseClient,
): Promise<string[]> {
  const client = admin ?? getSupabaseAdminClient();
  const { data, error } = await client
    .from("profiles")
    .select("id, role_key, system_authority")
    .eq("is_active", true)
    .is("deleted_at", null);

  if (error || !data?.length) return [];

  return (data as ProfileGovernanceRow[])
    .filter((row) =>
      hasSystemRootAuthority({
        roleKey: row.role_key,
        systemAuthority: row.system_authority,
      }),
    )
    .map((row) => row.id);
}
